import React, { useState, useEffect } from 'react';

interface MangaWildProgressLoaderProps {
  progress?: number; // 0 to 100. If omitted, will simulate smooth charging
  mode?: 'splash' | 'reader' | 'inline';
  statusText?: string;
  onComplete?: () => void;
  className?: string;
  minDurationMs?: number; // Minimum duration for splash/charge
}

export const MangaWildProgressLoader: React.FC<MangaWildProgressLoaderProps> = ({
  progress: externalProgress,
  mode = 'splash',
  statusText,
  onComplete,
  className = '',
  minDurationMs = 1200,
}) => {
  const [internalProgress, setInternalProgress] = useState(externalProgress ?? 0);
  const [statusMessage, setStatusMessage] = useState(statusText || 'Awakening MangaWild...');
  const [isCompleted, setIsCompleted] = useState(false);

  // Status messages for simulated charging
  const defaultStatusSteps = [
    { threshold: 15, text: 'Inking manga panels...' },
    { threshold: 45, text: 'Syncing cloud library...' },
    { threshold: 75, text: 'Charging reader engine...' },
    { threshold: 95, text: 'Unleashing chapter...' },
    { threshold: 100, text: 'Ready to Read!' },
  ];

  // If externalProgress is not provided, simulate smooth natural load
  useEffect(() => {
    if (externalProgress !== undefined) {
      setInternalProgress(Math.min(100, Math.max(0, externalProgress)));
      if (statusText) setStatusMessage(statusText);
      if (externalProgress >= 100) {
        setIsCompleted(true);
        if (onComplete) {
          const timer = setTimeout(onComplete, 350);
          return () => clearTimeout(timer);
        }
      }
      return;
    }

    const startTime = Date.now();
    let animFrame: number;

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const ratio = Math.min(elapsed / minDurationMs, 1);
      
      // Easing curve: quick start, smooth settle at end
      const eased = 1 - Math.pow(1 - ratio, 2.5);
      const currentPct = Math.min(100, Math.round(eased * 100));
      
      setInternalProgress(currentPct);

      if (!statusText) {
        const step = defaultStatusSteps.find(s => currentPct <= s.threshold);
        if (step) {
          setStatusMessage(step.text);
        }
      }

      if (ratio < 1) {
        animFrame = requestAnimationFrame(updateProgress);
      } else {
        setInternalProgress(100);
        setStatusMessage('Welcome to MangaWild!');
        setIsCompleted(true);
        if (onComplete) {
          setTimeout(onComplete, 300);
        }
      }
    };

    animFrame = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(animFrame);
  }, [externalProgress, minDurationMs, onComplete, statusText]);

  const displayProgress = externalProgress !== undefined ? externalProgress : internalProgress;

  if (mode === 'inline') {
    return (
      <div className={`flex flex-col items-center justify-center p-6 space-y-3 ${className}`}>
        {/* Animated mini logo pulse */}
        <div className="relative">
          <div className="absolute -inset-2 bg-sky-500/20 rounded-full blur-md animate-pulse" />
          <img
            src="/mangawild-logo.webp"
            alt="MangaWild"
            className="w-10 h-10 object-contain rounded-xl relative z-10 border border-white/20 shadow-lg animate-bounce"
            style={{ animationDuration: '1.4s' }}
          />
        </div>

        {/* Progress Bar */}
        <div className="w-48 bg-zinc-800/80 rounded-full h-1.5 overflow-hidden border border-white/10 relative">
          <div
            className="h-full bg-gradient-to-r from-sky-400 via-white to-sky-300 transition-all duration-200 ease-out shadow-[0_0_12px_rgba(56,189,248,0.8)]"
            style={{ width: `${displayProgress}%` }}
          />
        </div>

        <div className="flex items-center justify-between w-48 text-[11px] font-mono text-zinc-400">
          <span className="truncate">{statusMessage}</span>
          <span className="font-bold text-white ml-2">{Math.round(displayProgress)}%</span>
        </div>
      </div>
    );
  }

  // Reader mode or Fullscreen Splash mode
  const isSplash = mode === 'splash';

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#07080d] text-white select-none transition-opacity duration-500 ${
        isCompleted && isSplash ? 'opacity-0 pointer-events-none' : 'opacity-100'
      } ${className}`}
    >
      {/* Background Anime Ambience: Speed Lines & Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-sky-600/20 via-zinc-800/10 to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/[0.03] via-transparent to-transparent" />
      </div>

      {/* Main MangaWild Hero Branding */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-sm sm:max-w-md w-full">
        {/* Animated MangaWild Logo with Shonen Energy Aura */}
        <div className="relative mb-5 group">
          {/* Pulsing Aura Rings */}
          <div className="absolute -inset-4 bg-gradient-to-r from-sky-500/30 to-indigo-500/30 rounded-2xl blur-xl animate-pulse" />
          <div className="absolute -inset-1 bg-white/20 rounded-2xl blur-xs" />

          {/* Logo Frame */}
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-black border-2 border-white/20 shadow-2xl p-2 flex items-center justify-center overflow-hidden">
            <img
              src="/mangawild-logo.webp"
              alt="MangaWild"
              className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(255,255,255,0.4)] transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  'https://d1yei2z3i6k35z.cloudfront.net/17195590/69d8ee239944d3.80596161_1000295520.webp';
              }}
            />
            {/* Shimmer line passing through logo */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
          </div>
        </div>

        {/* Brand Wordmark in Rockidz 3D */}
        <div className="space-y-1 mb-6">
          <h1
            className="text-3xl sm:text-4xl tracking-wider text-white font-rockidz-3d drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
            style={{
              fontFamily: "'Rockidz 3D', 'Rockidz', cursive, system-ui, sans-serif",
              letterSpacing: '0.05em',
            }}
          >
            MANGAWILD
          </h1>
          <p className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.25em] text-zinc-400">
            Official Digital Manga & Webtoons
          </p>
        </div>

        {/* High-Octane Progress Bar Track */}
        <div className="w-full max-w-xs sm:max-w-sm space-y-2.5">
          <div className="relative w-full bg-zinc-900/90 border border-zinc-700/80 rounded-full h-3 p-0.5 shadow-inner overflow-hidden">
            {/* Animated Energy Fill Bar */}
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 via-white to-sky-400 transition-all duration-150 ease-out relative shadow-[0_0_16px_rgba(56,189,248,0.9)]"
              style={{ width: `${displayProgress}%` }}
            >
              {/* Internal glowing highlight */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-[shimmer_1.5s_infinite]" />
            </div>
          </div>

          {/* Real-time Percentage & Manga Status Indicator */}
          <div className="flex items-center justify-between text-xs font-mono px-1">
            <span className="text-zinc-400 text-[11px] flex items-center gap-1.5 truncate">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
              <span className="truncate">{statusMessage}</span>
            </span>
            <span className="text-white font-bold text-[12px] tabular-nums tracking-wider ml-2">
              {Math.round(displayProgress)}%
            </span>
          </div>
        </div>

        {/* Subtle Manga Watermark Accent */}
        <div className="mt-8 flex items-center gap-3 text-zinc-600 text-[10px] font-mono tracking-widest uppercase">
          <span>漫画・WILD</span>
          <span>•</span>
          <span>HIGH FIDELITY READER</span>
        </div>
      </div>
    </div>
  );
};
