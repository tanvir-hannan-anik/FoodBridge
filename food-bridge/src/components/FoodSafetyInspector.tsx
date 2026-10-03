import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, Thermometer, Clock, Sparkles, AlertCircle, FileCheck } from 'lucide-react';
import { Language } from '../types';

interface FoodSafetyInspectorProps {
  lang: Language;
}

export const FoodSafetyInspector: React.FC<FoodSafetyInspectorProps> = ({ lang }) => {
  const [activeStep, setActiveStep] = useState<number>(0);

  const protocols = [
    {
      id: 0,
      title: lang === 'bn' ? '১. ঘ্রাণ ও গুণগত মান পরীক্ষা' : '01. Sensory & Aroma Inspection',
      shortTitle: lang === 'bn' ? 'ঘ্রাণ ও সতেজতা' : 'Sensory Check',
      standard: lang === 'bn' ? 'মানদণ্ড: ১০০% অক্ষত স্বাদ ও ঘ্রাণ' : 'Standard: 100% fresh aroma & texture',
      desc: lang === 'bn'
        ? 'আমাদের প্রশিক্ষিত ভলান্টিয়ার টিম খাবার সংগ্রহের সময় খাদ্য বিশেষজ্ঞরা নির্দেশিত পদ্ধতি অনুযায়ী রঙ, ঘ্রাণ এবং তরকারির তেল-ঝোল অক্ষত রয়েছে কি না পরীক্ষা করেন।'
        : 'Volunteers perform trained sensory evaluations checking color, texture, and aroma against food safety guidelines before accepting any batch.',
      icon: <Sparkles className="w-5 h-5 text-emerald-400" />,
      checklist: [
        lang === 'bn' ? 'কোনো অপ্রীতিকর গন্ধ নেই' : 'No sour or off-notes in aroma',
        lang === 'bn' ? 'ঝোল বা গ্রেভিতে ফেনা সৃষ্টি হয়নি' : 'No fermentation or frothiness in gravies',
        lang === 'bn' ? 'ভাত ও রুটি সম্পূর্ণ নরম ও সতেজ' : 'Grains and bread intact and fresh',
      ],
    },
    {
      id: 1,
      title: lang === 'bn' ? '২. তাপমাত্রা নিয়ন্ত্রণ প্রটোকল' : '02. Thermal Chain Control',
      shortTitle: lang === 'bn' ? 'তাপমাত্রা' : 'Thermal Chain',
      standard: lang === 'bn' ? 'মানদণ্ড: >৬০°C (গরম) অথবা <৫°C (ঠান্ডা)' : 'Standard: >60°C (Hot) or <5°C (Chilled)',
      desc: lang === 'bn'
        ? 'ব্যাকটেরিয়া বিস্তার রোধে রান্না করা খাবার তাপমাত্রা নিয়ন্ত্রিত ইনসুলেটেড থার্মাল ব্যাগে রাখা হয়, যা খাবারকে সম্পূর্ণ গরম রাখে।'
        : 'To eliminate bacterial danger zones, cooked food is carried in insulated thermal bags that maintain safe temperatures above 60°C throughout transit.',
      icon: <Thermometer className="w-5 h-5 text-amber-400" />,
      checklist: [
        lang === 'bn' ? 'থার্মাল ব্যাগে সিল্ড সংরক্ষণ' : 'Sealed in thermal grade carriers',
        lang === 'bn' ? 'ব্যাকটেরিয়া বিস্তার মুক্ত পরিবেশ' : 'Zero bacterial proliferation window',
        lang === 'bn' ? 'পিকআপ থেকে বিতরণ পর্যন্ত তাপমাত্রা নজরদারি' : 'Monitored temperature log from donor to plate',
      ],
    },
    {
      id: 2,
      title: lang === 'bn' ? '৩. সময়সীমা যাচাই (৪ ঘণ্টার মধ্যে)' : '03. Strict 4-Hour Cook Window',
      shortTitle: lang === 'bn' ? 'সময়সীমা' : 'Time Window',
      standard: lang === 'bn' ? 'মানদণ্ড: রান্নার ৪ ঘণ্টার মধ্যে বিতরণ সম্পন্ন' : 'Standard: Rescued & served within 4 hours',
      desc: lang === 'bn'
        ? 'শুধুমাত্র সদ্য প্রস্তুত করা খাবারই ফুড ব্রিজের মাধ্যমে উদ্ধার করা হয়। রান্নার পর দীর্ঘ সময় পেরিয়ে যাওয়া কোনো ঝুঁকিপূর্ণ খাবার সংগ্রহ করা হয় না।'
        : 'Only freshly cooked surplus within a 4-hour window from preparation is permitted for emergency redistribution to vulnerable communities.',
      icon: <Clock className="w-5 h-5 text-teal-300" />,
      checklist: [
        lang === 'bn' ? 'রান্নার সঠিক সময় রেজিস্ট্রেশন বাধ্যতামূলক' : 'Mandatory cooked-time recording at intake',
        lang === 'bn' ? 'সর্বোচ্চ ২৮ মিনিটের মধ্যে পিকআপ নিশ্চিত' : 'Average pickup under 28 minutes',
        lang === 'bn' ? 'মেয়াদোত্তীর্ণ বা বাসি খাবার সম্পূর্ণ নিষিদ্ধ' : 'Stale or overnight cooked meals strictly rejected',
      ],
    },
    {
      id: 3,
      title: lang === 'bn' ? '৪. খাদ্যমান সিল্ড ও পরিচ্ছন্ন প্যাকিং' : '04. Food-Grade Sealed Packaging',
      shortTitle: lang === 'bn' ? 'সিল্ড প্যাকিং' : 'Sealed Packaging',
      standard: lang === 'bn' ? 'মানদণ্ড: বায়ুরোধী ফুড-গ্রেড কন্টেইনার' : 'Standard: Airtight food-grade foodware',
      desc: lang === 'bn'
        ? 'প্রতিটি উদ্ধারকৃত খাবারের অংশ বায়ুরোধী ও পরিচ্ছন্ন ফুড-গ্রেড বক্সে প্যাক করা হয় যাতে পরিবহনকালে ধূলিকণা বা বাইরের দূষণ স্পর্শ না করে।'
        : 'All dishes are packed into airtight, food-grade biodegradable containers and hygiene-sealed to safeguard against dust and external contaminants.',
      icon: <FileCheck className="w-5 h-5 text-emerald-400" />,
      checklist: [
        lang === 'bn' ? 'ধূলিবালি ও জীবাণুরোধক সিল' : 'Dustproof and contaminant-resistant seals',
        lang === 'bn' ? 'ভলান্টিয়ারদের গ্লাভস ও মাস্ক ব্যবহার' : 'Mandatory sanitized gloves and masks for couriers',
        lang === 'bn' ? 'আশ্রয়কেন্দ্রে পরিষ্কার খাবার গ্রহণের নিশ্চয়তা' : 'Guaranteed hygienic arrival at beneficiary centers',
      ],
    },
  ];

  const current = protocols[activeStep];

  return (
    <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full pt-16">
      <div className="rounded-3xl bg-[#181d1a]/80 border border-emerald-500/30 p-6 md:p-10 relative overflow-hidden">
        <div className="max-w-2xl mb-8">
          <span className="font-mono-code text-xs text-emerald-400 uppercase tracking-widest px-3 py-1 rounded bg-[#0A0F0D] border border-emerald-500/30 inline-flex items-center gap-1.5 mb-3 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'bn' ? 'খাদ্য নিরাপত্তা প্রটোকল' : 'FOOD SAFETY PROTOCOL'}</span>
          </span>
          <h3 className="font-display text-2xl sm:text-3xl text-white font-bold tracking-tight">
            {lang === 'bn'
              ? 'নিরাপদ ও স্বাস্থ্যসম্মত খাদ্য সুরক্ষার ৪টি স্তম্ভ'
              : 'Our 4-Pillar Food Hygiene & Safety Guarantee'}
          </h3>
          <p className="font-body text-slate-300 text-sm mt-1">
            {lang === 'bn'
              ? 'উদ্বৃত্ত খাবার যেন কারো স্বাস্থ্যের জন্য হুমকি না হয়ে পুষ্টি জোগায়, তার জন্য আমাদের কঠোর চেকলিস্ট।'
              : 'Rigorous food hygiene controls ensuring every rescued plate is nourishing, dignified, and certified safe.'}
          </p>
        </div>

        {/* Interactive Step Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
          {protocols.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => setActiveStep(idx)}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                activeStep === idx
                  ? 'bg-emerald-500/10 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                  : 'bg-[#0A0F0D] border-[#3c4a42]/30 hover:border-emerald-500/30 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono-code text-[11px] text-emerald-400 font-bold">
                  {`0${idx + 1}`}
                </span>
                {p.icon}
              </div>
              <span
                className={`text-xs sm:text-sm font-semibold block ${
                  activeStep === idx ? 'text-white' : 'text-slate-300'
                }`}
              >
                {p.shortTitle}
              </span>
            </button>
          ))}
        </div>

        {/* Active Protocol Content Box */}
        <div className="bg-[#0A0F0D] rounded-2xl p-6 border border-[#3c4a42]/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-[#3c4a42]/30">
            <div>
              <span className="font-mono-code text-xs text-emerald-400 font-semibold block mb-1">
                {current.standard}
              </span>
              <h4 className="font-display text-xl text-white font-bold">
                {current.title}
              </h4>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono-code text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>{lang === 'bn' ? 'বাধ্যতামূলক স্ট্যান্ডার্ড' : 'Mandatory Standard'}</span>
            </div>
          </div>

          <p className="font-body text-slate-300 text-sm leading-relaxed mb-6">
            {current.desc}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {current.checklist.map((item, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-[#181d1a] border border-[#3c4a42]/30 flex items-start gap-2.5 text-xs text-slate-200"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
