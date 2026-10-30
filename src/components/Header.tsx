import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Bell,
  Shield,
  PenTool,
  Sparkles,
  LogOut,
  Menu,
  X,
  BookOpen,
  Crown,
  UserCheck,
  Edit2,
  Check,
  User as UserIcon,
  Flame,
  Newspaper,
  Users,
  Compass,
  Calculator,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { StorageService } from '../services/storage';
import { MangaWildLogo } from './MangaWildLogo';
import { UserRole } from '../types/auth';
import { AuthModal } from './AuthModal';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string, params?: Record<string, string>) => void;
  onOpenVIPModal: () => void;
  onOpenSearch: () => void;
  onOpenCancelCalc?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  onOpenVIPModal,
  onOpenSearch,
  onOpenCancelCalc,
}) => {
  const {
    user,
    isAuthenticated,
    isVIP,
    role,
    signOut,
    unreadNotifsCount,
    markNotificationsAsRead,
    notifications,
    updateUsername,
    updateUser,
    toggleCreatorMode,
  } = useAuth();
  const { theme } = useTheme();

  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const lastScrollYRef = useRef(0);

  // Direction-aware scroll listener:
  // - Scrolls down: slides header out with animation, blur removed, buttons hidden
  // - Scrolls up slightly: slides header down immediately with blur and buttons restored
  // - At top: always visible
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const lastScrollY = lastScrollYRef.current;
      const delta = currentScrollY - lastScrollY;

      if (currentScrollY <= 20) {
        setIsHeaderVisible(true);
        setIsScrolledDown(false);
      } else {
        setIsScrolledDown(true);

        // User scrolling DOWN past 60px: hide header
        if (delta > 6 && currentScrollY > 60) {
          setIsHeaderVisible(false);
          setIsNotifOpen(false);
        }
        // User scrolling UP: immediately reveal header
        else if (delta < -4) {
          setIsHeaderVisible(true);
        }
      }

      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Listen for bottom nav Profile / Menu trigger
  useEffect(() => {
    const handleToggleMenu = () => setIsMenuDrawerOpen(prev => !prev);
    window.addEventListener('mw-toggle-menu', handleToggleMenu);
    return () => window.removeEventListener('mw-toggle-menu', handleToggleMenu);
  }, []);

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authDefaultRole, setAuthDefaultRole] = useState<'reader' | 'creator' | 'admin'>('reader');
  const [authDefaultMode, setAuthDefaultMode] = useState<'signin' | 'signup'>('signin');

  // Username inline edit state
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsernameInput, setNewUsernameInput] = useState(user.username || '');
  const [usernameError, setUsernameError] = useState<string | null>(null);

  // Avatar picker state
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');

  const AVATAR_OPTIONS = [
    { id: 'av1', url: '/avatars/avatar-1.svg', name: 'Hero' },
    { id: 'av2', url: '/avatars/avatar-2.svg', name: 'Cyber' },
    { id: 'av3', url: '/avatars/avatar-3.svg', name: 'Artist' },
    { id: 'av4', url: '/avatars/avatar-4.svg', name: 'Anime' },
    { id: 'av5', url: '/avatars/avatar-5.svg', name: 'Ronin' },
    { id: 'av6', url: '/avatars/avatar-6.svg', name: 'Chibi' },
  ];

  // Only display Creator Studio for creators or admins
  const isCreatorOrAdmin = user.role === 'creator' || user.role === 'admin';

  const navLinks = [
    { id: 'browse', label: 'Browse' },
    { id: 'new_series', label: 'New Series' },
    { id: 'membership', label: 'Subscription', highlight: true },
    ...(isCreatorOrAdmin ? [{ id: 'creator', label: 'Creator Studio' }] : []),
    { id: 'news', label: 'Manga News' },
    { id: 'library', label: 'My Library' },
  ];

  const handleSaveUsername = (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError(null);
    const res = updateUsername(newUsernameInput);
    if (res.success) {
      setIsEditingUsername(false);
    } else {
      setUsernameError(res.error || 'Failed to update username');
    }
  };

  const handleOpenAuth = (
    defaultRoleChoice: 'reader' | 'creator' | 'admin' = 'reader',
    defaultModeChoice: 'signin' | 'signup' = 'signin'
  ) => {
    setAuthDefaultRole(defaultRoleChoice);
    setAuthDefaultMode(defaultModeChoice);
    setIsAuthModalOpen(true);
    setIsMenuDrawerOpen(false);
  };

  return (
    <>
      {/* Static layout spacer to maintain top margin for page content */}
      <div className="h-16 sm:h-20 w-full shrink-0 pointer-events-none" aria-hidden="true" />

      {/* Floating Island Header Bar with Curved Bezels and Frosted Glass Effect */}
      <header
        className={`fixed top-2.5 sm:top-3.5 left-3 right-3 sm:left-6 sm:right-6 max-w-6xl mx-auto z-40 transition-all duration-300 ease-out pointer-events-auto ${
          isHeaderVisible
            ? 'translate-y-0 opacity-100'
            : '-translate-y-24 opacity-0 pointer-events-none'
        }`}
      >
        <div className="relative bg-black/75 backdrop-blur-2xl border border-white/15 rounded-2xl sm:rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.85)] px-3 sm:px-5 py-2 sm:py-2.5 flex items-center justify-between gap-3 sm:gap-6">
          {/* Left: MangaWild Logo inside curved island bar */}
          <button
            onClick={() => onNavigate('home')}
            className="focus:outline-none flex items-center cursor-pointer transition-transform duration-150 active:scale-95 shrink-0"
            title="MangaWild Home"
          >
            <MangaWildLogo size="sm" />
          </button>

          {/* Menu Buttons & Actions - Clickable when header is in view */}
          <div className="flex items-center justify-between flex-1 gap-4 sm:gap-8 pointer-events-auto">
            {/* Center: Clean Text Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-semibold">
            {navLinks.map(link => {
              const isActive = currentView === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => onNavigate(link.id)}
                  className={`transition-all duration-150 whitespace-nowrap cursor-pointer relative py-1 active:scale-95 ${
                    isActive
                      ? theme === 'dark'
                        ? 'text-white border-b-2 border-white'
                        : 'text-zinc-950 border-b-2 border-zinc-950'
                      : link.highlight
                      ? 'text-zinc-200 hover:text-white font-bold'
                      : theme === 'dark'
                      ? 'text-zinc-400 hover:text-white'
                      : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}

            {user.role === 'admin' && (
              <button
                onClick={() => onNavigate('admin')}
                className={`transition-all duration-150 whitespace-nowrap font-bold flex items-center gap-1.5 cursor-pointer py-1 active:scale-95 ${
                  currentView === 'admin'
                    ? 'text-white border-b-2 border-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Shield className="w-4 h-4 text-white" />
                <span>Admin Suite</span>
              </button>
            )}
          </nav>

          {/* Right: Search, Theme Toggle, Notifications, VIP & Menu */}
          <div className="flex items-center gap-1 sm:gap-2.5 shrink-0 ml-auto">
            {/* Search Button (Minimalist pill with ⌘K badge) */}
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-200 transition-all duration-150 active:scale-95 cursor-pointer"
              title="Search Manga Catalog (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="hidden md:inline text-xs text-zinc-400">Search</span>
              <kbd className="hidden md:inline-block px-1 py-0.2 rounded text-[9px] font-mono font-medium text-zinc-500 bg-white/[0.06] border border-white/[0.06]">
                ⌘K
              </kbd>
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsNotifOpen(!isNotifOpen);
                  if (!isNotifOpen) markNotificationsAsRead();
                }}
                className={`relative p-1.5 sm:p-2 rounded-xl transition-all duration-150 active:scale-95 cursor-pointer border border-transparent ${
                  theme === 'dark'
                    ? 'text-zinc-400 hover:text-white hover:bg-white/[0.06] hover:border-white/[0.08]'
                    : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                }`}
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                )}
              </button>

              {isNotifOpen && (
                <div
                  className={`absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl shadow-2xl p-4 z-50 animate-fade-in-up border ${
                    theme === 'dark'
                      ? 'bg-zinc-950/95 backdrop-blur-xl border-white/10 text-white'
                      : 'bg-white border-zinc-200 text-zinc-900'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                      Notifications
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {notifications.length} updates
                    </span>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-zinc-500 py-3 text-center">No notifications</p>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          className={`p-2.5 rounded-xl text-xs space-y-1 transition-all border border-white/[0.04] ${
                            theme === 'dark' ? 'bg-white/[0.03]' : 'bg-zinc-100'
                          }`}
                        >
                          <p className="font-semibold text-zinc-200">{n.title}</p>
                          <p
                            className={`text-[11px] leading-tight ${
                              theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'
                            }`}
                          >
                            {n.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* VIP Button (Minimalist refined badge) */}
            <button
              type="button"
              onClick={() => onNavigate('membership')}
              className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer active:scale-95 border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white"
              title="MangaWild VIP Pass & Membership"
            >
              <Crown className="w-3.5 h-3.5 text-zinc-200" />
              <span className="tracking-wide">VIP</span>
              {isVIP && (
                <span className="text-[8px] tracking-wider uppercase bg-white/10 text-white border border-white/20 px-1 py-0.2 rounded font-mono font-semibold">
                  PRO
                </span>
              )}
            </button>

            {/* Log In Button - Minimal monochrome pill */}
            {!isAuthenticated && (
              <button
                onClick={() => handleOpenAuth('reader')}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-black bg-white hover:bg-zinc-200 rounded-xl transition-all whitespace-nowrap cursor-pointer active:scale-95 shadow-xs"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Log In</span>
              </button>
            )}

            {/* Sign Out Button */}
            {isAuthenticated && (
              <button
                onClick={signOut}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-white bg-transparent hover:bg-white/[0.06] border border-transparent hover:border-white/10 rounded-xl transition-all whitespace-nowrap cursor-pointer active:scale-95"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}

            {/* Menu Button (Minimal icon-first button) */}
            <button
              onClick={() => {
                setIsMenuDrawerOpen(!isMenuDrawerOpen);
                setNewUsernameInput(user.username || '');
                setIsEditingUsername(false);
              }}
              className={`p-2 rounded-xl border transition-all duration-150 active:scale-95 cursor-pointer ${
                isMenuDrawerOpen
                  ? 'bg-white text-black border-white shadow-sm'
                  : 'border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 text-zinc-300 hover:text-white'
              }`}
              title="Open Menu & Profile"
              aria-label="Open Menu & Profile"
            >
              <Menu className="w-4 h-4 text-current" />
            </button>
          </div>
          </div>
        </div>
      </header>

      {/* Side Slide-Out Menu & Profile Drawer */}
      {isMenuDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMenuDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <aside
            className={`relative w-full max-w-sm h-full shadow-2xl flex flex-col z-10 overflow-y-auto border-l transition-all ${
              theme === 'dark'
                ? 'bg-[#0e0e12] border-zinc-800 text-white'
                : 'bg-white border-zinc-200 text-zinc-900'
            }`}
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Menu className="w-5 h-5 text-white" />
                <span className="text-sm font-bold tracking-tight uppercase font-mono">
                  MangaWild Menu
                </span>
              </div>
              <button
                onClick={() => setIsMenuDrawerOpen(false)}
                className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                title="Close Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Card Section */}
            {!isAuthenticated ? (
              <div className="p-5 border-b border-zinc-800/80 bg-zinc-900/40 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-zinc-300 flex items-center justify-center mx-auto border border-zinc-700 shadow-md">
                  <UserIcon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Welcome to MangaWild</h4>
                  <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                    Sign in to customize your profile, follow creators, post comments, and track your reading library.
                  </p>
                </div>
                <button
                  onClick={() => {
                    handleOpenAuth('reader');
                    setIsMenuDrawerOpen(false);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-98"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Log In / Sign Up</span>
                </button>
              </div>
            ) : (
              <div className="p-5 border-b border-zinc-800/80 bg-zinc-900/40">
                <div className="flex items-start gap-3.5">
                  <img
                    src={user.avatarUrl || '/avatars/avatar-1.svg'}
                    alt={user.username}
                    className="w-13 h-13 rounded-2xl object-cover bg-zinc-800 border-2 border-zinc-700 shadow-md shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-sm font-black truncate">@{user.username}</p>
                      <span
                        className="text-[9px] font-mono px-2 py-0.5 rounded uppercase tracking-wider font-bold border shrink-0 bg-zinc-800 text-zinc-300 border-zinc-700"
                      >
                        {user.role === 'creator'
                          ? 'Creator'
                          : user.role === 'admin'
                          ? 'Admin'
                          : user.role === 'subscriber'
                          ? 'Subscriber'
                          : 'Reader'}
                      </span>
                    </div>

                    {/* Username Display & Edit Form */}
                    <div className="mt-1">
                      {isEditingUsername ? (
                        <form onSubmit={handleSaveUsername} className="mt-1 space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-mono text-zinc-500">@</span>
                            <input
                              type="text"
                              value={newUsernameInput}
                              onChange={e =>
                                setNewUsernameInput(
                                  e.target.value.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '')
                                )
                              }
                              placeholder="username"
                              className="w-full px-2 py-1 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-white font-mono focus:outline-none focus:border-white"
                              autoFocus
                            />
                            <button
                              type="submit"
                              className="p-1.5 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 transition-colors cursor-pointer"
                              title="Save Username"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsEditingUsername(false);
                                setUsernameError(null);
                              }}
                              className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {usernameError && (
                            <p className="text-[10px] text-red-400 font-mono">{usernameError}</p>
                          )}
                        </form>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-mono text-zinc-400">
                            @{user.username || 'username'}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setNewUsernameInput(user.username || '');
                              setIsEditingUsername(true);
                            }}
                            className="text-[10px] text-zinc-500 hover:text-white flex items-center gap-0.5 hover:underline font-mono cursor-pointer"
                            title="Edit Custom Username"
                          >
                            <Edit2 className="w-2.5 h-2.5" />
                            <span>Change</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] text-zinc-500 truncate mt-0.5">{user.email}</p>
                  </div>
                </div>

                {/* Minimal Avatar Selector */}
                <div className="mt-3 pt-3 border-t border-zinc-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-zinc-400">Profile Avatar</span>
                    <button
                      type="button"
                      onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                      className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 font-mono hover:underline cursor-pointer"
                    >
                      <Edit2 className="w-2.5 h-2.5" />
                      <span>{showAvatarPicker ? 'Hide Avatars' : 'Change Avatar'}</span>
                    </button>
                  </div>

                  {showAvatarPicker && (
                    <div className="mt-2.5 p-2.5 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2.5">
                      <p className="text-[10px] text-zinc-400 font-mono">Select a minimal avatar:</p>
                      <div className="grid grid-cols-6 gap-1.5">
                        {AVATAR_OPTIONS.map(av => (
                          <button
                            key={av.id}
                            type="button"
                            onClick={() => {
                              updateUser({ avatarUrl: av.url });
                            }}
                            className={`p-1 rounded-xl border transition-all cursor-pointer flex flex-col items-center ${
                              user.avatarUrl === av.url
                                ? 'border-white bg-zinc-800 ring-1 ring-white'
                                : 'border-zinc-800 hover:border-zinc-600 bg-zinc-900'
                            }`}
                            title={av.name}
                          >
                            <img src={av.url} alt={av.name} className="w-7 h-7 rounded-lg object-cover" />
                          </button>
                        ))}
                      </div>

                      {/* Custom image URL input */}
                      <div className="pt-2 border-t border-zinc-900 flex items-center gap-1.5">
                        <input
                          type="url"
                          value={customAvatarUrl}
                          onChange={e => setCustomAvatarUrl(e.target.value)}
                          placeholder="Or paste custom image URL..."
                          className="w-full px-2 py-1 text-[11px] rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (customAvatarUrl.trim()) {
                              updateUser({ avatarUrl: customAvatarUrl.trim() });
                              setCustomAvatarUrl('');
                            }
                          }}
                          className="px-2.5 py-1 text-[10px] font-bold bg-white text-zinc-950 rounded-lg hover:bg-zinc-200 transition-colors cursor-pointer shrink-0"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Active VIP Subscription Card in Drawer */}
                {isVIP && (
                  <div className="mt-3.5 p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-md">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-zinc-800 text-white border border-zinc-700 flex items-center justify-center shrink-0">
                          <Crown className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-white">
                              {user.subscription?.planId === 'yearly' ? 'Annual VIP Pass' : 'Monthly VIP Pass'}
                            </p>
                            <span className="text-[9px] bg-white text-zinc-950 px-1.5 py-0.5 font-mono font-bold rounded">
                              ACTIVE
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                            {user.subscription?.expiresAt
                              ? `Expires: ${new Date(user.subscription.expiresAt).toLocaleDateString()}`
                              : 'All VIP perks unlocked'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onNavigate('membership');
                          setIsMenuDrawerOpen(false);
                        }}
                        className="text-[11px] font-semibold text-zinc-300 hover:text-white underline font-mono cursor-pointer shrink-0"
                      >
                        Plan Details
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Links in Drawer */}
            <div className="p-4 space-y-1.5 flex-1">
              {/* Account Mode Switcher (Reader <-> Creator) */}
              {isAuthenticated && (
                isCreatorOrAdmin ? (
                  <div className="p-3 mb-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-3 shadow-md">
                    <div>
                      <p className="text-xs font-bold text-white flex items-center gap-1.5">
                        <PenTool className="w-3.5 h-3.5 text-zinc-300" />
                        <span>Creator Mode Active</span>
                      </p>
                      <p className="text-[11px] text-zinc-400">Manage series and profile</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        toggleCreatorMode();
                        setIsMenuDrawerOpen(false);
                        onNavigate('home');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold shrink-0 cursor-pointer border border-zinc-700 transition-all active:scale-95"
                    >
                      Switch to Reader
                    </button>
                  </div>
                ) : (
                  <div className="p-3 mb-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-3 shadow-md">
                    <div>
                      <p className="text-xs font-bold text-white flex items-center gap-1.5">
                        <PenTool className="w-3.5 h-3.5 text-zinc-300" />
                        <span>Publish Your Manga</span>
                      </p>
                      <p className="text-[11px] text-zinc-400">Switch account to Creator Mode</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        toggleCreatorMode();
                        setIsMenuDrawerOpen(false);
                        onNavigate('creator');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold shrink-0 cursor-pointer shadow-md transition-all active:scale-98"
                    >
                      Switch to Creator
                    </button>
                  </div>
                )
              )}

              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider px-3 mb-2">
                Main Dashboards & Sections
              </p>

              {/* My Creator Profile Button (Only for Creators & Admins) */}
              {isAuthenticated && isCreatorOrAdmin && (
                <button
                  onClick={() => {
                    const myProfile = StorageService.getOrCreateCreatorProfile(user);
                    onNavigate('creator-profile', { id: myProfile.id });
                    setIsMenuDrawerOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl font-medium text-xs flex items-center justify-between transition-all cursor-pointer ${
                    currentView === 'creator-profile'
                      ? 'bg-zinc-800 text-white font-bold border border-zinc-700'
                      : theme === 'dark'
                      ? 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                      : 'text-zinc-800 hover:bg-zinc-100 hover:text-zinc-950'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <UserIcon className="w-4 h-4 text-zinc-300" />
                    <span>My Creator Profile & Socials</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400 font-bold">Edit Profile</span>
                </button>
              )}

              {/* Reader Library / Dashboard */}
              <button
                onClick={() => {
                  onNavigate('library');
                  setIsMenuDrawerOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl font-medium text-xs flex items-center justify-between transition-all cursor-pointer ${
                  currentView === 'library'
                    ? 'bg-zinc-800 text-white font-bold'
                    : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="w-4 h-4 text-white" />
                  <span>Reader Library & History</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">Reader</span>
              </button>

              {/* Creator Studio Dashboard (Only for Creators & Admins) */}
              {isCreatorOrAdmin && (
                <button
                  onClick={() => {
                    onNavigate('creator');
                    setIsMenuDrawerOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl font-medium text-xs flex items-center justify-between transition-all cursor-pointer ${
                    currentView === 'creator'
                      ? 'bg-zinc-800 text-white font-bold'
                      : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <PenTool className="w-4 h-4 text-white" />
                    <span>Creator Studio & Uploads</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">70% Royalty</span>
                </button>
              )}

              {/* Admin Suite Dashboard (Only for Admins) */}
              {user.role === 'admin' && (
                <button
                  onClick={() => {
                    onNavigate('admin');
                    setIsMenuDrawerOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl font-medium text-xs flex items-center justify-between transition-all cursor-pointer ${
                    currentView === 'admin'
                      ? 'bg-zinc-800 text-white font-bold'
                      : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-white" />
                    <span>Admin Moderation & Approval</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">Approvals</span>
                </button>
              )}

              {/* Prominent VIP Button in Menu */}
              <div className="pt-1 pb-1 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('membership');
                    setIsMenuDrawerOpen(false);
                  }}
                  className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer shadow-md group ${
                    isVIP
                      ? 'bg-zinc-900 border-white/30 text-white'
                      : 'bg-zinc-900/90 hover:bg-zinc-800 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-zinc-800 text-white border border-white/20 flex items-center justify-center shrink-0">
                        <Crown className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-white group-hover:text-zinc-200">
                            VIP Pass & Membership
                          </span>
                          <span className="text-[9px] bg-white text-black px-1.5 py-0.5 rounded font-black font-mono uppercase">
                            VIP
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                          {isVIP ? 'Perks active & unlocked' : 'Unlimited 4K manga & ad-free'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>

                {/* Dedicated Subscription Cancellation & Calculation Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuDrawerOpen(false);
                    if (onOpenCancelCalc) {
                      onOpenCancelCalc();
                    } else {
                      onNavigate('membership');
                    }
                  }}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl font-medium text-xs flex items-center justify-between transition-all cursor-pointer bg-zinc-900/70 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800"
                  title="Subscription Cancellation & Refund Calculator"
                >
                  <div className="flex items-center gap-3">
                    <Calculator className="w-4 h-4 text-zinc-300" />
                    <span>Cancellation & Calculator</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                    Proration
                  </span>
                </button>
              </div>


              <div className="border-t border-zinc-800/80 my-2 pt-2">
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider px-3 mb-2">
                  Browse & Discover
                </p>

                <button
                  onClick={() => {
                    onNavigate('browse');
                    setIsMenuDrawerOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <Compass className="w-4 h-4" />
                  <span>All Manga Catalog</span>
                </button>

                <button
                  onClick={() => {
                    onNavigate('new_series');
                    setIsMenuDrawerOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-zinc-300" />
                  <span>New Series Releases</span>
                </button>

                <button
                  onClick={() => {
                    onNavigate('news');
                    setIsMenuDrawerOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <Newspaper className="w-4 h-4" />
                  <span>Manga News & Updates</span>
                </button>
              </div>
            </div>

            {/* Drawer Footer with Sign Out when authenticated */}
            {isAuthenticated && (
              <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/30">
                <button
                  onClick={() => {
                    signOut();
                    setIsMenuDrawerOpen(false);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* Global Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultRole={authDefaultRole}
        defaultMode={authDefaultMode}
        onSuccess={() => {
          setIsAuthModalOpen(false);
        }}
      />
    </>
  );
};
