import { OFFICIAL_IMAGES } from '../data/projectData';
import { ParallaxLayer } from './ParallaxLayer';
import { SafeImage } from './SafeImage';

export function Lifestyle() {
  return (
    <section
      id="lifestyle"
      className="relative scroll-mt-20 overflow-hidden bg-[#29353d] px-6 py-20 sm:px-8 sm:py-28 lg:px-12"
    >
      <div className="mx-auto max-w-[1380px]">
        <div className="grid grid-cols-1 gap-8 pb-12 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="text-xs font-medium tracking-[0.22em] uppercase text-[#cbb389]">
              06 · The Lifestyle
            </p>
            <h2 className="mt-4 font-serif text-[clamp(2.25rem,4.2vw,3.75rem)] font-normal leading-[1.06] text-[#f4efe6]">
              Quiet power from morning espresso to twilight cinema.
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="text-sm sm:text-base font-light leading-relaxed text-[#c8c4bc]">
              Life at Green Acrres unfolds at a measured pace—beginning inside the 22 ft.
              double-height Belgrave Hall lounge and ascending to private open-air gatherings
              above the Bandra canopy.
            </p>
          </div>
        </div>

        {/* Asymmetrical Dual Official Lifestyle Plates */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
          {/* Primary Square Plate: Grand Lobby */}
          <figure className="lg:col-span-6">
            <div className="overflow-hidden border border-[#f4efe6]/14 bg-[#0e2226] p-3 sm:p-4">
              <div className="aspect-square w-full overflow-hidden rounded-t-[3rem] sm:rounded-t-[4.5rem]">
                <ParallaxLayer
                  layerName="lifestyle-lobby"
                  rangePx={18}
                  className="h-full w-full"
                >
                  <SafeImage
                    src={OFFICIAL_IMAGES.grandLobby}
                    alt="The Belgrave Hall double-height entrance lobby with lounge and deli café"
                    fallbackTitle="The Belgrave Hall"
                    className="h-full w-full object-cover object-center transition-transform duration-700 hover:scale-[1.03]"
                  />
                </ParallaxLayer>
              </div>
            </div>
            <figcaption className="mt-4 flex flex-col gap-1 border-b border-[#f4efe6]/12 pb-4 sm:flex-row sm:items-baseline sm:justify-between">
              <span className="font-serif text-xl text-[#f4efe6]">
                The Belgrave Hall · Lounge &amp; Deli Café
              </span>
              <span className="text-xs tracking-[0.16em] uppercase text-[#cbb389]">
                22 Ft. Arrival Volume
              </span>
            </figcaption>
          </figure>

          {/* Secondary Square Plate: Rooftop Terrace Lounge */}
          <div className="flex flex-col gap-8 lg:col-span-6 lg:pl-6">
            <figure>
              <div className="overflow-hidden border border-[#f4efe6]/14 bg-[#0e2226] p-3 sm:p-4">
                <div className="aspect-square w-full overflow-hidden">
                  <ParallaxLayer
                    layerName="lifestyle-terrace"
                    rangePx={22}
                    invert
                    className="h-full w-full"
                  >
                    <SafeImage
                      src={OFFICIAL_IMAGES.terraceView}
                      alt="Rooftop terrace lounge and open-air screening venue at dusk overlooking Bandra"
                      fallbackTitle="Twilight Terrace Lounge"
                      className="h-full w-full object-cover object-center transition-transform duration-700 hover:scale-[1.03]"
                    />
                  </ParallaxLayer>
                </div>
              </div>
              <figcaption className="mt-4 flex flex-col gap-1 border-b border-[#f4efe6]/12 pb-4 sm:flex-row sm:items-baseline sm:justify-between">
                <span className="font-serif text-xl text-[#f4efe6]">
                  Sky Terrace &amp; Open-Air Cinema
                </span>
                <span className="text-xs tracking-[0.16em] uppercase text-[#cbb389]">
                  4,300+ Sq. Ft. Rooftop
                </span>
              </figcaption>
            </figure>

            <p className="max-w-lg text-sm font-light leading-[1.8] text-[#c8c4bc]">
              Car-free landscaped gardens, discreet valet drop-off, and resident-only rooftop
              hospitality preserve the serenity of an estate while remaining minutes from Mumbai&apos;s
              coastal promenades and financial hub.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
