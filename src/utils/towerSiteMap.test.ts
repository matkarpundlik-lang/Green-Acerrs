import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TOWER_ZONES,
  getAdjacentTowerZoneId,
  getTowerZoneById,
} from './towerSiteMap';

test('TOWER_ZONES bands are ordered top-to-bottom within elevation image bounds', () => {
  assert.equal(TOWER_ZONES.length, 5);
  let previousBottom = 0;
  for (const zone of TOWER_ZONES) {
    assert.ok(zone.bandTopPct >= previousBottom, `${zone.id} overlaps previous band`);
    assert.ok(zone.bandHeightPct > 0);
    previousBottom = zone.bandTopPct + zone.bandHeightPct;
    assert.ok(previousBottom <= 100, `${zone.id} exceeds 100% height`);
  }
});

test('getTowerZoneById falls back cleanly when given unknown id', () => {
  assert.equal(getTowerZoneById('sky-estates').id, 'sky-estates');
  assert.equal(getTowerZoneById('nonexistent').id, TOWER_ZONES[0].id);
});

test('getAdjacentTowerZoneId wraps around both directions', () => {
  assert.equal(getAdjacentTowerZoneId('rooftop-sky-deck', 'down'), 'sky-penthouse');
  assert.equal(getAdjacentTowerZoneId('rooftop-sky-deck', 'up'), 'arrival-belgrave-hall');
  assert.equal(getAdjacentTowerZoneId('arrival-belgrave-hall', 'down'), 'rooftop-sky-deck');
});
