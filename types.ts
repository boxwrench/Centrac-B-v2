
export enum AppTab {
  ASSETS = 'assets',
  DOSING = 'dosing',
  HYDRAULICS = 'hydraulics',
  TROUBLESHOOTING = 'troubleshooting',
}

export interface TroubleshootingEntry {
  symptom: string;
  category: string;
  cause: string;
  recommendation: string;
}

export interface CalculationResult {
  value: number;
  unit: string;
  status?: 'pass' | 'fail' | 'warning' | 'neutral';
  message?: string;
}

export type EquipmentType = 'metering_pump' | 'tank' | 'other';

export interface Equipment {
  id: string;
  tag: string;
  type: EquipmentType;
  make?: string;
  model?: string;
  nameplate?: Record<string, string>;
  location?: string;
  createdAt: number;
}

export type LogKind = 'dosing' | 'hydraulics' | 'troubleshoot';

export interface LogEntry {
  id: string;
  equipmentId: string | null;
  kind: LogKind;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  note?: string;
  timestamp: number;
}
