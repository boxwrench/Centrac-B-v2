import { describe, it, expect } from 'vitest';
import { manualSections, maintenanceTopics, troubleGroups } from './manual-content';
import { byId } from './parts';

describe('manual content catalog', () => {
  it('lists readable manual sections with valid page numbers', () => {
    expect(manualSections.length).toBeGreaterThan(0);
    for (const s of manualSections) {
      expect(s.title.length).toBeGreaterThan(0);
      expect(s.label.length).toBeGreaterThan(0);
      expect(Number.isInteger(s.page) && s.page >= 1 && s.page <= 56).toBe(true);
    }
  });

  it('links maintenance topics to known parts and pages', () => {
    expect(maintenanceTopics.length).toBeGreaterThan(0);
    for (const t of maintenanceTopics) {
      expect(t.details.length).toBeGreaterThan(0);
      expect(t.page).toBeGreaterThanOrEqual(1);
      for (const id of t.parts) expect(byId[id], `topic ${t.id} part ${id}`).toBeDefined();
    }
  });

  it('links troubleshooting checks to known parts and pages', () => {
    expect(troubleGroups.length).toBeGreaterThan(0);
    for (const g of troubleGroups) {
      expect(g.checks.length).toBeGreaterThan(0);
      for (const c of g.checks) {
        expect(c.action.length).toBeGreaterThan(0);
        for (const id of c.parts) expect(byId[id], `check "${c.cause}" part ${id}`).toBeDefined();
      }
    }
  });
});
