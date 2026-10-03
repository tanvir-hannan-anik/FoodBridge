import React from 'react';
import {
  Trash2,
  HeartCrack,
  BarChart3,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  ZoomIn,
} from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';
import { ImageWithFallback } from './ImageWithFallback';

interface ProblemSectionProps {
  lang: Language;
  onOpenPhotoLightbox?: (url: string, title: string, desc: string, loc?: string) => void;
}

export const ProblemSection: React.FC<ProblemSectionProps> = ({
  lang,
  onOpenPhotoLightbox,
}) => {
  const t = translations[lang];

  // Image assets from verified Bangladesh field research and documentary archives
  const wasteImages = [
    {
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBKBnrWfwAE53PEK19ZayqQ985MIB-tcrifXmsumSaY5nuW7hdzdeZdT9NzbJVtOefx98dE9cXp9EjE3XZudQGx0TgrzQcCMXcLDUVFz2anqIRoKULQ6lqLrpFmZ9zOq7QwNB3WaZ_Ff3nAZe6e--S4iS88dbk3UTWZR3XUDMUv31JpFQjDZPFijFpacGSOWK9Q2sE28ZSFzOiKkj7BwMp-Wqe3evIJ41sFzCw6NONwRWK0xjt4v-UraBSB7ODqGgqk',
      title: lang === 'bn' ? 'কনভেনশন সেন্টার ও বিয়ের অনুষ্ঠানের উদ্বৃত্ত খাবার' : 'Post-Event Banquet Discards & Surplus Food',
      desc: lang === 'bn' ? 'অনুষ্ঠান শেষে টন কে টন অক্ষত ও সুস্বাদু খাবার আবর্জনার স্তূপে নিক্ষেপ করা হচ্ছে।' : 'Commercial banquet halls discard massive volumes of untouched cooked meals.',
      tag: lang === 'bn' ? 'উদ্বৃত্ত খাবার' : 'Banquet Discards',
      badge: lang === 'bn' ? 'অপচয়' : 'Edible Waste',
    },
    {
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDoUTo8fNgWR6BKz_zNuASBKbb767XwVI7_UBiZUjITcvMN1d22EjbihwrjsnytyfZwi1AHoPsI_uQespdS1vDjk16ePGktWooDVEUqKxO6cvDeI0ZJRky32A8UUBGMFqk0rCBJvupgLE3-TrXBeWXmEOimR4ueZydmevUMpUi9ngGkd9VWuzmrdkDhtyf9eVenPCi55gh1VRQkJtb8g-GQ7XjMDgItVcm1stOKP1ELB6O51H1vuW2hPHsyuWvvMPyX',
      title: lang === 'bn' ? 'বাংলাদেশে বার্ষিক খাদ্য অপচয় ১৪.১ মিলিয়ন টন' : 'Bangladesh Annual Food Waste Hits 14.10M Tonnes',
      desc: lang === 'bn' ? 'জাতীয় জরিপে উঠে এসেছে ঢাকা ও বড় শহরগুলোর ল্যান্ডফিলে খাদ্য বর্জ্যের উদ্বেগজনক পরিমাণ।' : 'National reports highlight the devastating environmental and economic cost of food disposal.',
      tag: lang === 'bn' ? '১৪.১ মিলিয়ন টন বর্জ্য' : '14.1M Tonnes Lost',
      badge: lang === 'bn' ? 'ঢাকা ল্যান্ডফিল' : 'Dhaka Landfills',
    },
    {
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCwD6R7S2ZqtoLvkKcRFa-eTG5etsvtXMnFIqmV36Hed-RVPsWlPnIY6ChdeF-LXFurkkAUhPDJaRc2oqMg9C0uFTBgsETT6k_rD_q19qVdxC3iaJbZr94ZXGQpWp8J7GneG9npficJ0Uunq-glqWJR2vH1VPdbe4gRgxYK8jbxZ-oQTef2CPh-WUJZUZuQeSF3SfPNeIrIhQNoXdXrmDE41JgoGJXoWUz-43_ReSXTj3Nth1Fk7zNJirwILE-Ie4NY',
      title: lang === 'bn' ? 'বাংলাদেশে ৩৪% খাদ্য অপচয় — বিশ্বব্যাংক গবেষণা' : 'Bangladesh Wastes 34% of Food Annually - World Bank',
      desc: lang === 'bn' ? 'খামার থেকে ভোক্তা স্তর পর্যন্ত এক-তৃতীয়াংশ খাদ্য বর্জ্যে পরিণত হয়।' : 'Over one-third of total food produced is lost or wasted along the supply chain.',
      tag: lang === 'bn' ? '৩৪% বার্ষিক অপচয়' : '34% Wasted Annually',
      badge: lang === 'bn' ? 'বিশ্বব্যাংক সমীক্ষা' : 'World Bank Study',
    },
    {
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAL7nP9Tny7BWU-qdEydYcc0T6Q7cT6wnNZRaBmu172Aio9ywFFrInhEo9wwHE7uHl1V1M4V3YD8VnmwH9-8_infMvxbmUaLsvf64hA1qL9KENvznw_Vcks6aUkvH3CVeZzaXzpA2VrHekcvyJw2j7cV_BZZu01tPdZcdNxqcUyKM4pwCszJS6avIJvId1DlG2hejibArZde_8LNgUj6tt7KHpvWdkkSY-pKi9r9JGy12rYQ8G_p7eDheF_98yTcCo7',
      title: lang === 'bn' ? 'বাজারের অবিক্রীত তাজা শাকসবজি ও ফলমূল ডাম্পিং' : 'Market Produce Discarded by Municipal Workers',
      desc: lang === 'bn' ? 'আড়ত ও পাইকারি বাজারের ভালো শাকসবজি সংরক্ষণের অভাবে ডাস্টবিনে ফেলা হয়।' : 'Wholesale market fresh produce discarded due to lack of immediate redistribution channels.',
      tag: lang === 'bn' ? 'বাজার উদ্বৃত্ত' : 'Market Surplus Dump',
      badge: lang === 'bn' ? 'দৈনিক অপচয়' : 'Daily Discard',
    },
  ];

  const hungerImages = [
    {
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCWENTzfSAZouhzJuPUdsowcZr8fQDzi78HHt8Xkfqhh2BM3PBvQw6JmkJgDgq_76zQglRiYIOPl-utMa1DuWmUK9VojwbTFfMKaPT1HW3ZLvl5wIDoHAJXmOfzqu1Uqpwruq7BXqu2vh0eqVMXMOfwKgdRm3obBDZNilgjrJiJ4HHTbHOEVpstw3McgBoIEFPhxgNnmRwubJM4t25VQpY65zRmE28V7qEP2yAqIFn2wa1JBs2FIE6AOg8CWFRb2XJn',
      title: lang === 'bn' ? 'এক বেলা খাবারের আশায় অপেক্ষারত দুস্থ পরিবার' : 'Crowd of Families Waiting for Daily Relief Food',
      desc: lang === 'bn' ? 'ত্রাণ ও খাবারের গাড়ি দেখলেই শত শত মানুষ খাবার পেতে ভিড় জমায়।' : 'Displaced and low-income families gathering in hope of a hot meal.',
      tag: lang === 'bn' ? 'অসহায় পরিবার' : 'Communities in Need',
      sub: lang === 'bn' ? 'দৈনিক খাদ্যের অপেক্ষায় হাজারো মানুষ' : 'Displaced families waiting for daily relief food',
    },
    {
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAxeOAMZTEN4cr5vr7hdq84OyKW9gwkVk-Hs534I4l3FM4tvtwAu8AsFnFQfBc7lVg_i3ozlDWYkXvePE_Pgd2zyUbPKnxDnT5P-F-4cdWwHWkdfYRoWYhgpAsBpx_eWAphOWeQI_u-3oHxbKV_hcmbiKh98_jteC026ojk-ldz41TnT8_rEQHVLmfnPEQjT4W-wxIlgwf8Jnm9rZqSbEDiXQXVKfLy1E_-UNH5V_RO4RrI3L3tOXNNGcUbJNVZVDCX',
      title: lang === 'bn' ? 'বস্তি এলাকায় শুধু সাদা ভাত খেয়ে বেঁচে থাকার লড়াই' : 'Child in Urban Slum Eating Bare Rice Morsel',
      desc: lang === 'bn' ? 'পুষ্টিকর তরকারি বা প্রোটিনের অভাবে শুধু ফ্যান-ভাতে ক্ষুধা নিবারণ করছে শিশুরা।' : 'Street youth and impoverished children struggling for basic caloric sustenance.',
      tag: lang === 'bn' ? 'শহুরে সংকট' : 'Urban Vulnerability',
      sub: lang === 'bn' ? 'ফুটপাতে অনাহারে দিন কাটানো পথশিশু' : 'Street youth seeking survival calories',
    },
    {
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCn09gcR67oGRtBQKf0lq2zrYX6N2RyeaxXEJrLbXPUrmZSebosQ11iNcYTr04DVc1l-sEaTMtE57mafhiLdSvs8QIeXoDnL610Ku6LpRciUHP_MK41c6Bqv4TtTix7YMAIWr_n4Bb5VOBknP12sFe4KedzT6IZVx7J_x6tAZpPtYb8Nwz6Izm-MoBw6g3kEREg9WncvlPTKsA4FlL1gctUkGiJQmVzUkcmURzpSWOxI9J8rpMyYrAEojf0bv5PiWbI',
      title: lang === 'bn' ? 'তীব্র অপুষ্টিতে ভোগা সন্তানকে কোলে নিয়ে মা' : 'Mother Holding Severely Malnourished Infant',
      desc: lang === 'bn' ? 'বুকের দুধ ও পর্যাপ্ত সুষম খাদ্যের অভাবে নবজাতক ও শিশুদের খর্বকায় হওয়ার ঝুঁকি।' : 'Acute childhood developmental stunting caused by persistent nutritional deficit.',
      tag: lang === 'bn' ? 'মারাত্মক অপুষ্টি' : 'Malnutrition Deficit',
      sub: lang === 'bn' ? 'শিশুর শারীরিক খর্বতা ও পুষ্টিহীনতা' : 'Acute childhood developmental stunting',
    },
    {
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCn9IWtJ90Rx04tMPQQKlTMwb01RE6-eVDUZngtfc7i81HnkpI513GgdIOx8HbzPkDHOfxoO2qKqTRyK4zXT-F1pF9MVfdsjeHizSgBod36h8DShk59yAZPA8rEMdu2GUu9X_Gj0CKK5FvIHER_-QnXZku8afliQXDZdhsWrF8vRGZRRw24rtVYcMnHFwvj_rlQ3ck632rw2WFiYt7ogNXZ52gglLAukfyHSiax6rFhACYHDlNwaEY5-PTKu_KwcLG-',
      title: lang === 'bn' ? '“আমি ক্ষুধার্ত” প্ল্যাকার্ড হাতে দাঁড়িয়ে থাকা পথশিশু' : 'Child Holding Handwritten "I\'m Hungry" Sign',
      desc: lang === 'bn' ? 'একটি সমাজ যেখানে টন কে টন খাবার অপচয় হয়, সেখানে এই আকুতি ক্ষমার অযোগ্য।' : 'Innocent youth enduring persistent hunger across crowded city streets.',
      tag: lang === 'bn' ? 'নীরব আকুতি' : 'A Silent Plea',
      sub: lang === 'bn' ? 'এক মুঠো আহারের জন্য অবোধ শিশুর কান্না' : 'Innocent youth enduring persistent hunger',
    },
  ];

  return (
    <section id="problem" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex flex-col gap-12 pt-16">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-2">
        <span className="font-mono-code text-xs text-emerald-400 uppercase tracking-widest px-3 py-1 rounded bg-[#181d1a] border border-emerald-500/20 inline-block mb-3 font-semibold">
          {t.problem.badge}
        </span>
        <h2 className="font-display text-3xl sm:text-4xl text-white font-bold tracking-tight">
          {t.problem.title}
        </h2>
        <p className="font-body text-slate-300 mt-2 text-base">
          {t.problem.subtitle}
        </p>
      </div>

      {/* ========================================================= */}
      {/* PROBLEM 01: FOOD WASTE CRISIS (4 Full-Width Visual Cards) */}
      {/* ========================================================= */}
      <div className="bg-[#181d1a]/80 backdrop-blur-xl border border-[#3c4a42]/30 rounded-3xl p-6 md:p-8 hover:border-emerald-500/40 transition-colors shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#3c4a42]/20">
          <div className="flex items-center gap-3">
            <span className="font-mono-code text-xs text-rose-400 bg-rose-950/40 border border-rose-800/40 px-3 py-1 rounded-full uppercase font-bold">
              {t.problem.wasteCrisisBadge}
            </span>
            <span className="text-slate-500">|</span>
            <h3 className="font-display text-xl sm:text-2xl text-white font-bold">
              {t.problem.wasteCrisisTitle}
            </h3>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-[#0A0F0D]/70 border border-[#3c4a42]/30 self-start md:self-auto">
            <span className="text-xs text-slate-400">{t.problem.wasteMetricLabel}:</span>
            <span className="font-mono-code text-xs text-rose-400 font-bold">
              {t.problem.wasteMetricValue}
            </span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-8 space-y-3">
              <p className="font-body text-base sm:text-lg text-white font-medium leading-relaxed">
                {t.problem.wasteCrisisP1}
              </p>
              <p className="font-body text-sm text-slate-300 leading-relaxed">
                {t.problem.wasteCrisisP2}
              </p>
            </div>
            <div className="md:col-span-4 grid grid-cols-2 md:grid-cols-1 gap-3">
              <div className="p-3.5 rounded-xl bg-[#0A0F0D]/80 border border-[#3c4a42]/30">
                <span className="font-mono-code text-sm text-emerald-400 font-bold block mb-1">
                  {t.problem.wasteStat1Val}
                </span>
                <span className="text-xs text-slate-400 leading-tight block">
                  {t.problem.wasteStat1Label}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#0A0F0D]/80 border border-[#3c4a42]/30">
                <span className="font-mono-code text-sm text-teal-300 font-bold block mb-1">
                  {t.problem.wasteStat2Val}
                </span>
                <span className="text-xs text-slate-400 leading-tight block">
                  {t.problem.wasteStat2Label}
                </span>
              </div>
            </div>
          </div>

          {/* 4 Photos Grid - 100% Uncropped with Lightbox */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {wasteImages.map((img, i) => (
              <div
                key={i}
                className="relative rounded-2xl overflow-hidden border border-[#3c4a42]/30 group bg-[#0A0F0D] flex flex-col justify-between"
              >
                <div
                  onClick={() =>
                    onOpenPhotoLightbox?.(
                      img.url,
                      img.title,
                      img.desc,
                      lang === 'bn' ? 'বাংলাদেশ মেট্রো' : 'Bangladesh Metros'
                    )
                  }
                  className="w-full h-64 sm:h-72 flex items-center justify-center p-2.5 bg-[#0A0F0D] cursor-pointer relative group/pbox"
                >
                  <img
                    src={img.url}
                    alt={img.title}
                    className="max-h-full max-w-full w-auto h-auto object-contain filter brightness-[0.98] contrast-[1.04] group-hover/pbox:scale-105 transition-transform duration-300 rounded-xl"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-[#0A0F0D]/90 text-emerald-300 opacity-0 group-hover/pbox:opacity-100 transition-opacity border border-emerald-500/30 shadow-md">
                    <ZoomIn className="w-3.5 h-3.5" />
                  </div>
                  <span className="absolute bottom-2 right-2 text-[9px] font-mono-code text-emerald-400 bg-[#0A0F0D]/90 px-1.5 py-0.5 rounded border border-emerald-500/20 opacity-0 group-hover/pbox:opacity-100 transition-opacity">
                    {lang === 'bn' ? 'সম্পূর্ণ চিত্র' : 'Full Image'}
                  </span>
                </div>

                <div className="p-3 bg-[#0A0F0D] border-t border-[#3c4a42]/30 flex items-center justify-between">
                  <span className="text-[11px] font-mono-code bg-[#181d1a] border border-[#3c4a42]/40 px-2 py-0.5 rounded text-white font-semibold">
                    {img.tag}
                  </span>
                  <span className="text-[10px] font-mono-code text-rose-400 bg-rose-950/40 border border-rose-800/40 px-1.5 py-0.5 rounded">
                    {img.badge}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* EMPIRICAL FIELD RESEARCH & FOOD WASTE STATISTICS BASE     */}
      {/* ========================================================= */}
      <div className="bg-[#181d1a]/50 rounded-3xl p-6 md:p-8 border border-[#3c4a42]/30 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0A0F0D] border border-emerald-500/20 self-start">
            <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono-code text-xs text-emerald-400 uppercase font-semibold">
              {t.problem.evidenceBadge}
            </span>
          </div>
          <span className="font-mono-code text-xs text-slate-400">
            {t.problem.evidenceSource}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Card 1: Households Lead Waste */}
          <div className="p-6 rounded-2xl bg-[#0A0F0D]/90 border border-[#3c4a42]/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-display font-semibold text-white text-base">
                  {t.problem.evidenceCard1Title}
                </h4>
                <span className="font-mono-code text-xs text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                  {t.problem.evidenceCard1Stat}
                </span>
              </div>
              <p className="font-body text-xs text-slate-300 mb-4 leading-relaxed">
                {t.problem.evidenceCard1Desc}
              </p>
              <div
                onClick={() =>
                  onOpenPhotoLightbox?.(
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuAU26zqseEFycUFYLjBAfbvxJEl7p7eeXX99B6Ze48dwEzNDn_DNfDU1uFQtB_F8kZZE8mO0ztfWsykMKLd2iW-ybLjlO1hD3Hbu1tMcmaCCbPZ6nI4YEXs993CBUtnCcRft1iC3RnjcchhwyY9W4nT6B0-VXjByyhPnmnGvS367aicfjZuiM_AircleMv4UP1flKAuaB4HW8sfI4DIWs4U5MR7z_F8etMQAx_kpVvThF96hWM3J6v3wnJlTkVoVVyx',
                    t.problem.evidenceCard1Title,
                    t.problem.evidenceCard1Desc,
                    'UNEP Food Waste Index Telemetry'
                  )
                }
                className="rounded-xl p-3 bg-[#0A0F0D] border border-[#3c4a42]/30 flex items-center justify-center cursor-pointer group"
              >
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAU26zqseEFycUFYLjBAfbvxJEl7p7eeXX99B6Ze48dwEzNDn_DNfDU1uFQtB_F8kZZE8mO0ztfWsykMKLd2iW-ybLjlO1hD3Hbu1tMcmaCCbPZ6nI4YEXs993CBUtnCcRft1iC3RnjcchhwyY9W4nT6B0-VXjByyhPnmnGvS367aicfjZuiM_AircleMv4UP1flKAuaB4HW8sfI4DIWs4U5MR7z_F8etMQAx_kpVvThF96hWM3J6v3wnJlTkVoVVyx"
                  alt="Household food waste statistical telemetry"
                  className="w-full h-auto max-h-72 object-contain rounded-lg group-hover:scale-105 transition-transform"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <span className="font-mono-code text-[10px] text-slate-400 mt-3 block text-center">
              {lang === 'bn'
                ? 'উৎস: জাতিসংঘ পরিবেশ কর্মসূচি খাদ্য অপচয় সূচক ও জাতীয় নগর সমীক্ষা'
                : 'Source: UNEP Food Waste Index Report & Urban Assessments'}
            </span>
          </div>

          {/* Card 2: Bangladesh Waste Stream Composition */}
          <div className="p-6 rounded-2xl bg-[#0A0F0D]/90 border border-[#3c4a42]/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-display font-semibold text-white text-base">
                  {t.problem.evidenceCard2Title}
                </h4>
                <span className="font-mono-code text-xs text-rose-400 bg-rose-950/60 border border-rose-800/40 px-2 py-0.5 rounded font-bold">
                  {t.problem.evidenceCard2Stat}
                </span>
              </div>
              <p className="font-body text-xs text-slate-300 mb-4 leading-relaxed">
                {t.problem.evidenceCard2Desc}
              </p>
              <div
                onClick={() =>
                  onOpenPhotoLightbox?.(
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuBf2fdXoAiaMlpYo6Z244gC6zw8vB3sO9si7x39XG1aSGJ29frw-o5s719FyL9O0Cx6FR32x1hT1N9Z4667jZ-FXHDYfwWvkdTPYIxdf2p-F8X0esFfl8RAIUJnnc5Plz52Uhz7BzjKOaIdngVdWEymi7Mv_XyrEUydNDT1WZBTwe_3WPzNEsTsjG82Mgx_n0eIcCiYeMe6eryPe0upKvuCqEs4EbYiyPJgRa-M5zsrL23o8N-ak3u8tffsMrwogVxG',
                    t.problem.evidenceCard2Title,
                    t.problem.evidenceCard2Desc,
                    'Waste Concern Bangladesh Municipal Analysis'
                  )
                }
                className="rounded-xl p-3 bg-[#0A0F0D] border border-[#3c4a42]/30 flex items-center justify-center cursor-pointer group"
              >
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBf2fdXoAiaMlpYo6Z244gC6zw8vB3sO9si7x39XG1aSGJ29frw-o5s719FyL9O0Cx6FR32x1hT1N9Z4667jZ-FXHDYfwWvkdTPYIxdf2p-F8X0esFfl8RAIUJnnc5Plz52Uhz7BzjKOaIdngVdWEymi7Mv_XyrEUydNDT1WZBTwe_3WPzNEsTsjG82Mgx_n0eIcCiYeMe6eryPe0upKvuCqEs4EbYiyPJgRa-M5zsrL23o8N-ak3u8tffsMrwogVxG"
                  alt="Bangladesh waste composition chart"
                  className="w-full h-auto max-h-72 object-contain rounded-lg group-hover:scale-105 transition-transform"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center pt-3 mt-3 border-t border-[#3c4a42]/20">
              <div className="p-2.5 rounded-xl bg-[#181d1a]">
                <span className="font-mono-code text-xs text-emerald-400 font-bold block">
                  68% {lang === 'bn' ? 'নিরাপদ' : 'Edible'}
                </span>
                <span className="text-[11px] text-slate-400">
                  {lang === 'bn' ? 'উদ্বৃত্ত খাবার' : 'Commercial Surplus'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#181d1a]">
                <span className="font-mono-code text-xs text-teal-300 font-bold block">
                  100% {lang === 'bn' ? 'ট্র্যাকড' : 'Traceable'}
                </span>
                <span className="text-[11px] text-slate-400">
                  {lang === 'bn' ? 'আশ্রয়কেন্দ্র লগবুক' : 'Shelter Delivery Log'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* PROBLEM 02: HUNGER & FOOD INSECURITY (4 Uncropped Cards) */}
      {/* ========================================================= */}
      <div className="bg-[#181d1a]/80 backdrop-blur-xl border border-[#3c4a42]/30 rounded-3xl p-6 md:p-8 hover:border-emerald-500/40 transition-colors shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#3c4a42]/20">
          <div className="flex items-center gap-3">
            <span className="font-mono-code text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-700/40 px-3 py-1 rounded-full uppercase font-bold">
              {t.problem.hungerBadge}
            </span>
            <span className="text-slate-500">|</span>
            <h3 className="font-display text-xl sm:text-2xl text-white font-bold">
              {t.problem.hungerCrisisTitle}
            </h3>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-[#0A0F0D]/70 border border-[#3c4a42]/30 self-start md:self-auto">
            <span className="text-xs text-slate-400">{t.problem.hungerMetricLabel}:</span>
            <span className="font-mono-code text-xs text-amber-400 font-bold">
              {t.problem.hungerMetricValue}
            </span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-8 space-y-3">
              <p className="font-body text-base sm:text-lg text-white font-medium leading-relaxed">
                {t.problem.hungerCrisisP1}
              </p>
              <p className="font-body text-sm text-slate-300 leading-relaxed">
                {t.problem.hungerCrisisP2}
              </p>
            </div>
            <div className="md:col-span-4">
              <div className="p-4 rounded-xl bg-[#0A0F0D]/90 border border-[#3c4a42]/30 flex flex-col justify-center h-full">
                <span className="text-xs text-slate-400 mb-1">
                  {t.problem.hungerStatSub}
                </span>
                <span className="font-mono-code text-2xl font-bold text-amber-400">
                  {t.problem.hungerStatHighlight}
                </span>
              </div>
            </div>
          </div>

          {/* 4 Photos Grid - 100% Uncropped with Lightbox */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {hungerImages.map((img, i) => (
              <div
                key={i}
                className="relative rounded-2xl overflow-hidden border border-[#3c4a42]/30 group bg-[#0A0F0D] flex flex-col justify-between"
              >
                <div
                  onClick={() =>
                    onOpenPhotoLightbox?.(
                      img.url,
                      img.title,
                      img.desc,
                      lang === 'bn' ? 'ঢাকা ও শহুরে জনপদ' : 'Urban Settlements'
                    )
                  }
                  className="w-full h-64 sm:h-72 flex items-center justify-center p-2.5 bg-[#0A0F0D] cursor-pointer relative group/pbox"
                >
                  <img
                    src={img.url}
                    alt={img.title}
                    className="max-h-full max-w-full w-auto h-auto object-contain filter brightness-[0.98] contrast-[1.04] group-hover/pbox:scale-105 transition-transform duration-300 rounded-xl"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-[#0A0F0D]/90 text-emerald-300 opacity-0 group-hover/pbox:opacity-100 transition-opacity border border-emerald-500/30 shadow-md">
                    <ZoomIn className="w-3.5 h-3.5" />
                  </div>
                  <span className="absolute bottom-2 right-2 text-[9px] font-mono-code text-emerald-400 bg-[#0A0F0D]/90 px-1.5 py-0.5 rounded border border-emerald-500/20 opacity-0 group-hover/pbox:opacity-100 transition-opacity">
                    {lang === 'bn' ? 'সম্পূর্ণ চিত্র' : 'Full Image'}
                  </span>
                </div>

                <div className="p-3 bg-[#0A0F0D] border-t border-[#3c4a42]/30 flex flex-col gap-1">
                  <span className="text-[11px] font-mono-code bg-[#181d1a] border border-[#3c4a42]/40 px-2 py-0.5 rounded text-white font-semibold block w-max">
                    {img.tag}
                  </span>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    {img.sub}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* THE DIGITAL BRIDGE TURNING POINT CONCEPT                  */}
      {/* Connected 3-Part Architecture with Glowing Bridge SVG     */}
      {/* ========================================================= */}
      <div className="p-6 md:p-10 rounded-3xl bg-gradient-to-b md:bg-gradient-to-r from-[#181d1a] via-[#1c211e] to-[#181d1a] border border-emerald-500/40 text-center flex flex-col items-center justify-center gap-6 shadow-[0_0_35px_rgba(16,185,129,0.18)] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.15),transparent_70%)] pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0A0F0D] border border-emerald-500/30">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 emerald-ping" />
          <span className="font-mono-code text-xs text-emerald-400 uppercase font-bold tracking-wider">
            {t.problem.bridgeTurningBadge}
          </span>
        </div>

        <div className="max-w-2xl relative z-10">
          <h3 className="font-display text-2xl sm:text-3xl text-white font-bold tracking-tight mb-2">
            {t.problem.bridgeTurningTitle}
          </h3>
          <p className="font-body text-slate-300 text-sm md:text-base leading-relaxed">
            {t.problem.bridgeTurningDesc}
          </p>
        </div>

        {/* 3-Column Visual Flow Connector */}
        <div className="w-full max-w-6xl pt-2 z-10 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Left Column: Surplus Food with 2 Real Photos */}
            <div className="md:col-span-4 p-5 rounded-2xl bg-[#0A0F0D]/95 border border-[#3c4a42]/40 flex flex-col gap-3 text-left">
              <div className="flex items-center justify-between">
                <span className="font-mono-code text-xs text-rose-400 font-bold px-2.5 py-1 rounded bg-rose-950/50 border border-rose-800/40 uppercase">
                  {t.problem.bridgeCard1Title}
                </span>
                <Trash2 className="w-4 h-4 text-rose-400" />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div
                  onClick={() =>
                    onOpenPhotoLightbox?.(
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuDC3fZnPHYzEM8HtyYfFYll0ByiY_fU5DvWn1HJnaRQap7Io-_Qw5Yz-5_dR05mJzZBwnf8pk6AQdWGx1U20stS_qPyWqstLuvECiI_jxcdFYh1WQY9opkHF6k7kH2Eg7px6zpUXAREYC3ZZ-u7SUxJlZinL6WF2J2IKE28K55AEHqwYgUA7OPmMtun-5IqLcMyIPRCdxRpSvBbVz2AIQRqkWIk5XEuQFmRSgvRALZ0Nh5s2y1dxqHFpPpNcALv82be',
                      lang === 'bn' ? 'ফেলে দেওয়া উদ্বৃত্ত খাদ্য' : 'Discarded Surplus Edibles',
                      lang === 'bn' ? 'হোটেল ও রেস্তোরাঁর অক্ষত খাদ্য বর্জ্যে নিক্ষিপ্ত।' : 'Untouched banquet meals thrown into disposal bags.',
                      'Dhaka Venues'
                    )
                  }
                  className="rounded-xl overflow-hidden border border-[#3c4a42]/30 relative group/b1 bg-[#0A0F0D] h-48 sm:h-52 flex items-center justify-center p-1.5 cursor-pointer shadow-inner"
                >
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDC3fZnPHYzEM8HtyYfFYll0ByiY_fU5DvWn1HJnaRQap7Io-_Qw5Yz-5_dR05mJzZBwnf8pk6AQdWGx1U20stS_qPyWqstLuvECiI_jxcdFYh1WQY9opkHF6k7kH2Eg7px6zpUXAREYC3ZZ-u7SUxJlZinL6WF2J2IKE28K55AEHqwYgUA7OPmMtun-5IqLcMyIPRCdxRpSvBbVz2AIQRqkWIk5XEuQFmRSgvRALZ0Nh5s2y1dxqHFpPpNcALv82be"
                    alt="Surplus plates and food waste"
                    className="max-w-full max-h-full w-auto h-auto object-contain filter brightness-[0.98] group-hover/b1:scale-105 transition-transform rounded-lg"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 right-2 p-1 rounded bg-[#0A0F0D]/85 text-emerald-300 opacity-0 group-hover/b1:opacity-100 transition-opacity border border-emerald-500/30">
                    <ZoomIn className="w-3 h-3" />
                  </div>
                  <span className="absolute bottom-1.5 left-1.5 text-[9px] font-mono-code bg-[#0A0F0D]/90 px-1.5 py-0.5 rounded text-slate-300 border border-[#3c4a42]/40">
                    {lang === 'bn' ? 'উদ্বৃত্ত খাবার' : 'Discarded Food'}
                  </span>
                </div>

                <div
                  onClick={() =>
                    onOpenPhotoLightbox?.(
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuCZSGIHFF_ZSpeygwoqfzsvUEPaHVXkL6uM9arDec2xpXl7zZIHjVurVCmqWaqqy3WzDmaEeGUwEVNA5DCm2WOVHUeo0osQehszHVxawLJrK1vJ-El9xqyNCkA9ycO0Whc818yUY8htXjQ6i2Y4BbylbB8J7WTg4IY3OsqwhzzFcaWNgiSh8ASgbP1MKam0F75OpIzEOLp8VCZ0VvDqEpcItGAFbFyp03Z0J-ZjCwG5ZlGsI3E2Xphs2rIvellIOkuT',
                      lang === 'bn' ? '১৪.১ মিলিয়ন টন বার্ষিক খাদ্য অপচয়' : '14.1M Tonnes Annual Food Surplus Dumped',
                      lang === 'bn' ? 'বাংলাদেশে প্রতি বছর বিপুল পরিমাণ খাবার অপচয় হয়।' : 'Massive food volumes lost instead of feeding the needy.',
                      'National Waste Index'
                    )
                  }
                  className="rounded-xl overflow-hidden border border-[#3c4a42]/30 relative group/b2 bg-[#0A0F0D] h-48 sm:h-52 flex items-center justify-center p-1.5 cursor-pointer shadow-inner"
                >
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCZSGIHFF_ZSpeygwoqfzsvUEPaHVXkL6uM9arDec2xpXl7zZIHjVurVCmqWaqqy3WzDmaEeGUwEVNA5DCm2WOVHUeo0osQehszHVxawLJrK1vJ-El9xqyNCkA9ycO0Whc818yUY8htXjQ6i2Y4BbylbB8J7WTg4IY3OsqwhzzFcaWNgiSh8ASgbP1MKam0F75OpIzEOLp8VCZ0VvDqEpcItGAFbFyp03Z0J-ZjCwG5ZlGsI3E2Xphs2rIvellIOkuT"
                    alt="Annual food surplus dumped"
                    className="max-w-full max-h-full w-auto h-auto object-contain filter brightness-[0.98] group-hover/b2:scale-105 transition-transform rounded-lg"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 right-2 p-1 rounded bg-[#0A0F0D]/85 text-emerald-300 opacity-0 group-hover/b2:opacity-100 transition-opacity border border-emerald-500/30">
                    <ZoomIn className="w-3 h-3" />
                  </div>
                  <span className="absolute bottom-1.5 left-1.5 text-[9px] font-mono-code bg-[#0A0F0D]/90 px-1.5 py-0.5 rounded text-slate-300 border border-[#3c4a42]/40">
                    {lang === 'bn' ? '১৪.১ মি. টন' : '14.1M Tonnes'}
                  </span>
                </div>
              </div>

              <p className="font-body text-xs text-slate-300 leading-relaxed">
                {t.problem.bridgeCard1Desc}
              </p>
            </div>

            {/* Center Column: The Digital Bridge Animated Suspension Graphic */}
            <div className="md:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl bg-[#1c211e]/90 border border-emerald-500/50 text-center relative overflow-hidden shadow-[0_0_35px_rgba(16,185,129,0.25)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.25),transparent_70%)] pointer-events-none" />

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 font-mono-code text-[11px] font-bold uppercase mb-2 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 emerald-ping" />
                <span>{lang === 'bn' ? 'ডিজিটাল উদ্ধার সেতু' : 'THE DIGITAL BRIDGE'}</span>
              </div>

              {/* Glowing Suspension Bridge Vector */}
              <svg className="w-full h-20 my-1" fill="none" preserveAspectRatio="none" viewBox="0 0 260 80">
                <defs>
                  <linearGradient id="bridgeGlow" x1="0%" x2="100%" y1="0%" y2="0%">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.7" />
                    <stop offset="50%" stopColor="#10b981" stopOpacity="1" />
                    <stop offset="100%" stopColor="#059669" stopOpacity="0.9" />
                  </linearGradient>
                  <linearGradient id="cableGlow" x1="0%" x2="100%" y1="0%" y2="0%">
                    <stop offset="0%" stopColor="rgba(16,185,129,0.2)" />
                    <stop offset="50%" stopColor="rgba(16,185,129,0.9)" />
                    <stop offset="100%" stopColor="rgba(16,185,129,0.2)" />
                  </linearGradient>
                </defs>
                <path d="M 10 70 Q 130 15 250 70" stroke="url(#bridgeGlow)" strokeDasharray="6 4" strokeWidth="3.5" />
                <path d="M 20 72 L 240 72" stroke="#3c4a42" strokeWidth="2.5" />
                <path d="M 70 72 L 70 38" stroke="url(#cableGlow)" strokeWidth="1.5" />
                <path d="M 105 72 L 105 24" stroke="url(#cableGlow)" strokeWidth="1.5" />
                <path d="M 130 72 L 130 20" stroke="url(#cableGlow)" strokeWidth="2" />
                <path d="M 155 72 L 155 24" stroke="url(#cableGlow)" strokeWidth="1.5" />
                <path d="M 190 72 L 190 38" stroke="url(#cableGlow)" strokeWidth="1.5" />
                <circle cx="130" cy="20" r="5" fill="#10b981" filter="drop-shadow(0 0 8px #10b981)" />
              </svg>

              <div className="font-display text-xl text-emerald-400 font-extrabold tracking-tight">
                {t.problem.bridgeCard2Title}
              </div>
              <p className="font-body text-[12px] text-slate-300 mt-1">
                {t.problem.bridgeCard2Desc}
              </p>

              <div className="flex items-center justify-center gap-3 mt-3 pt-3 border-t border-[#3c4a42]/30 w-full font-mono-code text-[11px] text-teal-300">
                <span className="flex items-center gap-1">
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{lang === 'bn' ? 'উদ্বৃত্ত উদ্ধার' : 'Excess Rescued'}</span>
                </span>
                <span className="text-slate-500">•</span>
                <span className="flex items-center gap-1 font-semibold text-emerald-400">
                  ⚡ {lang === 'bn' ? '২৮ মিনিট রেসপন্স' : '28m Dispatch'}
                </span>
              </div>
            </div>

            {/* Right Column: People in Need with 2 Real Photos */}
            <div className="md:col-span-4 p-5 rounded-2xl bg-[#0A0F0D]/95 border border-[#3c4a42]/40 flex flex-col gap-3 text-left">
              <div className="flex items-center justify-between">
                <span className="font-mono-code text-xs text-emerald-400 font-bold px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-500/40 uppercase">
                  {t.problem.bridgeCard3Title}
                </span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div
                  onClick={() =>
                    onOpenPhotoLightbox?.(
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuDHNhrwZKlmULg0btXPxnikTdsIHRXLZxqa3vXUOmwdgwkZVIOuVtz0bINznxzust9trr8CF1cT9XHZDfoPIl28djhafsDIFqs4X7FP2t2r_5o5RGD8es_PpFd3lx_HrzwD4QwFUpwqz5sAiRgDVwwu-ZTJfcazTXq5S_1o0vvyEdssPpXofx3NYWo5Fzbe29sD2XYEH-JynSsOV06G4ua48nJawE4p9wELSGz80c-R0bIEInIZxFQVt-tog2yPRw85',
                      lang === 'bn' ? 'শিশুদের মাঝে গরম খাবার বিতরণ' : 'Volunteers Handing Fresh Food to Children',
                      lang === 'bn' ? 'উদ্ধারকৃত নিরাপদ খাবার সরাসরি শিশুদের পাতে পৌঁছে দেওয়া হচ্ছে।' : 'Warm nutritious rescued meals handed to vulnerable youth.',
                      'Mirpur Shelter'
                    )
                  }
                  className="rounded-xl overflow-hidden border border-[#3c4a42]/30 relative group/b3 bg-[#0A0F0D] h-48 sm:h-52 flex items-center justify-center p-1.5 cursor-pointer shadow-inner"
                >
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDHNhrwZKlmULg0btXPxnikTdsIHRXLZxqa3vXUOmwdgwkZVIOuVtz0bINznxzust9trr8CF1cT9XHZDfoPIl28djhafsDIFqs4X7FP2t2r_5o5RGD8es_PpFd3lx_HrzwD4QwFUpwqz5sAiRgDVwwu-ZTJfcazTXq5S_1o0vvyEdssPpXofx3NYWo5Fzbe29sD2XYEH-JynSsOV06G4ua48nJawE4p9wELSGz80c-R0bIEInIZxFQVt-tog2yPRw85"
                    alt="Volunteers handing fresh food to children"
                    className="max-w-full max-h-full w-auto h-auto object-contain filter brightness-[0.98] group-hover/b3:scale-105 transition-transform rounded-lg"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 right-2 p-1 rounded bg-[#0A0F0D]/85 text-emerald-300 opacity-0 group-hover/b3:opacity-100 transition-opacity border border-emerald-500/30">
                    <ZoomIn className="w-3 h-3" />
                  </div>
                  <span className="absolute bottom-1.5 left-1.5 text-[9px] font-mono-code bg-[#0A0F0D]/90 px-1.5 py-0.5 rounded text-emerald-300 border border-emerald-500/30">
                    {lang === 'bn' ? 'আশ্রয়কেন্দ্র' : 'Youth Shelter'}
                  </span>
                </div>

                <div
                  onClick={() =>
                    onOpenPhotoLightbox?.(
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuA17k3Vxvr-U__kVumR_2441ihGVRdv8YHSStXtTFHpYXZEvYizagtCruPBts_cqZ9K4evZ8yPC1s8FN8jLoJfXuJberJnkOUzng2TBWZFa1GgMssHqSFMpALB0Qb9yxXZAlnO_JHLs9X62dqaowc8bcKoVp4gj8CWkEC0kL13dtDi_5kABalFvKmfufAvQToKmfN8VjECKDQXaoAkgA3-xygNeQID8BSL1wHhnFcxUTGBHwuwEcgf4UKzcb4aI5AtA',
                      lang === 'bn' ? 'গরম খাবারের তৃপ্তিতে হাসিমুখ শিশু' : 'Happy Child Receiving Nutritious Warm Meal',
                      lang === 'bn' ? 'ডাস্টবিন থেকে রক্ষা পাওয়া খাবারই আজ এই শিশুর মুখে হাসি ফুটিয়েছে।' : 'Saved food creating human dignity and smiles.',
                      'Korail Community Camp'
                    )
                  }
                  className="rounded-xl overflow-hidden border border-[#3c4a42]/30 relative group/b4 bg-[#0A0F0D] h-48 sm:h-52 flex items-center justify-center p-1.5 cursor-pointer shadow-inner"
                >
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuA17k3Vxvr-U__kVumR_2441ihGVRdv8YHSStXtTFHpYXZEvYizagtCruPBts_cqZ9K4evZ8yPC1s8FN8jLoJfXuJberJnkOUzng2TBWZFa1GgMssHqSFMpALB0Qb9yxXZAlnO_JHLs9X62dqaowc8bcKoVp4gj8CWkEC0kL13dtDi_5kABalFvKmfufAvQToKmfN8VjECKDQXaoAkgA3-xygNeQID8BSL1wHhnFcxUTGBHwuwEcgf4UKzcb4aI5AtA"
                    alt="Happy child receiving nutritious warm meal"
                    className="max-w-full max-h-full w-auto h-auto object-contain filter brightness-[0.98] group-hover/b4:scale-105 transition-transform rounded-lg"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 right-2 p-1 rounded bg-[#0A0F0D]/85 text-emerald-300 opacity-0 group-hover/b4:opacity-100 transition-opacity border border-emerald-500/30">
                    <ZoomIn className="w-3 h-3" />
                  </div>
                  <span className="absolute bottom-1.5 left-1.5 text-[9px] font-mono-code bg-[#0A0F0D]/90 px-1.5 py-0.5 rounded text-emerald-300 border border-emerald-500/30">
                    {lang === 'bn' ? 'তৃপ্তির হাসি' : 'Dignified Meals'}
                  </span>
                </div>
              </div>

              <p className="font-body text-xs text-slate-300 leading-relaxed">
                {t.problem.bridgeCard3Desc}
              </p>
            </div>
          </div>

          {/* Bottom Synthesis Line */}
          <div className="p-3.5 rounded-2xl bg-[#0A0F0D]/90 border border-emerald-500/25 text-center">
            <p className="font-mono-code text-xs text-white font-semibold">
              <span className="text-rose-400 font-bold">{lang === 'bn' ? 'উদ্বৃত্ত খাবার' : 'Surplus Food'}</span>{' '}
              <span className="text-slate-500">➔</span>{' '}
              <span className="text-emerald-400 font-bold tracking-wider">{lang === 'bn' ? 'ফুড ব্রিজ' : 'FOOD BRIDGE'}</span>{' '}
              <span className="text-slate-500">➔</span>{' '}
              <span className="text-teal-300 font-bold">{lang === 'bn' ? 'ক্ষুধার্ত মানুষের মুখে' : 'People in Need'}</span>:{' '}
              <span className="text-slate-300">{lang === 'bn' ? 'অপচয় রোধে বাঁচুক প্রাণ' : 'Turning Waste into Hope'}</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
