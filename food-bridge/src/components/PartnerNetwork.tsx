import React, { useState } from 'react';
import { Building2, Award, Heart, Search, CheckCircle2 } from 'lucide-react';
import { Language } from '../types';
import { toBnDigits } from '../translations';

interface PartnerNetworkProps {
  lang: Language;
}

interface Partner {
  id: string;
  name: string;
  category: string;
  location: string;
  mealsDonated: number;
  badge: string;
}

export const PartnerNetwork: React.FC<PartnerNetworkProps> = ({ lang }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const partners: Partner[] = [
    {
      id: 'P-01',
      name: lang === 'bn' ? "সুলতান্স ডাইন (ধানমন্ডি ও গুলশান)" : "Sultan's Dine (Dhanmondi & Gulshan)",
      category: 'restaurant',
      location: lang === 'bn' ? 'ঢাকা' : 'Dhaka',
      mealsDonated: 14500,
      badge: lang === 'bn' ? 'গোল্ড পার্টনার' : 'Gold Partner',
    },
    {
      id: 'P-02',
      name: lang === 'bn' ? 'দ্য ওয়েস্টিন ঢাকা ব্যানকুইটস' : 'The Westin Dhaka Banquets',
      category: 'hotel',
      location: lang === 'bn' ? 'গুলশান ২, ঢাকা' : 'Gulshan 2, Dhaka',
      mealsDonated: 18200,
      badge: lang === 'bn' ? 'প্ল্যাটিনাম পার্টনার' : 'Platinum Partner',
    },
    {
      id: 'P-03',
      name: lang === 'bn' ? 'কাচ্চি ভাই ক্যাটারিং সার্ভিস' : 'Kacchi Bhai Catering Services',
      category: 'catering',
      location: lang === 'bn' ? 'মিরপুর ও উত্তরা' : 'Mirpur & Uttara',
      mealsDonated: 11400,
      badge: lang === 'bn' ? 'গোল্ড পার্টনার' : 'Gold Partner',
    },
    {
      id: 'P-04',
      name: lang === 'bn' ? 'র‍্যাডিসন ব্লু চিটাগং কনভেনশন' : 'Radisson Blu Chittagong Bay View',
      category: 'hotel',
      location: lang === 'bn' ? 'চট্টগ্রাম' : 'Chittagong',
      mealsDonated: 9800,
      badge: lang === 'bn' ? 'রেসকিউ হিরো' : 'Rescue Hero',
    },
    {
      id: 'P-05',
      name: lang === 'bn' ? 'উত্তরা ক্লাব ক্যাফেটেরিয়া' : 'Uttara Club Cafeteria',
      category: 'club',
      location: lang === 'bn' ? 'সেক্টর ৪, উত্তরা' : 'Sector 4, Uttara',
      mealsDonated: 7600,
      badge: lang === 'bn' ? 'সিলভার পার্টনার' : 'Silver Partner',
    },
    {
      id: 'P-06',
      name: lang === 'bn' ? 'ঢাকা রিজেন্সি হোটেল অ্যান্ড রিসোর্ট' : 'Dhaka Regency Hotel & Resort',
      category: 'hotel',
      location: lang === 'bn' ? 'নিকুঞ্জ, ঢাকা' : 'Nikunja, Dhaka',
      mealsDonated: 12900,
      badge: lang === 'bn' ? 'গোল্ড পার্টনার' : 'Gold Partner',
    },
  ];

  const filtered = partners.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = activeCategory === 'all' || p.category === activeCategory;
    return matchSearch && matchCat;
  });

  const formatNum = (n: number) => (lang === 'bn' ? toBnDigits(n.toLocaleString()) : n.toLocaleString());

  return (
    <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full pt-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <span className="font-mono-code text-xs text-emerald-400 uppercase tracking-widest px-3 py-1 rounded bg-[#181d1a] border border-emerald-500/30 inline-flex items-center gap-1.5 mb-3 font-semibold">
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'bn' ? 'দাতা ও সহযোগী নেটওয়ার্ক' : 'PARTNER KITCHENS & DONORS'}</span>
          </span>
          <h3 className="font-display text-2xl sm:text-3xl text-white font-bold tracking-tight">
            {lang === 'bn'
              ? 'আমাদের সাথে যুক্ত সম্মানিত খাদ্য পার্টনারগণ'
              : 'Verified Partner Kitchens & Hall of Fame'}
          </h3>
          <p className="font-body text-slate-300 text-sm mt-1">
            {lang === 'bn'
              ? 'যাঁদের উদ্বৃত্ত খাবার অপচয় না হয়ে হাজারো দুস্থ মানুষের মুখে আহার হয়ে ফুটেছে।'
              : 'Leading hotels, restaurants, and caterers committed to zero-landfill surplus diversion.'}
          </p>
        </div>

        {/* Search input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={lang === 'bn' ? 'পার্টনার বা এলাকা খুঁজুন...' : 'Search partner or area...'}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#181d1a] border border-[#3c4a42]/40 text-white placeholder-slate-400 text-xs focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Grid of Partners */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((partner) => (
          <div
            key={partner.id}
            className="bg-[#181d1a]/70 backdrop-blur-xl border border-[#3c4a42]/30 rounded-2xl p-5 hover:border-emerald-500/40 transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono-code text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-semibold">
                  {partner.badge}
                </span>
                <span className="text-xs text-slate-400">{partner.location}</span>
              </div>

              <h4 className="font-display font-semibold text-white text-base mb-1">
                {partner.name}
              </h4>
            </div>

            <div className="mt-4 pt-3 border-t border-[#3c4a42]/20 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {lang === 'bn' ? 'মোট দানকৃত খাবার:' : 'Total Meals Donated:'}
              </span>
              <span className="font-mono-code text-sm font-bold text-emerald-400 tabular-nums">
                {formatNum(partner.mealsDonated)}+
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
