import React from 'react';
import {
  HeartHandshake,
  ShieldCheck,
  Clock,
  ArrowRight,
  Utensils,
  MessageCircle,
} from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

interface HeroProps {
  lang: Language;
  onOpenDonate: () => void;
  onOpenRequest: () => void;
  onOpenPhotoLightbox?: (url: string, title: string, desc: string, loc?: string) => void;
}

export const Hero: React.FC<HeroProps> = ({
  lang,
  onOpenDonate,
  onOpenRequest,
}) => {
  const t = translations[lang];

  const heroImgUrl =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCUnRlsVcDiIe_deAGKLPw_xrXOdnsO4AN0r9teVzjzPIbog6R8BGJwYMMPvjhRACaIJ_-KhdtNHM7MPOa0FO7h_yx-2zbeEFAfYMh669eUpGK_14h4JORanfqdsIv-DhhFuAhPc3YLoxdR4Jgmex3C3vx_VPtTwvSzhDdPsVY29ER7D51P7tnMyAOU7waKl47B0WgGxHQtw8Q9YErhQHMEfZHi2rgY5z-vXcp0TgdR7ki0Op1tuTAgGksIpDTPrXPz';

  return (
    <section
      id="hero"
      className="relative min-h-[92vh] flex flex-col justify-end px-4 sm:px-6 lg:px-8 pt-24 pb-12 max-w-7xl mx-auto w-full"
    >
      {/* Background Atmosphere with Deep Emerald Glow & Cinematic Backdrop */}
      <div className="absolute inset-0 z-0 overflow-hidden rounded-b-3xl md:rounded-3xl border border-[#3c4a42]/30 bg-[#0A0F0D]">
        <img
          src={heroImgUrl}
          alt="Food Bridge Community Food Rescue and Distribution"
          className="w-full h-full object-cover object-center filter brightness-[0.55] contrast-[1.08] saturate-[0.9] scale-[1.01]"
          referrerPolicy="no-referrer"
        />
        {/* Soft atmospheric gradient scrims to ensure 100% text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F0D] via-[#0A0F0D]/80 to-[#0A0F0D]/25" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0F0D]/90 via-[#0A0F0D]/40 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.2),transparent_65%)]" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-3xl flex flex-col gap-5">
        {/* Live Status Indicator */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0A0F0D]/90 backdrop-blur-md border border-emerald-500/30 w-max shadow-[0_0_18px_rgba(16,185,129,0.22)]">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 emerald-ping" />
          <span className="font-mono-code text-xs text-emerald-400 tracking-wider uppercase font-semibold">
            {t.hero.statusBadge}
          </span>
          <span className="text-[#3c4a42]">•</span>
          <span className="font-mono-code text-xs text-slate-300">
            {t.hero.liveRegion}
          </span>
        </div>

        {/* Master Headline */}
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-white tracking-tight leading-[1.12] text-balance font-extrabold">
          {t.hero.title1}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200">
            {t.hero.wasteGradient}
          </span>
          {t.hero.title2}
          <span className="underline decoration-emerald-500/50 decoration-wavy decoration-2 underline-offset-8">
            {t.hero.hungerUnderline}
          </span>
        </h1>

        {/* Supporting Text */}
        <p className="font-body text-base md:text-lg text-slate-300 max-w-2xl leading-relaxed">
          {t.hero.subtitle}
        </p>

        {/* Call to Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
          <button
            onClick={onOpenDonate}
            className="bg-emerald-500 text-slate-950 font-bold px-6 py-3.5 rounded-xl hover:bg-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.45)] hover:shadow-[0_0_35px_rgba(16,185,129,0.65)] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer text-sm md:text-base font-mono-code"
          >
            <HeartHandshake className="w-5 h-5 text-slate-950" />
            <span>{t.hero.ctaDonate}</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

          <button
            onClick={onOpenRequest}
            className="bg-[#181d1a]/85 backdrop-blur-md border border-emerald-500/30 text-white hover:text-emerald-300 hover:border-emerald-400 px-6 py-3.5 rounded-xl active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer text-sm md:text-base shadow-sm font-mono-code"
          >
            <Utensils className="w-4 h-4 text-emerald-400" />
            <span>{t.hero.ctaHelp}</span>
          </button>

          {/* Quick WhatsApp helpline trigger */}
          <a
            href="https://wa.me/8801800274343?text=Hello%20Food%20Bridge%20Bangladesh,%20I%20have%20surplus%20food%20to%20rescue."
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-[#181d1a]/80 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 text-xs font-semibold transition-colors"
            title="Chat with Emergency Food Rescue Coordinator on WhatsApp"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>{lang === 'bn' ? 'হোয়াটসঅ্যাপ' : 'WhatsApp'}</span>
          </a>
        </div>

        {/* Operational Metrics Bar */}
        <div className="pt-4 border-t border-[#3c4a42]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-300">
          <p className="text-sm italic text-emerald-300 font-medium">
            {t.hero.credo}
          </p>
          <div className="flex items-center gap-4 text-xs font-mono-code text-slate-300">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Clock className="w-3.5 h-3.5" />
              <span>{t.hero.avgDispatch}</span>
            </span>
            <span className="text-[#3c4a42]">•</span>
            <span className="flex items-center gap-1 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.hero.safetyCertified}</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
