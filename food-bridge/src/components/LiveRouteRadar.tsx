import React, { useState } from 'react';
import { Navigation, Bike, MapPin, Thermometer, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Language } from '../types';
import { toBnDigits } from '../translations';

interface LiveRouteRadarProps {
  lang: Language;
}

interface RescueRoute {
  id: string;
  source: string;
  destination: string;
  foodSummary: string;
  quantityKg: number;
  courier: string;
  vehicle: 'bicycle' | 'motorbike' | 'van';
  distanceKm: number;
  progressPercent: number;
  tempCelsius: number;
  timeRemainingMins: number;
  status: 'en_route' | 'delivered';
}

export const LiveRouteRadar: React.FC<LiveRouteRadarProps> = ({ lang }) => {
  const routes: RescueRoute[] = [
    {
      id: 'ROUTE-DH-01',
      source: lang === 'bn' ? 'গুলশান ২ কনভেনশন সেন্টার' : 'Gulshan 2 Convention Center',
      destination: lang === 'bn' ? 'কড়াইল কমিউনিটি খাদ্য বিতরণ কেন্দ্র' : 'Korail Community Food Hub',
      foodSummary: lang === 'bn' ? '৮০ প্যাকেট গরম বিরিয়ানি ও ফিরনি' : '80 Hot Biryani Packs & Dessert',
      quantityKg: 35,
      courier: lang === 'bn' ? 'তানভীর আহমেদ (রাইডার #১২)' : 'Tanvir Ahmed (Rider #12)',
      vehicle: 'bicycle',
      distanceKm: 2.8,
      progressPercent: 78,
      tempCelsius: 63,
      timeRemainingMins: 6,
      status: 'en_route',
    },
    {
      id: 'ROUTE-DH-02',
      source: lang === 'bn' ? 'উত্তরা সেক্টর ১১ ব্যানকুইট হল' : 'Uttara Sector 11 Banquet Hall',
      destination: lang === 'bn' ? 'মিরপুর ১০ পথশিশু শিক্ষা ও পুষ্টি ক্যাম্প' : 'Mirpur 10 Youth Feeding Center',
      foodSummary: lang === 'bn' ? '১২০ প্যাকেট ফ্রেশ পোলাও ও মুরগির রোস্ট' : '120 Polao & Chicken Roast Packs',
      quantityKg: 52,
      courier: lang === 'bn' ? 'রাকিবুল হাসান (ভলান্টিয়ার স্কোয়াড)' : 'Rakibul Hasan (Rescue Squad)',
      vehicle: 'motorbike',
      distanceKm: 6.4,
      progressPercent: 62,
      tempCelsius: 65,
      timeRemainingMins: 11,
      status: 'en_route',
    },
    {
      id: 'ROUTE-DH-03',
      source: lang === 'bn' ? 'ধানমন্ডি ২৭ রেস্তোরাঁ হাব' : 'Dhanmondi 27 Restaurant Hub',
      destination: lang === 'bn' ? 'কামরাঙ্গীরচর বস্তি দুস্থ শিশু আশ্রয়' : 'Kamrangirchar Destitute Children Shelter',
      foodSummary: lang === 'bn' ? '৪০ প্যাকেট চাল, ডাল, সবজি ও রুটি' : '40 Packs Steamed Rice, Veggies & Bread',
      quantityKg: 24,
      courier: lang === 'bn' ? 'মারুফ হোসেন (বাইক ইউনিট)' : 'Maruf Hossain (Bike Unit)',
      vehicle: 'bicycle',
      distanceKm: 4.1,
      progressPercent: 92,
      tempCelsius: 61,
      timeRemainingMins: 3,
      status: 'en_route',
    },
    {
      id: 'ROUTE-CTG-01',
      source: lang === 'bn' ? 'আগ্রাবাদ বাণিজ্যিক ক্লাস্টার (চট্টগ্রাম)' : 'Agrabad Commercial Cluster (Chittagong)',
      destination: lang === 'bn' ? 'পতেঙ্গা উপকূলীয় জেলে পল্লি আশ্রয়কেন্দ্র' : 'Patenga Coastal Fishers Ward',
      foodSummary: lang === 'bn' ? '৭০ প্যাকেট মেজবানি গোশত ও ভাত' : '70 Packs Traditional Mezbani Meat & Rice',
      quantityKg: 38,
      courier: lang === 'bn' ? 'শহীদুল ইসলাম (চট্টগ্রাম ইউনিট)' : 'Shahidul Islam (CTG Unit)',
      vehicle: 'van',
      distanceKm: 8.5,
      progressPercent: 45,
      tempCelsius: 64,
      timeRemainingMins: 14,
      status: 'en_route',
    },
  ];

  const [activeRouteId, setActiveRouteId] = useState<string>(routes[0].id);
  const activeRoute = routes.find((r) => r.id === activeRouteId) || routes[0];

  const formatNum = (n: number | string) => (lang === 'bn' ? toBnDigits(n) : n);

  return (
    <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full pt-16">
      <div className="rounded-3xl bg-[#181d1a]/80 border border-emerald-500/30 p-6 md:p-10 relative overflow-hidden shadow-[0_0_40px_rgba(16,185,129,0.08)]">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <span className="font-mono-code text-xs text-emerald-400 uppercase tracking-widest px-3 py-1 rounded bg-[#0A0F0D] border border-emerald-500/30 inline-flex items-center gap-1.5 mb-3 font-semibold">
              <Navigation className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === 'bn' ? 'লাইভ রেসকিউ রাডার' : 'LIVE RESCUE ROUTE RADAR'}</span>
            </span>
            <h3 className="font-display text-2xl sm:text-3xl text-white font-bold tracking-tight">
              {lang === 'bn'
                ? 'সক্রিয় খাদ্য উদ্ধার ও ডেলিভারি করিডোর'
                : 'Active Food Rescue & Cold-Chain Corridors'}
            </h3>
            <p className="font-body text-slate-300 text-sm mt-1">
              {lang === 'bn'
                ? 'রেস্তোরাঁ থেকে আশ্রয়কেন্দ্রে সরাসরি খাবার পৌঁছানোর রিয়েল-টাইম ট্র্যাকিং'
                : 'Real-time telemetry tracking surplus from commercial kitchens to shelter tables.'}
            </p>
          </div>

          {/* Route selector buttons */}
          <div className="flex flex-wrap gap-2">
            {routes.map((r) => (
              <button
                key={r.id}
                onClick={() => setActiveRouteId(r.id)}
                className={`px-3 py-1.5 rounded-xl font-mono-code text-xs transition-colors cursor-pointer ${
                  activeRouteId === r.id
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-[#0A0F0D] text-slate-300 hover:text-white border border-[#3c4a42]/40'
                }`}
              >
                {r.id}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Route Detailed Cockpit */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#0A0F0D] rounded-2xl p-6 border border-[#3c4a42]/40 items-center">
          {/* Visual Route Path Map Representation */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono-code">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 emerald-ping" />
                {lang === 'bn' ? 'লাইভ করিডোর সক্রিয়' : 'Live Corridor Active'}
              </span>
              <span>
                {lang === 'bn' ? 'দূরত্ব: ' : 'Distance: '}
                <strong className="text-white">{formatNum(activeRoute.distanceKm)} km</strong>
              </span>
            </div>

            {/* Visual Route Nodes */}
            <div className="relative p-5 rounded-2xl bg-[#181d1a] border border-[#3c4a42]/30">
              <div className="flex items-center justify-between relative z-10">
                {/* Source Node */}
                <div className="flex items-start gap-3 max-w-[45%]">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-mono-code text-[10px] text-slate-400 uppercase block">
                      {lang === 'bn' ? 'উৎপত্তিস্থল (দাতা)' : 'Origin (Donor)'}
                    </span>
                    <span className="font-display text-xs sm:text-sm font-semibold text-white block leading-tight">
                      {activeRoute.source}
                    </span>
                  </div>
                </div>

                {/* Animated Destination Node */}
                <div className="flex items-start gap-3 max-w-[45%] text-right justify-end">
                  <div>
                    <span className="font-mono-code text-[10px] text-teal-400 uppercase block">
                      {lang === 'bn' ? 'গন্তব্য (আশ্রয়কেন্দ্র)' : 'Destination (Shelter)'}
                    </span>
                    <span className="font-display text-xs sm:text-sm font-semibold text-white block leading-tight">
                      {activeRoute.destination}
                    </span>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Progress Bar Line */}
              <div className="mt-5 pt-3 border-t border-[#3c4a42]/30">
                <div className="flex items-center justify-between text-xs font-mono-code mb-1.5">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <Bike className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{activeRoute.courier}</span>
                  </span>
                  <span className="text-emerald-400 font-bold">
                    {formatNum(activeRoute.progressPercent)}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#0A0F0D] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700"
                    style={{ width: `${activeRoute.progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Food summary note */}
            <div className="p-3.5 rounded-xl bg-[#181d1a]/60 border border-emerald-500/20 flex items-center justify-between text-xs">
              <span className="text-slate-300">
                {lang === 'bn' ? 'উদ্ধারকৃত খাদ্য সামগ্রী: ' : 'Rescued Item: '}
                <strong className="text-white font-medium">{activeRoute.foodSummary}</strong>
              </span>
              <span className="font-mono-code text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30">
                {formatNum(activeRoute.quantityKg)} kg
              </span>
            </div>
          </div>

          {/* Telemetry Telemetrics */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-[#181d1a] border border-[#3c4a42]/30 text-center">
              <Thermometer className="w-5 h-5 text-amber-400 mx-auto mb-1" />
              <span className="font-mono-code text-2xl font-bold text-amber-300 block">
                {formatNum(activeRoute.tempCelsius)}°C
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                {lang === 'bn' ? 'নিরাপদ গরম খাদ্য তাপমাত্রা' : 'Insulated Hot Chain'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#181d1a] border border-[#3c4a42]/30 text-center">
              <Clock className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
              <span className="font-mono-code text-2xl font-bold text-emerald-400 block">
                ~{formatNum(activeRoute.timeRemainingMins)} {lang === 'bn' ? 'মিনিট' : 'Mins'}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                {lang === 'bn' ? 'পৌঁছানোর আনুমানিক সময়' : 'Est. Delivery Arrival'}
              </span>
            </div>

            <div className="col-span-2 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center gap-2 text-xs font-mono-code text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>
                {lang === 'bn'
                  ? 'খাদ্য নিরাপত্তা সনদ প্রাপ্ত ও সিল্ড ট্রান্সফার'
                  : 'Food Safety Tested & Sealed Transfer Guaranteed'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
