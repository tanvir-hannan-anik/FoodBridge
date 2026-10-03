import React from 'react';
import { Leaf, HeartHandshake, Users, BarChart3, Globe, Sparkles } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';
import { ImageWithFallback } from './ImageWithFallback';

interface MissionAndSDGProps {
  lang: Language;
  onOpenPhotoLightbox?: (url: string, title: string, desc: string, loc?: string) => void;
}

export const MissionAndSDG: React.FC<MissionAndSDGProps> = ({
  lang,
  onOpenPhotoLightbox,
}) => {
  const t = translations[lang];

  const chartImg1 =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuA46nz51qKnrHS_iPYrrp8pluvZn6TP3WJdJmO2vgIch2D6bZ9pKVk-dnFvvknD9bXOvqPO17--OdTrE-_Ql_z119uvmAWX7HZzSvqO2vIfiQFHeY3vocQFQAPn3wqH5jYjBlJ2_wOHo5mBxL7zaeKXnZ9NfamkM8c8mv5DAMT10k_m_OgO4yPe6m0dNIu7UI2HPfUa1N6Y7tYOklryS1AF0MF9fjLlDUN1byxzrKoA48gSNzI9zzUIvzYZOusI-YKn';
  const chartImg2 =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCxaj_7sPDr-Y9xzu0eav7dyZqdFlS03SQEi3G49e-FhKrJIM4mCUUwWrrhnEcvuQ6F_ziVo6vp1hVcKDLVJwPBeynfDEZexali7o-EuZhJSAPnP3d6jhDWIWTIhnmyHrGlSdl6bvpKBqqfKH1hUBXpeaQaFllJi3ZSJgiD-27_zsu35eobeyZF8OhXkIs6JC18Rv42bpQj9_iOpnIXunVdh1OfjQAvARI9zfFrHP-QRvUwH-MV-wRm_d3F1kUSmFEs';

  const pillarIcons = [
    <Leaf className="w-6 h-6 text-emerald-400" />,
    <HeartHandshake className="w-6 h-6 text-emerald-400" />,
    <Users className="w-6 h-6 text-emerald-400" />,
  ];

  return (
    <div className="space-y-24">
      {/* ========================================== */}
      {/* MISSION SECTION                            */}
      {/* ========================================== */}
      <section id="mission" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full pt-20">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-12">
          <div>
            <span className="font-mono-code text-xs text-emerald-400 uppercase tracking-widest px-3 py-1 rounded bg-[#181d1a] border border-emerald-500/20 inline-block mb-3 font-semibold">
              {t.mission.badge}
            </span>
            <h2 className="font-display text-3xl sm:text-4xl text-white font-bold tracking-tight">
              {t.mission.title}
            </h2>
          </div>
          <p className="font-body text-slate-300 max-w-lg leading-relaxed text-base">
            {t.mission.subtitle}
          </p>
        </div>

        {/* 3 Pillar Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {t.mission.pillars.map((pillar, idx) => (
            <div
              key={idx}
              className="bg-[#181d1a]/70 backdrop-blur-xl border border-[#3c4a42]/30 rounded-2xl p-6 hover:border-emerald-500/50 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#0A0F0D] border border-emerald-500/30 flex items-center justify-center mb-5 shadow-sm">
                  {pillarIcons[idx]}
                </div>
                <h3 className="font-display text-xl text-white mb-2 font-bold">
                  {pillar.title}
                </h3>
                <p className="font-body text-slate-300 text-sm leading-relaxed">
                  {pillar.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================== */}
      {/* IMPACT METRICS & RESEARCH SECTION          */}
      {/* ========================================== */}
      <section id="impact" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full pt-10">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="font-mono-code text-xs text-emerald-400 uppercase tracking-widest px-3 py-1 rounded bg-[#181d1a] border border-emerald-500/20 inline-block mb-3 font-semibold">
            {t.impact.badge}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl text-white font-bold tracking-tight">
            {t.impact.title}
          </h2>
          <p className="font-body text-slate-300 mt-2 text-base">
            {t.impact.subtitle}
          </p>
        </div>

        {/* 5 Impact Metrics Counters */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-10">
          {t.impact.stats.map((stat, idx) => (
            <div
              key={idx}
              className={`bg-[#181d1a]/70 backdrop-blur-xl border border-[#3c4a42]/30 rounded-2xl p-4 text-center hover:border-emerald-500/40 transition-colors ${
                idx === 4 ? 'col-span-2 md:col-span-1' : ''
              }`}
            >
              <span className="font-mono-code text-2xl md:text-3xl text-emerald-400 font-bold block mb-1 tabular-nums">
                {stat.value}
              </span>
              <span className="font-display text-xs md:text-sm text-white font-semibold block">
                {stat.label}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                {stat.sub}
              </span>
            </div>
          ))}
        </div>

        {/* Empirical Research & Chart Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-[#181d1a]/40 rounded-3xl p-6 md:p-8 border border-[#3c4a42]/30">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0A0F0D] border border-emerald-500/20">
              <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono-code text-xs text-emerald-400 uppercase font-semibold">
                {lang === 'bn' ? 'সরেজমিন গবেষণা তথ্য' : 'Empirical Field Research'}
              </span>
            </div>
            <h3 className="font-display text-2xl text-white font-bold">
              {t.impact.researchTitle}
            </h3>
            <p className="font-body text-slate-300 text-sm leading-relaxed">
              {t.impact.researchDesc}
            </p>
            <div className="p-4 rounded-xl bg-[#0A0F0D]/90 border border-[#3c4a42]/20">
              <ImageWithFallback
                src={chartImg1}
                alt="Urban consumer food waste survey data"
                className="rounded-lg w-full h-auto object-contain max-h-60 border border-[#3c4a42]/30 filter brightness-[0.98] bg-[#0A0F0D]"
                caption={lang === 'bn' ? 'শহুরে খাদ্য অপচয় সমীক্ষা রিপোর্ট' : 'Urban Consumer Food Waste Telemetry'}
                categoryTag={lang === 'bn' ? 'সমীক্ষা' : 'SURVEY'}
                onClick={() =>
                  onOpenPhotoLightbox?.(
                    chartImg1,
                    lang === 'bn' ? 'শহুরে ভোক্তা খাদ্য বর্জ্য বিশ্লেষণ' : 'Urban Household & Hospitality Food Waste',
                    lang === 'bn'
                      ? 'জাতীয় নগর বর্জ্য সমীক্ষা ও খাদ্য নিরাপত্তা বিষয়ক গবেষণালব্ধ তথ্য।'
                      : 'Comprehensive empirical survey telemetry on metropolitan food discard volumes.',
                    lang === 'bn' ? 'ঢাকা ও চট্টগ্রাম' : 'Dhaka & Chittagong'
                  )
                }
              />
              <span className="font-mono-code text-[10px] text-slate-400 mt-2 block">
                {lang === 'bn'
                  ? 'উৎস: জাতীয় নগর বর্জ্য সমীক্ষা ও খাদ্য নিরাপত্তা বিশ্লেষণ'
                  : 'Source: National Urban Waste Survey & Food Security Assessments'}
              </span>
            </div>
          </div>

          <div className="bg-[#0A0F0D]/90 rounded-2xl p-5 md:p-6 border border-[#3c4a42]/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-display font-bold text-white text-base">
                  {lang === 'bn' ? 'খাদ্য অপচয়ের উৎস বিশ্লেষণ' : 'Regional Surplus Distribution'}
                </span>
                <span className="font-mono-code text-xs text-emerald-400 font-semibold bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded">
                  {lang === 'bn' ? 'লাইভ তথ্য' : 'BENCHMARK'}
                </span>
              </div>
              <ImageWithFallback
                src={chartImg2}
                alt="Bangladesh urban food waste chart by sector"
                className="w-full h-auto object-contain rounded-lg border border-[#3c4a42]/20 mb-4 filter brightness-[0.98]"
                caption={lang === 'bn' ? 'খাদ্য বর্জ্যের খাতভিত্তিক বিতরণ' : 'Food Waste Breakdown By Sector'}
                categoryTag={lang === 'bn' ? 'চার্ট' : 'METRICS'}
                onClick={() =>
                  onOpenPhotoLightbox?.(
                    chartImg2,
                    lang === 'bn' ? 'খাত অনুযায়ী খাদ্যের অপচয় হার' : 'Food Surplus Loss By Sector',
                    lang === 'bn'
                      ? 'হোটেল, রেস্তোরাঁ ও অনুষ্ঠান বাড়ির অধিকাংশ খাবারই অক্ষত ও খাওয়ার উপযোগী থাকে।'
                      : 'Hospitality and banquets account for the largest share of recoverable calories.',
                    lang === 'bn' ? 'বাংলাদেশ মেট্রো' : 'Bangladesh Metros'
                  )
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-center pt-3 border-t border-[#3c4a42]/20">
              <div className="p-2.5 rounded-xl bg-[#181d1a]">
                <span className="font-mono-code text-xs text-emerald-400 font-bold block">
                  68% {lang === 'bn' ? 'নিরাপদ' : 'Safe Surplus'}
                </span>
                <span className="text-[11px] text-slate-400">
                  {lang === 'bn' ? 'তাৎক্ষণিক খাওয়ার উপযোগী' : 'Ready to Consume'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#181d1a]">
                <span className="font-mono-code text-xs text-teal-300 font-bold block">
                  100% {lang === 'bn' ? 'ট্র্যাকড' : 'Traceable'}
                </span>
                <span className="text-[11px] text-slate-400">
                  {lang === 'bn' ? 'আশ্রয়কেন্দ্র লগবুক' : 'Shelter Intake Verified'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

