import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { hollowBox, hollowCylinder, clipGeometry, sectionEdges } from './inspection';
import { createPumpScene } from './pumpScene';

describe('3D scene inspection geometry', () => {
  it('builds hollow walls with a real void', () => {
    const solid = new THREE.BoxGeometry(2, 2, 2);
    const hollow = hollowBox(2, 2, 2);
    expect(hollow.getAttribute('position').count).toBeGreaterThan(0);
    // Six wall panels merge to more triangles than one solid box (12).
    const index = hollow.index!;
    expect(index.count / 3).toBeGreaterThan(12);
    solid.dispose();
    hollow.dispose();
  });

  it('clips geometry to the retained half-space', () => {
    const source = new THREE.BoxGeometry(2, 2, 2);
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
    const clipped = clipGeometry(source, plane);
    const pos = clipped.getAttribute('position');
    expect(pos.count).toBeGreaterThan(0);
    for (let i = 0; i < pos.count; i++) {
      expect(plane.distanceToPoint(new THREE.Vector3().fromBufferAttribute(pos, i))).toBeGreaterThanOrEqual(-1e-6);
    }
    source.dispose();
    clipped.dispose();
  });

  it('traces section edges on the cut plane', () => {
    const source = hollowCylinder(0.5, 0.5, 1);
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
    const edges = sectionEdges(source, plane);
    expect(edges.getAttribute('position').count).toBeGreaterThan(0);
    source.dispose();
    edges.dispose();
  });

  it('exposes the scene factory without touching the DOM on import', () => {
    expect(typeof createPumpScene).toBe('function');
    expect(createPumpScene.length).toBe(3);
  });
});
