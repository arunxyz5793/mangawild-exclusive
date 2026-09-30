import React, { useState } from 'react';
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
  Sun,
  Moon,
  Crown,
  UserCheck,
  Edit2,
  Check,
  User as UserIcon,
  Flame,
  Newspaper,
  Users,
  Compass,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { MangaWildLogo } from './MangaWildLogo';
import { UserRole } from '../types/auth';
import { AuthModal } from './AuthModal';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string, params?: Record<string, string>) => void;
  onOpenVIPModal: () => void;
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  onOpenVIPModal,
  onOpenSearch,
}) => {
  const {
    user,
    isAuthenticated,
    role,
    signOut,
    unreadNotifsCount,
    markNotificationsAsRead,
    notifications,
    updateUsername,
    updateUser,
  } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authDefaultRole, setAuthDefaultRole] = useState<'reader' | 'creator' | 'admin'>('reader');

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

  const navLinks = [
    { id: 'browse', label: 'Browse' },
    { id: 'trending', label: 'Leaderboard' },
    { id: 'membership', label: 'Subscription', highlight: true },
    { id: 'creator', label: 'Creator Studio' },
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

  const handleOpenAuth = (defaultRoleChoice: 'reader' | 'creator' | 'admin' = 'reader') => {
    setAuthDefaultRole(defaultRoleChoice);
    setIsAuthModalOpen(true);
    setIsMenuDrawerOpen(false);
  };

  return (
    <>
      {/* Main Navigation Header - Spacious, Open, and Clean */}
      <header
        className={`sticky top-0 z-40 transition-colors backdrop-blur-md border-b ${
          theme === 'dark'
            ? 'bg-[#09090b]/95 border-zinc-800'
            : 'bg-white/95 border-zinc-200 shadow-xs'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4 sm:gap-8">
          {/* Left: MangaWild Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('home')}
              className="focus:outline-none flex items-center cursor-pointer transition-transform active:scale-98"
            >
              <MangaWildLogo size="md" />
            </button>
          </div>

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

          {/* Right: Search, Theme Toggle, Notifications, VIP & 3-Lines Menu */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 ml-auto">
            {/* Search Button */}
            <button
              onClick={onOpenSearch}
              className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl border transition-all duration-200 active:scale-95 cursor-pointer shadow-xs ${
                theme === 'dark'
                  ? 'bg-zinc-900/90 hover:bg-zinc-800 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white'
                  : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 hover:border-zinc-300 text-zinc-700 hover:text-zinc-950'
              }`}
              title="Search Manga Catalog (Ctrl+K)"
            >
              <Search className="w-4 h-4 text-zinc-400 shrink-0" />
              <span className="hidden md:inline text-xs font-medium text-zinc-400">Search...</span>
            </button>

            {/* Dark / Light Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl transition-all duration-150 active:scale-95 cursor-pointer flex items-center justify-center ${
                theme === 'dark'
                  ? 'text-zinc-200 hover:text-white hover:bg-zinc-800'
                  : 'text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100'
              }`}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsNotifOpen(!isNotifOpen);
                  if (!isNotifOpen) markNotificationsAsRead();
                }}
                className={`relative p-2 rounded-xl transition-all duration-150 active:scale-95 cursor-pointer ${
                  theme === 'dark'
                    ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                }`}
                title="Notifications"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {unreadNotifsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-white dark:bg-zinc-200 animate-pulse" />
                )}
              </button>

              {isNotifOpen && (
                <div
                  className={`absolute right-0 mt-2 w-80 rounded-2xl shadow-2xl p-4 z-50 animate-fade-in-up border ${
                    theme === 'dark'
                      ? 'bg-zinc-900 border-zinc-800 text-white'
                      : 'bg-white border-zinc-200 text-zinc-900'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider font-mono">
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
                          className={`p-2.5 rounded-xl text-xs space-y-1 transition-all ${
                            theme === 'dark' ? 'bg-zinc-800/60' : 'bg-zinc-100'
                          }`}
                        >
                          <p className="font-bold">{n.title}</p>
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

            {/* Log In Button - Only visible when not authenticated */}
            {!isAuthenticated && (
              <button
                onClick={() => handleOpenAuth('reader')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 text-xs font-bold text-zinc-950 bg-white hover:bg-zinc-200 rounded-xl shadow-xs transition-all uppercase tracking-wide whitespace-nowrap cursor-pointer active:scale-95"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Log In</span>
              </button>
            )}

            {/* Sign Out Button - Direct visible action when authenticated */}
            {isAuthenticated && (
              <button
                onClick={signOut}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 text-xs font-bold text-red-300 hover:text-white bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 rounded-xl transition-all uppercase tracking-wide whitespace-nowrap cursor-pointer active:scale-95"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}

            {/* Prominent Three-Lines Menu Button */}
            <button
              onClick={() => {
                setIsMenuDrawerOpen(!isMenuDrawerOpen);
                setNewUsernameInput(user.username || '');
                setIsEditingUsername(false);
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-150 active:scale-95 cursor-pointer font-bold text-xs ${
                isMenuDrawerOpen
                  ? 'bg-white text-zinc-950 border-white shadow-md'
                  : theme === 'dark'
                  ? 'border-zinc-800 bg-zinc-900/90 text-white hover:bg-zinc-800 hover:border-zinc-700'
                  : 'border-zinc-300 bg-zinc-50 text-zinc-900 hover:bg-zinc-100 hover:border-zinc-400'
              }`}
              title="Open Menu & Profile"
              aria-label="Open Menu & Profile"
            >
              <Menu className="w-5 h-5 text-current" />
              <span className="hidden sm:inline font-mono uppercase tracking-wider">Menu</span>
            </button>
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
                    alt={user.name}
                    className="w-13 h-13 rounded-2xl object-cover bg-zinc-800 border-2 border-zinc-700 shadow-md shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-sm font-black truncate">{user.name}</p>
                      <span
                        className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-bold border shrink-0 ${
                          user.role === 'admin'
                            ? 'bg-purple-950/80 text-purple-300 border-purple-800'
                            : user.role === 'creator'
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                            : user.role === 'subscriber'
                            ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}
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
              </div>
            )}

            {/* Navigation Links in Drawer */}
            <div className="p-4 space-y-1.5 flex-1">
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider px-3 mb-2">
                Main Dashboards & Sections
              </p>

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

              {/* Creator Studio Dashboard */}
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

              {/* Admin Suite Dashboard */}
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

              {/* Subscription Membership */}
              <button
                onClick={() => {
                  onNavigate('membership');
                  setIsMenuDrawerOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl font-medium text-xs flex items-center justify-between transition-all cursor-pointer ${
                  currentView === 'membership'
                    ? 'bg-zinc-800 text-white font-bold'
                    : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Crown className="w-4 h-4 text-white" />
                  <span>Subscription Plans</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">Plans</span>
              </button>

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
                    onNavigate('trending');
                    setIsMenuDrawerOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <Flame className="w-4 h-4" />
                  <span>Trending Leaderboard</span>
                </button>

                <button
                  onClick={() => {
                    onNavigate('creators');
                    setIsMenuDrawerOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  <span>Creators Directory</span>
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
                  className="w-full py-2.5 px-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 hover:bg-red-900/60 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98"
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
        onSuccess={() => {
          setIsAuthModalOpen(false);
        }}
      />
    </>
  );
};
