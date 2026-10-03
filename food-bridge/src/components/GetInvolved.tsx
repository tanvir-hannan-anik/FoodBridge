import React from 'react';
import { Utensils, Bike, Building2, HeartHandshake, ArrowRight, MessageCircle } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

interface GetInvolvedProps {
  lang: Language;
  onOpenDonate: () => void;
  onOpenVolunteer: () => void;
  onOpenRequest: () => void;
  onOpenPhotoLightbox?: (url: string, title: string, desc: string, loc?: string) => void;
}

export const GetInvolved: React.FC<GetInvolvedProps> = ({
  lang,
  onOpenDonate,
  onOpenVolunteer,
  onOpenRequest,
  onOpenPhotoLightbox,
}) => {
  const t = translations[lang];

  const finalCtaImg =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAAp5gvSs7d0M4CLfWKNPQTmTgV30qos3FJCfbJZrQZVaMRDYnrwl5iniOwA3_HUqd17eqrdwX0vGtG4fXci7fDV7gBrx4OaXBoPoczH9bPBrej2xNMy0XIjNiC1mYMjFVcd_znRIjvN075_AQF-AjfFGSz6aRxUmJRp64K9K2s1nho2AolnC2B69tkhoBQnRjOhiJhCyAHuX1M3RBvqIPZLVnNaYgwSyJG-vFBN812bkyuftU6l51CcQCP-WCT8jWI';

  return (
    <div className="space-y-20">
      {/* 3 Call-To-Action Cards */}
      <section id="donate" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full pt-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="font-mono-code text-xs text-emerald-400 uppercase tracking-widest px-3 py-1 rounded bg-[#181d1a] border border-emerald-500/20 inline-block mb-3 font-semibold">
            {t.getInvolved.badge}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl text-white font-bold tracking-tight">
            {t.getInvolved.title}
          </h2>
          <p className="font-body text-slate-300 mt-2 text-base">
            {t.getInvolved.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Donate */}
          <div className="bg-[#181d1a]/80 backdrop-blur-xl border border-[#3c4a42]/30 rounded-2xl p-6 flex flex-col justify-between group hover:border-emerald-500/50 transition-all">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#0A0F0D] border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-110 transition-transform">
                <Utensils className="w-6 h-6" />
              </div>
              <h3 className="font-display text-xl text-white font-bold mb-2">
                {t.getInvolved.card1Title}
              </h3>
              <p className="font-body text-slate-300 text-sm leading-relaxed mb-6">
                {t.getInvolved.card1Desc}
              </p>
            </div>
            <button
              onClick={onOpenDonate}
              className="w-full bg-emerald-500 text-slate-950 font-bold py-3 rounded-xl hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer text-sm"
            >
              {t.getInvolved.card1Btn}
            </button>
          </div>

          {/* Card 2: Volunteer */}
          <div className="bg-[#181d1a]/80 backdrop-blur-xl border border-[#3c4a42]/30 rounded-2xl p-6 flex flex-col justify-between group hover:border-emerald-500/50 transition-all">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#0A0F0D] border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-110 transition-transform">
                <Bike className="w-6 h-6" />
              </div>
              <h3 className="font-display text-xl text-white font-bold mb-2">
                {t.getInvolved.card2Title}
              </h3>
              <p className="font-body text-slate-300 text-sm leading-relaxed mb-6">
                {t.getInvolved.card2Desc}
              </p>
            </div>
            <button
              onClick={onOpenVolunteer}
              className="w-full bg-[#0A0F0D] border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 font-bold py-3 rounded-xl transition-all cursor-pointer text-sm"
            >
              {t.getInvolved.card2Btn}
            </button>
          </div>

          {/* Card 3: Partner Shelter */}
          <div className="bg-[#181d1a]/80 backdrop-blur-xl border border-[#3c4a42]/30 rounded-2xl p-6 flex flex-col justify-between group hover:border-emerald-500/50 transition-all">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#0A0F0D] border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-110 transition-transform">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="font-display text-xl text-white font-bold mb-2">
                {t.getInvolved.card3Title}
              </h3>
              <p className="font-body text-slate-300 text-sm leading-relaxed mb-6">
                {t.getInvolved.card3Desc}
              </p>
            </div>
            <button
              onClick={onOpenRequest}
              className="w-full bg-[#0A0F0D] border border-[#3c4a42]/60 text-slate-200 hover:text-emerald-400 hover:border-emerald-400 font-bold py-3 rounded-xl transition-all cursor-pointer text-sm"
            >
              {t.getInvolved.card3Btn}
            </button>
          </div>
        </div>
      </section>

      {/* Final Cinematic Call to Action Banner */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full pb-10">
        <div className="relative rounded-3xl overflow-hidden border border-emerald-500/30 p-8 md:p-16 flex flex-col items-center text-center shadow-[0_0_50px_rgba(16,185,129,0.18)]">
          {/* Background Imagery with High Quality Bright Scrim */}
          <div className="absolute inset-0 z-0 bg-[#0A0F0D]">
            <img
              src={finalCtaImg}
              alt="Smiles and hope after receiving warm nourishing meal"
              className="w-full h-full object-cover filter brightness-[0.55] contrast-[1.12] saturate-[0.85]"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F0D] via-[#0A0F0D]/80 to-[#0A0F0D]/50" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.22),transparent_70%)]" />
          </div>

          <div className="relative z-10 max-w-2xl flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#181d1a]/90 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <HeartHandshake className="w-7 h-7" />
            </div>

            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-white font-extrabold tracking-tight">
              {t.finalCta.title}
            </h2>

            <p className="font-body text-slate-300 text-sm md:text-base leading-relaxed">
              {t.finalCta.subtitle}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 w-full sm:w-auto">
              <button
                onClick={onOpenDonate}
                className="w-full sm:w-auto bg-emerald-500 text-slate-950 font-bold px-8 py-3.5 rounded-xl hover:bg-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.45)] active:scale-95 transition-all text-center cursor-pointer text-sm md:text-base flex items-center justify-center gap-2"
              >
                <span>{t.finalCta.btnDonate}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenVolunteer}
                className="w-full sm:w-auto bg-[#181d1a]/80 backdrop-blur-md border border-emerald-500/40 text-white hover:text-emerald-300 hover:border-emerald-400 px-8 py-3.5 rounded-xl active:scale-95 transition-all text-center cursor-pointer text-sm md:text-base"
              >
                {t.finalCta.btnJoin}
              </button>

              <a
                href="https://wa.me/8801800274343?text=Hello%20Food%20Bridge,%20I%20want%20to%20help%20rescue%20food."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20 px-5 py-3.5 rounded-xl transition-all text-center flex items-center justify-center gap-2 text-sm font-semibold"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
