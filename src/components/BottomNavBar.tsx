import React, { useState, useEffect, useRef } from 'react';
import { Home, Compass, Bookmark, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface BottomNavBarProps {
  currentView: string;
  onNavigate: (view: string, params?: Record<string, string>) => void;
  onOpenProfileMenu: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentView,
  onNavigate,
  onOpenProfileMenu,
}) => {
  const { isVIP } = useAuth();
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(true);
  const scrollTimeoutRef = useRef<number | null>(null);
  const lastScrollYRef = useRef(0);

  // Synchronized scroll listener:
  // Hides bottom nav bar while actively scrolling (up or down) so it never blocks screen content,
  // and immediately reveals it as soon as scrolling stops.
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = Math.abs(currentScrollY - lastScrollYRef.current);
      lastScrollYRef.current = currentScrollY;

      if (delta > 2) {
        setIsVisible(false);
      }

      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = window.setTimeout(() => {
        setIsVisible(true);
      }, 130);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Hidden when inside reader mode
  if (currentView === 'read') return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 w-full max-w-lg mx-auto pointer-events-auto select-none transition-all duration-250 ease-out ${
        isVisible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      {/* Compact Flush Bottom Bar with ONLY Top Corners Curved (Merged with Bottom Website Edge per User Screenshot) */}
      <nav
        className={`relative w-full backdrop-blur-2xl border-t border-x rounded-t-[1.75rem] sm:rounded-t-[2.25rem] py-1.5 px-4 flex items-center justify-around transition-colors duration-200 ${
          theme === 'light'
            ? 'bg-white/95 border-zinc-300 shadow-[0_-6px_24px_rgba(0,0,0,0.08)]'
            : 'bg-black/95 border-white/15 shadow-[0_-8px_30px_rgba(0,0,0,0.85)]'
        }`}
      >
        {/* 1. Home Button */}
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className={`group relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 cursor-pointer active:scale-90 ${
            currentView === 'home'
              ? theme === 'light'
                ? 'text-black bg-zinc-200 font-bold'
                : 'text-white bg-white/15 font-bold'
              : theme === 'light'
              ? 'text-zinc-600 hover:text-black hover:bg-zinc-100'
              : 'text-zinc-400 hover:text-white hover:bg-white/10'
          }`}
          title="Home"
        >
          <Home
            className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
              currentView === 'home' ? 'stroke-[2.25px]' : 'stroke-[1.75px]'
            }`}
          />
          <span className="text-[10px] font-semibold tracking-tight mt-0.5 leading-none">
            Home
          </span>
        </button>

        {/* 2. Browse Button */}
        <button
          type="button"
          onClick={() => onNavigate('browse')}
          className={`group relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 cursor-pointer active:scale-90 ${
            currentView === 'browse' || currentView === 'new_series'
              ? theme === 'light'
                ? 'text-black bg-zinc-200 font-bold'
                : 'text-white bg-white/15 font-bold'
              : theme === 'light'
              ? 'text-zinc-600 hover:text-black hover:bg-zinc-100'
              : 'text-zinc-400 hover:text-white hover:bg-white/10'
          }`}
          title="Browse All Manga"
        >
          <Compass
            className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
              currentView === 'browse' || currentView === 'new_series'
                ? 'stroke-[2.25px]'
                : 'stroke-[1.75px]'
            }`}
          />
          <span className="text-[10px] font-semibold tracking-tight mt-0.5 leading-none">
            Browse
          </span>
        </button>

        {/* 3. Library Button */}
        <button
          type="button"
          onClick={() => onNavigate('library')}
          className={`group relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 cursor-pointer active:scale-90 ${
            currentView === 'library'
              ? theme === 'light'
                ? 'text-black bg-zinc-200 font-bold'
                : 'text-white bg-white/15 font-bold'
              : theme === 'light'
              ? 'text-zinc-600 hover:text-black hover:bg-zinc-100'
              : 'text-zinc-400 hover:text-white hover:bg-white/10'
          }`}
          title="My Library"
        >
          <Bookmark
            className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
              currentView === 'library' ? 'stroke-[2.25px]' : 'stroke-[1.75px]'
            }`}
          />
          <span className="text-[10px] font-semibold tracking-tight mt-0.5 leading-none">
            Library
          </span>
        </button>

        {/* 4. Profile / Menu Button */}
        <button
          type="button"
          onClick={onOpenProfileMenu}
          className={`group relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 cursor-pointer active:scale-90 ${
            currentView === 'membership' || currentView === 'creator' || currentView === 'admin'
              ? theme === 'light'
                ? 'text-black bg-zinc-200 font-bold'
                : 'text-white bg-white/15 font-bold'
              : theme === 'light'
              ? 'text-zinc-600 hover:text-black hover:bg-zinc-100'
              : 'text-zinc-400 hover:text-white hover:bg-white/10'
          }`}
          title="Profile & Menu"
        >
          <div className="relative">
            <User
              className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
                currentView === 'membership' || currentView === 'creator' || currentView === 'admin'
                  ? 'stroke-[2.25px]'
                  : 'stroke-[1.75px]'
              }`}
            />
            {isVIP && (
              <span
                className={`absolute -top-0.5 -right-1 w-1.5 h-1.5 rounded-full ${
                  theme === 'light' ? 'bg-black ring-1 ring-white' : 'bg-white ring-1 ring-black'
                }`}
              />
            )}
          </div>
          <span className="text-[10px] font-semibold tracking-tight mt-0.5 leading-none">
            Profile
          </span>
        </button>
      </nav>
    </div>
  );
};
