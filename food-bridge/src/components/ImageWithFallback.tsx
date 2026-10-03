import React, { useState } from 'react';
import { Image as ImageIcon, ZoomIn, Sparkles, Maximize2 } from 'lucide-react';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  aspectRatio?: string;
  caption?: string;
  categoryTag?: string;
  onClick?: () => void;
  priority?: boolean;
  fit?: 'contain' | 'cover' | 'fill' | 'scale-down';
  showUncroppedBadge?: boolean;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  className = '',
  containerClassName = '',
  caption,
  categoryTag,
  onClick,
  fit = 'contain',
  showUncroppedBadge = true,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fitClass =
    fit === 'cover'
      ? 'object-cover'
      : fit === 'fill'
      ? 'object-fill'
      : fit === 'scale-down'
      ? 'object-scale-down'
      : 'object-contain';

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden group select-none bg-[#0A0F0D] flex items-center justify-center ${
        onClick ? 'cursor-pointer' : ''
      } ${containerClassName}`}
    >
      {/* Subtle ambient backlight inside image container for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none z-10" />

      {/* Skeleton Loading Placeholder */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-r from-[#181d1a] via-[#262b29] to-[#181d1a] animate-pulse z-0 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-emerald-400/50 animate-spin" />
        </div>
      )}

      {!hasError ? (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          referrerPolicy="no-referrer"
          className={`max-w-full max-h-full ${fitClass} transition-transform duration-500 group-hover:scale-[1.03] ${
            isLoading ? 'opacity-0' : 'opacity-100'
          } ${className}`}
        />
      ) : (
        /* Styled Fallback Container - Zero Broken Image Policy */
        <div className="w-full h-full min-h-[180px] bg-gradient-to-br from-[#181d1a] via-[#1c211e] to-[#0A0F0D] border border-emerald-500/20 p-5 flex flex-col items-center justify-center text-center relative z-20">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <ImageIcon className="w-6 h-6" />
          </div>
          {categoryTag && (
            <span className="font-mono-code text-[10px] text-emerald-400 uppercase tracking-widest px-2 py-0.5 rounded bg-[#0A0F0D] border border-emerald-500/30 mb-1">
              {categoryTag}
            </span>
          )}
          <p className="font-display font-semibold text-white text-xs sm:text-sm max-w-xs mt-1">
            {caption || alt}
          </p>
          <span className="text-[10px] text-slate-400 font-mono-code mt-1">
            Food Bridge Visual Archive
          </span>
        </div>
      )}

      {/* Hover Zoom & Full Photo Indicator */}
      {onClick && !hasError && !isLoading && (
        <div className="absolute top-2.5 right-2.5 z-20 p-1.5 rounded-lg bg-[#0A0F0D]/85 backdrop-blur-md text-emerald-300 opacity-0 group-hover:opacity-100 transition-opacity border border-emerald-500/40 shadow-md flex items-center gap-1">
          <Maximize2 className="w-3.5 h-3.5" />
          <span className="text-[10px] font-mono-code hidden sm:inline text-emerald-300 font-semibold">
            পূর্ণ চিত্র
          </span>
        </div>
      )}

      {/* Subtle Uncropped Indicator tag on bottom right on hover */}
      {showUncroppedBadge && !hasError && !isLoading && (
        <div className="absolute bottom-2 right-2 z-20 text-[9px] font-mono-code text-emerald-400/90 bg-[#0A0F0D]/85 px-1.5 py-0.5 rounded border border-emerald-500/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          ১০০% অরিজিনাল ভিউ
        </div>
      )}
    </div>
  );
};
