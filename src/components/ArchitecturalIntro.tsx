import { OFFICIAL_IMAGES, PROJECT_META } from '../data/projectData';
import { ParallaxLayer } from './ParallaxLayer';
import { SafeImage } from './SafeImage';

export function ArchitecturalIntro() {
  return (
    <section
      id="architecture"
      className="relative scroll-mt-20 overflow-hidden bg-[#29353d] px-4 py-16 sm:px-8 sm:py-24 lg:px-12 lg:py-28"
    >
      {/* Subtle slate background architectural parallax framing */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <ParallaxLayer
          layerName="intro-backdrop"
          rangePx={34}
          invert
          withScale={false}
          className="mx-auto h-full max-w-[1440px] border-x border-[#f4efe6]/5"
        >
          <div className="h-full w-full bg-[radial-gradient(ellipse_at_top_right,rgba(203,179,137,0.06),transparent_60%)]" />
        </ParallaxLayer>
      </div>

      <div className="relative z-10 mx-auto max-w-[1380px] bg-[#0e2226] border border-[#cbb389]/20 p-6 sm:p-10 lg:p-16">
        {/* Editorial Kicker & Oversized Headline */}
        <div className="grid grid-cols-1 gap-8 border-b border-[#f4efe6]/12 pb-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="text-xs font-medium tracking-[0.22em] uppercase text-[#cbb389]">
              01 · Architectural Introduction
            </p>
            <h2 className="mt-4 font-serif text-[clamp(2.25rem,4.5vw,4rem)] font-normal leading-[1.05] text-[#f4efe6]">
              Composed like a stately manor above Pali Hill.
            </h2>
          </div>
          <div className="lg:col-span-5 lg:pb-1">
            <p className="text-sm sm:text-base font-light leading-relaxed text-[#c8c4bc]">
              Perched on Billionaires&apos; Row along Nargis Dutt Road,{' '}
              <span className="text-[#f4efe6] font-normal">{PROJECT_META.officialBrand}</span>{' '}
              commands a rare sea-facing vantage in Mumbai&apos;s most distinguished enclave—where
              discretion, scale, and quiet power define contemporary residential architecture.
            </p>
          </div>
        </div>

        {/* Asymmetrical Editorial Image Composition */}
        <div className="mt-12 grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Left: Full Vertical Elevation (1080x1720 natural portrait ratio) */}
          <figure className="lg:col-span-7">
            <div className="relative overflow-hidden border border-[#cbb389]/20 bg-[#132b30] p-3 sm:p-4">
              <div className="relative aspect-[10/14] w-full overflow-hidden">
                <ParallaxLayer
                  layerName="intro-elevation"
                  rangePx={24}
                  className="h-full w-full"
                >
                  <SafeImage
                    src={OFFICIAL_IMAGES.elevationFull}
                    alt="Full front architectural elevation of Green Acrres rising 56 metres amidst Pali Hill canopy"
                    fallbackTitle="56-Metre Architectural Elevation"
                    className="h-full w-full object-cover object-center transition-transform duration-700 hover:scale-[1.02]"
                  />
                </ParallaxLayer>
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0e2226]/25 via-transparent to-[#0e2226]/25"
                />
              </div>
            </div>
            <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs tracking-[0.14em] uppercase text-[#93a1aa]">
              <span>Fig. 01 — Front Elevation · Nargis Dutt Road</span>
              <span className="font-mono text-[#cbb389]">56M · 16 FLOORS</span>
            </figcaption>
          </figure>

          {/* Right: Asymmetrical Drop-Off Plate & Editorial Narrative */}
          <div className="flex flex-col justify-between gap-10 lg:col-span-5 lg:pt-12">
            <div className="space-y-6">
              <div className="text-xs tracking-[0.18em] uppercase text-[#cbb389]">
                Japandi Architectural Discipline
              </div>
              <p className="text-base font-light leading-[1.75] text-[#f4efe6]/90">
                Conceived with Japandi architectural clarity—uniting Japanese restraint with
                Scandinavian warmth—the 16-floor structure pairs international honed stone and dark
                bronze vertical louvres with cascading greenery across its private terraces.
              </p>
              <p className="text-sm font-light leading-[1.75] text-[#c8c4bc]">
                Arrival begins beneath a 17.5 ft. sweeping valet-serviced portico leading into a
                car-free landscaped ground plane anchored by a century-old bonsai.
              </p>
            </div>

            <figure className="border-t border-[#cbb389]/25 pt-8">
              <div className="overflow-hidden border border-[#f4efe6]/12 bg-[#132b30]">
                <div className="aspect-square w-full overflow-hidden rounded-t-[2.5rem] sm:rounded-t-[3.5rem]">
                  <ParallaxLayer
                    layerName="intro-dropoff"
                    rangePx={18}
                    invert
                    className="h-full w-full"
                  >
                    <SafeImage
                      src={OFFICIAL_IMAGES.dropOff}
                      alt="Green Acrres 17.5-foot valet drop-off portico with travertine walls and ancient bonsai"
                      fallbackTitle="Valet Drop-Off Portico"
                      className="h-full w-full object-cover object-center transition-transform duration-700 hover:scale-[1.03]"
                    />
                  </ParallaxLayer>
                </div>
              </div>
              <figcaption className="mt-3 flex items-center justify-between gap-2 text-xs tracking-[0.14em] uppercase text-[#93a1aa]">
                <span>Fig. 02 — Valet Drop-Off &amp; Bonsai Courtyard</span>
                <span className="font-mono text-[#cbb389]">17.5 FT PORTICO</span>
              </figcaption>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}
