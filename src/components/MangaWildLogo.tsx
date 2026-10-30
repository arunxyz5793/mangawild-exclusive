import React from 'react';
import { useTheme } from '../context/ThemeContext';

interface MangaWildLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showExclusiveBadge?: boolean;
  showWordmark?: boolean;
}

export const MangaWildLogo: React.FC<MangaWildLogoProps> = ({
  className = '',
  size = 'md',
  showWordmark = true,
}) => {
  const { theme } = useTheme();

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
      {/* Official MangaWild Logo Image */}
      <div className="relative group shrink-0">
        <img
          src="/mangawild-logo.webp"
          alt="MangaWild"
          className={`${logoDimensions[size]} object-contain rounded-xl border ${
            theme === 'light' ? 'border-black bg-black' : 'border-white/30 bg-black'
          } shadow-md transition-transform duration-200 group-hover:scale-105`}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = 'https://d1yei2z3i6k35z.cloudfront.net/17195590/69d8ee239944d3.80596161_1000295520.webp';
          }}
        />
      </div>

      {/* MangaWild Wordmark Typography in custom MangaWild font - switches between White (Dark) and Black (Light) */}
      {showWordmark && (
        <div className="flex items-center justify-center min-w-0">
          <span
            className={`font-rockidz-3d tracking-wider leading-none transition-colors duration-200 ${
              theme === 'light' ? 'text-black' : 'text-white'
            } ${textSizes[size]}`}
            style={{
              fontFamily: "'Rockidz 3D', 'Rockidz', cursive, system-ui, sans-serif",
              letterSpacing: '0.04em',
              color: theme === 'light' ? '#000000' : '#ffffff',
              WebkitTextFillColor: theme === 'light' ? '#000000' : '#ffffff',
            }}
          >
            MANGAWILD
          </span>
        </div>
      )}
    </div>
  );
};
