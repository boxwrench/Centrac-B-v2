import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Equipment, LogEntry, PmTask, ReportRecord } from '../../types';
import { compileReport, localDateKey, visibleTasks } from '../../engines/report';
import { logRepo } from '../../db/logRepo';
import { reportRepo } from '../../db/reportRepo';
import { SETTINGS_KEYS, readSetting, writeSetting } from '../../state/settings';
import { useActiveAsset } from '../../state/ActiveAssetContext';

type Status = 'pass' | 'fail' | 'warning' | 'neutral';

const statusChipClasses: Record<Status, string> = {
  pass: 'bg-green-100 text-green-800',
  fail: 'bg-red-100 text-red-800',
  warning: 'bg-yellow-100 text-yellow-800',
  neutral: 'bg-slate-100 text-slate-800',
};

const StatusChip: React.FC<{ status?: string }> = ({ status }) => {
  const s = (status === 'pass' || status === 'fail' || status === 'warning' ? status : 'neutral') as Status;
  if (s === 'neutral') return null;
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${statusChipClasses[s]}`}>{s}</span>
  );
};

/** print:hidden eye toggle used on every reviewable row. */
const ExcludeToggle: React.FC<{ excluded: boolean; onToggle: () => void }> = ({ excluded, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    title={excluded ? 'Re-include in report' : 'Exclude from report'}
    className={`print:hidden flex-shrink-0 h-7 w-7 flex items-center justify-center rounded-lg border text-sm transition-colors ${
      excluded
        ? 'border-slate-300 bg-slate-100 text-slate-400 hover:bg-slate-200'
        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
    }`}
  >
    {excluded ? '\u{1F6AB}' : '\u{1F441}'}
  </button>
);

/** Flat key: value listing for a log entry's outputs (checks/calibrations). */
const OutputsList: React.FC<{ outputs: Record<string, unknown> }> = ({ outputs }) => {
  const entries = Object.entries(outputs).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (entries.length === 0) return <p className="text-xs text-slate-400">No outputs recorded.</p>;
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
      {entries.map(([k, v]) => (
        <span key={k}>
          <span className="text-slate-400">{k}:</span> <span className="font-mono">{String(v)}</span>
        </span>
      ))}
    </div>
  );
};

const fmtTime = (ts: number): string =>
  new Date(ts).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

interface ReviewableRow {
  id: string;
  excluded: boolean;
}

/** Wrapper: excluded rows are print:hidden always; when hidden from the review list they render nothing. */
const RowShell: React.FC<{
  row: ReviewableRow;
  showExcluded: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}> = ({ row, showExcluded, onToggle, children }) => {
  if (row.excluded && !showExcluded) return null;
  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-xl border ${
        row.excluded ? 'print:hidden border-slate-200 bg-slate-50 opacity-60' : 'border-slate-200'
      }`}
    >
      <div className="min-w-0 flex-1">{children}</div>
      <ExcludeToggle excluded={row.excluded} onToggle={() => onToggle(row.id)} />
    </div>
  );
};

const ReportPack: React.FC = () => {
  const { equipment } = useActiveAsset();
  const [date, setDate] = useState<string>(() => localDateKey(Date.now()));
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [record, setRecord] = useState<ReportRecord | undefined>(undefined);
  const [plantName, setPlantName] = useState<string>(() => readSetting(SETTINGS_KEYS.plantName));
  const [operatorName, setOperatorName] = useState<string>(() => readSetting(SETTINGS_KEYS.operatorName));
  const [remarksDraft, setRemarksDraft] = useState<string>('');
  const [showExcluded, setShowExcluded] = useState(false);

  useEffect(() => {
    void logRepo.listAll().then(setLogs);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void reportRepo.get(date).then((r) => {
      if (cancelled) return;
      setRecord(r);
      setRemarksDraft(r?.remarks ?? '');
    });
    return () => {
      cancelled = true;
    };
  }, [date]);

  const excludedIds = record?.excludedLogIds ?? [];

  // The truthful report contents (exclusions applied) — what actually prints.
  const compiled = useMemo(
    () => compileReport(logs, equipment, date, excludedIds),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [logs, equipment, date, record],
  );

  // Unfiltered view — used only to recover excluded entries for the review-mode "show excluded" toggle.
  const compiledAll = useMemo(() => compileReport(logs, equipment, date, []), [logs, equipment, date]);

  const excludedSet = useMemo(() => new Set(excludedIds), [excludedIds]);

  const persistRecord = useCallback(
    async (patch: Partial<Omit<ReportRecord, 'date'>>) => {
      const next: ReportRecord = {
        date,
        operator: record?.operator,
        remarks: record?.remarks,
        excludedLogIds: record?.excludedLogIds ?? [],
        ...patch,
      };
      setRecord(next);
      await reportRepo.upsert(next);
    },
    [date, record],
  );

  const toggleExcluded = useCallback(
    (id: string) => {
      const current = record?.excludedLogIds ?? [];
      const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
      void persistRecord({ excludedLogIds: next });
    },
    [record, persistRecord],
  );

  const handlePlantNameChange = (v: string) => {
    setPlantName(v);
    writeSetting(SETTINGS_KEYS.plantName, v);
  };

  const handleOperatorNameChange = (v: string) => {
    setOperatorName(v);
    writeSetting(SETTINGS_KEYS.operatorName, v);
    void persistRecord({ operator: v });
  };

  const handleRemarksBlur = () => {
    void persistRecord({ remarks: remarksDraft });
  };

  const tagFor = (equipmentId: string | null): string =>
    equipment.find((e: Equipment) => e.id === equipmentId)?.tag ?? 'Unassigned';

  // Merge the truthful (exclusion-applied) lists with their excluded counterparts (for review re-inclusion).
  const roundsRows = useMemo(() => {
    const real = compiled.rounds.completed;
    const excluded = compiledAll.rounds.completed.filter((c) => excludedSet.has(c.entry.id));
    return [...real, ...excluded];
  }, [compiled, compiledAll, excludedSet]);

  const mergedList = (kind: 'checks' | 'calibrations' | 'issues'): LogEntry[] => {
    const real = compiled[kind];
    const excluded = compiledAll[kind].filter((e) => excludedSet.has(e.id));
    return [...real, ...excluded];
  };

  const checksRows = useMemo(() => mergedList('checks'), [compiled, compiledAll, excludedSet]);
  const calibrationRows = useMemo(() => mergedList('calibrations'), [compiled, compiledAll, excludedSet]);
  const issueRows = useMemo(() => mergedList('issues'), [compiled, compiledAll, excludedSet]);

  const checksByAsset = useMemo(() => {
    const groups = new Map<string, LogEntry[]>();
    for (const e of checksRows) {
      const key = tagFor(e.equipmentId);
      const list = groups.get(key) ?? [];
      list.push(e);
      groups.set(key, list);
    }
    return groups;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checksRows, equipment]);

  const totalVisible = visibleTasks(equipment).length;
  const totalExcluded = excludedIds.length;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800">Daily Operating Report</h2>
            <p className="text-sm text-slate-500 mt-1">{date}</p>
          </div>
          <div className="print:hidden flex items-center gap-3">
            <label className="text-xs font-semibold text-slate-500 uppercase">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Plant Name</label>
            <input
              type="text"
              value={plantName}
              onChange={(e) => handlePlantNameChange(e.target.value)}
              placeholder="Plant name"
              className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 print:border-none print:p-0"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Operator</label>
            <input
              type="text"
              value={operatorName}
              onChange={(e) => handleOperatorNameChange(e.target.value)}
              placeholder="Operator name"
              className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 print:border-none print:p-0"
            />
          </div>
        </div>

        <div className="print:hidden flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => window.print()}
            className="bg-blue-600 text-white font-semibold rounded-lg px-5 py-2.5 hover:bg-blue-700 transition-colors"
          >
            Print / Save as PDF
          </button>
          {totalExcluded > 0 && (
            <button
              type="button"
              onClick={() => setShowExcluded((s) => !s)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 underline decoration-dotted"
            >
              {totalExcluded} excluded{showExcluded ? ' — hide' : ' — show'}
            </button>
          )}
        </div>
      </div>

      {/* Rounds */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3 border-b pb-2">
          Rounds &middot; {compiled.rounds.completed.length} of {totalVisible} done
        </h3>
        {roundsRows.length === 0 ? (
          <p className="text-sm text-slate-400">None recorded.</p>
        ) : (
          <div className="space-y-2">
            {roundsRows.map(({ task, entry }: { task: PmTask; entry: LogEntry }) => {
              const outputs = entry.outputs as { done?: boolean; date?: string; readings?: Record<string, { value: unknown; status?: string }> } | undefined;
              const readings = outputs?.readings ?? {};
              const readingEntries = Object.entries(readings);
              return (
                <RowShell
                  key={entry.id}
                  row={{ id: entry.id, excluded: excludedSet.has(entry.id) }}
                  showExcluded={showExcluded}
                  onToggle={toggleExcluded}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-800">{task.label}</span>
                    <span className="text-[10px] text-slate-400">{fmtTime(entry.timestamp)}</span>
                  </div>
                  {readingEntries.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {readingEntries.map(([fieldId, r]) => {
                        const field = task.fields?.find((f) => f.id === fieldId);
                        const label = field?.label ?? fieldId;
                        return (
                          <span
                            key={fieldId}
                            className="inline-flex items-center gap-1 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded px-2 py-0.5"
                          >
                            {label}: <span className="font-mono">{String(r.value)}</span>
                            <StatusChip status={r.status} />
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 mt-1 block">Done{outputs?.date ? ` · ${outputs.date}` : ''}</span>
                  )}
                </RowShell>
              );
            })}
          </div>
        )}

        <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400 mt-5 mb-2 border-t pt-3">
          Not completed
        </h4>
        {compiled.rounds.skipped.length === 0 ? (
          <p className="text-sm text-slate-400">None recorded.</p>
        ) : (
          <ul className="list-disc list-inside space-y-1">
            {compiled.rounds.skipped.map((t: PmTask) => (
              <li key={t.id} className="text-sm text-slate-600">
                {t.label}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Equipment Checks */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3 border-b pb-2">
          Equipment Checks
        </h3>
        {checksRows.length === 0 ? (
          <p className="text-sm text-slate-400">None recorded.</p>
        ) : (
          <div className="space-y-4">
            {Array.from(checksByAsset.entries()).map(([tag, entries]) => (
              <div key={tag}>
                <h4 className="text-xs font-bold uppercase tracking-wide text-blue-600 mb-2">{tag}</h4>
                <div className="space-y-2">
                  {entries.map((e) => (
                    <RowShell
                      key={e.id}
                      row={{ id: e.id, excluded: excludedSet.has(e.id) }}
                      showExcluded={showExcluded}
                      onToggle={toggleExcluded}
                    >
                      <span className="text-[10px] text-slate-400 block mb-1">{fmtTime(e.timestamp)}</span>
                      <OutputsList outputs={e.outputs} />
                    </RowShell>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Calibrations */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3 border-b pb-2">
          Calibrations
        </h3>
        {calibrationRows.length === 0 ? (
          <p className="text-sm text-slate-400">None recorded.</p>
        ) : (
          <div className="space-y-2">
            {calibrationRows.map((e) => (
              <RowShell
                key={e.id}
                row={{ id: e.id, excluded: excludedSet.has(e.id) }}
                showExcluded={showExcluded}
                onToggle={toggleExcluded}
              >
                <span className="text-xs font-semibold text-slate-700">{tagFor(e.equipmentId)}</span>
                <span className="text-[10px] text-slate-400 ml-2">{fmtTime(e.timestamp)}</span>
                <div className="mt-1">
                  <OutputsList outputs={e.outputs} />
                </div>
              </RowShell>
            ))}
          </div>
        )}
      </section>

      {/* Issues & Fixes */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3 border-b pb-2">
          Issues &amp; Fixes
        </h3>
        {issueRows.length === 0 ? (
          <p className="text-sm text-slate-400">None recorded.</p>
        ) : (
          <div className="space-y-2">
            {issueRows.map((e) => {
              const inputs = e.inputs as { symptom?: string; category?: string } | undefined;
              const outputs = e.outputs as { cause?: string; recommendation?: string } | undefined;
              return (
                <RowShell
                  key={e.id}
                  row={{ id: e.id, excluded: excludedSet.has(e.id) }}
                  showExcluded={showExcluded}
                  onToggle={toggleExcluded}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-800">{inputs?.symptom ?? 'Issue'}</span>
                    <span className="text-xs text-slate-500">{tagFor(e.equipmentId)}</span>
                    <span className="text-[10px] text-slate-400">{fmtTime(e.timestamp)}</span>
                  </div>
                  {(outputs?.cause || outputs?.recommendation || e.note) && (
                    <p className="text-xs text-slate-500 mt-1">
                      {[outputs?.cause, outputs?.recommendation, e.note].filter(Boolean).join(' — ')}
                    </p>
                  )}
                </RowShell>
              );
            })}
          </div>
        )}
      </section>

      {/* Remarks */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3 border-b pb-2">Remarks</h3>
        <textarea
          value={remarksDraft}
          onChange={(e) => setRemarksDraft(e.target.value)}
          onBlur={handleRemarksBlur}
          placeholder="Notes for the day..."
          rows={4}
          className="print:hidden w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="hidden print:block text-sm text-slate-700 whitespace-pre-wrap">
          {remarksDraft || 'None recorded.'}
        </p>
      </section>

      {/* Signature block — always prints */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <p className="text-sm text-slate-700">
          Operator signature: ____________________________&nbsp;&nbsp;&nbsp;&nbsp;Date: ________________
        </p>
      </section>
    </div>
  );
};

export default ReportPack;
