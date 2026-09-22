import { describe, it, expect } from 'vitest';
import { parts, byId } from './parts';
import { enclosingParts, mechanismColors } from './inspection';

describe('3D model parts catalog', () => {
  it('has a non-empty catalog with unique ids', () => {
    expect(parts.length).toBeGreaterThan(0);
    expect(new Set(parts.map((p) => p.id)).size).toBe(parts.length);
  });

  it('indexes every part in byId with matching fields', () => {
    for (const p of parts) {
      expect(byId[p.id]).toEqual(p);
      expect(p.name.length).toBeGreaterThan(0);
      expect(p.pn.length).toBeGreaterThan(0);
      expect(p.qty.length).toBeGreaterThan(0);
      expect(['Drive', 'Liquid end']).toContain(p.section);
      expect([8, 10]).toContain(p.figure);
    }
  });

  it('references only known parts from the inspection sets', () => {
    for (const id of enclosingParts) expect(byId[id], `enclosing ${id}`).toBeDefined();
    for (const id of Object.keys(mechanismColors)) expect(byId[id], `mechanism ${id}`).toBeDefined();
  });
});
