import React from 'react';
import { HeartHandshake, ShieldCheck, Phone, MapPin, Globe } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

interface FooterProps {
  lang: Language;
  onToggleLang: () => void;
}

export const Footer: React.FC<FooterProps> = ({ lang, onToggleLang }) => {
  const t = translations[lang];

  return (
    <footer className="w-full bg-[#0A0F0D] border-t border-[#3c4a42]/30 pt-16 pb-24 md:pb-12 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Col 1: Brand & Status */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#181d1a] border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <span className="font-display text-xl text-white font-bold tracking-tight">
                {t.footer.aboutTitle}
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              {t.footer.aboutDesc}
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 emerald-ping" />
              <span className="font-mono-code text-xs text-emerald-400 font-semibold">
                {t.footer.gridOnline}
              </span>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <span className="font-mono-code text-xs text-white uppercase tracking-wider block mb-4 font-semibold">
              {t.footer.navHeader}
            </span>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="#hero" className="text-slate-400 hover:text-emerald-400 transition-colors">
                  {lang === 'bn' ? 'হোম পেজ' : 'Home'}
                </a>
              </li>
              <li>
                <a href="#problem" className="text-slate-400 hover:text-emerald-400 transition-colors">
                  {t.nav.problem}
                </a>
              </li>
              <li>
                <a href="#workflow" className="text-slate-400 hover:text-emerald-400 transition-colors">
                  {t.nav.solution}
                </a>
              </li>
              <li>
                <a href="#impact" className="text-slate-400 hover:text-emerald-400 transition-colors">
                  {t.nav.impact}
                </a>
              </li>
              <li>
                <a href="#calculator" className="text-slate-400 hover:text-emerald-400 transition-colors">
                  {t.nav.calculator}
                </a>
              </li>
              <li>
                <a href="#sdgs" className="text-slate-400 hover:text-emerald-400 transition-colors">
                  {t.nav.sdgs}
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Operations Hub */}
          <div>
            <span className="font-mono-code text-xs text-white uppercase tracking-wider block mb-4 font-semibold">
              {t.footer.opsHeader}
            </span>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{t.footer.ops1}</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{t.footer.ops2}</span>
              </li>
              <li className="flex items-start gap-2 text-white font-medium">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{t.footer.ops3}</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{t.footer.ops4}</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Quality & Language */}
          <div>
            <span className="font-mono-code text-xs text-white uppercase tracking-wider block mb-4 font-semibold">
              {t.footer.standardsHeader}
            </span>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              {t.footer.standardsDesc}
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#181d1a] border border-emerald-500/30 font-mono-code text-xs text-emerald-400 mb-4">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{t.footer.safetyBadge}</span>
            </div>

            <div>
              <button
                onClick={onToggleLang}
                className="flex items-center gap-2 text-xs text-slate-300 hover:text-emerald-300 py-1.5 px-3 rounded-lg bg-[#181d1a] border border-[#3c4a42]/40 transition-colors cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>{lang === 'en' ? 'বাংলায় পড়ুন (Switch to Bangla)' : 'Read in English'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#3c4a42]/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 text-center sm:text-left">
          <p>{t.footer.copyright}</p>
          <div className="flex items-center gap-5">
            <a href="#" className="hover:text-emerald-400 transition-colors">
              {t.footer.privacy}
            </a>
            <a href="#" className="hover:text-emerald-400 transition-colors">
              {t.footer.terms}
            </a>
            <a href="#" className="hover:text-emerald-400 transition-colors">
              {t.footer.foodSafety}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
