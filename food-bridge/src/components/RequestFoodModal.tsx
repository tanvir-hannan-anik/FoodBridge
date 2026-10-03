import React, { useState } from 'react';
import { X, CheckCircle2, UtensilsCrossed, AlertTriangle } from 'lucide-react';
import { Language } from '../types';
import { translations, toBnDigits } from '../translations';

interface RequestFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const RequestFoodModal: React.FC<RequestFoodModalProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  const t = translations[lang];

  const [shelterName, setShelterName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('dhaka');
  const [address, setAddress] = useState('');
  const [mealsNeeded, setMealsNeeded] = useState<number>(30);
  const [urgency, setUrgency] = useState<'critical' | 'today' | 'recurring'>('today');
  const [notes, setNotes] = useState('');

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [requestId, setRequestId] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shelterName || !contactPerson || !phone || !address) return;

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setRequestId(`FB-REQ-${randomNum}`);
    setIsSubmitted(true);
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#181d1a] border border-emerald-500/40 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(16,185,129,0.2)] my-8">
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
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <h3 className="font-display text-2xl text-white font-bold tracking-tight">
                {t.modals.requestTitle}
              </h3>
            </div>
            <p className="text-sm text-slate-300 mb-6">
              {t.modals.requestSubtitle}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {t.modals.shelterName} *
                </label>
                <input
                  type="text"
                  required
                  value={shelterName}
                  onChange={(e) => setShelterName(e.target.value)}
                  placeholder={lang === 'bn' ? 'আশ্রয়কেন্দ্র / এতিমখানা / সম্প্রদায়ের নাম' : 'Shelter / Orphanage / Community Center Name'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0F0D] border border-[#3c4a42]/50 text-white placeholder-slate-400 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {t.modals.contactPerson} *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder={lang === 'bn' ? 'দায়িত্বপ্রাপ্ত ব্যক্তির নাম' : 'Name of In-charge'}
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
                    placeholder="+880 1XXXXXXXXX"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0F0D] border border-[#3c4a42]/50 text-white placeholder-slate-400 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
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
                    {t.modals.mealsNeeded} *
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="5000"
                    required
                    value={mealsNeeded}
                    onChange={(e) => setMealsNeeded(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0F0D] border border-[#3c4a42]/50 text-white text-sm focus:border-emerald-500 focus:outline-none tabular-nums"
                  />
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
                  placeholder={lang === 'bn' ? 'সঠিক ডেলিভারি ঠিকানা ও ল্যান্ডমার্ক' : 'Full delivery address and notable landmark'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0F0D] border border-[#3c4a42]/50 text-white placeholder-slate-400 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {t.modals.urgency}
                </label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0F0D] border border-[#3c4a42]/50 text-white text-sm focus:border-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="critical">{t.modals.urgencyCritical}</option>
                  <option value="today">{t.modals.urgencyToday}</option>
                  <option value="recurring">{t.modals.urgencyRecurring}</option>
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
                  placeholder={lang === 'bn' ? 'শিশুদের খাবার, নিরামিষ বা কোনো নির্দিষ্ট নির্দেশনা...' : 'e.g. Children dietary, vegetarian, or elderly nutrition preferences...'}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#0A0F0D] border border-[#3c4a42]/50 text-white placeholder-slate-400 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-emerald-500 text-slate-950 font-bold py-3.5 rounded-xl hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95 transition-all cursor-pointer text-sm md:text-base flex items-center justify-center gap-2"
                >
                  <UtensilsCrossed className="w-5 h-5 text-slate-950" />
                  <span>{t.modals.submitRequest}</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-teal-500/20 border border-teal-500/50 flex items-center justify-center text-teal-400 mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="font-display text-2xl text-white font-bold mb-2">
              {t.modals.requestSuccessTitle}
            </h3>
            <p className="text-sm text-slate-300 max-w-md mx-auto mb-6 leading-relaxed">
              {t.modals.requestSuccessMsg}
            </p>

            <div className="p-4 rounded-2xl bg-[#0A0F0D] border border-teal-500/30 max-w-sm mx-auto mb-6">
              <span className="text-xs text-slate-400 block mb-1">
                {lang === 'bn' ? 'রিকোয়েস্ট ট্র্যাকিং নম্বর' : 'Request Tracking Reference'}
              </span>
              <span className="font-mono-code text-xl font-bold text-teal-400 tracking-wider">
                {lang === 'bn' ? toBnDigits(requestId) : requestId}
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
