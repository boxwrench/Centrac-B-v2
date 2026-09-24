import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PM_CHECKLIST } from '../../constants';
import { LogEntry, PmTask, EQUIPMENT_TYPE_LABELS } from '../../types';
import { logRepo } from '../../db/logRepo';
import { useActiveAsset } from '../../state/ActiveAssetContext';
import { useNav } from '../../state/NavContext';
import PageHeader from '../../components/ui/PageHeader';
import Segmented from '../../components/ui/Segmented';
import { MaintenanceGuide } from '../model/ServiceGuides';
import TaskForm, { formatFieldValues } from './TaskForm';
import { localDateKey } from '../../engines/report';

type MaintenanceView = 'rounds' | 'centrac';

const startOfToday = (): number => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const FACILITY_KEY = 'facility';
const taskIdOf = (e: LogEntry): string | undefined =>
  (e.inputs as { taskId?: string } | undefined)?.taskId;

const PmRounds: React.FC = () => {
  const { activeAsset, activeAssetId, refreshEquipment } = useActiveAsset();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    const all = await logRepo.listAll();
    setLogs(all.filter((e) => e.kind === 'maintenance'));
  }, []);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  // Facility tasks (no assetTypes) always show; asset tasks show for the active asset's type.
  const facilityTasks = useMemo(() => PM_CHECKLIST.filter((t) => !t.assetTypes || t.assetTypes.length === 0), []);
  const assetTasks = useMemo(
    () =>
      activeAsset
        ? PM_CHECKLIST.filter((t) => t.assetTypes && t.assetTypes.includes(activeAsset.type))
        : [],
    [activeAsset],
  );

  // Map of "<scope>::<taskId>" -> today's log entry, so we can show done-state and undo it.
  const doneToday = useMemo(() => {
    const today = startOfToday();
    const map = new Map<string, LogEntry>();
    for (const e of logs) {
      if (e.timestamp < today) continue;
      const tid = taskIdOf(e);
      if (!tid) continue;
      const scope = e.equipmentId ?? FACILITY_KEY;
      map.set(`${scope}::${tid}`, e);
    }
    return map;
  }, [logs]);

  const keyFor = (task: PmTask): string =>
    `${task.assetTypes && task.assetTypes.length ? activeAssetId ?? FACILITY_KEY : FACILITY_KEY}::${task.id}`;

  const toggle = async (task: PmTask) => {
    const scopeId = task.assetTypes && task.assetTypes.length ? activeAssetId : null;
    const existing = doneToday.get(keyFor(task));
    if (existing) {
      await logRepo.remove(existing.id);
    } else {
      await logRepo.add({
        equipmentId: scopeId,
        kind: 'maintenance',
        inputs: { taskId: task.id, label: task.label },
        outputs: { done: true, date: localDateKey(Date.now()) },
      });
    }
    await loadLogs();
    await refreshEquipment(); // keep the asset's History view in sync
  };

  const handleFormSaved = async () => {
    setOpenTaskId(null);
    await loadLogs();
    await refreshEquipment();
  };

  const totalVisible = facilityTasks.length + assetTasks.length;
  const doneVisible =
    facilityTasks.filter((t) => doneToday.has(keyFor(t))).length +
    assetTasks.filter((t) => doneToday.has(keyFor(t))).length;

  const renderRow = (task: PmTask) => {
    const hasFields = !!(task.fields && task.fields.length);
    const checked = doneToday.has(keyFor(task));

    if (!hasFields) {
      return (
        <button
          key={task.id}
          onClick={() => toggle(task)}
          className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-all ${
            checked ? 'border-green-400 bg-green-50' : 'border-line hover:bg-raised'
          }`}
        >
          <span
            className={`mt-0.5 h-5 w-5 flex-shrink-0 rounded border flex items-center justify-center text-xs font-bold ${
              checked ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 text-transparent'
            }`}
          >
            ✓
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wide text-orange-700">{task.category}</span>
            </span>
            <span className={`block text-sm ${checked ? 'text-slate-600 line-through' : 'text-slate-800'}`}>
              {task.label}
            </span>
            {task.hint && <span className="block text-xs text-slate-600 mt-0.5">{task.hint}</span>}
          </span>
        </button>
      );
    }

    // Tasks with structured fields: accordion. Tapping an open (undone) row expands the
    // form; tapping a completed row un-checks it (removes the entry), matching the
    // no-fields toggle's undo behaviour.
    const scopeId = task.assetTypes && task.assetTypes.length ? activeAssetId : null;
    const entry = doneToday.get(keyFor(task));
    const isOpen = openTaskId === task.id;
    const ws = checked ? (entry?.outputs as { worstStatus?: string } | undefined)?.worstStatus : undefined;
    const rowClasses = checked
      ? ws === 'fail'
        ? 'border-red-400 bg-red-50'
        : ws === 'warning'
          ? 'border-yellow-400 bg-yellow-50'
          : 'border-green-400 bg-green-50'
      : 'border-line hover:bg-raised';
    const summary =
      checked && entry
        ? formatFieldValues(task.fields ?? [], (entry.inputs as { values?: Record<string, unknown> }).values)
        : '';

    return (
      <div key={task.id} className={`rounded-xl border transition-all ${rowClasses}`}>
        <button
          onClick={() => (checked ? toggle(task) : setOpenTaskId(isOpen ? null : task.id))}
          className="w-full text-left flex items-start gap-3 p-3"
        >
          <span
            className={`mt-0.5 h-5 w-5 flex-shrink-0 rounded border flex items-center justify-center text-xs font-bold ${
              checked ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 text-transparent'
            }`}
          >
            ✓
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wide text-orange-700">{task.category}</span>
            </span>
            <span className={`block text-sm ${checked ? 'text-slate-600' : 'text-slate-800'}`}>{task.label}</span>
            {task.hint && !checked && <span className="block text-xs text-slate-600 mt-0.5">{task.hint}</span>}
            {summary && <span className="block text-xs text-slate-600 mt-1">{summary}</span>}
          </span>
          {!checked && <span className="mt-0.5 text-xs text-slate-600">{isOpen ? '▲' : '▼'}</span>}
        </button>
        {!checked && isOpen && (
          <div className="px-3 pb-3">
            <TaskForm task={task} scopeEquipmentId={scopeId} onSaved={handleFormSaved} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-surface p-5 rounded-2xl shadow-sm border border-line flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Preventive Maintenance Rounds</h3>
          <p className="text-sm text-slate-600">
            EPA routine O&amp;M checklist. Completed items are logged to history for the day.
            {!activeAsset && ' Select an asset to add its equipment-specific tasks.'}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold font-mono text-slate-800">
            {doneVisible}/{totalVisible}
          </div>
          <div className="text-[10px] uppercase font-bold tracking-widest text-slate-600">Done today</div>
        </div>
      </div>

      <section className="bg-surface p-6 rounded-2xl shadow-sm border border-line">
        <h4 className="text-sm font-bold uppercase tracking-wide text-slate-600 mb-3 border-b pb-2">Facility</h4>
        <div className="space-y-2">{facilityTasks.map(renderRow)}</div>
      </section>

      <section className="bg-surface p-6 rounded-2xl shadow-sm border border-line">
        <h4 className="text-sm font-bold uppercase tracking-wide text-slate-600 mb-3 border-b pb-2">
          {activeAsset ? `${activeAsset.tag} · ${EQUIPMENT_TYPE_LABELS[activeAsset.type]}` : 'Asset tasks'}
        </h4>
        {!activeAsset ? (
          <p className="text-slate-600 text-sm">Select an asset above to see equipment-specific PM tasks.</p>
        ) : assetTasks.length === 0 ? (
          <p className="text-slate-600 text-sm">
            No equipment-specific PM tasks defined for {EQUIPMENT_TYPE_LABELS[activeAsset.type]}.
          </p>
        ) : (
          <div className="space-y-2">{assetTasks.map(renderRow)}</div>
        )}
      </section>
    </div>
  );
};

const MaintenancePack: React.FC = () => {
  const { openManual, openPart } = useNav();
  const [view, setView] = useState<MaintenanceView>('rounds');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance"
        subtitle="Today's rounds and PM tasks, plus the Centrac B service intervals from the manual."
      >
        <Segmented
          label="Maintenance view"
          value={view}
          onChange={setView}
          options={[
            { id: 'rounds', label: 'Rounds & PM' },
            { id: 'centrac', label: 'Centrac B service intervals' },
          ]}
        />
      </PageHeader>
      {view === 'rounds' ? (
        <PmRounds />
      ) : (
        <div className="cb-model">
          <div className="explorer explorer-embed">
            <MaintenanceGuide onManual={openManual} onPart={openPart} />
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenancePack;
