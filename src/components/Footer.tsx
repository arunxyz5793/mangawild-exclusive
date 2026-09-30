import React from 'react';
import { MangaWildLogo } from './MangaWildLogo';
import { Shield, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface FooterProps {
  onNavigate: (view: string) => void;
  onOpenVIPModal: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenVIPModal }) => {
  const { theme } = useTheme();

  return (
    <footer
      className={`border-t pt-16 pb-12 transition-colors select-none ${
        theme === 'dark'
          ? 'bg-[#09090b] border-zinc-800 text-zinc-400'
          : 'bg-zinc-100 border-zinc-200 text-zinc-600'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-zinc-800/40">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <MangaWildLogo size="lg" />
            <p className="text-xs leading-relaxed max-w-sm">
              The premier publishing destination for original serialized manga, webtoons, and graphic novels.
              Empowering independent writers and artists with 70% royalties and weekly direct payouts.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span
                className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 font-mono ${
                  theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-700'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-zinc-300" />
                <span>70% Creator Royalties</span>
              </span>
              <span
                className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 font-mono ${
                  theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-700'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
                <span>Weekly UPI & Bank Payouts</span>
              </span>
            </div>
          </div>

          {/* Explore Links */}
          <div className="space-y-3">
            <h4
              className={`text-xs font-bold uppercase tracking-wider font-mono ${
                theme === 'dark' ? 'text-white' : 'text-zinc-900'
              }`}
            >
              MangaWild Library
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('browse')}
                  className="hover:text-white dark:hover:text-white transition-all active:scale-95 cursor-pointer"
                >
                  All Original Manga
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('trending')}
                  className="hover:text-white dark:hover:text-white transition-all active:scale-95 cursor-pointer"
                >
                  Trending Leaderboard
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('news')}
                  className="hover:text-white dark:hover:text-white transition-all active:scale-95 cursor-pointer"
                >
                  Studio News & Releases
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('membership')}
                  className="font-bold hover:underline cursor-pointer flex items-center gap-1 text-zinc-200 transition-all active:scale-95"
                >
                  <Sparkles className="w-3 h-3" /> Subscription Plans
                </button>
              </li>
            </ul>
          </div>

          {/* Creators */}
          <div className="space-y-3">
            <h4
              className={`text-xs font-bold uppercase tracking-wider font-mono ${
                theme === 'dark' ? 'text-white' : 'text-zinc-900'
              }`}
            >
              Creator Studio
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('creator')}
                  className="hover:text-white dark:hover:text-white transition-all active:scale-95 cursor-pointer font-semibold text-zinc-200"
                >
                  Join Creator Program
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('creators')}
                  className="hover:text-white dark:hover:text-white transition-all active:scale-95 cursor-pointer"
                >
                  MangaWild Creators
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('creator')}
                  className="hover:text-white dark:hover:text-white transition-all active:scale-95 cursor-pointer"
                >
                  Creator Revenue & Payouts
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('creator')}
                  className="hover:text-white dark:hover:text-white transition-all active:scale-95 cursor-pointer"
                >
                  Publish New Chapters
                </button>
              </li>
            </ul>
          </div>

          {/* Reader Library */}
          <div className="space-y-3">
            <h4
              className={`text-xs font-bold uppercase tracking-wider font-mono ${
                theme === 'dark' ? 'text-white' : 'text-zinc-900'
              }`}
            >
              Reader Account
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('library')}
                  className="hover:text-white dark:hover:text-white transition-colors cursor-pointer"
                >
                  My Reading History
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('library')}
                  className="hover:text-white dark:hover:text-white transition-colors cursor-pointer"
                >
                  Bookmarked Series
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('library')}
                  className="hover:text-white dark:hover:text-white transition-colors cursor-pointer"
                >
                  Submitted Reviews
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('membership')}
                  className="hover:text-white dark:hover:text-white transition-colors cursor-pointer"
                >
                  Coins & Subscriptions
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500 font-mono">
          <p>© {new Date().getFullYear()} MangaWild. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Original manga platform built for readers and creators.
          </p>
        </div>
      </div>
    </footer>
  );
};
