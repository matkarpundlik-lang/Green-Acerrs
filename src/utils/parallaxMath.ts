export interface ParallaxShiftResult {
  yPx: number;
  scale: number;
}

export interface HeroParallaxMetrics {
  backdropYPx: number;
  backdropScale: number;
  midgroundYPx: number;
  foregroundYPx: number;
  foregroundOpacity: number;
}

/**
 * Clamps a numeric value into [min, max].
 */
export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/**
 * Computes normalized traversal progress in [-1, 1] for an element passing through the viewport.
 * -1 = element just entering from the bottom; 0 = element centered in viewport; +1 = element exiting top.
 */
export function computeSectionProgress(
  rectTop: number,
  rectHeight: number,
  viewportHeight: number
): number {
  if (viewportHeight <= 0 || rectHeight <= 0) {
    return 0;
  }
  const viewportCenter = viewportHeight / 2;
  const elementCenter = rectTop + rectHeight / 2;
  const halfSpan = (viewportHeight + rectHeight) / 2;
  if (halfSpan <= 0) return 0;
  return clamp((viewportCenter - elementCenter) / halfSpan, -1, 1);
}

/**
 * Computes a bounded vertical parallax translation and minimum safe overscan scale
 * so that an image inside an overflow-hidden frame never exposes container edges.
 */
export function computeParallaxShift(
  progress: number,
  rangePx: number,
  invert = false,
  containerHeightPx = 420
): ParallaxShiftResult {
  const safeProgress = clamp(progress, -1, 1);
  const absRange = Math.max(0, Math.abs(rangePx));
  const direction = invert ? -1 : 1;
  const yPx = Number((safeProgress * absRange * direction).toFixed(2));

  // Ensure overscan covers maximum ±absRange travel on both top and bottom edges.
  const safeHeight = Math.max(240, containerHeightPx);
  const requiredScale = 1 + (absRange * 2.2) / safeHeight;
  const scale = Number(Math.max(1.04, Math.min(requiredScale, 1.24)).toFixed(4));

  return { yPx, scale };
}

/**
 * Multi-plane scroll metrics for the full-bleed Hero composition:
 * - backdrop image drifts gently downward while maintaining overscan
 * - architectural midground grid drifts at an intermediate plane
 * - editorial foreground drifts slightly upward with a subtle late-scroll fade
 */
export function computeHeroParallaxMetrics(
  scrollY: number,
  viewportHeight: number
): HeroParallaxMetrics {
  const safeScrollY = Math.max(0, Number.isFinite(scrollY) ? scrollY : 0);
  const safeVh = Math.max(540, Number.isFinite(viewportHeight) ? viewportHeight : 900);
  const normalized = clamp(safeScrollY / safeVh, 0, 1.25);

  const backdropYPx = Number((normalized * 125).toFixed(2));
  const backdropScale = Number((1.09 + normalized * 0.035).toFixed(4));
  const midgroundYPx = Number((normalized * 64).toFixed(2));
  const foregroundYPx = Number((-normalized * 26).toFixed(2));
  const foregroundOpacity = Number(clamp(1 - Math.max(0, normalized - 0.38) * 0.65, 0.45, 1).toFixed(3));

  return {
    backdropYPx,
    backdropScale,
    midgroundYPx,
    foregroundYPx,
    foregroundOpacity,
  };
}
