import React, { useState } from 'react';
import { HeartHandshake, Globe, Menu, X, ArrowRight, UtensilsCrossed } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

interface NavbarProps {
  lang: Language;
  onToggleLang: () => void;
  onOpenDonate: () => void;
  onOpenRequest: () => void;
  onOpenVolunteer: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  lang,
  onToggleLang,
  onOpenDonate,
  onOpenRequest,
  onOpenVolunteer,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = translations[lang];

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#0A0F0D]/85 backdrop-blur-md border-b border-[#3c4a42]/30 transition-all duration-200">
      <div className="flex justify-between items-center px-4 md:px-8 py-3.5 w-full max-w-7xl mx-auto">
        {/* Zone 1: Single text element wordmark with icon */}
        <div className="flex items-center gap-3">
          <a href="#hero" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#181d1a] border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:border-emerald-400 transition-colors shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              <HeartHandshake className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-lg tracking-tight font-bold text-white group-hover:text-emerald-300 transition-colors">
                {t.nav.brand}
              </span>
            </div>
          </a>
        </div>

        {/* Zone 2: 4-6 clean text navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
          <a
            href="#problem"
            className="hover:text-emerald-400 transition-colors whitespace-nowrap"
          >
            {t.nav.problem}
          </a>
          <a
            href="#workflow"
            className="hover:text-emerald-400 transition-colors whitespace-nowrap"
          >
            {t.nav.solution}
          </a>
          <a
            href="#impact"
            className="hover:text-emerald-400 transition-colors whitespace-nowrap"
          >
            {t.nav.impact}
          </a>
          <a
            href="#sdgs"
            className="hover:text-emerald-400 transition-colors whitespace-nowrap"
          >
            {t.nav.sdgs}
          </a>
          <a
            href="#calculator"
            className="hover:text-emerald-400 transition-colors whitespace-nowrap"
          >
            {t.nav.calculator}
          </a>
          <a
            href="#story"
            className="hover:text-emerald-400 transition-colors whitespace-nowrap"
          >
            {t.nav.story}
          </a>
          <a
            href="#roadmap"
            className="hover:text-emerald-400 transition-colors whitespace-nowrap"
          >
            {t.nav.roadmap}
          </a>
        </nav>

        {/* Zone 3: 1-2 primary actions + Language Toggle */}
        <div className="flex items-center gap-3">
          {/* Language Switcher Button */}
          <button
            onClick={onToggleLang}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#181d1a] border border-[#3c4a42]/40 text-slate-200 hover:text-emerald-300 hover:border-emerald-500/40 text-xs font-medium transition-colors cursor-pointer"
            title={lang === 'en' ? 'বাংলায় পরিবর্তন করুন' : 'Switch to English'}
            aria-label="Toggle Language"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold">{lang === 'en' ? 'বাংলা' : 'EN'}</span>
          </button>

          {/* Secondary Action on Desktop */}
          <button
            onClick={onOpenRequest}
            className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-slate-300 hover:text-emerald-300 px-3 py-1.5 rounded-lg border border-transparent hover:border-[#3c4a42]/50 transition-colors"
          >
            <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.nav.getHelp}</span>
          </button>

          {/* Primary CTA */}
          <button
            onClick={onOpenDonate}
            className="bg-emerald-500 text-slate-950 text-xs font-bold px-4 py-2 rounded-lg hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.35)] hover:shadow-[0_0_22px_rgba(16,185,129,0.6)] active:scale-95 transition-all duration-150 inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <span>{t.nav.donate}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Mobile hamburger toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 rounded-lg text-slate-300 hover:text-emerald-400 hover:bg-[#181d1a] transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#3c4a42]/40 bg-[#0A0F0D]/95 px-5 py-4 flex flex-col gap-3">
          <a
            href="#problem"
            onClick={() => setMobileMenuOpen(false)}
            className="text-slate-200 hover:text-emerald-400 py-2 border-b border-[#1c211e] text-sm"
          >
            {t.nav.problem}
          </a>
          <a
            href="#workflow"
            onClick={() => setMobileMenuOpen(false)}
            className="text-slate-200 hover:text-emerald-400 py-2 border-b border-[#1c211e] text-sm"
          >
            {t.nav.solution}
          </a>
          <a
            href="#impact"
            onClick={() => setMobileMenuOpen(false)}
            className="text-slate-200 hover:text-emerald-400 py-2 border-b border-[#1c211e] text-sm"
          >
            {t.nav.impact}
          </a>
          <a
            href="#sdgs"
            onClick={() => setMobileMenuOpen(false)}
            className="text-slate-200 hover:text-emerald-400 py-2 border-b border-[#1c211e] text-sm"
          >
            {t.nav.sdgs}
          </a>
          <a
            href="#calculator"
            onClick={() => setMobileMenuOpen(false)}
            className="text-slate-200 hover:text-emerald-400 py-2 border-b border-[#1c211e] text-sm"
          >
            {t.nav.calculator}
          </a>
          <a
            href="#story"
            onClick={() => setMobileMenuOpen(false)}
            className="text-slate-200 hover:text-emerald-400 py-2 border-b border-[#1c211e] text-sm"
          >
            {t.nav.story}
          </a>
          <a
            href="#roadmap"
            onClick={() => setMobileMenuOpen(false)}
            className="text-slate-200 hover:text-emerald-400 py-2 border-b border-[#1c211e] text-sm"
          >
            {t.nav.roadmap}
          </a>

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenRequest();
              }}
              className="w-full text-center py-2.5 rounded-lg border border-emerald-500/30 text-emerald-300 font-medium text-sm hover:bg-emerald-500/10"
            >
              {t.nav.getHelp}
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenVolunteer();
              }}
              className="w-full text-center py-2.5 rounded-lg bg-[#181d1a] border border-[#3c4a42]/50 text-slate-200 font-medium text-sm hover:border-emerald-400/40"
            >
              {t.nav.volunteer}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
