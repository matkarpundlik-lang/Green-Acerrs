import { useEffect, useState } from 'react';
import { Compass, Menu, X } from 'lucide-react';

interface HeaderProps {
  onOpenVirtualTour?: () => void;
}

const NAV_ITEMS = [
  { label: 'Architecture', href: '#architecture' },
  { label: 'Site Map', href: '#site-map' },
  { label: 'Residences', href: '#residences' },
  { label: 'Location', href: '#location' },
  { label: 'Gallery', href: '#gallery' },
];

export function Header({ onOpenVirtualTour }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 48);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 h-16 transition-colors duration-300 ${
          scrolled
            ? 'bg-[#0e2226]/92 backdrop-blur-md border-b border-[#cbb389]/20'
            : 'bg-gradient-to-b from-[#0e2226]/75 to-transparent'
        }`}
      >
        <div className="mx-auto flex h-full max-w-[1380px] items-center justify-between gap-8 px-6 lg:px-12">
          {/* Zone 1: Single-line brand wordmark */}
          <a
            href="#hero"
            className="font-serif text-xl lg:text-2xl tracking-[0.22em] uppercase text-[#f4efe6] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#cbb389]"
          >
            GREEN ACRRES
          </a>

          {/* Zone 2: Concise single-line navigation links */}
          <nav
            aria-label="Primary Navigation"
            className="hidden lg:flex items-center gap-7 text-xs font-medium tracking-[0.16em] uppercase text-[#f4efe6]/85"
          >
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="relative py-1 whitespace-nowrap shrink-0 transition-colors duration-150 hover:text-[#cbb389] after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-[#cbb389] after:transition-transform after:duration-200 hover:after:scale-x-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#cbb389]"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Zone 3: Single primary action CTA + mobile drawer button */}
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="#enquiry"
              className="hidden sm:inline-flex items-center justify-center border border-[#cbb389]/60 bg-[#0e2226]/60 px-5 py-2 text-xs font-medium tracking-[0.16em] uppercase text-[#f4efe6] whitespace-nowrap shrink-0 transition-colors duration-150 hover:bg-[#cbb389] hover:text-[#0e2226] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#cbb389]"
            >
              Private Viewing
            </a>

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={mobileOpen}
              className="inline-flex h-11 w-11 items-center justify-center border border-[#cbb389]/35 bg-[#0e2226]/70 text-[#f4efe6] lg:hidden transition-colors hover:border-[#cbb389] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#cbb389]"
            >
              <Menu className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
          className="fixed inset-0 z-50 flex flex-col bg-[#0e2226] text-[#f4efe6] lg:hidden"
        >
          <div className="flex h-16 items-center justify-between border-b border-[#cbb389]/20 px-6">
            <span className="font-serif text-xl tracking-[0.22em] uppercase text-[#f4efe6]">
              GREEN ACRRES
            </span>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation menu"
              className="inline-flex h-11 w-11 items-center justify-center border border-[#cbb389]/35 text-[#f4efe6] transition-colors hover:border-[#cbb389]"
            >
              <X className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </div>

          <nav aria-label="Mobile Sections" className="flex flex-1 flex-col justify-between px-6 py-10">
            <ul className="space-y-6">
              {NAV_ITEMS.map((item, idx) => (
                <li key={item.href} className="border-b border-[#f4efe6]/10 pb-4">
                  <a
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-baseline justify-between font-serif text-3xl text-[#f4efe6] transition-colors hover:text-[#cbb389]"
                  >
                    <span>{item.label}</span>
                    <span className="font-mono text-xs text-[#cbb389]">0{idx + 1}</span>
                  </a>
                </li>
              ))}
            </ul>

            <div className="space-y-3 pt-8">
              <p className="text-xs tracking-[0.16em] uppercase text-[#93a1aa]">
                Paradigm Realty · Pali Hill, Bandra West
              </p>
              {onOpenVirtualTour && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    onOpenVirtualTour();
                  }}
                  className="flex h-12 w-full items-center justify-center gap-2 border border-[#cbb389]/60 bg-[#132b30] px-6 text-xs font-medium tracking-[0.18em] uppercase text-[#cbb389] transition-colors hover:border-[#cbb389] hover:text-[#f4efe6]"
                >
                  <Compass className="h-4 w-4" strokeWidth={1.5} />
                  <span>360° Virtual Experience</span>
                </button>
              )}
              <a
                href="#enquiry"
                onClick={() => setMobileOpen(false)}
                className="flex h-12 w-full items-center justify-center bg-[#cbb389] px-6 text-xs font-semibold tracking-[0.18em] uppercase text-[#0e2226] transition-colors hover:bg-[#d8c49f]"
              >
                Register for Private Viewing
              </a>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
