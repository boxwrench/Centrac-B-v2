
import React from 'react';

interface InfoCardProps {
  title: string;
  value: string | number;
  unit?: string;
  status?: 'pass' | 'fail' | 'warning' | 'neutral';
  description?: string;
}

const InfoCard: React.FC<InfoCardProps> = ({ title, value, unit, status = 'neutral', description }) => {
  const statusColors = {
    pass: 'bg-green-50 border-green-200 text-green-700',
    fail: 'bg-red-50 border-red-200 text-red-700',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    neutral: 'bg-surface border-line text-slate-700'
  };

  const badgeColors = {
    pass: 'bg-green-100 text-green-800',
    fail: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
    neutral: 'bg-slate-100 text-slate-800'
  };

  return (
    <div className={`p-4 rounded-xl border-2 transition-all ${statusColors[status]}`}>
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-sm font-semibold uppercase tracking-wider opacity-70">{title}</h4>
        {status !== 'neutral' && (
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${badgeColors[status]}`}>
            {status}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold font-mono">{value}</span>
        {unit && <span className="text-sm font-medium opacity-80">{unit}</span>}
      </div>
      {description && <p className="mt-2 text-xs leading-relaxed opacity-90">{description}</p>}
    </div>
  );
};

export default InfoCard;
