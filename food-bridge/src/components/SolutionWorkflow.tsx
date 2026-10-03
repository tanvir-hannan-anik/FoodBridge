import React from 'react';
import { Store, Network, Truck, Sparkles, CheckCircle2 } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

interface SolutionWorkflowProps {
  lang: Language;
}

export const SolutionWorkflow: React.FC<SolutionWorkflowProps> = ({ lang }) => {
  const t = translations[lang];

  const icons = [
    <Store className="w-5 h-5 text-emerald-400" />,
    <Network className="w-5 h-5 text-emerald-400" />,
    <Truck className="w-5 h-5 text-emerald-400" />,
    <Sparkles className="w-5 h-5 text-emerald-400" />,
  ];

  return (
    <section id="workflow" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full pt-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
        <div>
          <span className="font-mono-code text-xs text-emerald-400 uppercase tracking-widest px-3 py-1 rounded bg-[#181d1a] border border-emerald-500/20 inline-block mb-3">
            {t.workflow.badge}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl text-white font-bold tracking-tight">
            {t.workflow.title}
          </h2>
        </div>
        <p className="font-body text-slate-300 max-w-md text-base">
          {t.workflow.subtitle}
        </p>
      </div>

      {/* 4 Connected Step Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {t.workflow.steps.map((step, idx) => (
          <div
            key={idx}
            className="relative bg-[#181d1a]/70 backdrop-blur-xl border border-[#3c4a42]/30 rounded-2xl p-6 flex flex-col justify-between group hover:border-emerald-500/50 hover:shadow-[0_10px_30px_rgba(16,185,129,0.15)] transition-all duration-200"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="font-mono-code text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
                  {step.num} — {step.subtitle}
                </span>
                <div className="w-10 h-10 rounded-xl bg-[#0A0F0D] border border-[#3c4a42]/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                  {icons[idx]}
                </div>
              </div>

              <h4 className="font-display text-xl text-white mb-2 font-bold group-hover:text-emerald-300 transition-colors">
                {step.title}
              </h4>
              <p className="font-body text-slate-300 text-sm leading-relaxed">
                {step.desc}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-[#3c4a42]/30 flex items-center gap-2 text-emerald-400 font-mono-code text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{step.tag}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
