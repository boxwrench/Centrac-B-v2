import React from 'react';

interface Option<T extends string> {
  id: T;
  label: string;
  hint?: string;
}

/** Pill-style view switcher used at the top of packs that hold more than one view. */
function Segmented<T extends string>({ options, value, onChange, label }: {
  options: Option<T>[];
  value: T;
  onChange: (id: T) => void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-xl bg-slate-200/70 p-1">
      {options.map((o) => (
        <button
          key={o.id}
          role="tab"
          aria-selected={value === o.id}
          onClick={() => onChange(o.id)}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            value === o.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {o.label}
          {o.hint && <span className="ml-2 text-xs font-medium text-slate-400">{o.hint}</span>}
        </button>
      ))}
    </div>
  );
}

export default Segmented;
