import assert from 'node:assert/strict';
import test from 'node:test';
import {
  VIRTUAL_HOTSPOTS,
  VIRTUAL_TOUR_FOV_MAX,
  VIRTUAL_TOUR_FOV_MIN,
  VIRTUAL_TOUR_PITCH_MAX_DEG,
  VIRTUAL_TOUR_PITCH_MIN_DEG,
  VIRTUAL_VANTAGES,
  clampPitchDeg,
  clampTourFov,
  computeLookTargetVector,
  getVirtualVantageById,
  normalizeAzimuthDeg,
  shortestAzimuthDelta,
  worldAzimuthToGeographicBearing,
} from './virtualTourSpec.ts';

test('VIRTUAL_VANTAGES provides three valid sky estate interior stations with eye-level coordinates', () => {
  assert.equal(VIRTUAL_VANTAGES.length, 3);
  for (const station of VIRTUAL_VANTAGES) {
    assert.ok(station.eyePosition[1] > 1.5 && station.eyePosition[1] < 1.85);
    assert.ok(station.defaultFov >= VIRTUAL_TOUR_FOV_MIN && station.defaultFov <= VIRTUAL_TOUR_FOV_MAX);
  }
  assert.equal(getVirtualVantageById('foyer').id, 'foyer');
  assert.equal(getVirtualVantageById('terrace').id, 'terrace');
});

test('VIRTUAL_HOTSPOTS reference valid vantage stations and safe pitch/fov bounds', () => {
  const validIds = new Set(VIRTUAL_VANTAGES.map((v) => v.id));
  assert.ok(VIRTUAL_HOTSPOTS.length >= 4);
  for (const hotspot of VIRTUAL_HOTSPOTS) {
    assert.ok(validIds.has(hotspot.vantageId), `Unknown vantage ${hotspot.vantageId}`);
    assert.ok(
      hotspot.lookPitchDeg >= VIRTUAL_TOUR_PITCH_MIN_DEG &&
        hotspot.lookPitchDeg <= VIRTUAL_TOUR_PITCH_MAX_DEG
    );
    assert.ok(hotspot.lookFov >= VIRTUAL_TOUR_FOV_MIN && hotspot.lookFov <= VIRTUAL_TOUR_FOV_MAX);
  }
});

test('normalizeAzimuthDeg wraps negative and overflow angles cleanly into [0, 360)', () => {
  assert.equal(normalizeAzimuthDeg(0), 0);
  assert.equal(normalizeAzimuthDeg(360), 0);
  assert.equal(normalizeAzimuthDeg(-90), 270);
  assert.equal(normalizeAzimuthDeg(725), 5);
  assert.equal(normalizeAzimuthDeg(Number.NaN), 0);
});

test('clampPitchDeg and clampTourFov enforce safe standing viewing envelopes', () => {
  assert.equal(clampPitchDeg(90), VIRTUAL_TOUR_PITCH_MAX_DEG);
  assert.equal(clampPitchDeg(-90), VIRTUAL_TOUR_PITCH_MIN_DEG);
  assert.equal(clampPitchDeg(12), 12);

  assert.equal(clampTourFov(10), VIRTUAL_TOUR_FOV_MIN);
  assert.equal(clampTourFov(120), VIRTUAL_TOUR_FOV_MAX);
  assert.equal(clampTourFov(58), 58);
});

test('worldAzimuthToGeographicBearing maps sea-facing 0 deg world azimuth to West (270 deg)', () => {
  const sea = worldAzimuthToGeographicBearing(0);
  assert.equal(sea.bearingDeg, 270);
  assert.equal(sea.cardinal, 'W');
  assert.equal(sea.landmarkHint, 'Arabian Sea Horizon');

  const north = worldAzimuthToGeographicBearing(90);
  assert.equal(north.bearingDeg, 0);
  assert.equal(north.cardinal, 'N');

  const east = worldAzimuthToGeographicBearing(180);
  assert.equal(east.bearingDeg, 90);
  assert.equal(east.cardinal, 'E');
});

test('computeLookTargetVector aims cleanly along cardinal axes and vertical pitch', () => {
  const eye: [number, number, number] = [0, 1.68, 0];
  const forward = computeLookTargetVector(eye, 0, 0, 2);
  assert.ok(Math.abs(forward[0] - 0) < 1e-6);
  assert.ok(Math.abs(forward[1] - 1.68) < 1e-6);
  assert.ok(Math.abs(forward[2] - -2) < 1e-6);

  const right = computeLookTargetVector(eye, 90, 0, 2);
  assert.ok(Math.abs(right[0] - 2) < 1e-6);
  assert.ok(Math.abs(right[2] - 0) < 1e-6);

  const up = computeLookTargetVector(eye, 0, 30, 2);
  assert.ok(Math.abs(up[1] - (1.68 + 1)) < 1e-6);
});

test('shortestAzimuthDelta finds minimal signed angular path across 0/360 seam', () => {
  assert.equal(shortestAzimuthDelta(350, 10), 20);
  assert.equal(shortestAzimuthDelta(10, 350), -20);
  assert.equal(shortestAzimuthDelta(90, 270), 180);
});
