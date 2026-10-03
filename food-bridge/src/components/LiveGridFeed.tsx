import React, { useState } from 'react';
import { Activity, MapPin, CheckCircle2, Clock, Truck } from 'lucide-react';
import { Language, LiveRescueItem } from '../types';
import { translations } from '../translations';

interface LiveGridFeedProps {
  lang: Language;
}

export const LiveGridFeed: React.FC<LiveGridFeedProps> = ({ lang }) => {
  const [filterRegion, setFilterRegion] = useState<string>('all');
  const t = translations[lang];

  const items: LiveRescueItem[] = [
    {
      id: 'FB-9842',
      donorLocation: lang === 'bn' ? 'উত্তরা সেক্টর ১১ কনভেনশন হল' : 'Uttara Sector 11 Convention Hall',
      shelterDestination: lang === 'bn' ? 'মিরপুর পথশিশু আশ্রয়কেন্দ্র' : 'Mirpur Street Children Shelter',
      foodDescription: lang === 'bn' ? '৫০ প্যাকেট গরুর কাচ্চি বিরিয়ানি ও ফিরনি' : '50 Hot Beef Kacchi Biryani Packs & Dessert',
      quantity: lang === 'bn' ? '২৫ কেজি (~৭০ জন)' : '25 kg (~70 servings)',
      timeAgo: lang === 'bn' ? '৮ মিনিট আগে' : '8 mins ago',
      status: 'delivered',
      district: 'dhakaNorth',
    },
    {
      id: 'FB-9843',
      donorLocation: lang === 'bn' ? 'গুলশান ২ ব্যানকুইট ক্যাফে' : 'Gulshan 2 Banquet Cafe',
      shelterDestination: lang === 'bn' ? 'কড়াইল বস্তি জরুরি খাবার ক্যাম্প' : 'Korail Community Feeding Point',
      foodDescription: lang === 'bn' ? '৮০ প্যাকেট মোরগ পোলাও ও সালাদ' : '80 Chicken Polao & Fresh Salad Boxes',
      quantity: lang === 'bn' ? '৩৮ কেজি (~১১০ জন)' : '38 kg (~110 servings)',
      timeAgo: lang === 'bn' ? '১৯ মিনিট আগে' : '19 mins ago',
      status: 'in_transit',
      district: 'dhakaNorth',
    },
    {
      id: 'FB-9844',
      donorLocation: lang === 'bn' ? 'ধানমন্ডি ২৭ ক্যাটারিং হাব' : 'Dhanmondi 27 Catering Hub',
      shelterDestination: lang === 'bn' ? 'কামরাঙ্গীরচর শিশু পুষ্টি কেন্দ্র' : 'Kamrangirchar Youth Nutrition Care',
      foodDescription: lang === 'bn' ? 'তাজা বেকারি পাউরুটি, পেস্ট্রি ও দুধের ডেজার্ট' : 'Fresh Bakery Loaves, Pastries & Dairy Sweets',
      quantity: lang === 'bn' ? '২০ কেজি (~৫০ জন)' : '20 kg (~50 servings)',
      timeAgo: lang === 'bn' ? '৩২ মিনিট আগে' : '32 mins ago',
      status: 'delivered',
      district: 'dhakaSouth',
    },
    {
      id: 'FB-9845',
      donorLocation: lang === 'bn' ? 'মতিঝিল করপোরেট ক্যাফেটেরিয়া' : 'Motijheel Corporate Cafeteria',
      shelterDestination: lang === 'bn' ? 'কমলাপুর রেলওয়ে দুস্থ আশ্রয়স্থল' : 'Kamlapur Railway Destitute Shelter',
      foodDescription: lang === 'bn' ? 'ডাল, ভাত, সবজি ও ডিমের ভুনা' : 'Steamed Rice, Lentils, Veggie Curry & Eggs',
      quantity: lang === 'bn' ? '৩০ কেজি (~৮০ জন)' : '30 kg (~80 servings)',
      timeAgo: lang === 'bn' ? '৪৫ মিনিট আগে' : '45 mins ago',
      status: 'delivered',
      district: 'dhakaSouth',
    },
    {
      id: 'FB-9846',
      donorLocation: lang === 'bn' ? 'আগ্রাবাদ হোটেল রেস্তোরাঁ (চট্টগ্রাম)' : 'Agrabad Hotel Restaurant (Chittagong)',
      shelterDestination: lang === 'bn' ? 'পতেঙ্গা উপকূলীয় জেলে পল্লি আশ্রয়' : 'Patenga Coastal Shelter Ward',
      foodDescription: lang === 'bn' ? '৬০ প্যাকেট মেজবানি মাংস ও ভাত' : '60 Packs Traditional Mezbani Beef & Rice',
      quantity: lang === 'bn' ? '৩২ কেজি (~৯০ জন)' : '32 kg (~90 servings)',
      timeAgo: lang === 'bn' ? '১ ঘণ্টা আগে' : '1 hour ago',
      status: 'delivered',
      district: 'chittagong',
    },
    {
      id: 'FB-9847',
      donorLocation: lang === 'bn' ? 'জিন্দাবাজার ইভেন্ট স্পেস (সিলেট)' : 'Zindabazar Event Space (Sylhet)',
      shelterDestination: lang === 'bn' ? 'আম্বরখানা এতিমখানা ও মাদরাসা' : 'Amberkhana Orphanage Trust',
      foodDescription: lang === 'bn' ? 'শাহি বিরিয়ানি ও জর্দা মিষ্টি' : 'Special Biryani & Sweet Saffron Rice',
      quantity: lang === 'bn' ? '২২ কেজি (~৬০ জন)' : '22 kg (~60 servings)',
      timeAgo: lang === 'bn' ? '১ ঘণ্টা আগে' : '1 hour ago',
      status: 'matched',
      district: 'sylhet',
    },
  ];

  const filteredItems = filterRegion === 'all'
    ? items
    : items.filter((item) => item.district === filterRegion);

  const getStatusBadge = (status: LiveRescueItem['status']) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono-code text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-semibold">
            <CheckCircle2 className="w-3 h-3" />
            <span>{t.liveGrid.statusDelivered}</span>
          </span>
        );
      case 'in_transit':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono-code text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 px-2.5 py-0.5 rounded-full font-semibold">
            <Truck className="w-3 h-3 animate-pulse" />
            <span>{t.liveGrid.statusInTransit}</span>
          </span>
        );
      case 'matched':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono-code text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2.5 py-0.5 rounded-full font-semibold">
            <Clock className="w-3 h-3" />
            <span>{t.liveGrid.statusMatched}</span>
          </span>
        );
    }
  };

  return (
    <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full pt-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <span className="font-mono-code text-xs text-emerald-400 uppercase tracking-widest px-3 py-1 rounded bg-[#181d1a] border border-emerald-500/30 inline-flex items-center gap-1.5 mb-3">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.liveGrid.badge}</span>
          </span>
          <h3 className="font-display text-2xl sm:text-3xl text-white font-bold tracking-tight">
            {t.liveGrid.title}
          </h3>
          <p className="font-body text-slate-300 text-sm mt-1">
            {t.liveGrid.subtitle}
          </p>
        </div>

        {/* Region Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#181d1a] rounded-xl border border-[#3c4a42]/40">
          {[
            { id: 'all', label: t.liveGrid.allCities },
            { id: 'dhakaNorth', label: t.liveGrid.dhakaNorth },
            { id: 'dhakaSouth', label: t.liveGrid.dhakaSouth },
            { id: 'chittagong', label: t.liveGrid.chittagong },
            { id: 'sylhet', label: t.liveGrid.sylhet },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setFilterRegion(btn.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                filterRegion === btn.id
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Live Rescues */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-[#181d1a]/70 backdrop-blur-md rounded-2xl p-5 border border-[#3c4a42]/30 hover:border-emerald-500/40 transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono-code text-[11px] text-slate-400">
                  {item.id}
                </span>
                {getStatusBadge(item.status)}
              </div>

              <h4 className="font-display font-semibold text-white text-base mb-2">
                {item.foodDescription}
              </h4>

              <div className="space-y-1.5 text-xs text-slate-300 mb-4">
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-slate-400">
                    {lang === 'bn' ? 'উৎস: ' : 'From: '}
                    <strong className="text-slate-200">{item.donorLocation}</strong>
                  </span>
                </div>
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                  <span className="text-slate-400">
                    {lang === 'bn' ? 'গন্তব্য: ' : 'To: '}
                    <strong className="text-slate-200">{item.shelterDestination}</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#3c4a42]/20 flex items-center justify-between text-xs font-mono-code">
              <span className="text-emerald-400 font-semibold">{item.quantity}</span>
              <span className="text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {item.timeAgo}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
