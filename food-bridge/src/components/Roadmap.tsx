import React from 'react';
import { MapPin, Navigation, Compass } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

interface RoadmapProps {
  lang: Language;
}

export const Roadmap: React.FC<RoadmapProps> = ({ lang }) => {
  const t = translations[lang];

  const icons = [
    <MapPin className="w-5 h-5 text-emerald-400" />,
    <Compass className="w-5 h-5 text-teal-300" />,
    <Navigation className="w-5 h-5 text-slate-300" />,
  ];

  return (
    <section id="roadmap" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full pt-20">
      <div className="rounded-3xl bg-[#181d1a]/80 border border-emerald-500/20 p-8 md:p-12 relative overflow-hidden">
        {/* Ambient radial glow */}
        <div className="absolute -left-20 -top-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-2xl relative z-10 mb-10">
          <span className="font-mono-code text-xs text-emerald-400 uppercase tracking-widest px-3 py-1 rounded bg-[#0A0F0D] border border-emerald-500/30 inline-block mb-3">
            {t.roadmap.badge}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl text-white font-bold tracking-tight">
            {t.roadmap.title}
          </h2>
          <p className="font-body text-slate-300 text-sm md:text-base mt-2 leading-relaxed">
            {t.roadmap.subtitle}
          </p>
        </div>

        {/* 3 Phases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
          {t.roadmap.phases.map((item, idx) => (
            <div
              key={idx}
              className={`rounded-2xl p-6 border transition-colors flex flex-col justify-between ${
                idx === 0
                  ? 'bg-[#0A0F0D]/90 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                  : 'bg-[#0A0F0D]/70 border-[#3c4a42]/30 hover:border-emerald-500/30'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`font-mono-code text-xs font-bold px-2.5 py-1 rounded ${
                      idx === 0
                        ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-500/40'
                        : 'text-slate-300 bg-[#181d1a] border border-[#3c4a42]/40'
                    }`}
                  >
                    {item.phase}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-[#181d1a] flex items-center justify-center">
                    {icons[idx]}
                  </div>
                </div>

                <h4 className="font-display text-xl text-white font-bold mb-2">
                  {item.title}
                </h4>
                <p className="font-body text-slate-300 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#3c4a42]/30 flex items-center gap-2">
                {idx === 0 && <span className="w-2 h-2 rounded-full bg-emerald-400 emerald-ping" />}
                <span className="font-mono-code text-xs text-emerald-400 font-medium">
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
