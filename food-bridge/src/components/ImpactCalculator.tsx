import React, { useState } from 'react';
import { Calculator, Utensils, CloudFog, Users, Droplets, ArrowRight } from 'lucide-react';
import { Language } from '../types';
import { translations, toBnDigits } from '../translations';

interface ImpactCalculatorProps {
  lang: Language;
  onDonateWithWeight: (kg: number) => void;
}

export const ImpactCalculator: React.FC<ImpactCalculatorProps> = ({
  lang,
  onDonateWithWeight,
}) => {
  const [weightKg, setWeightKg] = useState<number>(45);
  const t = translations[lang];

  // Mathematical impact ratios based on FAO & environmental footprint metrics
  const meals = Math.round(weightKg * 2.5); // ~400g per meal
  const co2 = Math.round(weightKg * 2.85); // 2.85kg CO2e prevented per kg food saved
  const families = Math.max(1, Math.round(meals / 4)); // average 4 members
  const water = Math.round(weightKg * 420); // virtual water saved in liters

  const formatNumber = (val: number): string => {
    const formatted = val.toLocaleString();
    return lang === 'bn' ? toBnDigits(formatted) : formatted;
  };

  return (
    <section id="calculator" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full pt-20">
      <div className="rounded-3xl bg-[#181d1a]/80 border border-emerald-500/30 p-6 md:p-10 relative overflow-hidden shadow-[0_0_40px_rgba(16,185,129,0.08)]">
        {/* Ambient lighting */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl mb-8">
          <span className="font-mono-code text-xs text-emerald-400 uppercase tracking-widest px-3 py-1 rounded bg-[#0A0F0D] border border-emerald-500/30 inline-flex items-center gap-1.5 mb-3">
            <Calculator className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.calculator.badge}</span>
          </span>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-white font-bold tracking-tight">
            {t.calculator.title}
          </h2>
          <p className="font-body text-slate-300 mt-2 text-sm md:text-base">
            {t.calculator.subtitle}
          </p>
        </div>

        {/* Interactive Slider Area */}
        <div className="bg-[#0A0F0D]/90 rounded-2xl p-6 border border-[#3c4a42]/40 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <label
              htmlFor="weight-slider"
              className="text-sm md:text-base font-semibold text-slate-200"
            >
              {t.calculator.sliderLabel}
            </label>
            <div className="inline-flex items-center gap-2 bg-[#181d1a] border border-emerald-500/40 px-4 py-1.5 rounded-xl">
              <span className="font-mono-code text-2xl font-bold text-emerald-400 tabular-nums">
                {formatNumber(weightKg)}
              </span>
              <span className="text-xs text-slate-400 font-semibold">
                {lang === 'bn' ? 'কেজি' : 'KG'}
              </span>
            </div>
          </div>

          <input
            id="weight-slider"
            type="range"
            min="5"
            max="500"
            step="5"
            value={weightKg}
            onChange={(e) => setWeightKg(Number(e.target.value))}
            className="w-full h-2.5 bg-[#181d1a] rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 focus:outline-none"
            aria-label="Surplus weight in kilograms"
          />

          <div className="flex justify-between text-xs text-slate-300 font-mono-code mt-2">
            <span>{formatNumber(5)} {lang === 'bn' ? 'কেজি (ছোট ক্যাফে)' : 'kg (Cafe)'}</span>
            <span>{formatNumber(150)} {lang === 'bn' ? 'কেজি (রেস্তোরাঁ)' : 'kg (Restaurant)'}</span>
            <span>{formatNumber(500)} {lang === 'bn' ? 'কেজি (কনভেনশন হল)' : 'kg (Banquet Hall)'}</span>
          </div>
        </div>

        {/* Dynamic Metrics Output Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Card 1: Meals */}
          <div className="bg-[#0A0F0D]/80 rounded-2xl p-5 border border-emerald-500/20 hover:border-emerald-500/50 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
              <Utensils className="w-4 h-4" />
            </div>
            <div className="font-mono-code text-3xl font-bold text-emerald-400 tabular-nums mb-1">
              {formatNumber(meals)}
            </div>
            <div className="font-display font-semibold text-white text-sm">
              {t.calculator.mealsProvided}
            </div>
            <p className="text-xs text-slate-300 mt-1">{t.calculator.mealsSub}</p>
          </div>

          {/* Card 2: CO2e */}
          <div className="bg-[#0A0F0D]/80 rounded-2xl p-5 border border-emerald-500/20 hover:border-emerald-500/50 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-3">
              <CloudFog className="w-4 h-4" />
            </div>
            <div className="font-mono-code text-3xl font-bold text-teal-400 tabular-nums mb-1">
              {formatNumber(co2)}
            </div>
            <div className="font-display font-semibold text-white text-sm">
              {t.calculator.co2Prevented}
            </div>
            <p className="text-xs text-slate-300 mt-1">{t.calculator.co2Sub}</p>
          </div>

          {/* Card 3: Families */}
          <div className="bg-[#0A0F0D]/80 rounded-2xl p-5 border border-emerald-500/20 hover:border-emerald-500/50 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
              <Users className="w-4 h-4" />
            </div>
            <div className="font-mono-code text-3xl font-bold text-emerald-400 tabular-nums mb-1">
              {formatNumber(families)}
            </div>
            <div className="font-display font-semibold text-white text-sm">
              {t.calculator.familiesFed}
            </div>
            <p className="text-xs text-slate-300 mt-1">{t.calculator.familiesSub}</p>
          </div>

          {/* Card 4: Water */}
          <div className="bg-[#0A0F0D]/80 rounded-2xl p-5 border border-emerald-500/20 hover:border-emerald-500/50 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3">
              <Droplets className="w-4 h-4" />
            </div>
            <div className="font-mono-code text-3xl font-bold text-cyan-400 tabular-nums mb-1">
              {formatNumber(water)}
            </div>
            <div className="font-display font-semibold text-white text-sm">
              {t.calculator.waterSaved}
            </div>
            <p className="text-xs text-slate-300 mt-1">{t.calculator.waterSub}</p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#3c4a42]/30">
          <p className="text-sm text-slate-300 text-center sm:text-left">
            {lang === 'bn'
              ? 'আপনার প্রতিষ্ঠানের উদ্বৃত্ত খাবার কয়েক মিনিটে সংগ্রহ করতে প্রস্তুত আমাদের ভলান্টিয়ার দল।'
              : 'Our verified volunteer units are ready to collect your surplus food within 30 minutes.'}
          </p>

          <button
            onClick={() => onDonateWithWeight(weightKg)}
            className="w-full sm:w-auto bg-emerald-500 text-slate-950 font-bold px-6 py-3 rounded-xl hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer text-sm whitespace-nowrap"
          >
            <span>{t.calculator.cta}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
