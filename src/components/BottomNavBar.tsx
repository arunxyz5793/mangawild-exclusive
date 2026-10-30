import React from 'react';
import { Home, Compass, Bookmark, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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

  // Hidden when inside reader mode
  if (currentView === 'read') return null;

  return (
    <div className="fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-sm sm:max-w-md pointer-events-auto select-none">
      {/* Floating Island Dock with Curved Bezels and Frosted Glass Blur */}
      <nav className="relative bg-black/80 backdrop-blur-3xl border border-white/20 rounded-3xl py-2 px-3 shadow-[0_16px_50px_rgba(0,0,0,0.95)] flex items-center justify-around">
        {/* 1. Home Button with Dedicated Zoom & Spring Micro-Animation */}
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className={`group relative flex flex-col items-center justify-center py-1.5 px-3.5 rounded-2xl transition-all duration-300 transform-gpu cursor-pointer active:scale-75 hover:scale-110 ${
            currentView === 'home'
              ? 'text-white bg-white/15 shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-white/10'
          }`}
          title="Home"
        >
          <Home
            className={`w-5 h-5 transition-transform duration-300 ease-out group-hover:scale-125 group-hover:-translate-y-1 ${
              currentView === 'home' ? 'stroke-[2.5px] scale-110' : 'stroke-[1.75px]'
            }`}
          />
          <span className="text-[10px] font-medium tracking-tight mt-0.5 transition-all group-hover:font-bold">
            Home
          </span>
          {currentView === 'home' && (
            <span className="w-1.5 h-1.5 rounded-full bg-white mt-0.5 shadow-sm" />
          )}
        </button>

        {/* 2. Browse Button with Zoom Micro-Animation */}
        <button
          type="button"
          onClick={() => onNavigate('browse')}
          className={`group relative flex flex-col items-center justify-center py-1.5 px-3.5 rounded-2xl transition-all duration-300 transform-gpu cursor-pointer active:scale-75 hover:scale-110 ${
            currentView === 'browse' || currentView === 'new_series'
              ? 'text-white bg-white/15 shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-white/10'
          }`}
          title="Browse All Manga"
        >
          <Compass
            className={`w-5 h-5 transition-transform duration-300 ease-out group-hover:scale-125 group-hover:-translate-y-1 ${
              currentView === 'browse' || currentView === 'new_series'
                ? 'stroke-[2.5px] scale-110'
                : 'stroke-[1.75px]'
            }`}
          />
          <span className="text-[10px] font-medium tracking-tight mt-0.5 transition-all group-hover:font-bold">
            Browse
          </span>
          {(currentView === 'browse' || currentView === 'new_series') && (
            <span className="w-1.5 h-1.5 rounded-full bg-white mt-0.5 shadow-sm" />
          )}
        </button>

        {/* 3. Library Button with Zoom Micro-Animation */}
        <button
          type="button"
          onClick={() => onNavigate('library')}
          className={`group relative flex flex-col items-center justify-center py-1.5 px-3.5 rounded-2xl transition-all duration-300 transform-gpu cursor-pointer active:scale-75 hover:scale-110 ${
            currentView === 'library'
              ? 'text-white bg-white/15 shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-white/10'
          }`}
          title="My Library"
        >
          <Bookmark
            className={`w-5 h-5 transition-transform duration-300 ease-out group-hover:scale-125 group-hover:-translate-y-1 ${
              currentView === 'library' ? 'stroke-[2.5px] scale-110' : 'stroke-[1.75px]'
            }`}
          />
          <span className="text-[10px] font-medium tracking-tight mt-0.5 transition-all group-hover:font-bold">
            Library
          </span>
          {currentView === 'library' && (
            <span className="w-1.5 h-1.5 rounded-full bg-white mt-0.5 shadow-sm" />
          )}
        </button>

        {/* 4. Profile / Menu Button with Zoom Micro-Animation */}
        <button
          type="button"
          onClick={onOpenProfileMenu}
          className={`group relative flex flex-col items-center justify-center py-1.5 px-3.5 rounded-2xl transition-all duration-300 transform-gpu cursor-pointer active:scale-75 hover:scale-110 ${
            currentView === 'membership' || currentView === 'creator' || currentView === 'admin'
              ? 'text-white bg-white/15 shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-white/10'
          }`}
          title="Profile & Menu"
        >
          <div className="relative">
            <User
              className={`w-5 h-5 transition-transform duration-300 ease-out group-hover:scale-125 group-hover:-translate-y-1 ${
                currentView === 'membership' || currentView === 'creator' || currentView === 'admin'
                  ? 'stroke-[2.5px] scale-110'
                  : 'stroke-[1.75px]'
              }`}
            />
            {isVIP && (
              <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-white ring-2 ring-black" />
            )}
          </div>
          <span className="text-[10px] font-medium tracking-tight mt-0.5 transition-all group-hover:font-bold">
            Profile
          </span>
          {(currentView === 'membership' || currentView === 'creator' || currentView === 'admin') && (
            <span className="w-1.5 h-1.5 rounded-full bg-white mt-0.5 shadow-sm" />
          )}
        </button>
      </nav>
    </div>
  );
};
