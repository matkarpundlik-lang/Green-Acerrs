import { useState, type KeyboardEvent } from 'react';
import { Box, Layers } from 'lucide-react';
import { OFFICIAL_IMAGES } from '../data/projectData';
import {
  TOWER_ZONES,
  getAdjacentTowerZoneId,
  getTowerZoneById,
} from '../utils/towerSiteMap';
import { ParallaxLayer } from './ParallaxLayer';
import { SafeImage } from './SafeImage';
import { TowerMassing3D } from './TowerMassing3D';

export function TowerSiteMap() {
  const [activeZoneId, setActiveZoneId] = useState<string>(TOWER_ZONES[0].id);
  const [viewMode, setViewMode] = useState<'blueprint' | '3d'>('blueprint');
  const [fullscreen3D, setFullscreen3D] = useState(false);

  const activeZone = getTowerZoneById(activeZoneId);

  function handleZoneKeyDown(e: KeyboardEvent<HTMLButtonElement>, currentId: string) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveZoneId(getAdjacentTowerZoneId(currentId, 'down'));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveZoneId(getAdjacentTowerZoneId(currentId, 'up'));
    }
  }

  return (
    <section
      id="site-map"
      className="relative scroll-mt-20 overflow-hidden bg-[#29353d] px-4 py-16 sm:px-8 sm:py-24 lg:px-12 lg:py-28"
    >
      {/* Subtle architectural background parallax framing */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <ParallaxLayer
          layerName="sitemap-bg"
          rangePx={28}
          invert
          withScale={false}
          className="mx-auto h-full max-w-[1440px] border-x border-[#cbb389]/8"
        >
          <div className="h-full w-full bg-[radial-gradient(ellipse_at_top_center,rgba(14,34,38,0.45),transparent_65%)]" />
        </ParallaxLayer>
      </div>

      <div className="relative z-10 mx-auto max-w-[1380px] bg-[#0e2226] border border-[#cbb389]/25 p-6 sm:p-10 lg:p-16">
        {/* Section Header */}
        <div className="grid grid-cols-1 gap-6 border-b border-[#f4efe6]/12 pb-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="text-xs font-medium tracking-[0.22em] uppercase text-[#cbb389]">
              04 · Interactive Visual Site Map
            </p>
            <h2 className="mt-4 font-serif text-[clamp(2.2rem,4.2vw,3.75rem)] font-normal leading-[1.06] text-[#f4efe6]">
              Explore the vertical composition floor by floor.
            </h2>
          </div>
          <div className="lg:col-span-5 lg:text-right">
            <p className="text-sm font-light leading-relaxed text-[#c8c4bc]">
              Hover over or select any architectural zone on the 56-metre tower elevation—or inspect
              the interactive 3D architectural massing study—floor by floor.
            </p>
          </div>
        </div>

        {/* Interactive Tower Elevation + Live Feature Inspector */}
        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
          {/* Left: Interactive Tower Elevation Representation or 3D Massing View */}
          <div className="lg:col-span-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f4efe6]/12 pb-3 text-xs tracking-[0.16em] uppercase text-[#93a1aa]">
              <span className="inline-flex items-center gap-2">
                {viewMode === 'blueprint' ? (
                  <Layers className="h-3.5 w-3.5 text-[#cbb389]" strokeWidth={1.5} />
                ) : (
                  <Box className="h-3.5 w-3.5 text-[#cbb389]" strokeWidth={1.5} />
                )}
                <span>Elevation · 56 Metres</span>
              </span>

              {/* Mode Switcher: Elevation Blueprint vs 3D Massing Study */}
              <div
                role="tablist"
                aria-label="Tower visual representation mode"
                className="inline-flex border border-[#cbb389]/30 bg-[#132b30]"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === 'blueprint'}
                  onClick={() => setViewMode('blueprint')}
                  className={`px-3 py-1.5 font-mono text-[10px] tracking-[0.14em] uppercase transition-colors ${
                    viewMode === 'blueprint'
                      ? 'bg-[#cbb389] text-[#0e2226] font-semibold'
                      : 'text-[#c8c4bc] hover:text-[#f4efe6]'
                  }`}
                >
                  Elevation
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === '3d'}
                  onClick={() => setViewMode('3d')}
                  className={`px-3 py-1.5 font-mono text-[10px] tracking-[0.14em] uppercase transition-colors ${
                    viewMode === '3d'
                      ? 'bg-[#cbb389] text-[#0e2226] font-semibold'
                      : 'text-[#c8c4bc] hover:text-[#f4efe6]'
                  }`}
                >
                  3D Massing
                </button>
              </div>
            </div>

            <div className="relative mt-4 overflow-hidden border border-[#cbb389]/25 bg-[#132b30] p-3 sm:p-4">
              {viewMode === 'blueprint' ? (
                <div
                  data-testid="tower-sitemap-canvas"
                  className="relative mx-auto aspect-[10/14] w-full max-w-[460px] overflow-hidden border border-[#f4efe6]/12 bg-[#0c1b1f]"
                >
                  <SafeImage
                    src={OFFICIAL_IMAGES.elevationFull}
                    alt="Interactive architectural elevation of Paradigm Green Acrres showing rooftop sky deck, penthouse, full-floor sky estates, biophilic facade, and Belgrave Hall"
                    fallbackTitle="Green Acrres Tower Elevation"
                    className="h-full w-full object-cover object-center"
                  />

                  {/* Subtle slate wash so illuminated hover zones stand out sharply */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-[#0e2226]/20"
                  />

                  {/* Interactive Zone Overlays mapped directly to tower tiers */}
                  {TOWER_ZONES.map((zone) => {
                    const isActive = zone.id === activeZone.id;
                    return (
                      <button
                        key={zone.id}
                        type="button"
                        onMouseEnter={() => setActiveZoneId(zone.id)}
                        onFocus={() => setActiveZoneId(zone.id)}
                        onClick={() => setActiveZoneId(zone.id)}
                        onKeyDown={(e) => handleZoneKeyDown(e, zone.id)}
                        aria-pressed={isActive}
                        aria-label={`${zone.tierCode}: ${zone.title} (${zone.elevationLabel})`}
                        style={{
                          top: `${zone.bandTopPct}%`,
                          height: `${zone.bandHeightPct}%`,
                        }}
                        className={`group absolute inset-x-0 flex items-center justify-between px-3 text-left transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#cbb389] ${
                          isActive
                            ? 'border-y border-[#cbb389] bg-[#0e2226]/45 shadow-[inset_0_0_24px_rgba(203,179,137,0.24)]'
                            : 'border-y border-transparent bg-[#0e2226]/10 hover:border-[#cbb389]/60 hover:bg-[#0e2226]/35'
                        }`}
                      >
                        <span
                          className={`inline-block px-2 py-0.5 font-mono text-[10px] tracking-[0.16em] uppercase whitespace-nowrap transition-colors ${
                            isActive
                              ? 'bg-[#cbb389] text-[#0e2226] font-semibold'
                              : 'bg-[#0e2226]/80 text-[#f4efe6]/80 group-hover:text-[#cbb389]'
                          }`}
                        >
                          {zone.tierCode}
                        </span>

                        <span
                          className={`hidden sm:inline-block px-2 py-0.5 text-[11px] font-medium tracking-[0.12em] uppercase transition-opacity ${
                            isActive
                              ? 'bg-[#0e2226]/90 text-[#f4efe6] opacity-100'
                              : 'bg-[#0e2226]/70 text-[#c8c4bc] opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          {zone.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <TowerMassing3D
                  activeZoneId={activeZoneId}
                  onSelectZone={setActiveZoneId}
                  onToggleFullscreen={() => setFullscreen3D(true)}
                />
              )}
            </div>
          </div>

          {/* Right: Zone Selector Rail + Active Architectural Feature Panel */}
          <div className="flex flex-col gap-8 lg:col-span-6">
            {/* Compact Tier Selector List (supports hover & tap) */}
            <div
              role="list"
              aria-label="Tower Architectural Zones"
              className="border-t border-[#f4efe6]/15"
            >
              {TOWER_ZONES.map((zone) => {
                const isActive = zone.id === activeZone.id;
                return (
                  <button
                    key={zone.id}
                    type="button"
                    onMouseEnter={() => setActiveZoneId(zone.id)}
                    onFocus={() => setActiveZoneId(zone.id)}
                    onClick={() => setActiveZoneId(zone.id)}
                    onKeyDown={(e) => handleZoneKeyDown(e, zone.id)}
                    aria-current={isActive ? 'true' : undefined}
                    className={`flex w-full items-center justify-between gap-4 border-b border-[#f4efe6]/15 px-4 py-3.5 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#cbb389] ${
                      isActive
                        ? 'bg-[#132b30] text-[#f4efe6]'
                        : 'text-[#c8c4bc] hover:bg-[#132b30]/45 hover:text-[#f4efe6]'
                    }`}
                  >
                    <div className="flex items-baseline gap-3">
                      <span className="font-mono text-xs text-[#cbb389] whitespace-nowrap shrink-0">
                        {zone.tierCode}
                      </span>
                      <span className="font-serif text-lg sm:text-xl">{zone.title}</span>
                    </div>
                    <span className="hidden shrink-0 font-mono text-[11px] tracking-[0.12em] uppercase text-[#93a1aa] sm:inline">
                      {zone.elevationLabel}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Architectural Inspector Card */}
            <div
              data-testid="tower-sitemap-inspector"
              aria-live="polite"
              className="bg-[#132b30] border border-[#cbb389]/25 p-6 sm:p-8"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f4efe6]/12 pb-3 text-xs tracking-[0.16em] uppercase">
                <span className="font-mono text-[#cbb389]">{activeZone.tierCode}</span>
                <span className="font-mono text-[#c8c4bc]">{activeZone.elevationLabel}</span>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-12 sm:items-start">
                <div className="sm:col-span-5">
                  <div className="overflow-hidden border border-[#f4efe6]/14 bg-[#0e2226]">
                    <div className="aspect-[4/3] w-full overflow-hidden">
                      <SafeImage
                        key={activeZone.id}
                        src={activeZone.previewImage}
                        alt={activeZone.previewAlt}
                        fallbackTitle={activeZone.title}
                        className="h-full w-full object-cover object-center"
                      />
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-7">
                  <div className="text-xs tracking-[0.16em] uppercase text-[#cbb389]">
                    {activeZone.subtitle}
                  </div>
                  <h3 className="mt-1.5 font-serif text-2xl sm:text-3xl font-normal text-[#f4efe6]">
                    {activeZone.title}
                  </h3>
                  <p className="mt-3 text-sm font-light leading-relaxed text-[#c8c4bc]">
                    {activeZone.description}
                  </p>
                </div>
              </div>

              <ul className="mt-6 grid grid-cols-1 gap-2.5 border-t border-[#f4efe6]/12 pt-5 sm:grid-cols-2">
                {activeZone.highlights.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-xs sm:text-sm font-light text-[#f4efe6]/90"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-[#cbb389]"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#f4efe6]/12 pt-5">
                <span className="text-xs tracking-[0.14em] uppercase text-[#93a1aa]">
                  Verified Paradigm Green Acrres Datum
                </span>
                <a
                  href="#enquiry"
                  className="inline-flex h-10 items-center justify-center border border-[#cbb389]/70 px-5 text-xs font-medium tracking-[0.16em] uppercase text-[#f4efe6] transition-colors hover:bg-[#cbb389] hover:text-[#0e2226]"
                >
                  Enquire About This Tier
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {fullscreen3D && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Full viewport 3D architectural massing study"
          className="fixed inset-0 z-50 h-screen w-screen bg-[#0a181b]"
        >
          <TowerMassing3D
            activeZoneId={activeZoneId}
            onSelectZone={setActiveZoneId}
            isFullscreen
            onToggleFullscreen={() => setFullscreen3D(false)}
          />
        </div>
      )}
    </section>
  );
}
