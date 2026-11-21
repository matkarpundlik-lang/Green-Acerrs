import {
  PROJECT_META,
  UNVERIFIED_DISCLOSURE_PLACEHOLDERS,
  VERIFIED_HIGHLIGHTS,
} from '../data/projectData';
import { ParallaxLayer } from './ParallaxLayer';

export function Highlights() {
  return (
    <section
      id="highlights"
      className="relative scroll-mt-20 overflow-hidden bg-[#0e2226] border-y border-[#cbb389]/20 px-6 py-20 sm:px-8 sm:py-28 lg:px-12"
    >
      {/* Subtle drifting architectural grid backdrop behind numerical highlights */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <ParallaxLayer
          layerName="highlights-bg"
          rangePx={26}
          invert
          withScale={false}
          className="h-full w-full"
        >
          <div className="mx-auto grid h-full max-w-[1380px] grid-cols-3 border-x border-[#cbb389]/8">
            <div className="border-r border-[#cbb389]/6" />
            <div className="border-r border-[#cbb389]/6" />
            <div />
          </div>
        </ParallaxLayer>
      </div>

      <div className="relative z-10 mx-auto max-w-[1380px]">
        {/* Header Row */}
        <div className="grid grid-cols-1 gap-6 pb-12 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="text-xs font-medium tracking-[0.22em] uppercase text-[#cbb389]">
              03 · Verified Project Highlights
            </p>
            <h2 className="mt-4 font-serif text-[clamp(2.2rem,4vw,3.5rem)] font-normal leading-[1.08] text-[#f4efe6]">
              Scale measured in silence, height, and rarity.
            </h2>
          </div>
          <div className="lg:col-span-5 lg:text-right">
            <p className="text-xs tracking-[0.16em] uppercase text-[#93a1aa]">
              Confirmed Specifications · {PROJECT_META.officialBrand}
            </p>
            <p className="mt-1 font-mono text-xs text-[#cbb389]">
              MahaRERA Reg. {PROJECT_META.mahareraNumber}
            </p>
          </div>
        </div>

        {/* Oversized Tabular Numerical Grid */}
        <div className="grid grid-cols-1 border-t border-[#f4efe6]/15 sm:grid-cols-2 lg:grid-cols-3">
          {VERIFIED_HIGHLIGHTS.map((item, idx) => (
            <div
              key={item.id}
              className={`border-b border-[#f4efe6]/15 py-10 sm:px-8 ${
                idx % 3 !== 2 ? 'lg:border-r lg:border-[#f4efe6]/15' : ''
              } ${idx % 2 === 0 ? 'sm:border-r sm:border-[#f4efe6]/15 lg:border-r-0' : ''}`}
            >
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-serif text-[clamp(3.25rem,5vw,4.75rem)] font-normal leading-none tabular-nums text-[#f4efe6]">
                  {item.value}
                </span>
                <span className="font-mono text-xs tracking-[0.16em] uppercase text-[#cbb389]">
                  {item.unit}
                </span>
              </div>
              <h3 className="mt-5 text-sm font-medium tracking-[0.14em] uppercase text-[#f4efe6]">
                {item.label}
              </h3>
              <p className="mt-2 text-sm font-light leading-relaxed text-[#c8c4bc]">
                {item.detail}
              </p>
            </div>
          ))}
        </div>

        {/* Transparent Editable Placeholders for Non-Public Commercial Terms */}
        <div className="mt-12 bg-[#132b30] border border-[#cbb389]/25 p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-md">
              <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#cbb389]">
                Official Dossier Disclosures
              </p>
              <p className="mt-2 text-sm font-light leading-relaxed text-[#c8c4bc]">
                Unit-specific carpet areas, floor plans, pricing schedules, and possession milestones
                are withheld from public listing and shared exclusively by Paradigm Realty upon
                private registration.
              </p>
            </div>

            <dl className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-3 lg:max-w-3xl">
              {UNVERIFIED_DISCLOSURE_PLACEHOLDERS.map((entry) => (
                <div
                  key={entry.label}
                  className="border border-[#f4efe6]/12 bg-[#0e2226]/70 p-4"
                >
                  <dt className="text-xs font-medium tracking-[0.14em] uppercase text-[#cbb389]">
                    {entry.label}
                  </dt>
                  <dd className="mt-2 text-xs font-light leading-relaxed text-[#f4efe6]/85">
                    {entry.status}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
