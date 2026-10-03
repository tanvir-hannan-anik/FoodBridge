import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Copy, HeartHandshake, ShieldCheck } from 'lucide-react';
import { Language } from '../types';
import { translations, toBnDigits } from '../translations';

interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  initialWeight?: number;
}

export const DonateModal: React.FC<DonateModalProps> = ({
  isOpen,
  onClose,
  lang,
  initialWeight = 25,
}) => {
  const t = translations[lang];

  const [donorName, setDonorName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('dhaka');
  const [address, setAddress] = useState('');
  const [foodType, setFoodType] = useState('cooked');
  const [quantityKg, setQuantityKg] = useState<number>(initialWeight);
  const [servings, setServings] = useState<number>(Math.round(initialWeight * 2.5));
  const [cookedTime, setCookedTime] = useState('justNow');
  const [notes, setNotes] = useState('');

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialWeight) {
      setQuantityKg(initialWeight);
      setServings(Math.round(initialWeight * 2.5));
    }
  }, [initialWeight]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorName || !phone || !address) return;

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newId = `FB-RESCUE-${randomNum}`;
    setTicketId(newId);
    setIsSubmitted(true);
  };

  const handleCopyTicket = () => {
    navigator.clipboard.writeText(ticketId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#181d1a] border border-emerald-500/40 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(16,185,129,0.2)] my-8">
        {/* Close Button */}
        <button
          onClick={handleResetAndClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#0A0F0D] transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {!isSubmitted ? (
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <h3 className="font-display text-2xl text-white font-bold tracking-tight">
                {t.modals.donateTitle}
              </h3>
            </div>
            <p className="text-sm text-slate-300 mb-6">
              {t.modals.donateSubtitle}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {t.modals.donorName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    placeholder={lang === 'bn' ? 'উদা: মো. রাশেদুল করিম' : 'e.g. Rashedul Karim'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0F0D] border border-[#3c4a42]/50 text-white placeholder-slate-400 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {t.modals.phone} *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+880 1712-XXXXXX"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0F0D] border border-[#3c4a42]/50 text-white placeholder-slate-400 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {t.modals.orgName}
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder={lang === 'bn' ? 'রেস্তোরাঁ / হোটেল / অনুষ্ঠান বাড়ি' : 'Restaurant / Venue / Catering (Optional)'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0F0D] border border-[#3c4a42]/50 text-white placeholder-slate-400 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {t.modals.district} *
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0F0D] border border-[#3c4a42]/50 text-white text-sm focus:border-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="dhaka">Dhaka (ঢাকা)</option>
                    <option value="chittagong">Chittagong (চট্টগ্রাম)</option>
                    <option value="sylhet">Sylhet (সিলেট)</option>
                    <option value="gazipur">Gazipur (গাজীপুর)</option>
                    <option value="narayanganj">Narayanganj (নারায়ণগঞ্জ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {t.modals.foodType} *
                  </label>
                  <select
                    value={foodType}
                    onChange={(e) => setFoodType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0F0D] border border-[#3c4a42]/50 text-white text-sm focus:border-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="cooked">{t.modals.foodTypeCooked}</option>
                    <option value="bakery">{t.modals.foodTypeBakery}</option>
                    <option value="produce">{t.modals.foodTypeProduce}</option>
                    <option value="packaged">{t.modals.foodTypePackaged}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {t.modals.address} *
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={lang === 'bn' ? 'বাড়ি নং, রোড নং, সেক্টর/এলাকা, পরিচিত ল্যান্ডমার্ক' : 'House, Road, Area, Nearby Landmark for rapid courier pickup'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0F0D] border border-[#3c4a42]/50 text-white placeholder-slate-400 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {t.modals.quantityKg}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quantityKg}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setQuantityKg(val);
                      setServings(Math.round(val * 2.5));
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0F0D] border border-[#3c4a42]/50 text-white text-sm focus:border-emerald-500 focus:outline-none tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {t.modals.servings}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={servings}
                    onChange={(e) => setServings(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0F0D] border border-[#3c4a42]/50 text-white text-sm focus:border-emerald-500 focus:outline-none tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {t.modals.cookedTime}
                </label>
                <select
                  value={cookedTime}
                  onChange={(e) => setCookedTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0F0D] border border-[#3c4a42]/50 text-white text-sm focus:border-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="justNow">{t.modals.cookedTimeJustNow}</option>
                  <option value="today">{t.modals.cookedTimeToday}</option>
                  <option value="yesterday">{t.modals.cookedTimeYesterday}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {t.modals.notes}
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={lang === 'bn' ? 'খাবারটি বক্সে প্যাক করা নাকি পাতিলে আছে ইত্যাদি...' : 'e.g. Pre-boxed or bulk pots, any dietary info...'}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#0A0F0D] border border-[#3c4a42]/50 text-white placeholder-slate-400 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-emerald-500 text-slate-950 font-bold py-3.5 rounded-xl hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-95 transition-all cursor-pointer text-sm md:text-base flex items-center justify-center gap-2"
                >
                  <HeartHandshake className="w-5 h-5 text-slate-950" />
                  <span>{t.modals.submitDonate}</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Confirmation Success Screen */
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="font-display text-2xl text-white font-bold mb-2">
              {t.modals.donateSuccessTitle}
            </h3>
            <p className="text-sm text-slate-300 max-w-md mx-auto mb-6 leading-relaxed">
              {t.modals.donateSuccessMsg}
            </p>

            <div className="p-4 rounded-2xl bg-[#0A0F0D] border border-emerald-500/30 max-w-sm mx-auto mb-6">
              <span className="text-xs text-slate-400 block mb-1">
                {t.modals.ticketId}
              </span>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono-code text-xl font-bold text-emerald-400 tracking-wider">
                  {lang === 'bn' ? toBnDigits(ticketId) : ticketId}
                </span>
                <button
                  type="button"
                  onClick={handleCopyTicket}
                  className="p-1.5 rounded-lg bg-[#181d1a] hover:bg-[#3c4a42]/40 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Copy Ticket ID"
                  aria-label="Copy ticket code"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              {copied && (
                <span className="text-[11px] text-emerald-400 font-mono-code block mt-1">
                  {lang === 'bn' ? 'কোড কপি হয়েছে!' : 'Copied to clipboard!'}
                </span>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-300 mb-6">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>
                {lang === 'bn'
                  ? 'গড় পিকআপ রেসপন্স: ১৮-২৮ মিনিট'
                  : 'Average volunteer dispatch arrival: 18-28 minutes'}
              </span>
            </div>

            <button
              onClick={handleResetAndClose}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-colors cursor-pointer text-sm"
            >
              {t.modals.close}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
