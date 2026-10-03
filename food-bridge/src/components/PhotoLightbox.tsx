import React, { useEffect, useState } from 'react';
import {
  X,
  MapPin,
  ShieldCheck,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  CheckCircle2,
} from 'lucide-react';
import { Language } from '../types';

interface PhotoLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title: string;
  description: string;
  location?: string;
  lang: Language;
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title,
  description,
  location,
  lang,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
      if (e.key === '-') setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
      if (e.key === '0') setZoomLevel(1);
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setZoomLevel(1);
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  };

  const handleResetZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel(1);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/95 backdrop-blur-xl transition-all overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-6xl w-full bg-[#121714] border border-emerald-500/40 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(16,185,129,0.35)] my-auto flex flex-col"
      >
        {/* Top Control Bar */}
        <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-[#0A0F0D]/90 backdrop-blur-md border border-emerald-500/30 rounded-xl p-1 text-slate-300 shadow-lg">
            <button
              onClick={handleZoomIn}
              className="p-1.5 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer"
              title="Zoom In (+)"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer"
              title="Zoom Out (-)"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer text-[11px] font-mono-code px-2"
              title="Reset Zoom (0)"
              aria-label="Reset zoom"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-[#0A0F0D]/90 text-white hover:text-rose-400 hover:bg-[#0A0F0D] transition-colors cursor-pointer border border-emerald-500/30 shadow-lg"
            aria-label="Close photo view"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FULL 100% UN-CROPPED IMAGE DISPLAY (object-contain with generous max-height) */}
        <div className="relative w-full max-h-[75vh] min-h-[300px] bg-[#0A0F0D] p-3 sm:p-6 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.06),transparent_70%)] pointer-events-none" />
          
          <img
            src={imageUrl}
            alt={title}
            style={{ transform: `scale(${zoomLevel})` }}
            className="max-h-[68vh] w-auto max-w-full object-contain mx-auto rounded-xl transition-transform duration-200 filter brightness-[1.0] contrast-[1.03]"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Photo Metadata Caption Bar */}
        <div className="p-5 md:p-6 bg-[#181d1a] border-t border-[#3c4a42]/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="font-mono-code text-[11px] text-emerald-400 font-semibold uppercase tracking-wider bg-emerald-950/70 border border-emerald-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {lang === 'bn' ? '১০০% অরিজিনাল আনক্রপড ভিউ' : '100% Uncropped View'}
                </span>
              </span>
              {location && (
                <span className="text-xs text-slate-300 flex items-center gap-1 bg-[#0A0F0D] px-2.5 py-0.5 rounded-full border border-[#3c4a42]/40 font-mono-code">
                  <MapPin className="w-3.5 h-3.5 text-teal-400" />
                  <span>{location}</span>
                </span>
              )}
            </div>

            <h3 className="font-display text-lg md:text-2xl text-white font-bold leading-snug">
              {title}
            </h3>
            <p className="font-body text-slate-300 text-xs md:text-sm mt-1.5 leading-relaxed">
              {description}
            </p>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#3c4a42]/30">
            <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-mono-code bg-[#0A0F0D] px-3 py-1 rounded-xl border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{lang === 'bn' ? 'সম্পূর্ণ ফ্রেম প্রদর্শিত' : 'Full Frame Displayed'}</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono-code">
              {lang === 'bn' ? 'কিবোর্ড শর্টকাট: +/- জুম, Esc বন্ধ' : 'Shortcuts: +/- Zoom, Esc Close'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
