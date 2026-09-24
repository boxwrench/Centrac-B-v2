import React from 'react';
import { useActiveAsset } from '../../state/ActiveAssetContext';

const AssetPicker: React.FC = () => {
  const { equipment, activeAssetId, setActiveAssetId } = useActiveAsset();

  return (
    <select
      aria-label="Active asset"
      value={activeAssetId ?? ''}
      onChange={(e) => setActiveAssetId(e.target.value === '' ? null : e.target.value)}
      className="max-w-[10rem] sm:max-w-none bg-slate-800 text-slate-100 text-sm rounded-lg border border-slate-700 px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500"
    >
      <option value="">Unassigned</option>
      {equipment.map((eq) => (
        <option key={eq.id} value={eq.id}>
          {eq.tag}
        </option>
      ))}
    </select>
  );
};

export default AssetPicker;
