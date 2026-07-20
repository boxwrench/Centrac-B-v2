// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { readSetting, writeSetting, SETTINGS_KEYS } from './settings';

beforeEach(() => {
  globalThis.localStorage?.clear?.();
});

describe('device settings persistence helpers', () => {
  it('returns empty string when nothing stored', () => {
    expect(readSetting(SETTINGS_KEYS.plantName)).toBe('');
    expect(readSetting(SETTINGS_KEYS.operatorName)).toBe('');
  });

  it('round-trips a value through localStorage', () => {
    writeSetting(SETTINGS_KEYS.plantName, 'Hetch Hetchy');
    expect(localStorage.getItem(SETTINGS_KEYS.plantName)).toBe('Hetch Hetchy');
    expect(readSetting(SETTINGS_KEYS.plantName)).toBe('Hetch Hetchy');
  });

  it('overwrites a previously written value', () => {
    writeSetting(SETTINGS_KEYS.operatorName, 'Alice');
    writeSetting(SETTINGS_KEYS.operatorName, 'Bob');
    expect(readSetting(SETTINGS_KEYS.operatorName)).toBe('Bob');
  });
});
