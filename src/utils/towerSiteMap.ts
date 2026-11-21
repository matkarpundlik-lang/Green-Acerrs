import { OFFICIAL_IMAGES } from '../data/projectData';

export interface TowerZone {
  id: string;
  tierCode: string;
  elevationLabel: string;
  title: string;
  subtitle: string;
  description: string;
  highlights: string[];
  previewImage: string;
  previewAlt: string;
  // Percentage bounding box on elevation-full.jpg (top%, height%)
  bandTopPct: number;
  bandHeightPct: number;
}

export const TOWER_ZONES: TowerZone[] = [
  {
    id: 'rooftop-sky-deck',
    tierCode: 'TIER 05',
    elevationLabel: '+56.0 M · SKY CROWN',
    title: 'Rooftop Infinity Pool & Sky Lounge',
    subtitle: '4,300+ Sq. Ft. Elevated Experiences',
    description:
      'Crowning the 56-metre tower beneath an architectural bronze pergola frame, the rooftop sanctuary pairs an infinity swimming pool with a sunset view deck and open-air amphitheatre.',
    highlights: [
      '4,300+ sq. ft. of curated rooftop lifestyle experiences',
      'Infinity swimming pool overlooking the Arabian Sea',
      'Open-air amphitheatre, cinema screen & sunset lounge',
      'Panoramic views of sea, greens, city, sky, and beyond',
    ],
    previewImage: OFFICIAL_IMAGES.infinityPool,
    previewAlt: 'Rooftop infinity pool and sunset deck at 56 metres elevation',
    bandTopPct: 12,
    bandHeightPct: 10,
  },
  {
    id: 'sky-penthouse',
    tierCode: 'TIER 04',
    elevationLabel: 'UPPER CROWN · ~8,600 SQ. FT.',
    title: 'The Sprawling Sky Penthouse',
    subtitle: 'Signature Multi-Directional Crest Residence',
    description:
      'Positioned immediately beneath the rooftop crown with recessed double-height landscaped sky gardens, the penthouse spans approximately 8,600 sq. ft. of uninterrupted horizon living.',
    highlights: [
      'Approximately 8,600 sq. ft. sprawling penthouse scale',
      'Recessed landscaped terrace planters integrated into facade',
      '11.6 ft. to 12 ft. clear floor-to-ceiling living volume',
      'Direct private elevator foyer and separate service access',
    ],
    previewImage: OFFICIAL_IMAGES.terraceView,
    previewAlt: 'Sky terrace lounge overlooking Bandra West',
    bandTopPct: 22,
    bandHeightPct: 13,
  },
  {
    id: 'sky-estates',
    tierCode: 'TIER 03',
    elevationLabel: 'FULL-FLOOR RESIDENCES · 05 ESTATES',
    title: 'Sovereign Full-Floor Sky Estates',
    subtitle: 'One Residence Per Floor · Complete Privacy',
    description:
      'Only five expansive full-floor sky estates compose the primary residential tower, uniting open floor plans with floor-to-ceiling bronze-mullioned glazing.',
    highlights: [
      'Exclusively 5 expansive full-floor sky estates',
      'Private floor elevator lobby per residence',
      'Vast glass facades engineered for cross-ventilation & sea light',
      'Japandi architectural palette of honed stone and timber',
    ],
    previewImage: OFFICIAL_IMAGES.exteriorView,
    previewAlt: 'Close perspective of full-floor residential balconies and glass facades',
    bandTopPct: 35,
    bandHeightPct: 28,
  },
  {
    id: 'biophilic-podium',
    tierCode: 'TIER 02',
    elevationLabel: 'LOWER FACADE & PODIUM',
    title: 'Biophilic Louvres, Banquet & Wellness',
    subtitle: 'Hospitality & Green Curtain Screen',
    description:
      'Vertical dark bronze louvres and cascading biophilic planters wrap the lower architectural tiers, housing resident hospitality, banquet dining, and private wellness spaces.',
    highlights: [
      'Private banquet hall opening onto lush tropical foliage',
      'Executive conference chambers & fully equipped gymnasium',
      'Architectural bronze vertical louvres for solar privacy',
      'Landscaped gardens and dedicated children’s play zone',
    ],
    previewImage: OFFICIAL_IMAGES.banquetView,
    previewAlt: 'Private banquet hall framed by tropical foliage',
    bandTopPct: 63,
    bandHeightPct: 20,
  },
  {
    id: 'arrival-belgrave-hall',
    tierCode: 'TIER 01',
    elevationLabel: 'GROUND PLANE · 22 FT. VOLUME',
    title: 'Valet Drop-Off & The Belgrave Hall',
    subtitle: '17.5 Ft. Portico & Ancient Bonsai Sanctuary',
    description:
      'A car-free landscaped ground plane welcomes residents beneath a 17.5 ft. sweeping driveway into the 22 ft. double-height Belgrave Hall lobby, lounge, and deli café.',
    highlights: [
      '22 ft. double-height Belgrave Hall lobby with deli café',
      '17.5 ft. sweeping driveway with valet-serviced drop-off',
      'Century-old ancient bonsai anchoring the car-free lawn',
      'Multi-level basement parking, EV charging & biometric security',
    ],
    previewImage: OFFICIAL_IMAGES.grandLobby,
    previewAlt: '22-foot double-height Belgrave Hall entrance lobby',
    bandTopPct: 83,
    bandHeightPct: 12,
  },
];

export function getTowerZoneById(zoneId: string): TowerZone {
  return TOWER_ZONES.find((zone) => zone.id === zoneId) ?? TOWER_ZONES[0];
}

export function getAdjacentTowerZoneId(
  currentId: string,
  direction: 'up' | 'down'
): string {
  const index = TOWER_ZONES.findIndex((z) => z.id === currentId);
  if (index === -1) return TOWER_ZONES[0].id;
  if (direction === 'up') {
    return TOWER_ZONES[(index - 1 + TOWER_ZONES.length) % TOWER_ZONES.length].id;
  }
  return TOWER_ZONES[(index + 1) % TOWER_ZONES.length].id;
}
