import React from 'react';
import { Quote, ZoomIn } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

interface VisualStoryProps {
  lang: Language;
  onOpenPhotoLightbox?: (url: string, title: string, desc: string, loc?: string) => void;
}

export const VisualStory: React.FC<VisualStoryProps> = ({
  lang,
  onOpenPhotoLightbox,
}) => {
  const t = translations[lang];

  // Authentic community field rescue photographs from Bangladesh
  const photo1 =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBQAQKb6MYL-sNnqFBeWNlcvOtAXIX0qPwGvx7PBjIujO5ZmdQA57uVetiKHfVEP_yemNSIcuJqgtgm9XSNZDGoD49iomvkzQzKzMXlsdHR5rq-c4BehGnjzNEq4PaMKo0BLh-Qa_l5a5GfGhG6ipegCsFl0vmraiEMlyDvO4hJcucdy9pXCpI6Z1LTla6tYQM6MzPQZBp2fHHYCCnbHNghC_L9qSwG3oOpVuVab6o8TzQEs3h2--ZLi1AYRxzHoTrg';
  const photo2 =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD2ZkU_c_cVIBlguJyRap3oYDOJOQpYesuNfjjx3ezGLFjbUauVk9bF4Ba-lW2wxqYqO51c1tSpGFZR7U6eZpnERKcRBjFtJDMAOw1L3XiST4_rGpWOkgvZ5aIDSLk_jaC6cW9xm8d7RHTPGNL-No_tK98Tk-54_1vZLL9UEcJCK54Q3NvnI_nwbMlsRB5WNKsgxtHKj1AMbTM_W0GT-pXMVuOq3iYoMJ5o6ZldOyAGDBhpw3sAsQXVdJ8kLfmJeD2U';
  const photo3 =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDH_524AgrGLHiJNtddY34Xca70KiwbDsgWv65f36zlDN2pSKpGF7BssDwxLKRe1X_5KxmdQF6p6kIFrD-2soG-3Hl3FwT4i5m_Mxs9yP7da2joA_VRNK39UHJl6n6I4EF-0KOgzH4opwZreVatiISn3q08U4qsXEXpWyY8ZN9E1s0wMWOeuszYb7Kg0qTlOU77o4WMlXZQ-T7_2IQXxHF4342ujo4BeUJLbtyPnVlO_4Z0wtGNZrX7t6daLYTcKUwA';

  return (
    <section id="story" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full pt-20">
      <div className="mb-12 text-center max-w-2xl mx-auto">
        <span className="font-mono-code text-xs text-emerald-400 uppercase tracking-widest px-3 py-1 rounded bg-[#181d1a] border border-emerald-500/20 inline-block mb-3 font-semibold">
          {t.visualStory.badge}
        </span>
        <h2 className="font-display text-3xl sm:text-4xl text-white font-bold tracking-tight">
          {t.visualStory.title}
        </h2>
        <p className="font-body text-slate-300 mt-2 text-base">
          {t.visualStory.subtitle}
        </p>
      </div>

      {/* Editorial Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Large Feature 1: Children Dining at Table */}
        <div className="md:col-span-7 relative group rounded-2xl overflow-hidden border border-[#3c4a42]/30 bg-[#0A0F0D] flex flex-col justify-between">
          <div
            onClick={() =>
              onOpenPhotoLightbox?.(
                photo1,
                lang === 'bn' ? 'আশ্রয়কেন্দ্রে শিশুদের পুষ্টিকর খাবার গ্রহণ' : 'Children Sharing Nutritious Warm Meal',
                lang === 'bn'
                  ? 'উদ্ধারকৃত টাটকা বিরিয়ানি ও পুষ্টিকর খাবার একসঙ্গে বসে খাচ্ছে সুবিধাবঞ্চিত শিশুরা।'
                  : 'Children sharing nutritious warm meals at a partner youth shelter.',
                lang === 'bn' ? 'উত্তরা পার্টনার আশ্রয়কেন্দ্র' : 'Uttara Partner Shelter'
              )
            }
            className="w-full flex-1 flex items-center justify-center p-3 bg-[#0A0F0D] min-h-[320px] md:min-h-[380px] cursor-pointer relative"
          >
            <img
              src={photo1}
              alt="Children sharing warm food"
              className="max-w-full max-h-[380px] object-contain group-hover:scale-105 transition-transform duration-500 filter brightness-[0.98] contrast-[1.04] rounded-xl"
              referrerPolicy="no-referrer"
            />
            <div className="absolute top-4 right-4 p-1.5 rounded-lg bg-[#0A0F0D]/80 text-emerald-300 opacity-0 group-hover:opacity-100 transition-opacity border border-emerald-500/30">
              <ZoomIn className="w-4 h-4" />
            </div>
          </div>

          <div className="p-4 bg-[#0A0F0D] border-t border-[#3c4a42]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="font-mono-code text-[11px] text-emerald-400 uppercase bg-[#181d1a] px-2.5 py-1 rounded border border-emerald-500/30 w-max font-semibold">
              {lang === 'bn' ? 'কমিউনিটি মিল' : 'Community Dining'}
            </span>
            <p className="font-display text-white font-semibold text-xs sm:text-sm">
              {lang === 'bn'
                ? 'উত্তরা পার্টনার আশ্রয়কেন্দ্রে শিশুদের তৃপ্তির সাথে গরম খাবার গ্রহণ'
                : 'Children sharing nutritious warm meals at a partner youth shelter.'}
            </p>
          </div>
        </div>

        {/* Stacked Cards 2 & 3 */}
        <div className="md:col-span-5 flex flex-col gap-5">
          {/* Card 2: Volunteers Plating Food */}
          <div className="relative group rounded-2xl overflow-hidden border border-[#3c4a42]/30 bg-[#0A0F0D] flex flex-col flex-1">
            <div
              onClick={() =>
                onOpenPhotoLightbox?.(
                  photo2,
                  lang === 'bn' ? 'স্বেচ্ছাসেবকদের হাতে প্রস্তুতকৃত খাবার পরিবেশন' : 'Volunteers Plating Fresh Surplus Meals',
                  lang === 'bn'
                    ? 'হোটেল ও ক্যাটারিং থেকে আনা খাবার স্বাস্থ্যসম্মতভাবে বক্সে সাজানো হচ্ছে।'
                    : 'Volunteers plating freshly prepared daily surplus meals.',
                  lang === 'bn' ? 'ধানমন্ডি বিতরণ কেন্দ্র' : 'Dhanmondi Feeding Station'
                )
              }
              className="w-full h-56 flex items-center justify-center p-2.5 bg-[#0A0F0D] cursor-pointer relative"
            >
              <img
                src={photo2}
                alt="Serving fresh warm rice directly to children"
                className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500 filter brightness-[0.98] contrast-[1.04] rounded-lg"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-3 right-3 p-1 rounded-lg bg-[#0A0F0D]/80 text-emerald-300 opacity-0 group-hover:opacity-100 transition-opacity border border-emerald-500/30">
                <ZoomIn className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="p-3 bg-[#0A0F0D] border-t border-[#3c4a42]/20 flex items-center justify-between">
              <span className="font-mono-code text-[10px] text-teal-300 uppercase bg-[#181d1a] px-2 py-0.5 rounded border border-teal-500/20">
                {lang === 'bn' ? 'স্বেচ্ছাসেবক দল' : 'Rescue Squad'}
              </span>
              <p className="text-white text-xs font-medium truncate ml-2">
                {lang === 'bn'
                  ? 'উদ্ধারকৃত তাজা খাবার সুষমভাবে বন্টন করছেন ভলান্টিয়াররা'
                  : 'Volunteers plating freshly prepared daily surplus meals.'}
              </p>
            </div>
          </div>

          {/* Card 3: Distribution Queue */}
          <div className="relative group rounded-2xl overflow-hidden border border-[#3c4a42]/30 bg-[#0A0F0D] flex flex-col flex-1">
            <div
              onClick={() =>
                onOpenPhotoLightbox?.(
                  photo3,
                  lang === 'bn' ? 'সুশৃঙ্খল খাদ্য বিতরণ লাইন' : 'Orderly Distribution Queue with Partners',
                  lang === 'bn'
                    ? 'সম্মান ও শৃঙ্খলার সাথে দুস্থ মানুষের মাঝে খাবার বিতরণ নিশ্চিত করা হয়।'
                    : 'Orderly distribution queue operated with partner volunteer units.',
                  lang === 'bn' ? 'মিরপুর এতিমখানা ও আশ্রয়' : 'Mirpur Relief Ward'
                )
              }
              className="w-full h-56 flex items-center justify-center p-2.5 bg-[#0A0F0D] cursor-pointer relative"
            >
              <img
                src={photo3}
                alt="Community distribution line"
                className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500 filter brightness-[0.98] contrast-[1.04] rounded-lg"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-3 right-3 p-1 rounded-lg bg-[#0A0F0D]/80 text-emerald-300 opacity-0 group-hover:opacity-100 transition-opacity border border-emerald-500/30">
                <ZoomIn className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="p-3 bg-[#0A0F0D] border-t border-[#3c4a42]/20 flex items-center justify-between">
              <span className="font-mono-code text-[10px] text-emerald-300 uppercase bg-[#181d1a] px-2 py-0.5 rounded border border-emerald-500/20">
                {lang === 'bn' ? 'শৃঙ্খলাপরায়ণ' : 'Orderly Queue'}
              </span>
              <p className="text-white text-xs font-medium truncate ml-2">
                {lang === 'bn'
                  ? 'পার্টনার ভলান্টিয়ার ইউনিটের সাথে খাবার বিতরণ'
                  : 'Orderly distribution queue operated with partner units.'}
              </p>
            </div>
          </div>
        </div>

        {/* Full-width Credo Quote Card */}
        <div className="md:col-span-12 p-8 md:p-10 rounded-2xl bg-gradient-to-r from-[#181d1a] via-[#1c211e] to-[#181d1a] border border-emerald-500/30 relative overflow-hidden shadow-[0_0_40px_rgba(16,185,129,0.08)]">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-3xl mx-auto text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Quote className="w-6 h-6" />
            </div>
            <blockquote className="font-display text-xl sm:text-2xl md:text-3xl text-white font-bold tracking-tight leading-snug">
              {lang === 'bn'
                ? '“অপচয় থেকে রক্ষা পাওয়া প্রতিটি খাবারই হয়ে উঠতে পারে একজন ক্ষুধার্ত মানুষের বেঁচে থাকার সম্বল।”'
                : '“Every meal saved from waste can become a meal shared with someone in need.”'}
            </blockquote>
            <p className="font-mono-code text-xs text-emerald-300 uppercase tracking-wider font-semibold">
              {lang === 'bn' ? 'ফুড ব্রিজ মূলমন্ত্র ও অঙ্গীকার' : 'Food Bridge Operational Credo'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
