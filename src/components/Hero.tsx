import { useEffect, useRef } from 'react';
import { ArrowDown, Compass } from 'lucide-react';
import { OFFICIAL_IMAGES, PROJECT_META } from '../data/projectData';
import { computeHeroParallaxMetrics } from '../utils/parallaxMath';
import { SafeImage } from './SafeImage';

interface HeroProps {
  onOpenVirtualTour?: () => void;
}

export function Hero({ onOpenVirtualTour }: HeroProps) {
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const midgroundRef = useRef<HTMLDivElement | null>(null);
  const foregroundRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const applyHeroTransforms = () => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const metrics = reduced
        ? {
            backdropYPx: 0,
            backdropScale: 1.06,
            midgroundYPx: 0,
            foregroundYPx: 0,
            foregroundOpacity: 1,
          }
        : computeHeroParallaxMetrics(window.scrollY, window.innerHeight || 900);

      if (backdropRef.current) {
        backdropRef.current.style.transform = `translate3d(0, ${metrics.backdropYPx}px, 0) scale(${metrics.backdropScale})`;
        backdropRef.current.setAttribute('data-parallax-y', String(metrics.backdropYPx));
      }
      if (midgroundRef.current) {
        midgroundRef.current.style.transform = `translate3d(0, ${metrics.midgroundYPx}px, 0)`;
      }
      if (foregroundRef.current) {
        foregroundRef.current.style.transform = `translate3d(0, ${metrics.foregroundYPx}px, 0)`;
        foregroundRef.current.style.opacity = String(metrics.foregroundOpacity);
      }
    };

    applyHeroTransforms();

    let rafId = 0;
    const handleScrollOrResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(applyHeroTransforms);
    };

    window.addEventListener('scroll', handleScrollOrResize, { passive: true });
    window.addEventListener('resize', handleScrollOrResize, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('resize', handleScrollOrResize);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <section
      id="hero"
      className="relative flex min-h-[100svh] w-full flex-col justify-end overflow-hidden bg-[#0e2226]"
    >
      {/* Plane 1 (Deepest): Full-viewport official architectural photograph with subtle downward parallax & overscan */}
      <div
        ref={backdropRef}
        data-parallax-role="hero-bg"
        data-parallax-y="0"
        className="pointer-events-none absolute inset-0 will-change-transform"
        style={{ transform: 'translate3d(0, 0px, 0) scale(1.09)' }}
      >
        <SafeImage
          src={OFFICIAL_IMAGES.infinityPool}
          alt="Paradigm Green Acrres rooftop infinity pool and architectural terrace overlooking the Mumbai skyline at twilight"
          loading="eager"
          fallbackTitle="Green Acrres · Rooftop Horizon"
          className="h-full w-full object-cover object-center"
        />
      </div>

      {/* Controlled atmospheric slate-teal gradient scrim for WCAG contrast */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0e2226]/70 via-[#0e2226]/35 to-[#0e2226]/95"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0e2226]/75 via-transparent to-[#0e2226]/35"
      />

      {/* Plane 2 (Midground): Subtle architectural hairline framing drifting at intermediate scroll depth */}
      <div
        ref={midgroundRef}
        aria-hidden="true"
        data-parallax-role="hero-midground"
        className="pointer-events-none absolute inset-x-0 top-24 bottom-24 mx-auto hidden max-w-[1440px] border-x border-[#cbb389]/12 will-change-transform lg:block"
      >
        <div className="absolute inset-x-10 top-1/3 border-t border-[#f4efe6]/8" />
        <div className="absolute right-8 top-6 font-mono text-[10px] tracking-[0.22em] uppercase text-[#cbb389]/55">
          ELEV. +56.0 M · PALI HILL
        </div>
      </div>

      {/* Plane 3 (Foreground): Editorial composition with gentle upward counter-drift */}
      <div
        ref={foregroundRef}
        data-parallax-role="hero-fg"
        className="relative z-10 mx-auto w-full max-w-[1380px] px-6 pb-10 pt-28 will-change-transform sm:pb-14 lg:px-12 lg:pb-16"
      >
        <div className="grid grid-cols-1 items-end gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium tracking-[0.22em] uppercase text-[#cbb389]">
              <span>{PROJECT_META.developer}</span>
              <span aria-hidden="true">·</span>
              <span>{PROJECT_META.collection}</span>
            </div>

            <h1 className="font-serif text-[clamp(3.25rem,8.5vw,7.5rem)] font-normal leading-[0.9] tracking-[0.06em] uppercase text-[#f4efe6]">
              GREEN ACRRES
            </h1>

            <p className="mt-5 max-w-xl text-sm sm:text-base font-light leading-relaxed text-[#f4efe6]/85">
              Five sovereign full-floor sky estates rising 56 metres above{' '}
              <span className="text-[#f4efe6] font-normal">
                {PROJECT_META.addressLine1}, {PROJECT_META.addressLine2}
              </span>
              .
            </p>
          </div>

          <div className="flex flex-col items-start gap-6 lg:col-span-5 lg:items-end lg:text-right">
            <div className="border-t border-[#cbb389]/35 pt-4 text-xs tracking-[0.18em] uppercase text-[#c8c4bc]">
              <div>Pali Hill · Bandra West</div>
              <div className="mt-1 font-mono text-[11px] text-[#cbb389]">
                MahaRERA {PROJECT_META.mahareraNumber}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 lg:justify-end">
              <a
                href="#enquiry"
                className="inline-flex h-12 items-center justify-center bg-[#cbb389] px-6 text-xs font-semibold tracking-[0.18em] uppercase text-[#0e2226] whitespace-nowrap shrink-0 transition-colors duration-150 hover:bg-[#dcc7a0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#cbb389]"
              >
                Register Interest
              </a>
              {onOpenVirtualTour && (
                <button
                  type="button"
                  onClick={onOpenVirtualTour}
                  className="inline-flex h-12 items-center gap-2 border border-[#cbb389]/60 bg-[#0e2226]/70 px-5 text-xs font-medium tracking-[0.16em] uppercase text-[#cbb389] whitespace-nowrap shrink-0 transition-colors duration-150 hover:border-[#cbb389] hover:bg-[#cbb389] hover:text-[#0e2226] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#cbb389]"
                >
                  <Compass className="h-3.5 w-3.5" strokeWidth={1.5} />
                  <span>Virtual Experience</span>
                </button>
              )}
              <a
                href="#architecture"
                aria-label="Scroll to architectural introduction"
                className="inline-flex h-12 items-center gap-2 border border-[#f4efe6]/30 bg-[#0e2226]/55 px-5 text-xs font-medium tracking-[0.16em] uppercase text-[#f4efe6] whitespace-nowrap shrink-0 transition-colors duration-150 hover:border-[#cbb389] hover:text-[#cbb389]"
              >
                <span>Explore</span>
                <ArrowDown className="h-3.5 w-3.5" strokeWidth={1.5} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
