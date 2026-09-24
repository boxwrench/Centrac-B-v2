import { describe, expect, it } from 'vitest';
import { tabFromHash } from './NavContext';
import { AppTab } from '../types';

describe('tabFromHash', () => {
  it('lands on the 3D model with no hash', () => expect(tabFromHash('')).toBe(AppTab.MODEL));
  it('maps known tabs', () => {
    expect(tabFromHash('#/manual')).toBe(AppTab.MANUAL);
    expect(tabFromHash('#/report')).toBe(AppTab.REPORT);
  });
  it('falls back to the model for unknown hashes', () => expect(tabFromHash('#/nope')).toBe(AppTab.MODEL));
});
