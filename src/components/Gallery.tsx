import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
import { GALLERY_PLATES } from '../data/projectData';
import { SafeImage } from './SafeImage';

export function Gallery() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const activePlate = lightboxIndex !== null ? GALLERY_PLATES[lightboxIndex] : null;

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) =>
          prev === null ? null : (prev + 1) % GALLERY_PLATES.length
        );
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) =>
          prev === null ? null : (prev - 1 + GALLERY_PLATES.length) % GALLERY_PLATES.length
        );
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxIndex]);

  const spanClasses: Record<string, string> = {
    'plate-01': 'md:col-span-5',
    'plate-02': 'md:col-span-7',
    'plate-03': 'md:col-span-6',
    'plate-04': 'md:col-span-3',
    'plate-05': 'md:col-span-3',
    'plate-06': 'md:col-span-8',
    'plate-07': 'md:col-span-4',
  };

  const aspectClasses: Record<string, string> = {
    'plate-01': 'aspect-square',
    'plate-02': 'aspect-[4/3]',
    'plate-03': 'aspect-[4/3]',
    'plate-04': 'aspect-[1/2] sm:aspect-[3/5]',
    'plate-05': 'aspect-[1/2] sm:aspect-[3/5]',
    'plate-06': 'aspect-[2/1]',
    'plate-07': 'aspect-[10/14] md:aspect-[4/5]',
  };

  return (
    <section
      id="gallery"
      className="scroll-mt-20 bg-[#0e2226] border-t border-[#cbb389]/20 px-6 py-20 sm:px-8 sm:py-28 lg:px-12"
    >
      <div className="mx-auto max-w-[1380px]">
        <div className="grid grid-cols-1 gap-6 pb-12 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="text-xs font-medium tracking-[0.22em] uppercase text-[#cbb389]">
              09 · Curated Architectural Gallery
            </p>
            <h2 className="mt-4 font-serif text-[clamp(2.25rem,4.2vw,3.75rem)] font-normal leading-[1.06] text-[#f4efe6]">
              Official project plates &amp; spaces.
            </h2>
          </div>
          <div className="lg:col-span-5 lg:text-right">
            <p className="text-sm font-light text-[#c8c4bc]">
              Select any plate to inspect in full-screen monograph view.
            </p>
          </div>
        </div>

        {/* Asymmetrical Editorial Gallery Grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          {GALLERY_PLATES.map((plate, idx) => (
            <figure
              key={plate.id}
              className={`group flex flex-col ${spanClasses[plate.id] ?? 'md:col-span-6'}`}
            >
              <button
                type="button"
                onClick={() => setLightboxIndex(idx)}
                aria-label={`Inspect ${plate.title} in lightbox`}
                className="relative block w-full overflow-hidden border border-[#f4efe6]/14 bg-[#132b30] text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#cbb389]"
              >
                <div className={`w-full overflow-hidden ${aspectClasses[plate.id] ?? 'aspect-square'}`}>
                  <SafeImage
                    src={plate.src}
                    alt={plate.alt}
                    fallbackTitle={plate.title}
                    className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                </div>
                <span
                  aria-hidden="true"
                  className="absolute right-3 bottom-3 inline-flex h-10 w-10 items-center justify-center border border-[#cbb389]/50 bg-[#0e2226]/80 text-[#f4efe6] opacity-90 transition-opacity duration-200 group-hover:bg-[#cbb389] group-hover:text-[#0e2226]"
                >
                  <Maximize2 className="h-4 w-4" strokeWidth={1.5} />
                </span>
              </button>

              <figcaption className="mt-3 flex items-baseline justify-between gap-4 border-b border-[#f4efe6]/10 pb-3">
                <div>
                  <span className="font-mono text-xs text-[#cbb389]">{plate.index}</span>
                  <span className="mx-2 text-[#93a1aa]">·</span>
                  <span className="font-serif text-xl text-[#f4efe6]">{plate.title}</span>
                </div>
                <span className="hidden text-xs tracking-[0.12em] uppercase text-[#93a1aa] sm:inline">
                  {plate.subtitle}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>

      {/* Accessible Lightbox Modal */}
      {activePlate && lightboxIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Architectural plate viewer: ${activePlate.title}`}
          className="fixed inset-0 z-50 flex flex-col justify-between bg-[#0a181b]/96 p-4 backdrop-blur-md sm:p-8"
        >
          <div className="flex items-center justify-between border-b border-[#cbb389]/20 pb-4">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-xs text-[#cbb389]">
                {activePlate.index} / 0{GALLERY_PLATES.length}
              </span>
              <span className="font-serif text-xl sm:text-2xl text-[#f4efe6]">
                {activePlate.title}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              aria-label="Close lightbox viewer"
              className="inline-flex h-11 w-11 items-center justify-center border border-[#cbb389]/40 bg-[#0e2226] text-[#f4efe6] transition-colors hover:border-[#cbb389] hover:bg-[#cbb389] hover:text-[#0e2226]"
            >
              <X className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </div>

          <div className="relative my-4 flex flex-1 items-center justify-center overflow-hidden">
            <img
              src={activePlate.src}
              alt={activePlate.alt}
              referrerPolicy="no-referrer"
              className="max-h-[72vh] max-w-full border border-[#f4efe6]/15 object-contain"
            />
          </div>

          <div className="flex flex-col items-center justify-between gap-4 border-t border-[#cbb389]/20 pt-4 sm:flex-row">
            <p className="text-xs tracking-[0.16em] uppercase text-[#c8c4bc]">
              {activePlate.subtitle}
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setLightboxIndex(
                    (lightboxIndex - 1 + GALLERY_PLATES.length) % GALLERY_PLATES.length
                  )
                }
                aria-label="Previous plate"
                className="inline-flex h-11 items-center gap-2 border border-[#cbb389]/40 px-4 text-xs tracking-[0.16em] uppercase text-[#f4efe6] transition-colors hover:bg-[#cbb389] hover:text-[#0e2226]"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
                <span>Previous</span>
              </button>
              <button
                type="button"
                onClick={() => setLightboxIndex((lightboxIndex + 1) % GALLERY_PLATES.length)}
                aria-label="Next plate"
                className="inline-flex h-11 items-center gap-2 border border-[#cbb389]/40 px-4 text-xs tracking-[0.16em] uppercase text-[#f4efe6] transition-colors hover:bg-[#cbb389] hover:text-[#0e2226]"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
