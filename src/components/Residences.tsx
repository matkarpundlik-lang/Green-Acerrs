import { Compass } from 'lucide-react';
import { EDITORIAL_STUDIES, OFFICIAL_IMAGES } from '../data/projectData';
import type { VirtualVantageId } from '../utils/virtualTourSpec';
import { ParallaxLayer } from './ParallaxLayer';
import { SafeImage } from './SafeImage';

interface ResidencesProps {
  onOpenVirtualTour?: (vantageId?: VirtualVantageId) => void;
}

const RESIDENCE_ATTRIBUTES = [
  {
    title: 'Full-Floor Sky Estates',
    detail:
      'Only five expansive full-floor residences across the tower, eliminating shared corridors and assuring complete floor-plate privacy.',
  },
  {
    title: '11.6 Ft. to 12 Ft. Clear Volume',
    detail:
      'Generous ceiling heights paired with open floor plans and vast floor-to-ceiling bronze-framed glass facades.',
  },
  {
    title: 'Private & Service Cores',
    detail:
      'Direct private elevator arrival into an exclusive floor lobby, supported by separate high-speed service elevators.',
  },
  {
    title: '8,600 Sq. Ft. Sky Penthouse',
    detail:
      'A crowning multi-directional residence spanning approximately 8,600 sq. ft. with panoramic Arabian Sea and skyline vistas.',
  },
];

export function Residences({ onOpenVirtualTour }: ResidencesProps) {
  return (
    <section
      id="residences"
      className="relative scroll-mt-20 overflow-hidden bg-[#29353d] px-4 py-16 sm:px-8 sm:py-24 lg:px-12 lg:py-28"
    >
      {/* Subtle drifting architectural aura behind Residences monolith */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <ParallaxLayer
          layerName="residences-bg"
          rangePx={30}
          withScale={false}
          className="mx-auto h-full max-w-[1440px]"
        >
          <div className="h-full w-full bg-[radial-gradient(ellipse_at_bottom_left,rgba(14,34,38,0.55),transparent_65%)]" />
        </ParallaxLayer>
      </div>

      <div className="relative z-10 mx-auto max-w-[1380px] bg-[#172025] border border-[#f4efe6]/12 p-6 sm:p-10 lg:p-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-start">
          {/* Left Column: Editorial Text + Interior Study */}
          <div className="space-y-10 lg:col-span-7">
            <div>
              <p className="text-xs font-medium tracking-[0.22em] uppercase text-[#cbb389]">
                05 · The Residences
              </p>
              <h2 className="mt-4 font-serif text-[clamp(2.25rem,4.2vw,3.75rem)] font-normal leading-[1.06] text-[#f4efe6]">
                Sovereign floor plates framed in bronze, stone, and sea light.
              </h2>
              <p className="mt-5 max-w-2xl text-base font-light leading-[1.75] text-[#c8c4bc]">
                Every residence at Green Acrres is conceived as a singular private sanctuary above
                Pali Hill—expanding horizontally across an entire level so living salons, private
                suites, and landscaped decks capture cross-ventilation and uninterrupted horizons.
              </p>
            </div>

            {/* Atmospheric Interior Study + 360° Virtual Experience Trigger */}
            <figure>
              <div className="overflow-hidden border border-[#f4efe6]/12 bg-[#0e2226]">
                <div className="aspect-video w-full overflow-hidden">
                  <ParallaxLayer
                    layerName="residences-interior"
                    rangePx={18}
                    className="h-full w-full"
                  >
                    <SafeImage
                      src={EDITORIAL_STUDIES.interiorStudy}
                      alt="Interior atmospheric study illustrating 12-foot floor-to-ceiling bronze glass overlooking the Arabian Sea at dusk"
                      fallbackTitle="Sky Estate Spatial Study"
                      className="h-full w-full object-cover object-center transition-transform duration-700 hover:scale-[1.02]"
                    />
                  </ParallaxLayer>
                </div>
              </div>
              <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs tracking-[0.14em] uppercase text-[#93a1aa]">
                <span>Spatial Study — Japandi Proportion &amp; Arabian Sea Horizon</span>
                <span className="font-mono text-[#cbb389]">11.6 FT – 12 FT VOLUME</span>
              </figcaption>

              {onOpenVirtualTour && (
                <div className="mt-4 flex flex-col gap-3 border border-[#cbb389]/35 bg-[#0e2226]/90 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-[#cbb389]">
                      Interactive 360° Spatial Walkthrough
                    </p>
                    <p className="mt-1 text-xs font-light text-[#c8c4bc]">
                      Step inside the full-floor living salon, private lift vestibule, and sea verandah.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenVirtualTour('salon')}
                    className="inline-flex h-11 shrink-0 items-center justify-center gap-2 bg-[#cbb389] px-5 text-xs font-semibold tracking-[0.16em] uppercase text-[#0e2226] whitespace-nowrap transition-colors hover:bg-[#dcc7a0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#cbb389]"
                  >
                    <Compass className="h-4 w-4" strokeWidth={1.6} />
                    <span>Launch 360° Interior</span>
                  </button>
                </div>
              )}
            </figure>

            {/* Verified Residential Attributes */}
            <div className="grid grid-cols-1 gap-6 pt-2 sm:grid-cols-2">
              {RESIDENCE_ATTRIBUTES.map((attr) => (
                <div key={attr.title} className="border-t border-[#cbb389]/25 pt-4">
                  <h3 className="font-serif text-xl font-normal text-[#f4efe6]">{attr.title}</h3>
                  <p className="mt-2 text-sm font-light leading-relaxed text-[#c8c4bc]">
                    {attr.detail}
                  </p>
                </div>
              ))}
            </div>

            {/* Honest Floor Plan Disclosure Note */}
            <div className="flex flex-col gap-4 border border-[#cbb389]/30 bg-[#0e2226]/80 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-medium tracking-[0.18em] uppercase text-[#cbb389]">
                  Floor Plans &amp; Unit Configurations
                </p>
                <p className="mt-1 text-xs font-light leading-relaxed text-[#c8c4bc]">
                  Official RERA carpet area statements and private floor layouts are provided strictly
                  upon personal request.
                </p>
              </div>
              <a
                href="#enquiry"
                className="inline-flex h-11 shrink-0 items-center justify-center border border-[#cbb389]/70 px-5 text-xs font-medium tracking-[0.16em] uppercase text-[#f4efe6] whitespace-nowrap transition-colors hover:bg-[#cbb389] hover:text-[#0e2226]"
              >
                Request Floor Plans
              </a>
            </div>
          </div>

          {/* Right Column: Official Vertical Tower Perspective (800x1600) */}
          <figure className="lg:col-span-5">
            <div className="overflow-hidden border border-[#f4efe6]/12 bg-[#0e2226]">
              <div className="aspect-[1/2] max-h-[820px] w-full overflow-hidden">
                <ParallaxLayer
                  layerName="residences-exterior"
                  rangePx={26}
                  invert
                  className="h-full w-full"
                >
                  <SafeImage
                    src={OFFICIAL_IMAGES.exteriorView}
                    alt="Official exterior architectural perspective of Green Acrres showing cantilevered biophilic terraces and bronze louvres"
                    fallbackTitle="Green Acrres Exterior"
                    className="h-full w-full object-cover object-center transition-transform duration-700 hover:scale-[1.02]"
                  />
                </ParallaxLayer>
              </div>
            </div>
            <figcaption className="mt-3 flex items-center justify-between gap-2 text-xs tracking-[0.14em] uppercase text-[#93a1aa]">
              <span>Official Visual — Biophilic Facade &amp; Crown</span>
              <span className="font-mono text-[#cbb389]">ONLY 5 ESTATES</span>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
