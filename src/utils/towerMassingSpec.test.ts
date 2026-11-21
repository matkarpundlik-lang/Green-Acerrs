import test from 'node:test';
import assert from 'node:assert/strict';
import { TOWER_ZONES } from './towerSiteMap';
import {
  TOWER_MASSING_TIERS,
  TOWER_TOTAL_WORLD_HEIGHT,
  getMassingCameraTarget,
} from './towerMassingSpec';

test('TOWER_MASSING_TIERS spans ground to crown seamlessly and aligns 1:1 with TOWER_ZONES', () => {
  assert.equal(TOWER_MASSING_TIERS.length, TOWER_ZONES.length);
  assert.equal(TOWER_MASSING_TIERS[0].yEnd, TOWER_TOTAL_WORLD_HEIGHT);
  assert.equal(TOWER_MASSING_TIERS[TOWER_MASSING_TIERS.length - 1].yStart, 0);

  for (let i = 0; i < TOWER_MASSING_TIERS.length - 1; i++) {
    assert.equal(TOWER_MASSING_TIERS[i].yStart, TOWER_MASSING_TIERS[i + 1].yEnd);
  }

  for (const tier of TOWER_MASSING_TIERS) {
    assert.ok(
      TOWER_ZONES.some((z) => z.id === tier.zoneId && z.tierCode === tier.tierCode),
      `Missing matching TOWER_ZONE for ${tier.zoneId}`
    );
  }
});

test('getMassingCameraTarget resolves distinct framing for overview, crown, arrival, and active tier', () => {
  const overview = getMassingCameraTarget('overview', 'sky-estates');
  const crown = getMassingCameraTarget('crown', 'sky-estates');
  const arrival = getMassingCameraTarget('arrival', 'sky-estates');
  const tierFocus = getMassingCameraTarget('tier-focus', 'sky-estates');

  assert.ok(crown.target[1] > tierFocus.target[1]);
  assert.ok(tierFocus.target[1] > arrival.target[1]);
  assert.ok(overview.position[2] > crown.position[2]);
});
