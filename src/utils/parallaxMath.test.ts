import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeHeroParallaxMetrics,
  computeParallaxShift,
  computeSectionProgress,
} from './parallaxMath';

test('computeSectionProgress returns 0 when element center aligns with viewport center', () => {
  const progress = computeSectionProgress(250, 400, 900);
  assert.equal(progress, 0);
});

test('computeSectionProgress clamps traversal progress strictly within [-1, 1]', () => {
  assert.equal(computeSectionProgress(5000, 300, 900), -1);
  assert.equal(computeSectionProgress(-5000, 300, 900), 1);
  assert.equal(computeSectionProgress(100, 0, 900), 0);
  assert.equal(computeSectionProgress(100, 300, 0), 0);
});

test('computeParallaxShift computes bounded offset and guaranteed overscan scale', () => {
  const shift = computeParallaxShift(0.5, 24, false, 400);
  assert.equal(shift.yPx, 12);
  assert.ok(shift.scale >= 1 + (24 * 2) / 400);

  const inverted = computeParallaxShift(1, 20, true, 500);
  assert.equal(inverted.yPx, -20);
  assert.ok(inverted.scale >= 1.04);
});

test('computeHeroParallaxMetrics creates layered depth separation without exposing hero edges', () => {
  const atTop = computeHeroParallaxMetrics(0, 900);
  assert.equal(atTop.backdropYPx, 0);
  assert.equal(atTop.foregroundYPx, 0);
  assert.equal(atTop.foregroundOpacity, 1);
  assert.ok(atTop.backdropScale >= 1.08);

  const scrolled = computeHeroParallaxMetrics(450, 900);
  assert.ok(scrolled.backdropYPx > scrolled.midgroundYPx);
  assert.ok(scrolled.midgroundYPx > 0);
  assert.ok(scrolled.foregroundYPx < 0);
  assert.ok(scrolled.foregroundOpacity <= 1 && scrolled.foregroundOpacity >= 0.45);
});
