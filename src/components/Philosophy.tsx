import { PHILOSOPHY_PILLARS } from '../data/projectData';
import { ParallaxLayer } from './ParallaxLayer';

export function Philosophy() {
  return (
    <section
      id="philosophy"
      className="relative scroll-mt-20 overflow-hidden bg-[#29353d] px-6 py-20 sm:px-8 sm:py-28 lg:px-12 lg:py-32"
    >
      {/* Subtle atmospheric architectural rulings drifting behind philosophy typography */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <ParallaxLayer
          layerName="philosophy-bg"
          rangePx={32}
          withScale={false}
          className="mx-auto grid h-full max-w-[1380px] grid-cols-4 border-x border-[#cbb389]/8"
        >
          <div className="border-r border-[#cbb389]/6" />
          <div className="border-r border-[#cbb389]/6" />
          <div className="border-r border-[#cbb389]/6" />
          <div className="bg-[radial-gradient(ellipse_at_center,rgba(14,34,38,0.42),transparent_70%)]" />
        </ParallaxLayer>
      </div>

      <div className="relative z-10 mx-auto max-w-[1380px]">
        {/* Editorial Statement */}
        <div className="border-t border-b border-[#cbb389]/30 py-14 sm:py-20">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="lg:col-span-3">
              <p className="text-xs font-medium tracking-[0.22em] uppercase text-[#cbb389]">
                02 · Project Philosophy
              </p>
              <p className="mt-3 text-xs tracking-[0.16em] uppercase text-[#93a1aa]">
                Sea · Serenity · Sanctuary
              </p>
            </div>

            <div className="lg:col-span-9">
              <blockquote className="font-serif text-[clamp(2rem,4.2vw,3.6rem)] font-normal italic leading-[1.15] text-[#f4efe6]">
                &ldquo;A convergence so rare, even Pali Hill&apos;s choicest will pause in
                adoration.&rdquo;
              </blockquote>
              <p className="mt-8 max-w-2xl text-base font-light leading-[1.8] text-[#c8c4bc]">
                Above the tree-lined boulevards of Bandra West, Green Acrres prioritizes volume,
                natural light, and absolute privacy over density—giving each family an entire
                floor plate framed by the sea and skyline.
              </p>
            </div>
          </div>
        </div>

        {/* Four Verified Architectural Pillars */}
        <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {PHILOSOPHY_PILLARS.map((pillar) => (
            <article
              key={pillar.index}
              className="flex flex-col justify-between border-t border-[#f4efe6]/15 pt-6"
            >
              <div>
                <span className="font-mono text-xs tracking-[0.2em] text-[#cbb389]">
                  {pillar.index}
                </span>
                <h3 className="mt-4 font-serif text-2xl font-normal leading-snug text-[#f4efe6]">
                  {pillar.title}
                </h3>
                <p className="mt-3 text-sm font-light leading-relaxed text-[#c8c4bc]">
                  {pillar.body}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
