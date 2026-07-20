export const SETTINGS_KEYS = {
  plantName: 'centrac-b.plantName',
  operatorName: 'centrac-b.operatorName',
} as const;

export function readSetting(key: string): string {
  try {
    return localStorage.getItem(key) ?? '';
  } catch {
    return '';
  }
}

export function writeSetting(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable — non-fatal */
  }
}
