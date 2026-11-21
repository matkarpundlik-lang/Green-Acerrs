export type MassingCameraPresetId = 'overview' | 'crown' | 'arrival' | 'tier-focus';

export interface MassingCameraTarget {
  position: [number, number, number];
  target: [number, number, number];
}

export interface TowerTierElevationSpec {
  zoneId: string;
  tierCode: string;
  yStart: number;
  yEnd: number;
  focusY: number;
  cameraPosition: [number, number, number];
}

// 16-storey / 56m architectural scale mapped cleanly to world units (1 unit ≈ 2.24m, total tower height = 25 units)
export const TOWER_TOTAL_WORLD_HEIGHT = 25.0;

export const TOWER_MASSING_TIERS: TowerTierElevationSpec[] = [
  {
    zoneId: 'rooftop-sky-deck',
    tierCode: 'TIER 05',
    yStart: 21.8,
    yEnd: 25.0,
    focusY: 22.8,
    cameraPosition: [18.5, 27.5, 20.5],
  },
  {
    zoneId: 'sky-penthouse',
    tierCode: 'TIER 04',
    yStart: 18.0,
    yEnd: 21.8,
    focusY: 19.6,
    cameraPosition: [19.5, 21.5, 22.0],
  },
  {
    zoneId: 'sky-estates',
    tierCode: 'TIER 03',
    yStart: 10.2,
    yEnd: 18.0,
    focusY: 14.0,
    cameraPosition: [21.0, 15.0, 24.0],
  },
  {
    zoneId: 'biophilic-podium',
    tierCode: 'TIER 02',
    yStart: 4.4,
    yEnd: 10.2,
    focusY: 7.2,
    cameraPosition: [20.5, 9.0, 22.5],
  },
  {
    zoneId: 'arrival-belgrave-hall',
    tierCode: 'TIER 01',
    yStart: 0.0,
    yEnd: 4.4,
    focusY: 2.2,
    cameraPosition: [18.5, 5.2, 20.0],
  },
];

export function getMassingCameraTarget(
  preset: MassingCameraPresetId,
  activeZoneId: string
): MassingCameraTarget {
  if (preset === 'crown') {
    return {
      position: [17.0, 28.0, 19.5],
      target: [0, 22.4, 0],
    };
  }
  if (preset === 'arrival') {
    return {
      position: [18.0, 5.2, 19.5],
      target: [0, 2.2, 0],
    };
  }
  if (preset === 'tier-focus') {
    const matched =
      TOWER_MASSING_TIERS.find((item) => item.zoneId === activeZoneId) ?? TOWER_MASSING_TIERS[0];
    return {
      position: matched.cameraPosition,
      target: [0, matched.focusY, 0],
    };
  }
  // Full architectural silhouette overview framing entire 56m tower from base to crown
  return {
    position: [31.5, 16.0, 36.5],
    target: [0, 12.2, 0],
  };
}
