// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { readActiveAssetId, writeActiveAssetId, ACTIVE_ASSET_KEY } from './ActiveAssetContext';

beforeEach(() => {
  globalThis.localStorage?.clear?.();
});

describe('active asset persistence helpers', () => {
  it('returns null when nothing stored', () => {
    expect(readActiveAssetId()).toBeNull();
  });

  it('round-trips an id through localStorage', () => {
    writeActiveAssetId('eq-42');
    expect(localStorage.getItem(ACTIVE_ASSET_KEY)).toBe('eq-42');
    expect(readActiveAssetId()).toBe('eq-42');
  });

  it('clears the id when null is written', () => {
    writeActiveAssetId('eq-42');
    writeActiveAssetId(null);
    expect(readActiveAssetId()).toBeNull();
  });
});
