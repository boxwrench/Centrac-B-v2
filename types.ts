
export enum AppTab {
  SUCTION = 'suction',
  DISCHARGE = 'discharge',
  CALIBRATION = 'calibration',
  TROUBLESHOOTING = 'troubleshooting'
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
