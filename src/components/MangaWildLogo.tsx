import React from 'react';

interface MangaWildLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showExclusiveBadge?: boolean;
  showWordmark?: boolean;
}

export const MangaWildLogo: React.FC<MangaWildLogoProps> = ({
  className = '',
  size = 'md',
  showExclusiveBadge = false,
  showWordmark = true,
}) => {
  const logoDimensions = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const textSizes = {
    sm: 'text-xl sm:text-2xl',
    md: 'text-2xl sm:text-3xl',
    lg: 'text-3xl sm:text-4xl',
    xl: 'text-4xl sm:text-5xl',
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

      {/* MangaWild Wordmark Typography in custom MangaWild font - Clean and minimal */}
      {showWordmark && (
        <div className="flex items-center justify-center min-w-0">
          <span
            className={`font-rockidz-3d tracking-wider leading-none text-white ${textSizes[size]}`}
            style={{
              fontFamily: "'Rockidz 3D', 'Rockidz', cursive, system-ui, sans-serif",
              letterSpacing: '0.04em',
            }}
          >
            MANGAWILD
          </span>
        </div>
      )}
    </div>
  );
};
