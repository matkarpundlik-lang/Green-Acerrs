export type VirtualVantageId = 'salon' | 'foyer' | 'terrace';

export interface VirtualVantageStation {
  id: VirtualVantageId;
  code: string;
  label: string;
  shortLabel: string;
  subtitle: string;
  description: string;
  eyePosition: [number, number, number];
  defaultAzimuthDeg: number;
  defaultPitchDeg: number;
  defaultFov: number;
}

export interface VirtualHotspot {
  id: string;
  vantageId: VirtualVantageId;
  title: string;
  tag: string;
  detail: string;
  worldPosition: [number, number, number];
  lookAzimuthDeg: number;
  lookPitchDeg: number;
  lookFov: number;
}

export const VIRTUAL_TOUR_FOV_MIN = 38;
export const VIRTUAL_TOUR_FOV_MAX = 76;
export const VIRTUAL_TOUR_PITCH_MIN_DEG = -46;
export const VIRTUAL_TOUR_PITCH_MAX_DEG = 46;

export const VIRTUAL_VANTAGES: VirtualVantageStation[] = [
  {
    id: 'salon',
    code: '01',
    label: 'Grand Living Salon',
    shortLabel: 'Grand Salon',
    subtitle: 'Full-Floor Sky Estate · 11.6 Ft. – 12 Ft. Clear Height',
    description:
      'Open-span main salon framed in honed travertine, warm walnut joinery, and continuous bronze-mullioned sea glazing.',
    eyePosition: [-2.6, 1.66, 1.9],
    defaultAzimuthDeg: 32,
    defaultPitchDeg: -4,
    defaultFov: 64,
  },
  {
    id: 'foyer',
    code: '02',
    label: 'Private Elevator Lobby',
    shortLabel: 'Private Lobby',
    subtitle: 'Dedicated Arrival Portal · Single-Residence Floor Plate',
    description:
      'Direct private elevator arrival into an exclusive stone-clad vestibule, separated cleanly from the service elevator core.',
    eyePosition: [-2.6, 1.66, 3.1],
    defaultAzimuthDeg: 214,
    defaultPitchDeg: -2,
    defaultFov: 64,
  },
  {
    id: 'terrace',
    code: '03',
    label: 'Sea-Facing Verandah',
    shortLabel: 'Sea Terrace',
    subtitle: 'Cantilevered Biophilic Edge · Arabian Sea Twilight',
    description:
      'Stepped travertine verandah with perimeter tropical planters opening across Pali Hill canopy toward the western coastline.',
    eyePosition: [0.4, 1.66, -5.8],
    defaultAzimuthDeg: 14,
    defaultPitchDeg: -4,
    defaultFov: 64,
  },
];

export const VIRTUAL_HOTSPOTS: VirtualHotspot[] = [
  {
    id: 'bronze-glazing',
    vantageId: 'salon',
    title: 'Bronze Sea Glazing',
    tag: 'FAÇADE',
    detail:
      'Full-height acoustic bronze curtain wall flooding the uninterrupted floor plate with natural western coastal light.',
    worldPosition: [-2.4, 2.45, -4.6],
    lookAzimuthDeg: 2,
    lookPitchDeg: 5,
    lookFov: 58,
  },
  {
    id: 'ceiling-volume',
    vantageId: 'salon',
    title: '12 Ft. Clear Volume',
    tag: 'PROPORTION',
    detail:
      'Generous 11.6 ft. to 12 ft. architectural clear height accented by recessed champagne light coves across the reception zone.',
    worldPosition: [2.4, 3.35, -1.5],
    lookAzimuthDeg: 52,
    lookPitchDeg: 20,
    lookFov: 64,
  },
  {
    id: 'japandi-joinery',
    vantageId: 'salon',
    title: 'Stone & Timber',
    tag: 'FINISHES',
    detail:
      'Composed Japandi palette pairing honed international travertine stone flooring with fluted walnut millwork and hearth plinth.',
    worldPosition: [6.4, 1.65, 0.1],
    lookAzimuthDeg: 101,
    lookPitchDeg: -2,
    lookFov: 58,
  },
  {
    id: 'private-core',
    vantageId: 'foyer',
    title: 'Private Lift Core',
    tag: 'PRIVACY',
    detail:
      'Zero shared corridors—each of the five residences commands an entire floor served by a private arrival vestibule.',
    worldPosition: [-4.6, 1.85, 6.1],
    lookAzimuthDeg: 180,
    lookPitchDeg: 0,
    lookFov: 58,
  },
  {
    id: 'coastal-horizon',
    vantageId: 'terrace',
    title: 'Coastal Horizon',
    tag: 'VISTA',
    detail:
      'Elevated above Nargis Dutt Road with cantilevered biophilic planting framing sunset views over Bandra West.',
    worldPosition: [0.2, 1.85, -9.2],
    lookAzimuthDeg: -3,
    lookPitchDeg: -3,
    lookFov: 62,
  },
];

export function getVirtualVantageById(id: VirtualVantageId): VirtualVantageStation {
  return VIRTUAL_VANTAGES.find((v) => v.id === id) ?? VIRTUAL_VANTAGES[0];
}

export function normalizeAzimuthDeg(deg: number): number {
  if (!Number.isFinite(deg)) return 0;
  const wrapped = ((deg % 360) + 360) % 360;
  return wrapped === 360 ? 0 : wrapped;
}

export function clampPitchDeg(deg: number): number {
  if (!Number.isFinite(deg)) return 0;
  return Math.max(VIRTUAL_TOUR_PITCH_MIN_DEG, Math.min(VIRTUAL_TOUR_PITCH_MAX_DEG, deg));
}

export function clampTourFov(fov: number): number {
  if (!Number.isFinite(fov)) return 62;
  return Math.max(VIRTUAL_TOUR_FOV_MIN, Math.min(VIRTUAL_TOUR_FOV_MAX, fov));
}

/**
 * Scene convention:
 * - World -Z corresponds to geographic West (Arabian Sea facing Bandra West coast = 270° compass bearing).
 * - World +X corresponds to North (0°), +Z to East (90°), -X to South (180°).
 */
export function worldAzimuthToGeographicBearing(worldAzimuthDeg: number): {
  bearingDeg: number;
  cardinal: string;
  landmarkHint: string;
} {
  const geoDeg = Math.round(normalizeAzimuthDeg(270 + worldAzimuthDeg));
  const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;
  const idx = Math.round(geoDeg / 45) % 8;
  const cardinal = cardinals[idx];

  let landmarkHint = 'Pali Hill Canopy';
  if (geoDeg >= 235 && geoDeg <= 305) {
    landmarkHint = 'Arabian Sea Horizon';
  } else if (geoDeg > 305 || geoDeg < 45) {
    landmarkHint = 'Carter Road Coast';
  } else if (geoDeg >= 45 && geoDeg < 145) {
    landmarkHint = 'Private Core & Bandra';
  } else {
    landmarkHint = 'Sea Link Corridor';
  }

  return {
    bearingDeg: geoDeg,
    cardinal,
    landmarkHint,
  };
}

/**
 * Computes a world-space look target `[x, y, z]` relative to `eyePosition`
 * where `azimuthDeg = 0` points down `-Z`, `+90` points down `+X`, and `+pitchDeg` pitches upward.
 */
export function computeLookTargetVector(
  eyePosition: readonly [number, number, number],
  azimuthDeg: number,
  pitchDeg: number,
  radius = 2
): [number, number, number] {
  const azRad = (azimuthDeg * Math.PI) / 180;
  const pitchRad = (clampPitchDeg(pitchDeg) * Math.PI) / 180;
  const cosPitch = Math.cos(pitchRad);

  const dx = Math.sin(azRad) * cosPitch * radius;
  const dy = Math.sin(pitchRad) * radius;
  const dz = -Math.cos(azRad) * cosPitch * radius;

  return [eyePosition[0] + dx, eyePosition[1] + dy, eyePosition[2] + dz];
}

export function shortestAzimuthDelta(fromDeg: number, toDeg: number): number {
  const a = normalizeAzimuthDeg(fromDeg);
  const b = normalizeAzimuthDeg(toDeg);
  let diff = b - a;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return diff;
}
