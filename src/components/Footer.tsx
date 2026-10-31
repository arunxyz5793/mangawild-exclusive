import React, { useState } from 'react';
import { createPortal } from 'react-dom';
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
  Bug,
  Mail,
  X,
  CheckCircle2,
  Send,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { StorageService } from '../services/storage';

interface FooterProps {
  onNavigate: (view: string) => void;
  onOpenVIPModal: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isLight = theme === 'light';

  const [isBugModalOpen, setIsBugModalOpen] = useState(false);
  const [bugSubject, setBugSubject] = useState('');
  const [bugDescription, setBugDescription] = useState('');
  const [bugSubmitted, setBugSubmitted] = useState(false);

  const handleOpenBugModal = () => {
    setBugSubject('');
    setBugDescription('');
    setBugSubmitted(false);
    setIsBugModalOpen(true);
  };

  const handleSubmitBugReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bugDescription.trim()) return;

    StorageService.addReport({
      userId: user?.id || 'guest_reader',
      userName: user?.name || 'Reader',
      contactEmail: user?.email || '',
      category: 'website_bug',
      categoryLabel: 'Website Bug / Technical Issue',
      subject: bugSubject.trim() || 'Website Bug Report',
      description: bugDescription.trim(),
    });

    setBugSubmitted(true);
    setTimeout(() => {
      setIsBugModalOpen(false);
      setBugSubmitted(false);
      setBugSubject('');
      setBugDescription('');
    }, 2000);
  };

  // Fast-access icon strip
  const quickNav = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'browse', label: 'Catalog', icon: Compass },
    { id: 'new_series', label: 'Releases', icon: Sparkles },
    { id: 'news', label: 'News', icon: Flame },
    { id: 'membership', label: 'Exclusive', icon: Crown },
    { id: 'creator', label: 'Creator Studio', icon: PenTool },
    { id: 'library', label: 'Library', icon: Bookmark },
  ];

  return (
    <footer
      className={`border-t pt-10 pb-20 sm:pb-12 transition-colors select-none max-w-full box-border ${
        theme === 'dark'
          ? 'bg-black border-zinc-800 text-white'
          : 'bg-white border-black text-black'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8 max-w-full box-border">
        {/* Top Brand & Quick Navigation Strip Stacked Below Logo with Visible Labels */}
        <div className={`flex flex-col items-start gap-4 pb-6 border-b max-w-full box-border ${theme === 'dark' ? 'border-zinc-800' : 'border-black'}`}>
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
                      ? 'bg-white border-black text-black hover:bg-black hover:text-white'
                      : 'bg-zinc-900/80 border-white/15 text-white hover:bg-white/10'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5 shrink-0 stroke-[1.75px]" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={handleOpenBugModal}
              title="Report a Bug"
              aria-label="Report a Bug"
              className={`px-3 py-1.5 rounded-xl border transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                theme === 'light'
                  ? 'bg-white border-black text-black hover:bg-black hover:text-white'
                  : 'bg-zinc-900/80 border-white/15 text-white hover:bg-white/10'
              }`}
            >
              <Bug className="w-3.5 h-3.5 shrink-0 stroke-[1.75px]" />
              <span>Report Bug</span>
            </button>
          </nav>
        </div>

        {/* Multi-Column Navigation with Uniform Line-Art Icons and Full Readable Labels */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-8 border-b border-zinc-800/40 max-w-full box-border">
          {/* Brand Info & Core Badges */}
          <div className="lg:col-span-2 space-y-3.5 max-w-full box-border">
            <p className="text-xs font-medium leading-relaxed max-w-sm text-zinc-400">
              Read high-definition chapters directly from independent mangaka and studios, support creators with instant tips, and unlock unlimited reading with MangaWild Exclusive.
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

            {/* Official Email Direct Mail/Gmail Link */}
            <div className="pt-1">
              <a
                href="mailto:mangawildofficial@gmail.com"
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-semibold transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-white border-black text-black hover:bg-black hover:text-white'
                    : 'bg-zinc-900/90 border-white/15 text-white hover:bg-white hover:text-black'
                }`}
                title="Click to email mangawildofficial@gmail.com"
              >
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span>mangawildofficial@gmail.com</span>
              </a>
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
                <span className="truncate">Exclusive</span>
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
              Account &amp; Help
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
                onClick={() => onNavigate('membership')}
                className="group flex items-center gap-2 py-1.5 px-2 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer w-full text-left max-w-full box-border"
              >
                <LifeBuoy className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors shrink-0 stroke-[1.75px]" />
                <span className="truncate">Support</span>
              </button>
              <button
                type="button"
                onClick={handleOpenBugModal}
                className="group flex items-center gap-2 py-1.5 px-2 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer w-full text-left max-w-full box-border"
              >
                <Bug className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors shrink-0 stroke-[1.75px]" />
                <span className="truncate">Report Bug</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-500 font-mono max-w-full box-border">
          <p>© {new Date().getFullYear()} MangaWild. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-3 text-zinc-500">
            <a
              href="mailto:mangawildofficial@gmail.com"
              className="hover:underline text-zinc-400"
            >
              mangawildofficial@gmail.com
            </a>
            <span>•</span>
            <button
              type="button"
              onClick={handleOpenBugModal}
              className="hover:underline text-zinc-400 cursor-pointer flex items-center gap-1"
            >
              <Bug className="w-3 h-3" />
              <span>Report Bug</span>
            </button>
            <span>•</span>
            <span className="text-zinc-400">70% Royalties</span>
          </div>
        </div>
      </div>

      {/* Report Bug Popup Modal — Portaled to Viewport Center ("सामने ही खोलना है") */}
      {isBugModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsBugModalOpen(false)}
          >
            <div
              className={`w-full max-w-md rounded-2xl border p-5 sm:p-6 shadow-2xl transition-all box-border ${
                isLight
                  ? 'bg-white text-black border-black'
                  : 'bg-[#0e0e12] text-white border-white/25'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3 pb-4 border-b border-current/15">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      isLight ? 'bg-black text-white border-black' : 'bg-white text-black border-white'
                    }`}
                  >
                    <Bug className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider">
                      Report a Bug
                    </h3>
                    <p className="text-[11px] opacity-70">
                      Found a glitch or issue? Tell us below.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBugModalOpen(false)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors cursor-pointer ${
                    isLight
                      ? 'border-black/20 hover:bg-black hover:text-white'
                      : 'border-white/20 hover:bg-white hover:text-black'
                  }`}
                  aria-label="Close bug report modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {bugSubmitted ? (
                <div className="py-8 text-center space-y-2.5">
                  <CheckCircle2 className="w-10 h-10 mx-auto" />
                  <h4 className="text-sm font-bold">Bug Report Submitted!</h4>
                  <p className="text-xs opacity-75">
                    Thank you for helping improve MangaWild. Our team has received your report.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitBugReport} className="space-y-4 pt-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider font-mono opacity-80">
                      Bug Summary (Optional)
                    </label>
                    <input
                      type="text"
                      value={bugSubject}
                      onChange={(e) => setBugSubject(e.target.value)}
                      placeholder="e.g. Page layout issue, button not working..."
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none box-border ${
                        isLight
                          ? 'bg-white border-black text-black placeholder-zinc-500'
                          : 'bg-zinc-950 border-white/20 text-white placeholder-zinc-500 focus:border-white'
                      }`}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider font-mono opacity-80">
                      Describe the Bug *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={bugDescription}
                      onChange={(e) => setBugDescription(e.target.value)}
                      placeholder="Write any bug or issue you noticed on the website..."
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none resize-none box-border ${
                        isLight
                          ? 'bg-white border-black text-black placeholder-zinc-500'
                          : 'bg-zinc-950 border-white/20 text-white placeholder-zinc-500 focus:border-white'
                      }`}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2">
                    <a
                      href="mailto:mangawildofficial@gmail.com?subject=MangaWild%20Bug%20Report"
                      className="text-[11px] font-mono underline opacity-75 hover:opacity-100"
                    >
                      Or email mangawildofficial@gmail.com
                    </a>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsBugModalOpen(false)}
                        className={`px-3.5 py-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                          isLight ? 'border-black text-black' : 'border-white/20 text-zinc-300'
                        }`}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 ${
                          isLight
                            ? 'bg-black text-white border-black light-invert-pill'
                            : 'bg-white text-black border-white hover:bg-zinc-200'
                        }`}
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Bug</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>,
          document.body
        )}
    </footer>
  );
};

