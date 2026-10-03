import React, { useState } from 'react';
import { X, CheckCircle2, Bike, Award } from 'lucide-react';
import { Language } from '../types';
import { translations, toBnDigits } from '../translations';

interface VolunteerModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const VolunteerModal: React.FC<VolunteerModalProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  const t = translations[lang];

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('dhaka');
  const [transport, setTransport] = useState('bicycle');
  const [availability, setAvailability] = useState('avail1');

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [volunteerId, setVolunteerId] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    const randomNum = Math.floor(100 + Math.random() * 900);
    setVolunteerId(`VOL-BD-${randomNum}`);
    setIsSubmitted(true);
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#181d1a] border border-emerald-500/40 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(16,185,129,0.2)] my-8">
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
                <Bike className="w-4 h-4" />
              </div>
              <h3 className="font-display text-2xl text-white font-bold tracking-tight">
                {t.modals.volunteerTitle}
              </h3>
            </div>
            <p className="text-sm text-slate-300 mb-6">
              {t.modals.volunteerSubtitle}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {t.modals.volName} *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={lang === 'bn' ? 'আপনার নাম লিখুন' : 'e.g. Tanvir Ahmed'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0F0D] border border-[#3c4a42]/50 text-white placeholder-slate-400 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {t.modals.volPhone} *
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
                  {t.modals.transport}
                </label>
                <select
                  value={transport}
                  onChange={(e) => setTransport(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0F0D] border border-[#3c4a42]/50 text-white text-sm focus:border-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="bicycle">{t.modals.transportBicycle}</option>
                  <option value="motorbike">{t.modals.transportMotorbike}</option>
                  <option value="van">{t.modals.transportVan}</option>
                  <option value="walking">{t.modals.transportWalking}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {t.modals.availability}
                </label>
                <select
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0F0D] border border-[#3c4a42]/50 text-white text-sm focus:border-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="avail1">{t.modals.avail1}</option>
                  <option value="avail2">{t.modals.avail2}</option>
                  <option value="avail3">{t.modals.avail3}</option>
                  <option value="avail4">{t.modals.avail4}</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-emerald-500 text-slate-950 font-bold py-3.5 rounded-xl hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95 transition-all cursor-pointer text-sm md:text-base flex items-center justify-center gap-2"
                >
                  <Bike className="w-5 h-5 text-slate-950" />
                  <span>{t.modals.submitVol}</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 mx-auto mb-4">
              <Award className="w-8 h-8" />
            </div>

            <h3 className="font-display text-2xl text-white font-bold mb-2">
              {t.modals.volSuccessTitle}
            </h3>
            <p className="text-sm text-slate-300 max-w-md mx-auto mb-6 leading-relaxed">
              {t.modals.volSuccessMsg}
            </p>

            <div className="p-4 rounded-2xl bg-[#0A0F0D] border border-emerald-500/30 max-w-sm mx-auto mb-6">
              <span className="text-xs text-slate-400 block mb-1">
                {t.modals.volunteerId}
              </span>
              <span className="font-mono-code text-xl font-bold text-emerald-400 tracking-wider">
                {lang === 'bn' ? toBnDigits(volunteerId) : volunteerId}
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
