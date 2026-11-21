import { useState } from 'react';
import { AMENITY_SHOWCASES } from '../data/projectData';
import { ParallaxLayer } from './ParallaxLayer';
import { SafeImage } from './SafeImage';

export function Amenities() {
  const [activeId, setActiveId] = useState<string>(AMENITY_SHOWCASES[0].id);
  const activeAmenity =
    AMENITY_SHOWCASES.find((item) => item.id === activeId) ?? AMENITY_SHOWCASES[0];

  const frameClass =
    activeAmenity.imageOrientation === 'landscape'
      ? 'aspect-[2/1]'
      : activeAmenity.imageOrientation === 'tall'
        ? 'aspect-[4/5] max-h-[540px] mx-auto'
        : 'aspect-square max-h-[540px] mx-auto';

  return (
    <section
      id="amenities"
      className="relative scroll-mt-20 overflow-hidden bg-[#0e2226] border-y border-[#cbb389]/20 px-6 py-20 sm:px-8 sm:py-28 lg:px-12"
    >
      {/* Subtle architectural gradient wash drifting behind amenities showcase */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <ParallaxLayer
          layerName="amenities-bg"
          rangePx={26}
          invert
          withScale={false}
          className="h-full w-full"
        >
          <div className="mx-auto h-full max-w-[1440px] bg-[radial-gradient(ellipse_at_center_right,rgba(203,179,137,0.06),transparent_62%)]" />
        </ParallaxLayer>
      </div>

      <div className="relative z-10 mx-auto max-w-[1380px]">
        <div className="grid grid-cols-1 gap-6 pb-12 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="text-xs font-medium tracking-[0.22em] uppercase text-[#cbb389]">
              07 · Curated Amenities
            </p>
            <h2 className="mt-4 font-serif text-[clamp(2.25rem,4.2vw,3.75rem)] font-normal leading-[1.06] text-[#f4efe6]">
              Hospitality, wellness, and rooftop repose.
            </h2>
          </div>
          <div className="lg:col-span-5 lg:text-right">
            <p className="text-sm font-light leading-relaxed text-[#c8c4bc]">
              Every verified amenity is designed for low-density comfort across ground, podium, and
              rooftop tiers.
            </p>
          </div>
        </div>

        {/* Interactive Selector + Stage */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
          {/* Left: Amenity Index Selector */}
          <div
            role="tablist"
            aria-label="Verified Amenities Showcase"
            className="flex flex-col border-t border-[#f4efe6]/15 lg:col-span-5"
          >
            {AMENITY_SHOWCASES.map((item) => {
              const isSelected = item.id === activeAmenity.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setActiveId(item.id)}
                  className={`group flex w-full items-start justify-between gap-4 border-b border-[#f4efe6]/15 px-4 py-5 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#cbb389] ${
                    isSelected
                      ? 'bg-[#132b30] text-[#f4efe6]'
                      : 'bg-transparent text-[#c8c4bc] hover:bg-[#132b30]/45 hover:text-[#f4efe6]'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-3 text-xs tracking-[0.18em] uppercase">
                      <span className="font-mono text-[#cbb389]">{item.index}</span>
                      <span aria-hidden="true" className="text-[#93a1aa]">
                        ·
                      </span>
                      <span className="text-[#93a1aa]">{item.category}</span>
                    </div>
                    <div className="mt-2 font-serif text-2xl font-normal leading-snug">
                      {item.title}
                    </div>
                  </div>
                  <span
                    aria-hidden="true"
                    className={`mt-2 h-2 w-2 shrink-0 border border-[#cbb389] transition-colors ${
                      isSelected ? 'bg-[#cbb389]' : 'bg-transparent'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Right: Active Amenity Editorial Frame */}
          <div
            role="tabpanel"
            aria-label={activeAmenity.title}
            className="bg-[#132b30] border border-[#cbb389]/20 p-6 sm:p-8 lg:col-span-7"
          >
            <div className="overflow-hidden border border-[#f4efe6]/12 bg-[#0e2226]">
              <div className={`w-full overflow-hidden ${frameClass}`}>
                <ParallaxLayer
                  layerName="amenities-stage"
                  rangePx={16}
                  className="h-full w-full"
                >
                  <SafeImage
                    key={activeAmenity.id}
                    src={activeAmenity.image}
                    alt={activeAmenity.imageAlt}
                    fallbackTitle={activeAmenity.title}
                    className="h-full w-full object-cover object-center"
                  />
                </ParallaxLayer>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-b border-[#f4efe6]/12 pb-4 text-xs tracking-[0.16em] uppercase text-[#93a1aa]">
              <span>{activeAmenity.sourceNote}</span>
              <span className="font-mono text-[#cbb389]">{activeAmenity.category}</span>
            </div>

            <div className="mt-6">
              <h3 className="font-serif text-3xl font-normal text-[#f4efe6]">
                {activeAmenity.title}
              </h3>
              <p className="mt-3 text-sm sm:text-base font-light leading-relaxed text-[#c8c4bc]">
                {activeAmenity.summary}
              </p>

              <ul className="mt-6 grid grid-cols-1 gap-3 border-t border-[#f4efe6]/12 pt-5 sm:grid-cols-2">
                {activeAmenity.details.map((detail) => (
                  <li
                    key={detail}
                    className="flex items-start gap-2.5 text-xs sm:text-sm font-light text-[#f4efe6]/90"
                  >
                    <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-[#cbb389]" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
