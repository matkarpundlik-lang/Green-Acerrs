import { useCallback, useState } from 'react';
import { ArchitecturalIntro } from './components/ArchitecturalIntro';
import { Amenities } from './components/Amenities';
import { EnquirySection } from './components/EnquirySection';
import { Footer } from './components/Footer';
import { Gallery } from './components/Gallery';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Highlights } from './components/Highlights';
import { Lifestyle } from './components/Lifestyle';
import { LocationSection } from './components/LocationSection';
import { Philosophy } from './components/Philosophy';
import { Residences } from './components/Residences';
import { TowerSiteMap } from './components/TowerSiteMap';
import { VirtualExperienceModal } from './components/VirtualExperienceModal';
import type { VirtualVantageId } from './utils/virtualTourSpec';

export default function App() {
  const [virtualTour, setVirtualTour] = useState<{
    open: boolean;
    vantageId: VirtualVantageId;
  }>({
    open: false,
    vantageId: 'salon',
  });

  const openVirtualTour = useCallback((vantageId: VirtualVantageId = 'salon') => {
    setVirtualTour({ open: true, vantageId });
  }, []);

  const closeVirtualTour = useCallback(() => {
    setVirtualTour((prev) => ({ ...prev, open: false }));
  }, []);

  const scrollToEnquiry = useCallback(() => {
    const enquiryEl = document.getElementById('enquiry');
    enquiryEl?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-[#29353d] text-[#f4efe6]">
      <Header onOpenVirtualTour={() => openVirtualTour('salon')} />
      <main>
        <Hero onOpenVirtualTour={() => openVirtualTour('salon')} />
        <ArchitecturalIntro />
        <Philosophy />
        <Highlights />
        <TowerSiteMap />
        <Residences onOpenVirtualTour={openVirtualTour} />
        <Lifestyle />
        <Amenities />
        <LocationSection />
        <Gallery />
        <EnquirySection />
      </main>
      <Footer />

      <VirtualExperienceModal
        open={virtualTour.open}
        initialVantageId={virtualTour.vantageId}
        onClose={closeVirtualTour}
        onArrangeViewing={scrollToEnquiry}
      />
    </div>
  );
}
