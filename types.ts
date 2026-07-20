
export enum AppTab {
  ASSETS = 'assets',
  DOSING = 'dosing',
  HYDRAULICS = 'hydraulics',
  MAINTENANCE = 'maintenance',
  TROUBLESHOOTING = 'troubleshooting',
}

export type PmFieldType = 'reading' | 'checkitem' | 'select' | 'note';

export interface PmField {
  id: string;
  type: PmFieldType;
  label: string;
  unit?: string;
  min?: number;
  max?: number;
  warnLow?: number;
  warnHigh?: number;
  options?: string[];
  placeholder?: string;
}

export interface PmTask {
  id: string;
  label: string;
  category: string;
  // Asset types this task applies to. Omitted/empty = facility-wide (not tied to one asset).
  assetTypes?: EquipmentType[];
  // Optional operator hint, e.g. which tab supports the task.
  hint?: string;
  // Structured form fields for this task, if it supports guided data entry.
  fields?: PmField[];
}

export interface TroubleshootingEntry {
  symptom: string;
  category: string;
  cause: string;
  recommendation: string;
  // Which asset types this symptom applies to. Omitted = applies to all assets.
  assetTypes?: EquipmentType[];
}

export interface CalculationResult {
  value: number;
  unit: string;
  status?: 'pass' | 'fail' | 'warning' | 'neutral';
  message?: string;
}

export type EquipmentType =
  | 'metering_pump'
  | 'centrifugal_pump'
  | 'sump_pump'
  | 'tank'
  | 'basin'
  | 'other';

// Human-readable labels for each equipment type (single source of truth for UI).
export const EQUIPMENT_TYPE_LABELS: Record<EquipmentType, string> = {
  metering_pump: 'Metering Pump',
  centrifugal_pump: 'Centrifugal Pump',
  sump_pump: 'Sump Pump',
  tank: 'Tank',
  basin: 'Basin',
  other: 'Other',
};

export const EQUIPMENT_TYPES: EquipmentType[] = [
  'metering_pump',
  'centrifugal_pump',
  'sump_pump',
  'tank',
  'basin',
  'other',
];

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

export type LogKind = 'dosing' | 'hydraulics' | 'troubleshoot' | 'maintenance';

export interface LogEntry {
  id: string;
  equipmentId: string | null;
  kind: LogKind;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  note?: string;
  timestamp: number;
}

export interface ReportRecord {
  date: string;
  operator?: string;
  remarks?: string;
  excludedLogIds: string[];
}
