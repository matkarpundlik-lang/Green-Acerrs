import { useEffect, useRef, type ReactNode } from 'react';
import {
  computeParallaxShift,
  computeSectionProgress,
} from '../utils/parallaxMath';

interface LayerRegistration {
  element: HTMLElement;
  rangePx: number;
  invert: boolean;
  withScale: boolean;
  isVisible: boolean;
}

const registrations = new Set<LayerRegistration>();
let rafScheduled = false;
let listenersAttached = false;
let reducedMotion = false;
let observer: IntersectionObserver | null = null;

function checkReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function flushParallaxFrame() {
  rafScheduled = false;
  if (typeof window === 'undefined') return;

  reducedMotion = checkReducedMotion();
  const viewportHeight = window.innerHeight || 900;

  if (reducedMotion) {
    for (const reg of registrations) {
      reg.element.style.transform = 'translate3d(0, 0, 0)';
      reg.element.setAttribute('data-parallax-y', '0');
    }
    return;
  }

  // Batch DOM reads first to avoid forced layout thrashing
  const measurements: Array<{
    reg: LayerRegistration;
    top: number;
    height: number;
  }> = [];

  for (const reg of registrations) {
    if (!reg.isVisible) continue;
    const rect = reg.element.getBoundingClientRect();
    measurements.push({
      reg,
      top: rect.top,
      height: rect.height || 400,
    });
  }

  // Batch GPU-composited transform writes second
  for (const { reg, top, height } of measurements) {
    const progress = computeSectionProgress(top, height, viewportHeight);
    const { yPx, scale } = computeParallaxShift(
      progress,
      reg.rangePx,
      reg.invert,
      height
    );
    const transform = reg.withScale
      ? `translate3d(0, ${yPx}px, 0) scale(${scale})`
      : `translate3d(0, ${yPx}px, 0)`;

    reg.element.style.transform = transform;
    reg.element.setAttribute('data-parallax-y', String(yPx));
  }
}

function scheduleParallaxFrame() {
  if (rafScheduled || typeof window === 'undefined') return;
  rafScheduled = true;
  window.requestAnimationFrame(flushParallaxFrame);
}

function ensureObserver(): IntersectionObserver | null {
  if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
    return null;
  }
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          for (const reg of registrations) {
            if (reg.element === entry.target) {
              reg.isVisible = entry.isIntersecting;
            }
          }
        }
        scheduleParallaxFrame();
      },
      { rootMargin: '220px 0px' }
    );
  }
  return observer;
}

function attachGlobalListeners() {
  if (listenersAttached || typeof window === 'undefined') return;
  listenersAttached = true;
  window.addEventListener('scroll', scheduleParallaxFrame, { passive: true });
  window.addEventListener('resize', scheduleParallaxFrame, { passive: true });
}

function detachGlobalListenersIfEmpty() {
  if (!listenersAttached || registrations.size > 0 || typeof window === 'undefined') {
    return;
  }
  window.removeEventListener('scroll', scheduleParallaxFrame);
  window.removeEventListener('resize', scheduleParallaxFrame);
  observer?.disconnect();
  observer = null;
  listenersAttached = false;
}

export interface ParallaxLayerProps {
  children: ReactNode;
  rangePx?: number;
  invert?: boolean;
  withScale?: boolean;
  layerName?: string;
  className?: string;
}

export function ParallaxLayer({
  children,
  rangePx = 22,
  invert = false,
  withScale = true,
  layerName = 'section-plate',
  className = '',
}: ParallaxLayerProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reg: LayerRegistration = {
      element: el,
      rangePx,
      invert,
      withScale,
      isVisible: true,
    };

    registrations.add(reg);
    attachGlobalListeners();

    const io = ensureObserver();
    io?.observe(el);

    scheduleParallaxFrame();

    return () => {
      io?.unobserve(el);
      registrations.delete(reg);
      detachGlobalListenersIfEmpty();
    };
  }, [rangePx, invert, withScale]);

  return (
    <div
      ref={ref}
      data-parallax-layer={layerName}
      data-parallax-y="0"
      className={`will-change-transform ${className}`}
    >
      {children}
    </div>
  );
}
