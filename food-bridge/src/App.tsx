import React, { useState } from 'react';
import { Language } from './types';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ProblemSection } from './components/ProblemSection';
import { SolutionWorkflow } from './components/SolutionWorkflow';
import { ImpactCalculator } from './components/ImpactCalculator';
import { LiveGridFeed } from './components/LiveGridFeed';
import { LiveRouteRadar } from './components/LiveRouteRadar';
import { FoodSafetyInspector } from './components/FoodSafetyInspector';
import { VisualStory } from './components/VisualStory';
import { PartnerNetwork } from './components/PartnerNetwork';
import { MissionAndSDG } from './components/MissionAndSDG';
import { SdgSection } from './components/SdgSection';
import { Roadmap } from './components/Roadmap';
import { FaqSection } from './components/FaqSection';
import { GetInvolved } from './components/GetInvolved';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { DonateModal } from './components/DonateModal';
import { RequestFoodModal } from './components/RequestFoodModal';
import { VolunteerModal } from './components/VolunteerModal';
import { PhotoLightbox } from './components/PhotoLightbox';
import { MessageCircle } from 'lucide-react';

export default function App() {
  const [lang, setLang] = useState<Language>('bn');
  const [isDonateOpen, setIsDonateOpen] = useState(false);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [isVolunteerOpen, setIsVolunteerOpen] = useState(false);
  const [prefilledWeight, setPrefilledWeight] = useState<number>(35);

  // Lightbox state
  const [lightboxState, setLightboxState] = useState<{
    isOpen: boolean;
    url: string;
    title: string;
    desc: string;
    location?: string;
  }>({
    isOpen: false,
    url: '',
    title: '',
    desc: '',
    location: '',
  });

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'en' ? 'bn' : 'en'));
  };

  const handleOpenDonateWithWeight = (kg: number) => {
    setPrefilledWeight(kg);
    setIsDonateOpen(true);
  };

  const handleOpenLightbox = (
    url: string,
    title: string,
    desc: string,
    location?: string
  ) => {
    setLightboxState({
      isOpen: true,
      url,
      title,
      desc,
      location,
    });
  };

  return (
    <div
      className={`min-h-screen bg-[#0A0F0D] text-[#DFE4E0] antialiased selection:bg-emerald-500 selection:text-black ${
        lang === 'bn' ? 'font-bengali' : 'font-body'
      }`}
    >
      {/* Top Bar Navigation */}
      <Navbar
        lang={lang}
        onToggleLang={toggleLanguage}
        onOpenDonate={() => setIsDonateOpen(true)}
        onOpenRequest={() => setIsRequestOpen(true)}
        onOpenVolunteer={() => setIsVolunteerOpen(true)}
      />

      {/* Main Page Flow */}
      <main className="relative flex flex-col gap-10 md:gap-16 pb-20 md:pb-12 overflow-hidden">
        {/* 1. Hero Section */}
        <Hero
          lang={lang}
          onOpenDonate={() => setIsDonateOpen(true)}
          onOpenRequest={() => setIsRequestOpen(true)}
          onOpenPhotoLightbox={handleOpenLightbox}
        />

        {/* 2. The Dual Crisis Problem Bento */}
        <ProblemSection
          lang={lang}
          onOpenPhotoLightbox={handleOpenLightbox}
        />

        {/* 3. 4-Step Solution Workflow */}
        <SolutionWorkflow lang={lang} />

        {/* 4. Interactive Impact Calculator */}
        <ImpactCalculator
          lang={lang}
          onDonateWithWeight={handleOpenDonateWithWeight}
        />

        {/* 5. Live Rescue Route Radar & Cold-Chain Corridors */}
        <LiveRouteRadar lang={lang} />

        {/* 6. Real-time Rescue Activity Grid */}
        <LiveGridFeed lang={lang} />

        {/* 7. 4-Pillar Food Hygiene & Safety Protocol Inspector */}
        <FoodSafetyInspector lang={lang} />

        {/* 8. Visual Story Chronicle */}
        <VisualStory
          lang={lang}
          onOpenPhotoLightbox={handleOpenLightbox}
        />

        {/* 9. Verified Partner Kitchens & Hall of Fame */}
        <PartnerNetwork lang={lang} />

        {/* 10. Mission & Measured Research Impact */}
        <MissionAndSDG
          lang={lang}
          onOpenPhotoLightbox={handleOpenLightbox}
        />

        {/* 11. Dedicated UN Sustainable Development Goals (SDG) Section */}
        <SdgSection
          lang={lang}
          onOpenPhotoLightbox={handleOpenLightbox}
        />

        {/* 12. Scalability Roadmap */}
        <Roadmap lang={lang} />

        {/* 12. Frequently Asked Questions */}
        <FaqSection lang={lang} />

        {/* 13. Get Involved CTAs & Final Cinematic Banner */}
        <GetInvolved
          lang={lang}
          onOpenDonate={() => setIsDonateOpen(true)}
          onOpenVolunteer={() => setIsVolunteerOpen(true)}
          onOpenRequest={() => setIsRequestOpen(true)}
          onOpenPhotoLightbox={handleOpenLightbox}
        />
      </main>

      {/* Floating Emergency WhatsApp Button */}
      <a
        href="https://wa.me/8801800274343?text=Emergency%20Food%20Rescue%20Pickup%20Required"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Direct WhatsApp Emergency Dispatch Hotline"
        className="fixed bottom-20 md:bottom-6 right-5 z-40 p-3.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all hover:scale-105 active:scale-95 flex items-center gap-2 group cursor-pointer"
      >
        <MessageCircle className="w-5 h-5 fill-slate-950 text-slate-950" />
        <span className="hidden sm:inline font-mono-code text-xs font-bold whitespace-nowrap">
          {lang === 'bn' ? 'জরুরি উদ্ধার হটলাইন' : 'Emergency Hotline'}
        </span>
      </a>

      {/* Footer */}
      <Footer lang={lang} onToggleLang={toggleLanguage} />

      {/* Mobile Sticky Navigation */}
      <MobileBottomNav
        lang={lang}
        onOpenDonate={() => setIsDonateOpen(true)}
      />

      {/* Interactive Modals */}
      <DonateModal
        isOpen={isDonateOpen}
        onClose={() => setIsDonateOpen(false)}
        lang={lang}
        initialWeight={prefilledWeight}
      />

      <RequestFoodModal
        isOpen={isRequestOpen}
        onClose={() => setIsRequestOpen(false)}
        lang={lang}
      />

      <VolunteerModal
        isOpen={isVolunteerOpen}
        onClose={() => setIsVolunteerOpen(false)}
        lang={lang}
      />

      {/* Full Resolution Photo Lightbox Modal */}
      <PhotoLightbox
        isOpen={lightboxState.isOpen}
        onClose={() => setLightboxState((prev) => ({ ...prev, isOpen: false }))}
        imageUrl={lightboxState.url}
        title={lightboxState.title}
        description={lightboxState.desc}
        location={lightboxState.location}
        lang={lang}
      />
    </div>
  );
}
