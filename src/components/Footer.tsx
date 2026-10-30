import React from 'react';
import { MangaWildLogo } from './MangaWildLogo';
import {
  Shield,
  Sparkles,
  Compass,
  Flame,
  Crown,
  PenTool,
  Users,
  Wallet,
  PlusCircle,
  Clock,
  Bookmark,
  Star,
  LifeBuoy,
  Home,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface FooterProps {
  onNavigate: (view: string) => void;
  onOpenVIPModal: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenVIPModal }) => {
  const { theme } = useTheme();

  // Fast-access icon strip
  const quickNav = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'browse', label: 'Catalog', icon: Compass },
    { id: 'new_series', label: 'Releases', icon: Sparkles },
    { id: 'news', label: 'News', icon: Flame },
    { id: 'membership', label: 'VIP Pass', icon: Crown },
    { id: 'creator', label: 'Creator Studio', icon: PenTool },
    { id: 'library', label: 'Library', icon: Bookmark },
  ];

  return (
    <footer
      className={`border-t pt-10 pb-20 sm:pb-12 transition-colors select-none max-w-full box-border ${
        theme === 'dark'
          ? 'bg-[#09090b] border-zinc-800 text-zinc-400'
          : 'bg-zinc-100 border-zinc-200 text-zinc-600'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8 max-w-full box-border">
        {/* Top Brand & Quick Navigation Strip Stacked Below Logo with Visible Labels */}
        <div className="flex flex-col items-start gap-4 pb-6 border-b border-zinc-800/60 max-w-full box-border">
          <div className="flex flex-col gap-2">
            <MangaWildLogo size="sm" />
            <p className="text-xs sm:text-sm font-medium leading-relaxed max-w-xl text-zinc-400">
              MangaWild is India&apos;s premier platform for original serialized manga, webtoons, and graphic novels — featuring weekly direct UPI payouts and a 70% creator revenue share.
            </p>
          </div>

          {/* Quick Navigation Icons BELOW the MangaWild Logo with Icon + Label always visible */}
          <nav aria-label="Footer Quick Navigation" className="flex items-center gap-2 flex-wrap pt-1">
            {quickNav.map(item => {
              const IconComp = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  title={item.label}
                  aria-label={item.label}
                  className={`px-3 py-1.5 rounded-xl border transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                    theme === 'light'
                      ? 'bg-white border-zinc-300 text-zinc-800 hover:bg-zinc-200 hover:text-black'
                      : 'bg-zinc-900/80 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5 shrink-0 stroke-[1.75px]" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Multi-Column Navigation with Uniform Line-Art Icons and Full Readable Labels */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-8 border-b border-zinc-800/40 max-w-full box-border">
          {/* Brand Info & Core Badges */}
          <div className="lg:col-span-2 space-y-3.5 max-w-full box-border">
            <p className="text-xs font-medium leading-relaxed max-w-sm text-zinc-400">
              Read high-definition chapters directly from independent mangaka and studios, support creators with instant tips, and unlock unlimited reading with the MangaWild VIP Pass.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs">
              <span
                className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 font-semibold text-[11px] ${
                  theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-white border-zinc-300 text-zinc-800'
                }`}
              >
                <Shield className="w-3.5 h-3.5 shrink-0" />
                <span>70% Creator Revenue Share</span>
              </span>
              <span
                className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 font-semibold text-[11px] ${
                  theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-white border-zinc-300 text-zinc-800'
                }`}
              >
                <Wallet className="w-3.5 h-3.5 shrink-0" />
                <span>Direct Weekly UPI Payouts</span>
              </span>
            </div>
          </div>

          {/* Catalog & Discover */}
          <div className="space-y-2.5 max-w-full box-border">
            <h4
              className={`text-[11px] font-bold uppercase tracking-wider font-mono ${
                theme === 'dark' ? 'text-zinc-200' : 'text-zinc-900'
              }`}
            >
              Discover
            </h4>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => onNavigate('browse')}
                className="group flex items-center gap-2 py-1.5 px-2 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer w-full text-left max-w-full box-border"
              >
                <Compass className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors shrink-0 stroke-[1.75px]" />
                <span className="truncate">Catalog</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('new_series')}
                className="group flex items-center gap-2 py-1.5 px-2 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer w-full text-left max-w-full box-border"
              >
                <Sparkles className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors shrink-0 stroke-[1.75px]" />
                <span className="truncate">Releases</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('news')}
                className="group flex items-center gap-2 py-1.5 px-2 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer w-full text-left max-w-full box-border"
              >
                <Flame className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors shrink-0 stroke-[1.75px]" />
                <span className="truncate">News</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('membership')}
                className="group flex items-center gap-2 py-1.5 px-2 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer w-full text-left max-w-full box-border font-medium"
              >
                <Crown className="w-3.5 h-3.5 text-zinc-300 group-hover:text-white transition-colors shrink-0 stroke-[1.75px]" />
                <span className="truncate">VIP Pass</span>
              </button>
            </div>
          </div>

          {/* Creator Desk */}
          <div className="space-y-2.5 max-w-full box-border">
            <h4
              className={`text-[11px] font-bold uppercase tracking-wider font-mono ${
                theme === 'dark' ? 'text-zinc-200' : 'text-zinc-900'
              }`}
            >
              Creators
            </h4>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => onNavigate('creator')}
                className="group flex items-center gap-2 py-1.5 px-2 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer w-full text-left max-w-full box-border"
              >
                <PenTool className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors shrink-0 stroke-[1.75px]" />
                <span className="truncate">Studio</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('creators')}
                className="group flex items-center gap-2 py-1.5 px-2 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer w-full text-left max-w-full box-border"
              >
                <Users className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors shrink-0 stroke-[1.75px]" />
                <span className="truncate">Mangaka</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('creator')}
                className="group flex items-center gap-2 py-1.5 px-2 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer w-full text-left max-w-full box-border"
              >
                <Wallet className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors shrink-0 stroke-[1.75px]" />
                <span className="truncate">Payouts</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('creator')}
                className="group flex items-center gap-2 py-1.5 px-2 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer w-full text-left max-w-full box-border"
              >
                <PlusCircle className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors shrink-0 stroke-[1.75px]" />
                <span className="truncate">Publish</span>
              </button>
            </div>
          </div>

          {/* Reader Desk */}
          <div className="space-y-2.5 max-w-full box-border">
            <h4
              className={`text-[11px] font-bold uppercase tracking-wider font-mono ${
                theme === 'dark' ? 'text-zinc-200' : 'text-zinc-900'
              }`}
            >
              Account
            </h4>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => onNavigate('library')}
                className="group flex items-center gap-2 py-1.5 px-2 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer w-full text-left max-w-full box-border"
              >
                <Bookmark className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors shrink-0 stroke-[1.75px]" />
                <span className="truncate">Library</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('library')}
                className="group flex items-center gap-2 py-1.5 px-2 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer w-full text-left max-w-full box-border"
              >
                <Clock className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors shrink-0 stroke-[1.75px]" />
                <span className="truncate">History</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('library')}
                className="group flex items-center gap-2 py-1.5 px-2 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer w-full text-left max-w-full box-border"
              >
                <Star className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors shrink-0 stroke-[1.75px]" />
                <span className="truncate">Reviews</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('membership')}
                className="group flex items-center gap-2 py-1.5 px-2 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer w-full text-left max-w-full box-border"
              >
                <LifeBuoy className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors shrink-0 stroke-[1.75px]" />
                <span className="truncate">Support</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-500 font-mono max-w-full box-border">
          <p>© {new Date().getFullYear()} MangaWild. All rights reserved.</p>
          <p className="flex items-center gap-1.5 text-zinc-500">
            <span>Built for readers & creators.</span>
            <span>•</span>
            <span className="text-zinc-400">70% Royalties</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
