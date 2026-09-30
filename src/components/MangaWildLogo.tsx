import React from 'react';

interface MangaWildLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showExclusiveBadge?: boolean;
}

export const MangaWildLogo: React.FC<MangaWildLogoProps> = ({
  className = '',
  size = 'md',
  showExclusiveBadge = true,
}) => {
  const logoDimensions = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  };

  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 select-none cursor-pointer transition-transform active:scale-95 ${className}`}>
      {/* Official MangaWild Logo Image from mangawild.online */}
      <div className="relative group shrink-0">
        <img
          src="/mangawild-logo.webp"
          alt="MangaWild"
          className={`${logoDimensions[size]} object-contain rounded-xl border border-slate-700/60 shadow-md bg-black transition-transform duration-200 group-hover:scale-105`}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = 'https://d1yei2z3i6k35z.cloudfront.net/17195590/69d8ee239944d3.80596161_1000295520.webp';
          }}
        />
        <div className="absolute inset-0 rounded-xl ring-1 ring-white/10 pointer-events-none" />
      </div>

      {/* MangaWild Wordmark & Badge */}
      <div className="flex flex-col justify-center min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`font-display font-black tracking-wider leading-none text-slate-100 ${textSizes[size]}`}
            style={{ letterSpacing: '0.04em' }}
          >
            MANGAWILD
          </span>

          {showExclusiveBadge && (
            <span className="hidden sm:inline-block bg-slate-800/90 text-slate-200 border border-slate-700 text-[10px] font-bold tracking-widest px-2 py-0.5 rounded font-mono uppercase shadow-xs">
              EXCLUSIVE
            </span>
          )}
        </div>
        <span className="hidden sm:block text-[10px] uppercase font-mono tracking-widest text-slate-400 mt-0.5 truncate">
          Official Digital Manga
        </span>
      </div>
    </div>
  );
};
