import { ArrowUpRight } from 'lucide-react';
import { PROJECT_META } from '../data/projectData';

export function Footer() {
  return (
    <footer className="bg-[#0a181b] border-t border-[#cbb389]/20 px-6 py-16 text-[#c8c4bc] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1380px]">
        <div className="grid grid-cols-1 gap-10 border-b border-[#f4efe6]/12 pb-12 lg:grid-cols-12">
          {/* Brand Identity */}
          <div className="lg:col-span-5">
            <div className="font-serif text-2xl tracking-[0.22em] uppercase text-[#f4efe6]">
              GREEN ACRRES
            </div>
            <div className="mt-2 text-xs tracking-[0.18em] uppercase text-[#cbb389]">
              {PROJECT_META.developer} · {PROJECT_META.collection}
            </div>
            <p className="mt-4 max-w-md text-sm font-light leading-relaxed text-[#93a1aa]">
              {PROJECT_META.addressLine1}, {PROJECT_META.addressLine2}, {PROJECT_META.stateCountry}.
            </p>
          </div>

          {/* Section Links */}
          <div className="lg:col-span-3">
            <div className="text-xs font-medium tracking-[0.18em] uppercase text-[#cbb389]">
              Monograph Sections
            </div>
            <ul className="mt-4 space-y-2.5 text-sm font-light">
              <li>
                <a href="#architecture" className="transition-colors hover:text-[#f4efe6]">
                  Architecture
                </a>
              </li>
              <li>
                <a href="#philosophy" className="transition-colors hover:text-[#f4efe6]">
                  Philosophy
                </a>
              </li>
              <li>
                <a href="#highlights" className="transition-colors hover:text-[#f4efe6]">
                  Project Highlights
                </a>
              </li>
              <li>
                <a href="#site-map" className="transition-colors hover:text-[#f4efe6]">
                  Interactive Site Map
                </a>
              </li>
              <li>
                <a href="#residences" className="transition-colors hover:text-[#f4efe6]">
                  Residences
                </a>
              </li>
              <li>
                <a href="#amenities" className="transition-colors hover:text-[#f4efe6]">
                  Amenities
                </a>
              </li>
              <li>
                <a href="#location" className="transition-colors hover:text-[#f4efe6]">
                  Location
                </a>
              </li>
              <li>
                <a href="#gallery" className="transition-colors hover:text-[#f4efe6]">
                  Gallery
                </a>
              </li>
            </ul>
          </div>

          {/* Official References & RERA */}
          <div className="lg:col-span-4">
            <div className="text-xs font-medium tracking-[0.18em] uppercase text-[#cbb389]">
              Official References &amp; RERA
            </div>
            <div className="mt-4 space-y-4 text-sm font-light">
              <div>
                <a
                  href={PROJECT_META.officialWebsite}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[#f4efe6] underline underline-offset-4 transition-colors hover:text-[#cbb389]"
                >
                  <span>paradigmgreenacrres.com</span>
                  <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                </a>
              </div>
              <div className="border border-[#f4efe6]/12 bg-[#0e2226] p-4 text-xs">
                <div className="tracking-[0.14em] uppercase text-[#93a1aa]">
                  MahaRERA Registration No.
                </div>
                <div className="mt-1 font-mono text-sm text-[#cbb389]">
                  {PROJECT_META.mahareraNumber}
                </div>
                <a
                  href={PROJECT_META.mahareraUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-[11px] text-[#c8c4bc] underline underline-offset-2 hover:text-[#f4efe6]"
                >
                  <span>Verify on maharerait.mahaonline.gov.in</span>
                  <ArrowUpRight className="h-3 w-3" strokeWidth={1.5} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="mt-8 flex flex-col gap-4 text-xs font-light leading-relaxed text-[#93a1aa] lg:flex-row lg:items-center lg:justify-between">
          <p className="max-w-4xl">{PROJECT_META.disclaimer}</p>
          <p className="shrink-0 text-[#c8c4bc]">
            © {new Date().getFullYear()} {PROJECT_META.officialBrand}, Pali Hill.
          </p>
        </div>
      </div>
    </footer>
  );
}
