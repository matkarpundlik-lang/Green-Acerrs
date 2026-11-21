export interface VerifiedHighlight {
  id: string;
  value: string;
  unit: string;
  label: string;
  detail: string;
}

export interface PhilosophyPillar {
  index: string;
  title: string;
  body: string;
}

export interface AmenityShowcaseItem {
  id: string;
  index: string;
  title: string;
  category: string;
  summary: string;
  details: string[];
  image: string;
  imageAlt: string;
  imageOrientation: 'square' | 'landscape' | 'portrait' | 'tall';
  sourceNote: string;
}

export interface GalleryPlate {
  id: string;
  index: string;
  title: string;
  subtitle: string;
  src: string;
  alt: string;
  aspect: 'square' | 'landscape' | 'portrait' | 'tall';
  isOfficialProjectRender: boolean;
}

export interface VerifiedLandmark {
  id: string;
  name: string;
  distance: string;
  category: 'Connectivity' | 'Promenade' | 'Business & Aviation' | 'Education & Lifestyle';
  description: string;
  // Coordinates on the custom architectural Pali Hill vector map (0-100 viewBox)
  mapX: number;
  mapY: number;
}

export const PROJECT_META = {
  name: 'Green Acrres',
  officialBrand: 'Paradigm Green Acrres',
  developer: 'Paradigm Realty',
  collection: 'Paradigm Marquis Collection',
  addressLine1: "Billionaires' Row, Nargis Dutt Road",
  addressLine2: 'Pali Hill, Bandra West, Mumbai 400050',
  stateCountry: 'Maharashtra, India',
  mahareraNumber: 'PR1180002600160',
  mahareraUrl: 'https://maharerait.mahaonline.gov.in',
  officialWebsite: 'https://paradigmgreenacrres.com/',
  disclaimer:
    'This website is for informational purposes only and does not constitute an offer or contract. All information, architectural visualisations, and specifications are subject to change without notice as per official Paradigm Realty & MahaRERA disclosures.',
} as const;

export const OFFICIAL_IMAGES = {
  elevationFull: '/images/official/elevation-full.jpg',
  dropOff: '/images/official/gallery-1.jpg',
  grandLobby: '/images/official/gallery-2.jpg',
  terraceView: '/images/official/gallery-3.jpg',
  exteriorView: '/images/official/gallery-4.jpg',
  banquetView: '/images/official/gallery-6.jpg',
  infinityPool: '/images/official/gallery-7.jpg',
} as const;

export const EDITORIAL_STUDIES = {
  interiorStudy: '/src/assets/images/sky_estate_interior_study_1795271954003.jpg',
  paliHillStudy: '/src/assets/images/pali_hill_bandra_horizon_1795271954539.jpg',
} as const;

export const PHILOSOPHY_PILLARS: PhilosophyPillar[] = [
  {
    index: '01',
    title: 'A Legacy in the Sky',
    body: "Green Acrres does not merely join Pali Hill's skyline—it redefines it, rising 56 metres above Mumbai's most coveted hillside enclave.",
  },
  {
    index: '02',
    title: 'A Vision in Grandeur',
    body: 'Expansive full-floor plates framed by vast bronze-mullioned glass facades—where Arabian Sea light and architectural scale converge in harmony.',
  },
  {
    index: '03',
    title: 'Sculpted for the Privileged Few',
    body: 'A private floor lobby, an ancient 100-year-old bonsai at arrival, and uninterrupted horizon vistas—crafted for discreet, low-density living.',
  },
  {
    index: '04',
    title: 'Uncompromising Luxury',
    body: 'A serene Japandi-inspired sanctuary composed for generations, balancing quiet power with international stone, timber, and glazing finishes.',
  },
];

export const VERIFIED_HIGHLIGHTS: VerifiedHighlight[] = [
  {
    id: 'height',
    value: '56',
    unit: 'Metres',
    label: 'Architectural Elevation',
    detail: '16-storey low-density boutique tower rising above Nargis Dutt Road.',
  },
  {
    id: 'estates',
    value: '05',
    unit: 'Sky Estates',
    label: 'Extreme Rarity',
    detail: 'Only five expansive full-floor sky estates reserved for private ownership.',
  },
  {
    id: 'penthouse',
    value: '8,600',
    unit: 'Sq. Ft.',
    label: 'Sprawling Penthouse',
    detail: 'Approximate scale of the crowning sky penthouse residence.',
  },
  {
    id: 'lobby',
    value: '22',
    unit: 'Feet',
    label: 'The Belgrave Hall',
    detail: 'Double-height grand arrival lobby featuring lounge seating and deli café.',
  },
  {
    id: 'ceiling',
    value: '11.6',
    unit: 'Ft. – 12 Ft.',
    label: 'Residential Volume',
    detail: 'Expansive floor-to-ceiling heights across living salons and suites.',
  },
  {
    id: 'rooftop',
    value: '4,300+',
    unit: 'Sq. Ft.',
    label: 'Rooftop Experiences',
    detail: 'Curated sky deck with infinity pool and panoramic sea & city views.',
  },
];

export const AMENITY_SHOWCASES: AmenityShowcaseItem[] = [
  {
    id: 'arrival',
    index: '01',
    title: 'Grand Arrival & The Belgrave Hall',
    category: 'Ground Plane',
    summary:
      'A 17.5 ft. sweeping valet-serviced driveway transitions into a car-free landscaped ground level anchored by a 100-year-old bonsai and a 22 ft. double-height lobby.',
    details: [
      '17.5 ft. sweeping driveway with valet-serviced drop-off',
      '22 ft. double-height Belgrave Hall entrance lobby',
      'In-house lounge and curated deli café',
      'Car-free landscaped grounds with heritage bonsai',
    ],
    image: OFFICIAL_IMAGES.grandLobby,
    imageAlt: 'The Belgrave Hall 22-foot double-height grand lobby with sculptural pendant lights',
    imageOrientation: 'square',
    sourceNote: 'Official Architectural Visual · Grand Lobby',
  },
  {
    id: 'infinity-pool',
    index: '02',
    title: 'Rooftop Infinity Pool & Sunset Deck',
    category: 'Sky Level',
    summary:
      'Spanning over 4,300 sq. ft. of elevated rooftop experiences, the infinity pool and sunset deck frame uninterrupted vistas across the Arabian Sea, Pali Hill greens, and Mumbai skyline.',
    details: [
      'Temperature-balanced rooftop infinity swimming pool',
      'Sunset view deck & landscaped sky loungers',
      'Panoramic vistas of sea, greens, city, and sky',
      'Private rooftop lounge and bar hospitality zone',
    ],
    image: OFFICIAL_IMAGES.infinityPool,
    imageAlt: 'Rooftop infinity swimming pool overlooking the Mumbai skyline at twilight',
    imageOrientation: 'landscape',
    sourceNote: 'Official Architectural Visual · Infinity Pool',
  },
  {
    id: 'terrace-cinema',
    index: '03',
    title: 'Terrace Lounge & Open-Air Amphitheatre',
    category: 'Evening Leisure',
    summary:
      'Composed in honed travertine and warm timber soffits, the open-air terrace lounge hosts private twilight screenings and intimate skyline gatherings.',
    details: [
      'Open-air amphitheatre and private screening terrace',
      'Travertine stonework with custom architectural lighting',
      'Sheltered outdoor salon seating overlooking Bandra',
      'Seamless transition from sunset deck to evening lounge',
    ],
    image: OFFICIAL_IMAGES.terraceView,
    imageAlt: 'Rooftop terrace lounge and open-air cinema screen at dusk',
    imageOrientation: 'square',
    sourceNote: 'Official Architectural Visual · Terrace View',
  },
  {
    id: 'banquet-wellness',
    index: '04',
    title: 'Private Banquet & Conference Chambers',
    category: 'Hospitality & Wellness',
    summary:
      'Floor-to-ceiling bronze-framed windows open onto tropical foliage inside the private banquet pavilion, complemented by conference chambers and a dedicated gymnasium.',
    details: [
      'Private banquet hall overlooking landscaped greens',
      'Discreet executive conference chambers',
      'Fully equipped private resident gymnasium',
      'Landscaped gardens and dedicated children’s play zone',
    ],
    image: OFFICIAL_IMAGES.banquetView,
    imageAlt: 'Private banquet hall with floor-to-ceiling bronze-mullioned windows facing tropical greenery',
    imageOrientation: 'tall',
    sourceNote: 'Official Architectural Visual · Banquet View',
  },
  {
    id: 'infrastructure',
    index: '05',
    title: 'Private Vertical Access & Smart Security',
    category: 'Privacy & Engineering',
    summary:
      'Every arrival and departure is governed by multi-tier discretion, pairing private residential elevators with dedicated service cores and intelligent access infrastructure.',
    details: [
      'Private residential elevator & separate service elevator',
      '24/7 biometric and smart-card access control',
      'Multi-level basement parking with wide access ramps',
      'Dedicated EV charging stations and comprehensive CCTV',
    ],
    image: OFFICIAL_IMAGES.dropOff,
    imageAlt: 'Covered travertine valet drop-off portico with bronze fins and manicured bonsai',
    imageOrientation: 'square',
    sourceNote: 'Official Architectural Visual · Drop-Off',
  },
];

export const GALLERY_PLATES: GalleryPlate[] = [
  {
    id: 'plate-01',
    index: '01',
    title: 'Valet Drop-Off Portico',
    subtitle: '17.5 ft. Arrival & Ancient Bonsai Courtyard',
    src: OFFICIAL_IMAGES.dropOff,
    alt: 'Green Acrres covered travertine valet drop-off with dark bronze louvres and bonsai',
    aspect: 'square',
    isOfficialProjectRender: true,
  },
  {
    id: 'plate-02',
    index: '02',
    title: 'The Belgrave Hall',
    subtitle: '22 ft. Double-Height Grand Entrance Lobby',
    src: OFFICIAL_IMAGES.grandLobby,
    alt: 'Double-height grand lobby with alabaster pendant lighting and travertine stone walls',
    aspect: 'square',
    isOfficialProjectRender: true,
  },
  {
    id: 'plate-03',
    index: '03',
    title: 'Terrace Sky Lounge',
    subtitle: 'Open-Air Amphitheatre & Twilight Seating',
    src: OFFICIAL_IMAGES.terraceView,
    alt: 'Rooftop terrace lounge with outdoor projection screen and skyline views',
    aspect: 'square',
    isOfficialProjectRender: true,
  },
  {
    id: 'plate-04',
    index: '04',
    title: 'Tower Perspective',
    subtitle: '56-Metre Facade & Biophilic Balconies',
    src: OFFICIAL_IMAGES.exteriorView,
    alt: 'Dramatic upward perspective of the Green Acrres 16-storey tower facade',
    aspect: 'tall',
    isOfficialProjectRender: true,
  },
  {
    id: 'plate-05',
    index: '05',
    title: 'Banquet Pavilion',
    subtitle: 'Private Dining Framed by Tropical Foliage',
    src: OFFICIAL_IMAGES.banquetView,
    alt: 'Private banquet hall overlooking lush greenery through bronze-mullioned windows',
    aspect: 'tall',
    isOfficialProjectRender: true,
  },
  {
    id: 'plate-06',
    index: '06',
    title: 'Rooftop Infinity Pool',
    subtitle: '4,300+ Sq. Ft. Elevated Horizon Deck',
    src: OFFICIAL_IMAGES.infinityPool,
    alt: 'Rooftop infinity pool at night overlooking the Bandra and Mumbai skyline',
    aspect: 'landscape',
    isOfficialProjectRender: true,
  },
  {
    id: 'plate-07',
    index: '07',
    title: 'Full Architectural Elevation',
    subtitle: 'Nargis Dutt Road Facade Composition',
    src: OFFICIAL_IMAGES.elevationFull,
    alt: 'Full front architectural elevation of Paradigm Green Acrres',
    aspect: 'portrait',
    isOfficialProjectRender: true,
  },
];

export const VERIFIED_LANDMARKS: VerifiedLandmark[] = [
  {
    id: 'linking-hill',
    name: 'Linking Road & Hill Road',
    distance: '~1.5 – 2.0 km',
    category: 'Education & Lifestyle',
    description: "Bandra West's historic retail avenues, independent boutiques, and heritage cafés.",
    mapX: 64,
    mapY: 42,
  },
  {
    id: 'sea-link',
    name: 'Bandra–Worli Sea Link',
    distance: '~2.4 km',
    category: 'Connectivity',
    description: 'Direct coastal express corridor connecting Bandra West to Worli and South Mumbai.',
    mapX: 48,
    mapY: 78,
  },
  {
    id: 'carter-road',
    name: 'Carter Road Promenade',
    distance: '~2.5 km',
    category: 'Promenade',
    description: 'Tree-shaded Arabian Sea waterfront promenade bordering Pali Hill to the west.',
    mapX: 22,
    mapY: 36,
  },
  {
    id: 'bkc',
    name: 'Bandra Kurla Complex (BKC)',
    distance: '~6.0 km',
    category: 'Business & Aviation',
    description: "Mumbai's premier financial district, diplomatic consulates, and Jio World Drive.",
    mapX: 82,
    mapY: 60,
  },
  {
    id: 'airport',
    name: 'Chhatrapati Shivaji Maharaj Int’l Airport',
    distance: '~8.0 km · ~15 mins',
    category: 'Business & Aviation',
    description: 'Seamless northern arterial access to domestic and international private terminals.',
    mapX: 78,
    mapY: 20,
  },
  {
    id: 'institutions',
    name: "St. Andrew's & Dhirubhai Ambani Int’l School",
    distance: 'Bandra & BKC Belt',
    category: 'Education & Lifestyle',
    description: 'Established Bandra educational institutions and cultural centres within easy reach.',
    mapX: 54,
    mapY: 56,
  },
];

export const UNVERIFIED_DISCLOSURE_PLACEHOLDERS = [
  {
    label: 'Residences & Carpet Areas',
    status: 'Available in Private Dossier upon registration (official configurations & unit-wise RERA carpet plans)',
  },
  {
    label: 'Pricing & Payment Schedule',
    status: 'Upon Private Consultation with Paradigm Realty Advisory',
  },
  {
    label: 'Possession & Current Availability',
    status: 'Confirmed directly via Paradigm Realty & MahaRERA Portal (PR1180002600160)',
  },
];
