import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Language } from '../types';

interface FaqSectionProps {
  lang: Language;
}

export const FaqSection: React.FC<FaqSectionProps> = ({ lang }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: lang === 'bn'
        ? 'খাবার কতটা স্বাস্থ্যসম্মত ও নিরাপদ? আপনারা কীভাবে তা যাচাই করেন?'
        : 'How do you guarantee food safety and hygiene?',
      a: lang === 'bn'
        ? 'আমরা ৪-স্তরের কঠোর ফুড সেফটি প্রটোকল অনুসরণ করি: রান্নার সময়সীমা যাচাই (৪ ঘণ্টার মধ্যে), তাপমাত্রা নিয়ন্ত্রণ (>৬০°C থার্মাল ব্যাগ), এবং ঘ্রাণ ও গুণগত মান পর্যবেক্ষণ। কোনো বাসি বা ঝুঁকিপূর্ণ খাবার গ্রহণ করা হয় না।'
        : 'We enforce a strict 4-pillar safety protocol: verifying the preparation window (<4 hours), using insulated thermal containers (>60°C hot chain), and performing trained sensory tests. Stale or compromised food is never collected.',
    },
    {
      q: lang === 'bn'
        ? 'বাসা-বাড়ি বা পারিবারিক আয়োজন থেকে কি অল্প পরিমাণ খাবার দান করা সম্ভব?'
        : 'Can households or private dinners donate smaller portions?',
      a: lang === 'bn'
        ? 'হ্যাঁ, অবশ্যই। আপনার বাসায় অতিরিক্ত ৫-১০ জনের ভালো খাবার অবশিষ্ট থাকলেও আমাদের কাছে নোটিফিকেশন পাঠাতে পারেন। আমাদের স্থানীয় সাইকেল ভলান্টিয়াররা তা নিকটস্থ দুস্থ মানুষের কাছে পৌঁছে দেবে।'
        : 'Yes, absolutely. Even if you have fresh surplus for 5-10 people from a family gathering, you can list it. Our hyper-local bicycle couriers will collect and deliver it to nearby unhoused citizens.',
    },
    {
      q: lang === 'bn'
        ? 'খাবার পিকআপ করতে কত সময় লাগে এবং এর জন্য কি কোনো ফি দিতে হয়?'
        : 'How fast is the rescue dispatch, and are there any charges?',
      a: lang === 'bn'
        ? 'পিকআপের গড় সময় ১৮ থেকে ২৮ মিনিট। খাদ্য দাতা কিংবা গ্রহণকারী কোনো পক্ষকেই কোনো ফি দিতে হয় না। এটি সম্পূর্ণ বিনামূল্যে একটি মানবিক সেবা।'
        : 'Average volunteer dispatch arrival is 18 to 28 minutes. Food Bridge is completely 100% free for both donors and recipient shelters. It is a purely humanitarian service.',
    },
    {
      q: lang === 'bn'
        ? 'এতিমখানা বা আশ্রয়কেন্দ্র হিসেবে কীভাবে নিয়মিত খাবার পেতে পারি?'
        : 'How can an orphanage, shelter, or community enroll to receive food?',
      a: lang === 'bn'
        ? 'আমাদের "খাবার সহায়তা চেয়ে আবেদন" বা "Get Food Support" ফর্মে আপনার প্রতিষ্ঠানের ঠিকানা ও প্রতিদিনের চাহিদার তথ্য দিয়ে আবেদন করুন। ভেরিফিকেশনের পর আপনার এলাকাভুক্ত উদ্বৃত্ত খাবার নিয়মিত সরবরাহ করা হবে।'
        : 'Simply click "Request Food Support" and enter your facility details, headcount, and address. Once quickly verified, incoming surplus batches in your neighborhood will be routed to your kitchen.',
    },
    {
      q: lang === 'bn'
        ? 'স্বেচ্ছাসেবক (Volunteer) হিসেবে যুক্ত হতে কী যোগ্যতা বা বাহন প্রয়োজন?'
        : 'What is required to join as a volunteer courier?',
      a: lang === 'bn'
        ? 'শুধুমাত্র একটি সাইকেল, মোটরবাইক অথবা পায়ে হাঁটার সদিচ্ছাই যথেষ্ট! সপ্তাহে মাত্র ১-২ ঘণ্টা সময় দিয়েও আপনি আপনার এলাকার ক্ষুধার্ত মানুষের জন্য খাবার পৌঁছে দিতে পারেন।'
        : 'A bicycle, scooter, car, or even willingness to do hyper-local walking deliveries is all you need! Contributing just 1-2 hours a week can save dozens of meals in your community.',
    },
    {
      q: lang === 'bn'
        ? 'ফুড ব্রিজের কার্যক্রম কোন কোন শহরে চলছে?'
        : 'Which cities currently have active Food Bridge rescue grids?',
      a: lang === 'bn'
        ? 'বর্তমানে ঢাকা মহানগরের প্রধান জোনসমূহ (উত্তরা, গুলশান, বনানী, ধানমন্ডি, মিরপুর, মতিঝিল) ছাড়াও চট্টগ্রাম বাণিজ্যিক এলাকা এবং সিলেটে আমাদের নেটওয়ার্ক সক্রিয় রয়েছে।'
        : 'Currently, our active dispatch networks operate across major Dhaka zones (Uttara, Gulshan, Banani, Dhanmondi, Mirpur, Motijheel), Chittagong Commercial Hubs, and Sylhet.',
    },
  ];

  return (
    <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full pt-16">
      <div className="text-center mb-10">
        <span className="font-mono-code text-xs text-emerald-400 uppercase tracking-widest px-3 py-1 rounded bg-[#181d1a] border border-emerald-500/20 inline-flex items-center gap-1.5 mb-3 font-semibold">
          <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>{lang === 'bn' ? 'সাধারণ জিজ্ঞাসাসমূহ' : 'FREQUENTLY ASKED QUESTIONS'}</span>
        </span>
        <h3 className="font-display text-2xl sm:text-3xl text-white font-bold tracking-tight">
          {lang === 'bn' ? 'খাদ্য উদ্ধার সম্পর্কিত সাধারণ প্রশ্নের উত্তর' : 'Frequently Asked Questions'}
        </h3>
        <p className="font-body text-slate-300 text-sm mt-1">
          {lang === 'bn'
            ? 'খাদ্য নিরাপত্তা, ডেলিভারি পদ্ধতি ও অংশীদারিত্ব সম্পর্কে আপনার যা জানা প্রয়োজন।'
            : 'Everything you need to know about food safety, logistics, and getting involved.'}
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="rounded-2xl bg-[#181d1a]/70 border border-[#3c4a42]/30 overflow-hidden transition-colors"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:text-emerald-400 transition-colors"
              >
                <span className="font-display font-semibold text-white text-base">
                  {faq.q}
                </span>
                <div className="w-7 h-7 rounded-lg bg-[#0A0F0D] flex items-center justify-center text-emerald-400 shrink-0">
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-slate-300 font-body text-sm leading-relaxed border-t border-[#3c4a42]/20">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
