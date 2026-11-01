import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Shield,
  PenTool,
  Sparkles,
  LogOut,
  Menu,
  X,
  BookOpen,
  Crown,
  Edit2,
  Check,
  User as UserIcon,
  Flame,
  Newspaper,
  Compass,
  ChevronRight,
  Sun,
  Moon,
  Upload,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { StorageService } from '../services/storage';
import { MangaWildLogo } from './MangaWildLogo';
import { AuthModal } from './AuthModal';
import { getAvatarUrl, readImageFileAsDataUrl } from '../utils/avatar';

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
  onOpenSearch,
}) => {
  const {
    user,
    isAuthenticated,
    isVIP,
    signOut,
    updateUsername,
    updateUser,
    toggleCreatorMode,
  } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const scrollTimeoutRef = useRef<number | null>(null);
  const lastScrollYRef = useRef(0);

  // Synchronized scroll listener:
  // Hides header while actively scrolling (up or down) so it never blocks viewport content,
  // and immediately reveals header as soon as scrolling stops.
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = Math.abs(currentScrollY - lastScrollYRef.current);
      lastScrollYRef.current = currentScrollY;

      if (currentScrollY <= 10) {
        setIsHeaderVisible(true);
        if (scrollTimeoutRef.current) {
          window.clearTimeout(scrollTimeoutRef.current);
        }
        return;
      }

      if (delta > 2) {
        setIsHeaderVisible(false);
      }

      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = window.setTimeout(() => {
        setIsHeaderVisible(true);
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

  // Listen for bottom nav Profile / Menu trigger
  useEffect(() => {
    const handleToggleMenu = () => setIsMenuDrawerOpen(prev => !prev);
    window.addEventListener('mw-toggle-menu', handleToggleMenu);
    return () => window.removeEventListener('mw-toggle-menu', handleToggleMenu);
  }, []);

  // Lock background scroll when menu drawer is open
  useEffect(() => {
    if (isMenuDrawerOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isMenuDrawerOpen]);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authDefaultRole, setAuthDefaultRole] = useState<'reader' | 'creator' | 'admin'>('reader');
  const [authDefaultMode, setAuthDefaultMode] = useState<'signin' | 'signup'>('signup');

  // Account inline edit state
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newNameInput, setNewNameInput] = useState(user.name || '');
  const [newUsernameInput, setNewUsernameInput] = useState(user.username || '');
  const [newEmailInput, setNewEmailInput] = useState(user.email || '');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readImageFileAsDataUrl(file, 512, 0.85);
      updateUser({ avatarUrl: dataUrl });
    } catch {
      // ignore error
    }
  };

  // Only display Creator Studio for creators or admins
  const isCreatorOrAdmin = user.role === 'creator' || user.role === 'admin';

  const navLinks = [
    { id: 'browse', label: 'Browse', icon: Compass },
    { id: 'new_series', label: 'New Releases', icon: Sparkles },
    { id: 'membership', label: 'Exclusive', icon: Crown, highlight: true },
    ...(isCreatorOrAdmin ? [{ id: 'creator', label: 'Creator Studio', icon: PenTool }] : []),
    { id: 'news', label: 'Manga News', icon: Flame },
    { id: 'library', label: 'My Library', icon: BookOpen },
  ];

  const handleSaveUsername = (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError(null);
    const cleanUser = newUsernameInput.trim().replace(/^@+/, '').toLowerCase();
    if (cleanUser !== (user.username || '').toLowerCase()) {
      const res = updateUsername(cleanUser);
      if (!res.success) {
        setUsernameError(res.error || 'Failed to update username');
        return;
      }
    }

    const cleanEmail = newEmailInput.trim().toLowerCase();
    if (cleanEmail && cleanEmail !== (user.email || '').toLowerCase()) {
      if (!cleanEmail.includes('@')) {
        setUsernameError('Please enter a valid email address.');
        return;
      }
      const existingEmailUser = StorageService.getUsers().find(
        u => u.id !== user.id && u.email && u.email.toLowerCase() === cleanEmail
      );
      if (existingEmailUser) {
        setUsernameError('This email is already in use by another account.');
        return;
      }
    }

    if (newPasswordInput.trim() && newPasswordInput.trim().length < 4) {
      setUsernameError('Password must be at least 4 characters.');
      return;
    }

    const updates: Partial<typeof user> = {
      name: newNameInput.trim() || cleanUser || user.name,
      username: cleanUser || user.username,
    };
    if (cleanEmail) {
      updates.email = cleanEmail;
    }
    if (newPasswordInput.trim()) {
      updates.password = newPasswordInput.trim();
    }

    updateUser(updates);
    setNewPasswordInput('');
    setIsEditingUsername(false);
  };

  const handleOpenAuth = (
    defaultRoleChoice: 'reader' | 'creator' | 'admin' = 'reader',
    defaultModeChoice: 'signin' | 'signup' = 'signup'
  ) => {
    setAuthDefaultRole(defaultRoleChoice);
    setAuthDefaultMode(defaultModeChoice);
    setIsAuthModalOpen(true);
    setIsMenuDrawerOpen(false);
  };

  return (
    <>
      {/* Static layout spacer to maintain top margin for page content */}
      <div className="h-14 sm:h-16 w-full shrink-0 pointer-events-none" aria-hidden="true" />

      {/* Flush Top Header Bar with ONLY Bottom Corners Curved (Merged with Top Website Edge per User Screenshot) */}
      <header
        className={`fixed top-0 left-0 right-0 w-full z-40 transition-all duration-250 ease-out pointer-events-auto ${
          isHeaderVisible
            ? 'translate-y-0 opacity-100'
            : '-translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div
          className={`relative w-full max-w-7xl mx-auto backdrop-blur-2xl border-b border-x rounded-b-[1.75rem] sm:rounded-b-[2.5rem] px-3.5 sm:px-7 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-6 max-w-full box-border transition-colors duration-200 ${
            theme === 'light'
              ? 'bg-white border-black text-black shadow-[0_4px_20px_rgba(0,0,0,0.06)]'
              : 'bg-black/95 border-white/20 text-white shadow-[0_8px_30px_rgba(0,0,0,0.85)]'
          }`}
        >
          {/* Left: MangaWild Logo */}
          <button
            onClick={() => onNavigate('home')}
            className="focus:outline-none flex items-center cursor-pointer transition-transform duration-150 active:scale-95 shrink-0"
            title="MangaWild Home"
          >
            <MangaWildLogo size="sm" />
          </button>

          {/* Menu Buttons & Actions */}
          <div className="flex items-center justify-between flex-1 gap-2 sm:gap-6 pointer-events-auto min-w-0">
            {/* Center: Minimalist Uniform Line-Art Navigation Icons */}
            <nav className="hidden md:flex items-center gap-1 sm:gap-1.5" aria-label="Main Navigation">
              {navLinks.map(link => {
                const isActive = currentView === link.id;
                const IconComponent = link.icon;
                return (
                  <button
                    key={link.id}
                    onClick={() => onNavigate(link.id)}
                    title={link.label}
                    aria-label={link.label}
                    className={`group relative p-2 rounded-xl transition-all duration-150 cursor-pointer active:scale-95 flex items-center justify-center border ${
                      isActive
                        ? theme === 'light'
                          ? 'text-black bg-zinc-200 border-zinc-400 shadow-xs'
                          : 'text-white bg-white/15 border-white/25 shadow-xs'
                        : link.highlight
                        ? theme === 'light'
                          ? 'text-zinc-800 hover:text-black hover:bg-zinc-100 border-zinc-300'
                          : 'text-zinc-200 hover:text-white hover:bg-white/[0.08] border-white/10'
                        : theme === 'light'
                        ? 'text-zinc-600 hover:text-black hover:bg-zinc-100 border-transparent'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.06] border-transparent'
                    }`}
                  >
                    <IconComponent
                      className={`w-4 h-4 shrink-0 transition-transform duration-150 group-hover:scale-110 ${
                        isActive ? 'stroke-[2.25px]' : 'stroke-[1.75px]'
                      }`}
                    />
                    {isActive && (
                      <span
                        className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                          theme === 'light' ? 'bg-black' : 'bg-white'
                        }`}
                      />
                    )}
                  </button>
                );
              })}

              {user.role === 'admin' && (
                <button
                  onClick={() => onNavigate('admin')}
                  title="Admin Suite"
                  aria-label="Admin Suite"
                  className={`group relative p-2 rounded-xl transition-all duration-150 cursor-pointer active:scale-95 flex items-center justify-center border ${
                    currentView === 'admin'
                      ? theme === 'light'
                        ? 'text-black bg-zinc-200 border-zinc-400 shadow-xs'
                        : 'text-white bg-white/15 border-white/25 shadow-xs'
                      : theme === 'light'
                      ? 'text-zinc-600 hover:text-black hover:bg-zinc-100 border-transparent'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.06] border-transparent'
                  }`}
                >
                  <Shield
                    className={`w-4 h-4 shrink-0 transition-transform duration-150 group-hover:scale-110 ${
                      currentView === 'admin' ? 'stroke-[2.25px]' : 'stroke-[1.75px]'
                    }`}
                  />
                  {currentView === 'admin' && (
                    <span
                      className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                        theme === 'light' ? 'bg-black' : 'bg-white'
                      }`}
                    />
                  )}
                </button>
              )}
            </nav>

            {/* Right: Search, Theme Toggle, VIP, Log In & Menu (Notification Bell Removed per Request) */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto max-w-full box-border">
              {/* Search Button */}
              <button
                onClick={onOpenSearch}
                className={`p-1.5 sm:px-3 sm:py-1.5 rounded-xl border transition-all duration-150 active:scale-95 cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  theme === 'light'
                    ? 'border-zinc-300 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-black'
                    : 'border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white'
                }`}
                title="Search Manga Catalog (Ctrl+K)"
              >
                <Search className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden md:inline text-xs font-semibold">Search</span>
              </button>

              {/* Black / White Theme Switcher */}
              <button
                type="button"
                onClick={toggleTheme}
                className={`p-1.5 sm:p-2 rounded-xl border transition-all duration-150 active:scale-95 cursor-pointer shrink-0 flex items-center justify-center ${
                  theme === 'light'
                    ? 'border-zinc-300 bg-zinc-100 hover:bg-zinc-200 text-zinc-900'
                    : 'border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white'
                }`}
                title={theme === 'dark' ? 'Switch to White Theme' : 'Switch to Black Theme'}
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <Moon className="w-3.5 h-3.5 shrink-0" />
                )}
              </button>

              {/* Exclusive Button */}
              <button
                type="button"
                onClick={() => onNavigate('membership')}
                className={`flex items-center gap-1 p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-95 border shrink-0 ${
                  theme === 'light'
                    ? 'border-zinc-300 bg-zinc-100 hover:bg-zinc-200 text-zinc-900'
                    : 'border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 hover:text-white'
                }`}
                title="MangaWild Exclusive Membership"
              >
                <Crown className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline tracking-wide">Exclusive</span>
                {isVIP && (
                  <span className="hidden sm:inline text-[8px] tracking-wider uppercase bg-white/15 px-1 py-0.2 rounded font-bold">
                    ACTIVE
                  </span>
                )}
              </button>

              {/* Log In Button */}
              {!isAuthenticated && (
                <button
                  onClick={() => handleOpenAuth('reader')}
                  className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-1.5 text-xs font-bold text-black bg-white hover:bg-zinc-200 rounded-xl transition-all whitespace-nowrap cursor-pointer active:scale-95 shadow-xs shrink-0"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Log In</span>
                </button>
              )}

              {/* Sign Out Button (Hidden on tablet & mobile so it never overflows the header frame; located at the very end of the Menu drawer) */}
              {isAuthenticated && (
                <button
                  onClick={signOut}
                  className={`hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer active:scale-95 border ${
                    theme === 'light'
                      ? 'text-zinc-600 hover:text-black bg-transparent hover:bg-zinc-100 border-transparent hover:border-zinc-300'
                      : 'text-zinc-400 hover:text-white bg-transparent hover:bg-white/[0.06] border-transparent hover:border-white/10'
                  }`}
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              )}

              {/* Menu Button */}
              <button
                onClick={() => {
                  setIsMenuDrawerOpen(!isMenuDrawerOpen);
                  setNewUsernameInput(user.username || '');
                  setIsEditingUsername(false);
                }}
                className={`p-1.5 sm:p-2 rounded-xl border transition-all duration-150 active:scale-95 cursor-pointer shrink-0 ${
                  isMenuDrawerOpen
                    ? 'bg-white text-black border-white shadow-sm'
                    : theme === 'light'
                    ? 'border-zinc-300 bg-zinc-100 hover:bg-zinc-200 text-zinc-900'
                    : 'border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 hover:text-white'
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
                    src={getAvatarUrl(user.avatarUrl)}
                    alt={user.username}
                    className="w-13 h-13 rounded-2xl object-cover bg-zinc-800 border-2 border-zinc-700 shadow-md shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-sm font-black truncate">{user.name || `@${user.username}`}</p>
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

                    {/* Account Details Display & Edit Form */}
                    <div className="mt-1">
                      {isEditingUsername ? (
                        <form onSubmit={handleSaveUsername} className="mt-2 space-y-2">
                          <input
                            type="text"
                            value={newNameInput}
                            onChange={e => setNewNameInput(e.target.value)}
                            placeholder="Display Name"
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-white"
                          />
                          <div className="flex items-center gap-1">
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
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-white font-mono focus:outline-none focus:border-white"
                            />
                          </div>
                          <input
                            type="email"
                            value={newEmailInput}
                            onChange={e => setNewEmailInput(e.target.value)}
                            placeholder="Email address"
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-white font-mono focus:outline-none focus:border-white"
                          />
                          <input
                            type="password"
                            value={newPasswordInput}
                            onChange={e => setNewPasswordInput(e.target.value)}
                            placeholder="New password (optional)"
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-white font-mono focus:outline-none focus:border-white"
                          />
                          {usernameError && (
                            <p className="text-[10px] text-red-400 font-mono">{usernameError}</p>
                          )}
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <button
                              type="submit"
                              className="px-3 py-1.5 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Save</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsEditingUsername(false);
                                setUsernameError(null);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Cancel</span>
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-mono text-zinc-400">
                              @{user.username || 'username'}
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setNewNameInput(user.name || '');
                                setNewUsernameInput(user.username || '');
                                setNewEmailInput(user.email || '');
                                setNewPasswordInput('');
                                setUsernameError(null);
                                setIsEditingUsername(true);
                              }}
                              className="text-[10px] text-zinc-500 hover:text-white flex items-center gap-0.5 hover:underline font-mono cursor-pointer"
                              title="Edit Account"
                            >
                              <Edit2 className="w-2.5 h-2.5" />
                              <span>Edit</span>
                            </button>
                          </div>
                          <p className="text-[11px] text-zinc-500 truncate mt-0.5">{user.email}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Profile Photo Upload from Device Only */}
                <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-zinc-400">Profile Photo</span>
                  <label className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors">
                    <Upload className="w-3 h-3" />
                    <span>Upload Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Active Exclusive Subscription Card in Drawer */}
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
                              {user.subscription?.planId === 'yearly' ? 'Annual Exclusive' : 'Monthly Exclusive'}
                            </p>
                            <span className="text-[9px] bg-white text-zinc-950 px-1.5 py-0.5 font-mono font-bold rounded">
                              ACTIVE
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                            {user.subscription?.expiresAt
                              ? `Expires: ${new Date(user.subscription.expiresAt).toLocaleDateString()}`
                              : 'All Exclusive perks unlocked'}
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
                    <span>Creator Profile</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400 font-bold">Edit</span>
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
                  <span>Library</span>
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
                    <span>Creator Studio</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">70% Share</span>
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
                    <span>Admin Suite</span>
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
                            Exclusive Membership
                          </span>
                          <span className="text-[9px] bg-white text-black px-1.5 py-0.5 rounded font-black font-mono uppercase">
                            Exclusive
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
                  <span>Catalog</span>
                </button>

                <button
                  onClick={() => {
                    onNavigate('new_series');
                    setIsMenuDrawerOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-zinc-300" />
                  <span>Releases</span>
                </button>

                <button
                  onClick={() => {
                    onNavigate('news');
                    setIsMenuDrawerOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 rounded-xl text-xs flex items-center gap-3 transition-colors cursor-pointer ${
                    theme === 'dark'
                      ? 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                      : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
                  }`}
                >
                  <Newspaper className="w-4 h-4" />
                  <span>News</span>
                </button>
              </div>
            </div>

            {/* Drawer Footer with Sign Out when authenticated */}
            {isAuthenticated && (
              <div
                className={`mt-auto sticky bottom-0 p-4 border-t backdrop-blur-md ${
                  theme === 'dark'
                    ? 'border-zinc-800/80 bg-[#0e0e12]/95'
                    : 'border-zinc-200 bg-white/95'
                }`}
              >
                <button
                  onClick={() => {
                    signOut();
                    setIsMenuDrawerOpen(false);
                  }}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98 border ${
                    theme === 'dark'
                      ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700/80 text-zinc-300 hover:text-white'
                      : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-800 hover:text-black'
                  }`}
                >
                  <LogOut className="w-4 h-4 text-red-500" />
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
