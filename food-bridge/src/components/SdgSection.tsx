import React from 'react';
import {
  ArrowRight,
  Award,
  ZoomIn,
  CheckCircle2,
} from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

interface SdgSectionProps {
  lang: Language;
  onOpenPhotoLightbox?: (url: string, title: string, desc: string, loc?: string) => void;
  onScrollToImpact?: () => void;
}

export const SdgSection: React.FC<SdgSectionProps> = ({
  lang,
  onOpenPhotoLightbox,
  onScrollToImpact,
}) => {
  const t = translations[lang];

  // Official high-resolution UN SDG posters
  const sdg2Img =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDhOujVHtsiWc2UcVv-dnKZHDpdNP0bmXz5zSLBfBg_wtBJFW3z8HGWLXTbrPJch_BfyksUOWFBp7EyAX2iZAobBIdy2QILoUUDnLH45sIANbhJvhT1-u24w6a92sTDkMuHBNFE4REHJyMK9aHUpQvFR05TQoNbt7FK8c5QcTzmcCJyA6kDOVE-6mJTX4unA2V05juH3PZUqGcXa9mD3_xh8xb27ZsKXnxV1JLp9PRF6aWNYZdkrhdkDUVCg-UKUS-q';

  const sdg12Img =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCa2yLxG4MLurE_fC0KkpjE6T7-u-XV3lbQJq1vmTVHr_M3Ewo2Ds352LDb0anzOyg6aXkkGs3NevmcxaW5gJxqi5RtY1yxVFx9yPk3sUN4blt2Ps8hBNssI1WNk1ivlSGLq3jjqBcKMLZkPTfiOobBFIoZrq0_Tv-S2XzP-tm-9EEH4pZVyO5MYuBScBdnk2Rs-S2ZL-bCb6vE4T5FcoO-saVupvP6kthDuRDY9IZ5WDlQ4FseSWSDKvhP0gsge871';

  const sdg17Img =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBPqtMQ3oMU4cxIwHqoudI4fB8wvN_JJTjfODH7qtsTn0x2_0dzXizH6aZzLHC94wdGO-sMmz_sxACo16qVAbBkioeQmV54HJLB1kaTNX3OCFNaZY3O0q-mCJVIZftolgs-e-hUs3ybjKR6RsLpk7Z7_14F7uhO-VQl09lXJMS3uJVIaqSDO36UvBJOUqMMDO8dEDi1LJUZ6JROksI4quAQWjJ0dbWOadPhWyCUzrslkKcaWg6HkH0aqdwagxjig13J';

  const sdg1Img = '/images/sdg/sdg1_no_poverty.svg';
  const sdg3Img = '/images/sdg/sdg3_good_health.svg';
  const sdg11Img = '/images/sdg/sdg11_sustainable_cities.svg';
  const sdg13Img = '/images/sdg/sdg13_climate_action.svg';

  const handleScrollToImpact = () => {
    if (onScrollToImpact) {
      onScrollToImpact();
    } else {
      const el = document.getElementById('impact');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="sdgs"
      className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full pt-20 pb-16 overflow-hidden"
    >
      {/* Subtle Ambient Radial Lighting for Cinematic Depth */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[400px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-24 right-10 w-96 h-96 bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-14 relative z-10">
        <span className="font-mono-code text-xs text-emerald-400 uppercase tracking-widest px-3.5 py-1.5 rounded-full bg-[#181d1a] border border-emerald-500/30 inline-flex items-center gap-2 mb-4 shadow-[0_0_15px_rgba(16,185,129,0.15)] font-semibold">
          <Award className="w-3.5 h-3.5 text-emerald-400" />
          <span>{t.sdgs.badge}</span>
        </span>

        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-white font-extrabold tracking-tight leading-tight">
          {t.sdgs.title}
        </h2>

        <p className="font-body text-slate-300 mt-4 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
          {t.sdgs.subtitle}
        </p>

        {/* Ethical / Compliance Statement Notice */}
        <div className="mt-4 inline-flex items-center gap-2 text-xs font-mono-code text-emerald-400/90 bg-[#0A0F0D]/90 border border-emerald-500/20 px-4 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-400 emerald-ping" />
          <span>{t.sdgs.complianceNote}</span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* ELEGANT BRIDGE VISUAL METAPHOR:                           */}
      {/* FOOD → PEOPLE → COMMUNITY → SUSTAINABILITY → GLOBAL IMPACT*/}
      {/* ========================================================= */}
      <div className="relative z-10 mb-14 max-w-4xl mx-auto">
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#181d1a]/90 via-[#1c211e]/90 to-[#181d1a]/90 border border-emerald-500/30 backdrop-blur-md shadow-[0_0_30px_rgba(16,185,129,0.08)]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-2 text-center">
            {t.sdgs.bridgeMetaphor.map((step, idx) => (
              <React.Fragment key={idx}>
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 emerald-ping" />
                    <span className="font-mono-code text-xs sm:text-sm font-bold text-white tracking-wider">
                      {step.label}
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-300/80 font-mono-code">
                    {step.sub}
                  </span>
                </div>

                {idx < t.sdgs.bridgeMetaphor.length - 1 && (
                  <div className="hidden sm:flex items-center justify-center text-emerald-400/60 font-mono-code">
                    <span className="h-[1px] w-6 md:w-10 bg-gradient-to-r from-emerald-500/40 via-emerald-400 to-emerald-500/40" />
                    <ArrowRight className="w-3.5 h-3.5 -ml-1 text-emerald-400" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* PRIMARY SDGs: 100% UN-CROPPED LARGE PREMIUM CARDS          */}
      {/* (SDG 2, SDG 12, SDG 17 significantly larger than supporting)*/}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 relative z-10">
        {/* PRIMARY CARD 1: SDG 2 ZERO HUNGER */}
        <div className="group relative rounded-3xl bg-[#181d1a]/90 backdrop-blur-xl border border-[#3c4a42]/40 hover:border-emerald-500/80 p-6 sm:p-7 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_16px_40px_rgba(16,185,129,0.25)] flex flex-col justify-between overflow-hidden">
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all pointer-events-none" />

          <div>
            {/* Visual SDG Image Container - 100% Uncropped using object-contain */}
            <div
              onClick={() =>
                onOpenPhotoLightbox?.(
                  sdg2Img,
                  t.sdgs.sdg2Title,
                  t.sdgs.sdg2Desc,
                  'United Nations SDG 2 — Zero Hunger'
                )
              }
              className="relative h-64 w-full rounded-2xl overflow-hidden mb-6 border border-amber-500/30 bg-[#0A0F0D] p-3 flex items-center justify-center group/img cursor-pointer shadow-inner"
            >
              <img
                src={sdg2Img}
                alt="UN SDG 2 Zero Hunger Visual"
                className="max-h-full max-w-full w-auto h-auto object-contain rounded-xl group-hover/img:scale-105 transition-transform duration-300 filter brightness-[1.0] contrast-[1.04]"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-[#0A0F0D]/85 backdrop-blur-sm text-amber-300 opacity-0 group-hover/img:opacity-100 transition-opacity border border-amber-500/40">
                <ZoomIn className="w-3.5 h-3.5" />
              </div>
              <span className="absolute bottom-2.5 left-2.5 font-mono-code text-[10px] text-amber-300 bg-[#0A0F0D]/90 px-2.5 py-0.5 rounded border border-amber-500/30 font-semibold">
                SDG 02 TARGET 2.1
              </span>
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className="font-mono-code text-xs font-bold text-amber-300 bg-amber-950/70 border border-amber-500/40 px-3 py-1 rounded-xl shadow-sm">
                UN SDG 02
              </span>
              <span className="font-mono-code text-xs text-amber-400 font-semibold uppercase tracking-wider">
                {t.sdgs.sdg2Goal}
              </span>
            </div>

            <h3 className="font-display text-2xl text-white font-bold tracking-tight mb-3">
              {t.sdgs.sdg2Title}
            </h3>

            <p className="font-body text-slate-300 group-hover:text-slate-100 text-sm md:text-base leading-relaxed mb-6 transition-colors">
              {t.sdgs.sdg2Desc}
            </p>
          </div>

          <div className="pt-4 border-t border-[#3c4a42]/30 flex items-center justify-between text-xs font-mono-code">
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {t.sdgs.sdg2Highlight}
            </span>
            <span className="text-slate-400">Target 2.1 & 2.2</span>
          </div>
        </div>

        {/* PRIMARY CARD 2: SDG 12 RESPONSIBLE CONSUMPTION (TARGET 12.3) */}
        <div className="group relative rounded-3xl bg-[#181d1a]/90 backdrop-blur-xl border border-[#3c4a42]/40 hover:border-emerald-500/80 p-6 sm:p-7 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_16px_40px_rgba(16,185,129,0.25)] flex flex-col justify-between overflow-hidden">
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-600/10 rounded-full blur-2xl group-hover:bg-amber-600/20 transition-all pointer-events-none" />

          <div>
            {/* Visual SDG Image Container - 100% Uncropped using object-contain */}
            <div
              onClick={() =>
                onOpenPhotoLightbox?.(
                  sdg12Img,
                  t.sdgs.sdg12Title,
                  t.sdgs.sdg12Desc,
                  'United Nations Target 12.3 — Halve Global Food Waste'
                )
              }
              className="relative h-64 w-full rounded-2xl overflow-hidden mb-6 border border-amber-600/30 bg-[#0A0F0D] p-3 flex items-center justify-center group/img cursor-pointer shadow-inner"
            >
              <img
                src={sdg12Img}
                alt="UN SDG 12 Responsible Consumption Visual"
                className="max-h-full max-w-full w-auto h-auto object-contain rounded-xl group-hover/img:scale-105 transition-transform duration-300 filter brightness-[1.0] contrast-[1.04]"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-[#0A0F0D]/85 backdrop-blur-sm text-amber-200 opacity-0 group-hover/img:opacity-100 transition-opacity border border-amber-500/30">
                <ZoomIn className="w-3.5 h-3.5" />
              </div>
              <span className="absolute bottom-2.5 left-2.5 font-mono-code text-[10px] text-amber-200 bg-[#0A0F0D]/90 px-2.5 py-0.5 rounded border border-amber-500/20 font-semibold">
                TARGET 12·3 (HALVE WASTE)
              </span>
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className="font-mono-code text-xs text-amber-300 bg-amber-950/70 border border-amber-500/40 px-3 py-1 rounded-xl shadow-sm">
                UN SDG 12
              </span>
              <span className="font-mono-code text-xs text-amber-400 font-semibold uppercase tracking-wider">
                {t.sdgs.sdg12Goal}
              </span>
            </div>

            <h3 className="font-display text-2xl text-white font-bold tracking-tight mb-3">
              {t.sdgs.sdg12Title}
            </h3>

            <p className="font-body text-slate-300 group-hover:text-slate-100 text-sm md:text-base leading-relaxed mb-6 transition-colors">
              {t.sdgs.sdg12Desc}
            </p>
          </div>

          <div className="pt-4 border-t border-[#3c4a42]/30 flex items-center justify-between text-xs font-mono-code">
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {t.sdgs.sdg12Highlight}
            </span>
            <span className="text-slate-400">Target 12.3 (Zero Waste)</span>
          </div>
        </div>

        {/* PRIMARY CARD 3: SDG 17 PARTNERSHIPS FOR THE GOALS */}
        <div className="group relative rounded-3xl bg-[#181d1a]/90 backdrop-blur-xl border border-[#3c4a42]/40 hover:border-emerald-500/80 p-6 sm:p-7 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_16px_40px_rgba(16,185,129,0.25)] flex flex-col justify-between overflow-hidden">
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all pointer-events-none" />

          <div>
            {/* Visual SDG Image Container - 100% Uncropped using object-contain */}
            <div
              onClick={() =>
                onOpenPhotoLightbox?.(
                  sdg17Img,
                  t.sdgs.sdg17Title,
                  t.sdgs.sdg17Desc,
                  'United Nations SDG 17 — Partnerships for the Goals'
                )
              }
              className="relative h-64 w-full rounded-2xl overflow-hidden mb-6 border border-blue-500/30 bg-[#0A0F0D] p-3 flex items-center justify-center group/img cursor-pointer shadow-inner"
            >
              <img
                src={sdg17Img}
                alt="UN SDG 17 Partnerships for the Goals Visual"
                className="max-h-full max-w-full w-auto h-auto object-contain rounded-xl group-hover/img:scale-105 transition-transform duration-300 filter brightness-[1.0] contrast-[1.04]"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-[#0A0F0D]/85 backdrop-blur-sm text-blue-200 opacity-0 group-hover/img:opacity-100 transition-opacity border border-blue-400/30">
                <ZoomIn className="w-3.5 h-3.5" />
              </div>
              <span className="absolute bottom-2.5 left-2.5 font-mono-code text-[10px] text-blue-200 bg-[#0A0F0D]/90 px-2.5 py-0.5 rounded border border-blue-400/20 font-semibold">
                SDG 17 PARTNERSHIPS
              </span>
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className="font-mono-code text-xs font-bold text-blue-300 bg-blue-950/70 border border-blue-500/40 px-3 py-1 rounded-xl shadow-sm">
                UN SDG 17
              </span>
              <span className="font-mono-code text-xs text-blue-400 font-semibold uppercase tracking-wider">
                {t.sdgs.sdg17Goal}
              </span>
            </div>

            <h3 className="font-display text-2xl text-white font-bold tracking-tight mb-3">
              {t.sdgs.sdg17Title}
            </h3>

            <p className="font-body text-slate-300 group-hover:text-slate-100 text-sm md:text-base leading-relaxed mb-6 transition-colors">
              {t.sdgs.sdg17Desc}
            </p>
          </div>

          <div className="pt-4 border-t border-[#3c4a42]/30 flex items-center justify-between text-xs font-mono-code">
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {t.sdgs.sdg17Highlight}
            </span>
            <span className="text-slate-400">Target 17.17 (Alliances)</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SUPPORTING SDGs: Clean Secondary Grid of 4 Smaller Cards  */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12 relative z-10">
        {/* SUPPORTING 1: SDG 1 NO POVERTY */}
        <div className="group rounded-2xl bg-[#181d1a]/70 backdrop-blur-md border border-[#3c4a42]/30 hover:border-emerald-500/50 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(16,185,129,0.12)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono-code text-[11px] font-bold text-rose-300 bg-[#0A0F0D] border border-rose-500/30 px-2 py-0.5 rounded-lg">
                {t.sdgs.mini1Num}
              </span>
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-rose-500/30 group-hover:scale-110 transition-transform bg-[#E5243B] p-1 flex items-center justify-center shadow-md">
                <img src={sdg1Img} alt="SDG 1 Icon" className="w-full h-full object-contain" />
              </div>
            </div>

            <h4 className="font-display text-sm md:text-base text-white font-bold mb-2 group-hover:text-emerald-300 transition-colors">
              {t.sdgs.mini1Title}
            </h4>

            <p className="font-body text-slate-300 group-hover:text-slate-200 text-xs leading-relaxed transition-colors">
              {t.sdgs.mini1Desc}
            </p>
          </div>
        </div>

        {/* SUPPORTING 2: SDG 3 GOOD HEALTH */}
        <div className="group rounded-2xl bg-[#181d1a]/70 backdrop-blur-md border border-[#3c4a42]/30 hover:border-emerald-500/50 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(16,185,129,0.12)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono-code text-[11px] font-bold text-emerald-300 bg-[#0A0F0D] border border-emerald-500/30 px-2 py-0.5 rounded-lg">
                {t.sdgs.mini2Num}
              </span>
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-emerald-500/30 group-hover:scale-110 transition-transform bg-[#4C9F38] p-1 flex items-center justify-center shadow-md">
                <img src={sdg3Img} alt="SDG 3 Icon" className="w-full h-full object-contain" />
              </div>
            </div>

            <h4 className="font-display text-sm md:text-base text-white font-bold mb-2 group-hover:text-emerald-300 transition-colors">
              {t.sdgs.mini2Title}
            </h4>

            <p className="font-body text-slate-300 group-hover:text-slate-200 text-xs leading-relaxed transition-colors">
              {t.sdgs.mini2Desc}
            </p>
          </div>
        </div>

        {/* SUPPORTING 3: SDG 11 SUSTAINABLE CITIES */}
        <div className="group rounded-2xl bg-[#181d1a]/70 backdrop-blur-md border border-[#3c4a42]/30 hover:border-emerald-500/50 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(16,185,129,0.12)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono-code text-[11px] font-bold text-amber-300 bg-[#0A0F0D] border border-amber-500/30 px-2 py-0.5 rounded-lg">
                {t.sdgs.mini3Num}
              </span>
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-amber-500/30 group-hover:scale-110 transition-transform bg-[#FD9D24] p-1 flex items-center justify-center shadow-md">
                <img src={sdg11Img} alt="SDG 11 Icon" className="w-full h-full object-contain" />
              </div>
            </div>

            <h4 className="font-display text-sm md:text-base text-white font-bold mb-2 group-hover:text-emerald-300 transition-colors">
              {t.sdgs.mini3Title}
            </h4>

            <p className="font-body text-slate-300 group-hover:text-slate-200 text-xs leading-relaxed transition-colors">
              {t.sdgs.mini3Desc}
            </p>
          </div>
        </div>

        {/* SUPPORTING 4: SDG 13 CLIMATE ACTION */}
        <div className="group rounded-2xl bg-[#181d1a]/70 backdrop-blur-md border border-[#3c4a42]/30 hover:border-emerald-500/50 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(16,185,129,0.12)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono-code text-[11px] font-bold text-teal-300 bg-[#0A0F0D] border border-teal-500/30 px-2 py-0.5 rounded-lg">
                {t.sdgs.mini4Num}
              </span>
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-teal-500/30 group-hover:scale-110 transition-transform bg-[#3F7E44] p-1 flex items-center justify-center shadow-md">
                <img src={sdg13Img} alt="SDG 13 Icon" className="w-full h-full object-contain" />
              </div>
            </div>

            <h4 className="font-display text-sm md:text-base text-white font-bold mb-2 group-hover:text-emerald-300 transition-colors">
              {t.sdgs.mini4Title}
            </h4>

            <p className="font-body text-slate-300 group-hover:text-slate-200 text-xs leading-relaxed transition-colors">
              {t.sdgs.mini4Desc}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* BOTTOM MESSAGE & CTA BUTTON                               */}
      {/* ========================================================= */}
      <div className="relative z-10 p-6 md:p-8 rounded-3xl bg-gradient-to-r from-[#181d1a] via-[#1c211e] to-[#181d1a] border border-emerald-500/40 text-center flex flex-col sm:flex-row items-center justify-between gap-6 shadow-[0_0_35px_rgba(16,185,129,0.12)]">
        <div className="text-left max-w-2xl">
          <p className="font-display text-lg sm:text-xl md:text-2xl text-white font-bold tracking-tight leading-snug">
            {t.sdgs.bottomMessage}
          </p>
          <p className="font-mono-code text-xs text-emerald-400 mt-1">
            {lang === 'bn'
              ? 'ফুড ব্রিজ — অপচয়হীন টেকসই বাংলাদেশ গড়ার অঙ্গীকার'
              : 'Food Bridge — Committed to zero food waste and hunger eradication'}
          </p>
        </div>

        <button
          onClick={handleScrollToImpact}
          className="bg-emerald-500 text-slate-950 font-bold px-6 py-3.5 rounded-xl hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-95 transition-all text-sm font-mono-code shrink-0 cursor-pointer flex items-center gap-2 group"
        >
          <span>{t.sdgs.bottomCta}</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </section>
  );
};
