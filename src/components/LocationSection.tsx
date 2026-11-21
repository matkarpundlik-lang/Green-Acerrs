import { useState } from 'react';
import { MapPin } from 'lucide-react';
import {
  EDITORIAL_STUDIES,
  PROJECT_META,
  VERIFIED_LANDMARKS,
} from '../data/projectData';
import { ParallaxLayer } from './ParallaxLayer';
import { SafeImage } from './SafeImage';

export function LocationSection() {
  const [selectedLandmarkId, setSelectedLandmarkId] = useState<string>(VERIFIED_LANDMARKS[1].id);
  const selectedLandmark =
    VERIFIED_LANDMARKS.find((item) => item.id === selectedLandmarkId) ?? VERIFIED_LANDMARKS[0];

  return (
    <section
      id="location"
      className="relative scroll-mt-20 overflow-hidden bg-[#29353d] px-6 py-20 sm:px-8 sm:py-28 lg:px-12"
    >
      {/* Subtle drifting contour framing behind neighbourhood section */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <ParallaxLayer
          layerName="location-bg"
          rangePx={30}
          withScale={false}
          className="mx-auto h-full max-w-[1440px] border-x border-[#f4efe6]/5"
        >
          <div className="h-full w-full bg-[radial-gradient(ellipse_at_top_left,rgba(14,34,38,0.5),transparent_60%)]" />
        </ParallaxLayer>
      </div>

      <div className="relative z-10 mx-auto max-w-[1380px]">
        {/* Header & Pali Hill Introduction */}
        <div className="grid grid-cols-1 gap-8 pb-12 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="text-xs font-medium tracking-[0.22em] uppercase text-[#cbb389]">
              08 · Location &amp; Neighbourhood
            </p>
            <h2 className="mt-4 font-serif text-[clamp(2.25rem,4.2vw,3.75rem)] font-normal leading-[1.06] text-[#f4efe6]">
              Billionaires&apos; Row, Pali Hill, Bandra West.
            </h2>
          </div>
          <div className="lg:col-span-5">
            <address className="not-italic border-t border-[#cbb389]/35 pt-4 text-sm font-light leading-relaxed text-[#f4efe6]/90">
              <div className="font-medium tracking-[0.12em] uppercase text-[#cbb389]">
                Official Site Address
              </div>
              <div className="mt-1">
                {PROJECT_META.officialBrand}, {PROJECT_META.addressLine1}
              </div>
              <div className="text-[#c8c4bc]">
                {PROJECT_META.addressLine2}, {PROJECT_META.stateCountry}
              </div>
            </address>
          </div>
        </div>

        {/* Neighbourhood Horizon Visual */}
        <figure className="mb-12">
          <div className="overflow-hidden border border-[#f4efe6]/14 bg-[#0e2226]">
            <div className="aspect-[16/9] max-h-[540px] w-full overflow-hidden">
              <ParallaxLayer
                layerName="location-horizon"
                rangePx={24}
                className="h-full w-full"
              >
                <SafeImage
                  src={EDITORIAL_STUDIES.paliHillStudy}
                  alt="Tree-lined Pali Hill avenue in Bandra West at dusk overlooking the Arabian Sea and Bandra-Worli Sea Link"
                  fallbackTitle="Pali Hill · Bandra West"
                  className="h-full w-full object-cover object-center"
                />
              </ParallaxLayer>
            </div>
          </div>
          <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs tracking-[0.14em] uppercase text-[#93a1aa]">
            <span>Neighbourhood Study — Canopy of Pali Hill Looking Toward the Sea Link</span>
            <span className="font-mono text-[#cbb389]">19.065° N · 72.826° E</span>
          </figcaption>
        </figure>

        {/* Interactive Architectural Neighbourhood Map + Verified Landmarks */}
        <div className="grid grid-cols-1 gap-8 bg-[#0e2226] border border-[#cbb389]/20 p-6 sm:p-10 lg:grid-cols-12">
          {/* Vector Cartography Map */}
          <div className="lg:col-span-6">
            <div className="flex items-center justify-between border-b border-[#f4efe6]/12 pb-3 text-xs tracking-[0.16em] uppercase text-[#93a1aa]">
              <span>Interactive Bandra West Connectivity Map</span>
              <span className="font-mono text-[#cbb389]">Select Landmark</span>
            </div>

            <div className="relative mt-4 aspect-[4/3] w-full overflow-hidden border border-[#f4efe6]/12 bg-[#132b30]">
              <svg
                viewBox="0 0 100 100"
                className="h-full w-full"
                role="img"
                aria-label="Architectural orientation map of Green Acrres on Nargis Dutt Road, Pali Hill and surrounding verified Bandra West landmarks"
              >
                {/* Arabian Sea coastline shading */}
                <path
                  d="M0,0 L28,0 C22,25 14,48 20,70 C24,84 36,92 48,100 L0,100 Z"
                  fill="#0c1b1f"
                />
                <text
                  x="8"
                  y="72"
                  fill="#93a1aa"
                  fontSize="3.1"
                  letterSpacing="0.5"
                  opacity="0.7"
                >
                  ARABIAN SEA
                </text>

                {/* Contour / Grid architectural lines */}
                <g stroke="#cbb389" strokeOpacity="0.12" strokeWidth="0.3">
                  <line x1="0" y1="25" x2="100" y2="25" />
                  <line x1="0" y1="50" x2="100" y2="50" />
                  <line x1="0" y1="75" x2="100" y2="75" />
                  <line x1="25" y1="0" x2="25" y2="100" />
                  <line x1="50" y1="0" x2="50" y2="100" />
                  <line x1="75" y1="0" x2="75" y2="100" />
                </g>

                {/* Pali Hill elevation contour */}
                <ellipse
                  cx="39"
                  cy="45"
                  rx="13"
                  ry="10"
                  fill="#19363c"
                  stroke="#cbb389"
                  strokeOpacity="0.35"
                  strokeWidth="0.4"
                />

                {/* Arterial roads */}
                <path
                  d="M22,36 Q35,42 39,45 T64,42 L82,60"
                  fill="none"
                  stroke="#f4efe6"
                  strokeOpacity="0.22"
                  strokeWidth="0.6"
                  strokeDasharray="1.2 1.2"
                />
                <path
                  d="M39,45 L48,78"
                  fill="none"
                  stroke="#cbb389"
                  strokeOpacity="0.45"
                  strokeWidth="0.6"
                />
                <path
                  d="M39,45 L78,20"
                  fill="none"
                  stroke="#f4efe6"
                  strokeOpacity="0.2"
                  strokeWidth="0.5"
                  strokeDasharray="1.2 1.2"
                />

                {/* Active connector line from Green Acrres (39, 45) to selected landmark */}
                <line
                  x1="39"
                  y1="45"
                  x2={selectedLandmark.mapX}
                  y2={selectedLandmark.mapY}
                  stroke="#cbb389"
                  strokeWidth="0.8"
                />

                {/* Landmark Nodes */}
                {VERIFIED_LANDMARKS.map((landmark) => {
                  const active = landmark.id === selectedLandmark.id;
                  return (
                    <g
                      key={landmark.id}
                      onClick={() => setSelectedLandmarkId(landmark.id)}
                      className="cursor-pointer"
                    >
                      <circle
                        cx={landmark.mapX}
                        cy={landmark.mapY}
                        r={active ? 3.6 : 2.3}
                        fill={active ? '#cbb389' : '#29353d'}
                        stroke="#f4efe6"
                        strokeWidth={active ? 0.6 : 0.4}
                      />
                    </g>
                  );
                })}

                {/* Green Acrres Origin Pin */}
                <g>
                  <circle cx="39" cy="45" r="4.5" fill="#cbb389" fillOpacity="0.2" />
                  <circle cx="39" cy="45" r="2.2" fill="#f4efe6" stroke="#0e2226" strokeWidth="0.7" />
                  <text
                    x="39"
                    y="38.5"
                    textAnchor="middle"
                    fill="#f4efe6"
                    fontSize="3.2"
                    fontWeight="600"
                    letterSpacing="0.4"
                  >
                    GREEN ACRRES
                  </text>
                </g>
              </svg>
            </div>

            {/* Active Landmark Callout */}
            <div className="mt-4 flex items-start justify-between gap-4 border border-[#cbb389]/25 bg-[#132b30] p-4">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#cbb389]" strokeWidth={1.5} />
                <div>
                  <div className="font-serif text-xl text-[#f4efe6]">{selectedLandmark.name}</div>
                  <p className="mt-1 text-xs font-light leading-relaxed text-[#c8c4bc]">
                    {selectedLandmark.description}
                  </p>
                </div>
              </div>
              <div className="shrink-0 font-mono text-xs text-[#cbb389] tabular-nums">
                {selectedLandmark.distance}
              </div>
            </div>
          </div>

          {/* Right: Verified Landmarks Index */}
          <div className="flex flex-col justify-between lg:col-span-6">
            <div>
              <div className="border-b border-[#f4efe6]/12 pb-3 text-xs tracking-[0.16em] uppercase text-[#93a1aa]">
                Verified Connectivity &amp; Landmarks
              </div>
              <div className="divide-y divide-[#f4efe6]/12">
                {VERIFIED_LANDMARKS.map((landmark) => {
                  const active = landmark.id === selectedLandmark.id;
                  return (
                    <button
                      key={landmark.id}
                      type="button"
                      onClick={() => setSelectedLandmarkId(landmark.id)}
                      className={`flex w-full items-center justify-between gap-4 px-3 py-4 text-left transition-colors ${
                        active
                          ? 'bg-[#132b30] text-[#f4efe6]'
                          : 'text-[#c8c4bc] hover:bg-[#132b30]/45 hover:text-[#f4efe6]'
                      }`}
                    >
                      <div>
                        <div className="text-sm font-medium text-[#f4efe6]">{landmark.name}</div>
                        <div className="mt-0.5 text-xs text-[#93a1aa]">{landmark.category}</div>
                      </div>
                      <span className="shrink-0 font-mono text-xs tabular-nums text-[#cbb389]">
                        {landmark.distance}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="mt-6 text-xs font-light leading-relaxed text-[#93a1aa]">
              Approximate distances and travel times along Nargis Dutt Road &amp; Western Express
              arterial corridors as referenced in official project literature.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
