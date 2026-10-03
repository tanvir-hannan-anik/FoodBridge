import React from 'react';
import { HeartHandshake, BarChart2, Workflow, HeartCrack } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

interface MobileBottomNavProps {
  lang: Language;
  onOpenDonate: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  lang,
  onOpenDonate,
}) => {
  const t = translations[lang];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-40 bg-[#0A0F0D]/95 backdrop-blur-xl border-t border-[#3c4a42]/30 flex justify-around items-center px-3 py-2">
      <a
        href="#problem"
        className="flex flex-col items-center justify-center text-slate-400 hover:text-emerald-400 transition-colors py-0.5"
      >
        <HeartCrack className="w-4 h-4" />
        <span className="text-[10px] font-medium mt-0.5">{t.nav.problem}</span>
      </a>

      <a
        href="#workflow"
        className="flex flex-col items-center justify-center text-slate-400 hover:text-emerald-400 transition-colors py-0.5"
      >
        <Workflow className="w-4 h-4" />
        <span className="text-[10px] font-medium mt-0.5">{t.nav.solution}</span>
      </a>

      <a
        href="#impact"
        className="flex flex-col items-center justify-center text-slate-400 hover:text-emerald-400 transition-colors py-0.5"
      >
        <BarChart2 className="w-4 h-4" />
        <span className="text-[10px] font-medium mt-0.5">{t.nav.impact}</span>
      </a>

      <button
        onClick={onOpenDonate}
        className="flex flex-col items-center justify-center text-emerald-400 font-semibold py-0.5 cursor-pointer"
      >
        <HeartHandshake className="w-4 h-4 text-emerald-400" />
        <span className="text-[10px] font-bold mt-0.5">{t.nav.donate}</span>
      </button>
    </nav>
  );
};
