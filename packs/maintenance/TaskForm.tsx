import React, { useEffect, useMemo, useState } from 'react';
import { PmField, PmTask } from '../../types';
import { CONVERSION_FACTORS } from '../../constants';
import { logRepo } from '../../db/logRepo';
import { readingStatus, worstStatus, usageSince, daysOfSupply, analyzerDrift, catchVerdict, specificCapacity } from '../../engines/rounds';
import { drawdownGph } from '../../engines/dosing';
import InfoCard from '../../components/ui/InfoCard';
import { localDateKey } from '../../engines/report';

type Status = 'pass' | 'fail' | 'warning' | 'neutral';
type FieldValue = number | string | boolean;

/**
 * Values derived from a task's fields that are not directly entered but computed
 * (e.g. the pump-catch verdict, specific capacity). Shared by the InfoCard render
 * path and the save path so the two can't drift apart.
 */
const deriveExtraReadings = (
  taskId: string,
  values: Record<string, FieldValue>,
): Record<string, { value: number; status: Status }> => {
  const out: Record<string, { value: number; status: Status }> = {};

  if (taskId === 'pm-feed-pump-catch') {
    const mL = values.mL;
    const sec = values.sec;
    const expectedGph = values.expectedGph;
    if (
      typeof mL === 'number' && Number.isFinite(mL) &&
      typeof sec === 'number' && Number.isFinite(sec) &&
      typeof expectedGph === 'number' && Number.isFinite(expectedGph)
    ) {
      const actual = drawdownGph(mL, sec);
      const verdict = catchVerdict(actual, expectedGph);
      out.drawdownGph = { value: actual, status: 'neutral' };
      out.catchVerdict = { value: verdict.value, status: verdict.status };
    }
  }

  if (taskId === 'pm-well-pump-inspect') {
    const rate = values.pumpingRate;
    const waterLevelFt = values.waterLevelFt;
    if (
      typeof rate === 'number' && Number.isFinite(rate) &&
      typeof waterLevelFt === 'number' && Number.isFinite(waterLevelFt)
    ) {
      const sc = specificCapacity(rate, waterLevelFt);
      out.specificCapacity = { value: sc, status: 'neutral' };
    }
  }

  return out;
};

const statusChipClasses: Record<Status, string> = {
  pass: 'bg-green-100 text-green-800',
  fail: 'bg-red-100 text-red-800',
  warning: 'bg-yellow-100 text-yellow-800',
  neutral: 'bg-slate-100 text-slate-800',
};

const fmtShortDate = (iso: string): string => {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

/** Compact "value unit, value unit" listing for a task's fields — used for the "Last:" line and row summaries. */
export const formatFieldValues = (fields: PmField[], values: Record<string, unknown> | undefined): string => {
  if (!values) return '';
  const parts: string[] = [];
  for (const f of fields) {
    const v = values[f.id];
    if (v === undefined || v === null || v === '') continue;
    if (f.type === 'checkitem') {
      parts.push(`${f.label}: ${v ? 'pass' : 'fail'}`);
    } else if (f.type === 'reading' && typeof v === 'number') {
      parts.push(`${v}${f.unit ? ` ${f.unit}` : ''}`);
    } else {
      parts.push(String(v));
    }
  }
  return parts.join(', ');
};

const defaultValues = (fields: PmField[]): Record<string, FieldValue> => {
  const init: Record<string, FieldValue> = {};
  for (const f of fields) {
    if (f.type === 'select') init[f.id] = '';
    else if (f.type === 'note') init[f.id] = '';
    else if (f.type === 'reading') init[f.id] = NaN;
    // checkitem is intentionally left unset until the operator picks pass/fail.
  }
  return init;
};

/**
 * Generic renderer for a PmTask's PmField[]. Shows the last recorded values (if any),
 * an input per field with live status feedback, task-specific derived InfoCards, and a
 * Save button that writes a single `maintenance` log entry.
 */
const TaskForm: React.FC<{ task: PmTask; scopeEquipmentId: string | null; onSaved: () => void }> = ({
  task,
  scopeEquipmentId,
  onSaved,
}) => {
  const fields = useMemo(() => task.fields ?? [], [task.fields]);
  const [values, setValues] = useState<Record<string, FieldValue>>(() => defaultValues(fields));
  const [last, setLast] = useState<{ values: Record<string, unknown>; date?: string; timestamp: number } | undefined>(
    undefined,
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValues(defaultValues(fields));
    setLast(undefined);
    let cancelled = false;
    void logRepo.lastMaintenanceByTask(task.id, scopeEquipmentId).then((entry) => {
      if (cancelled || !entry) return;
      const inputs = entry.inputs as { values?: Record<string, unknown> } | undefined;
      const outputs = entry.outputs as { date?: string } | undefined;
      if (inputs?.values) setLast({ values: inputs.values, date: outputs?.date, timestamp: entry.timestamp });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.id, scopeEquipmentId]);

  const setValue = (id: string, v: FieldValue) => setValues((prev) => ({ ...prev, [id]: v }));

  const lastLine = last ? formatFieldValues(fields, last.values) : '';

  const derivedCards = useMemo(() => {
    const cards: React.ReactNode[] = [];

    if (task.id === 'pm-cl-analyzers') {
      const a = values.analyzerMgL;
      const g = values.grabMgL;
      if (typeof a === 'number' && Number.isFinite(a) && typeof g === 'number' && Number.isFinite(g)) {
        const r = analyzerDrift(a, g);
        cards.push(
          <InfoCard key="drift" title="Analyzer Drift" value={r.value.toFixed(2)} unit={r.unit} status={r.status} />,
        );
      }
    }

    if (task.id === 'pm-chem-tanks-usage') {
      const current = values.levelGal;
      const added = values.addedGal;
      const prev = last?.values.levelGal;
      if (typeof current === 'number' && Number.isFinite(current) && typeof prev === 'number' && Number.isFinite(prev)) {
        const addedNum = typeof added === 'number' && Number.isFinite(added) ? added : 0;
        const usage = usageSince(prev, current, addedNum);
        // daysOfSupply expects an average DAILY rate, not total usage since the last
        // reading — convert using the elapsed time since that reading (floor 1 day to
        // avoid inflating the rate on a same-day recheck).
        const daysElapsed = last ? Math.max(1, (Date.now() - last.timestamp) / 86_400_000) : 1;
        const dailyRate = usage / daysElapsed;
        const dos = daysOfSupply(current, dailyRate);
        const dosStatus: Status = dos < CONVERSION_FACTORS.MIN_DAYS_OF_SUPPLY ? 'warning' : 'pass';
        cards.push(
          <InfoCard key="usage" title="Usage Since Last" value={Number(usage.toFixed(2))} unit="gal" status="neutral" />,
        );
        cards.push(
          <InfoCard
            key="dos"
            title="Days of Supply"
            value={Number.isFinite(dos) ? dos.toFixed(1) : '∞'}
            unit="days"
            status={dosStatus}
          />,
        );
      }
    }

    if (task.id === 'pm-flow-meter') {
      const current = values.meterReading;
      const prev = last?.values.meterReading;
      if (
        typeof current === 'number' &&
        Number.isFinite(current) &&
        typeof prev === 'number' &&
        Number.isFinite(prev) &&
        current - prev >= 0
      ) {
        cards.push(
          <InfoCard key="production" title="Since Last Reading" value={Number((current - prev).toFixed(2))} unit="gal" status="neutral" />,
        );
      }
    }

    const extra = deriveExtraReadings(task.id, values);
    if (task.id === 'pm-feed-pump-catch' && extra.drawdownGph && extra.catchVerdict) {
      cards.push(
        <InfoCard
          key="drawdownGph"
          title="Actual Rate"
          value={extra.drawdownGph.value.toFixed(2)}
          unit="GPH"
          status="neutral"
        />,
      );
      cards.push(
        <InfoCard
          key="catchVerdict"
          title="Catch Verdict"
          value={extra.catchVerdict.value.toFixed(2)}
          unit="% error"
          status={extra.catchVerdict.status}
        />,
      );
    }
    if (task.id === 'pm-well-pump-inspect' && extra.specificCapacity) {
      cards.push(
        <InfoCard
          key="specificCapacity"
          title="Specific Capacity"
          value={extra.specificCapacity.value.toFixed(2)}
          unit="gpm/ft"
          status="neutral"
        />,
      );
    }

    return cards;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.id, values, last]);

  const readingFields = fields.filter((f) => f.type === 'reading');
  const checkitemFields = fields.filter((f) => f.type === 'checkitem');
  const canSave =
    readingFields.every((f) => typeof values[f.id] === 'number' && Number.isFinite(values[f.id] as number)) &&
    checkitemFields.every((f) => typeof values[f.id] === 'boolean');

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      const readings: Record<string, { value: number; status: Status }> = {};
      const statuses: Status[] = [];
      const valuesOut: Record<string, FieldValue> = {};
      for (const f of fields) {
        const v = values[f.id];
        valuesOut[f.id] = v;
        if (f.type === 'reading' && typeof v === 'number' && Number.isFinite(v)) {
          const status = readingStatus(v, f);
          readings[f.id] = { value: v, status };
          statuses.push(status);
        } else if (f.type === 'checkitem' && typeof v === 'boolean') {
          const status: Status = v ? 'pass' : 'fail';
          readings[f.id] = { value: v ? 1 : 0, status };
          statuses.push(status);
        }
      }

      const extra = deriveExtraReadings(task.id, values);
      for (const [id, r] of Object.entries(extra)) {
        readings[id] = r;
        statuses.push(r.status);
      }

      await logRepo.add({
        equipmentId: scopeEquipmentId,
        kind: 'maintenance',
        inputs: { taskId: task.id, label: task.label, values: valuesOut },
        outputs: {
          done: true,
          date: localDateKey(Date.now()),
          readings,
          worstStatus: worstStatus(statuses),
        },
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const renderField = (f: PmField) => {
    const v = values[f.id];

    if (f.type === 'reading') {
      const num = typeof v === 'number' ? v : NaN;
      const status = Number.isFinite(num) ? readingStatus(num, f) : undefined;
      return (
        <div key={f.id} className="space-y-1">
          <label className="text-xs font-semibold text-slate-600 uppercase">{f.label}</label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                step="any"
                value={Number.isFinite(num) ? num : ''}
                placeholder={f.placeholder}
                onChange={(e) => setValue(f.id, e.target.value === '' ? NaN : parseFloat(e.target.value))}
                className="w-full p-2 pr-12 border border-slate-300 rounded-lg outline-none font-mono focus:ring-2 focus:ring-orange-500"
              />
              {f.unit && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-600">{f.unit}</span>
              )}
            </div>
            {status && status !== 'neutral' && (
              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${statusChipClasses[status]}`}>
                {status}
              </span>
            )}
          </div>
        </div>
      );
    }

    if (f.type === 'checkitem') {
      const bool = typeof v === 'boolean' ? v : undefined;
      return (
        <div key={f.id} className="space-y-1">
          <label className="text-xs font-semibold text-slate-600 uppercase">{f.label}</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setValue(f.id, true)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${
                bool === true ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 text-slate-600 hover:bg-raised'
              }`}
            >
              Pass
            </button>
            <button
              type="button"
              onClick={() => setValue(f.id, false)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${
                bool === false ? 'bg-red-500 border-red-500 text-white' : 'border-slate-300 text-slate-600 hover:bg-raised'
              }`}
            >
              Fail
            </button>
          </div>
        </div>
      );
    }

    if (f.type === 'select') {
      return (
        <div key={f.id} className="space-y-1">
          <label className="text-xs font-semibold text-slate-600 uppercase">{f.label}</label>
          <select
            value={typeof v === 'string' ? v : ''}
            onChange={(e) => setValue(f.id, e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 bg-surface"
          >
            <option value="">Select…</option>
            {(f.options ?? []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      );
    }

    // note
    return (
      <div key={f.id} className="space-y-1">
        <label className="text-xs font-semibold text-slate-600 uppercase">{f.label}</label>
        <input
          type="text"
          value={typeof v === 'string' ? v : ''}
          placeholder={f.placeholder}
          onChange={(e) => setValue(f.id, e.target.value)}
          className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>
    );
  };

  return (
    <div className="space-y-4 pt-3 border-t border-line">
      {lastLine && (
        <p className="text-xs text-slate-600">
          Last: {lastLine}
          {last?.date ? ` · ${fmtShortDate(last.date)}` : ''}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{fields.map(renderField)}</div>

      {derivedCards.length > 0 && <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{derivedCards}</div>}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave || saving}
          className={`font-semibold rounded-lg px-5 py-2.5 transition-colors ${
            canSave && !saving ? 'bg-orange-700 text-white hover:bg-orange-800' : 'bg-slate-200 text-slate-600 cursor-not-allowed'
          }`}
        >
          Save
        </button>
        {!canSave && <span className="text-xs text-slate-600">Enter all readings to save.</span>}
      </div>
    </div>
  );
};

export default TaskForm;
