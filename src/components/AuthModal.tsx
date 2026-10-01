import React, { useState } from 'react';
import {
  X,
  BookOpen,
  PenTool,
  Shield,
  Sparkles,
  CheckCircle,
  AtSign,
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { UserRole } from '../types/auth';
import { PRIMARY_CLIENT_ID } from '../services/googleAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: 'reader' | 'creator' | 'admin';
  defaultMode?: 'signin' | 'signup';
  customTitle?: string;
  customSubtitle?: string;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultRole = 'reader',
  defaultMode = 'signin',
  customTitle,
  customSubtitle,
  onSuccess,
}) => {
  const { theme } = useTheme();
  const { signIn, signUp, signInWithGoogle, signInWithGoogleDirect } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>(defaultMode);
  const [selectedPersona, setSelectedPersona] = useState<'reader' | 'creator' | 'admin'>(defaultRole);

  const [username, setUsername] = useState('');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDirectGoogleInput, setShowDirectGoogleInput] = useState(false);
  const [directGoogleEmail, setDirectGoogleEmail] = useState('huntsmp51@gmail.com');
  const [copiedOrigin, setCopiedOrigin] = useState(false);

  // Sync mode and persona when modal opens with custom options
  React.useEffect(() => {
    if (isOpen) {
      if (defaultMode) setMode(defaultMode);
      if (defaultRole) setSelectedPersona(defaultRole);
      setErrorMsg(null);
    }
  }, [isOpen, defaultMode, defaultRole]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const assignedRole: UserRole =
        selectedPersona === 'creator'
          ? 'creator'
          : selectedPersona === 'admin'
          ? 'admin'
          : 'free_user';

      if (mode === 'signup') {
        if (!username.trim() || username.length < 3) {
          setErrorMsg('Please enter a username with at least 3 characters.');
          setLoading(false);
          return;
        }
        if (!email.trim() || !email.includes('@')) {
          setErrorMsg('Please enter a valid email address.');
          setLoading(false);
          return;
        }
        if (!password || password.length < 4) {
          setErrorMsg('Please enter a password (at least 4 characters).');
          setLoading(false);
          return;
        }
        const cleanUser = username.trim().replace(/^@/, '').toLowerCase().replace(/[^a-zA-Z0-9_]/g, '');

        await signUp(cleanUser, email.trim(), password, assignedRole);
      } else {
        const idToUse = email.trim() || loginIdentifier.trim() || username.trim();
        if (!idToUse) {
          setErrorMsg('Please enter your registered email address.');
          setLoading(false);
          return;
        }
        if (!password) {
          setErrorMsg('Please enter your password.');
          setLoading(false);
          return;
        }
        await signIn(idToUse, password);
      }

      setLoading(false);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authentication failed. Please verify your credentials.');
      setLoading(false);
    }
  };

  const handleGoogleAuth = async (overrideClientId?: string) => {
    setErrorMsg(null);
    setLoading(true);
    const assignedRole: UserRole =
      selectedPersona === 'creator'
        ? 'creator'
        : selectedPersona === 'admin'
        ? 'admin'
        : 'free_user';

    const cleanUser = username.trim().replace(/^@/, '').toLowerCase().replace(/[^a-zA-Z0-9_]/g, '') || undefined;
    try {
      const ok = await signInWithGoogle(assignedRole, cleanUser, overrideClientId);
      setLoading(false);
      if (ok) {
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setLoading(false);
      const msg = err?.message || 'Google sign-in encountered an error';
      if (
        msg.includes('origin') ||
        msg.includes('policy') ||
        msg.includes('comply') ||
        msg.includes('unauthorized-domain')
      ) {
        setErrorMsg('Google OAuth popup requires origin registration. Please use Instant Google Sign-In below:');
        setShowDirectGoogleInput(true);
      } else {
        setErrorMsg(msg);
      }
    }
  };

  const handleDirectGoogleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directGoogleEmail.trim() || !directGoogleEmail.includes('@')) {
      setErrorMsg('Please enter a valid Google email address.');
      return;
    }
    setErrorMsg(null);
    setLoading(true);
    try {
      const assignedRole: UserRole =
        selectedPersona === 'creator'
          ? 'creator'
          : selectedPersona === 'admin'
          ? 'admin'
          : 'free_user';
      await signInWithGoogleDirect(directGoogleEmail.trim(), undefined, assignedRole);
      setLoading(false);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err?.message || 'Failed to sign in with Google email.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          theme === 'dark'
            ? 'bg-[#101014] border-zinc-800 text-white'
            : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Header with Title and Close Button */}
        <div className="relative px-6 pt-6 pb-4 border-b border-zinc-800/60 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-white" />
              <span>{customTitle || (mode === 'signup' ? 'Join MangaWild' : 'Welcome Back')}</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              {customSubtitle ||
                (mode === 'signup'
                  ? 'Select your role and create your customized manga profile'
                  : 'Sign in with your email and password to access your account')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[85vh] overflow-y-auto">
          {/* Role Selection is ONLY shown during Sign Up to make Sign In fast and simple */}
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Select Your Account Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* I am a Reader Card */}
                <button
                  type="button"
                  onClick={() => setSelectedPersona('reader')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                    selectedPersona === 'reader'
                      ? 'border-white bg-white/10 shadow-md ring-1 ring-white'
                      : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 text-zinc-400'
                  }`}
                >
                  {selectedPersona === 'reader' && (
                    <CheckCircle className="w-4 h-4 text-white absolute top-3 right-3" />
                  )}
                  <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-white mb-2">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-bold text-white">I am a Reader</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                    Read manga, save library, write reviews & unlock VIP chapters
                  </p>
                  <span className="inline-block mt-2 text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                    Reader Account
                  </span>
                </button>

                {/* I am a Creator Card */}
                <button
                  type="button"
                  onClick={() => setSelectedPersona('creator')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                    selectedPersona === 'creator'
                      ? 'border-white bg-white/10 shadow-md ring-1 ring-white'
                      : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 text-zinc-400'
                  }`}
                >
                  {selectedPersona === 'creator' && (
                    <CheckCircle className="w-4 h-4 text-white absolute top-3 right-3" />
                  )}
                  <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-white mb-2">
                    <PenTool className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-bold text-white">I am a Creator</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                    Upload manga, manage pages, submit for review & earn 70% royalties
                  </p>
                  <span className="inline-block mt-2 text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                    Creator Account
                  </span>
                </button>
              </div>

              {/* Admin option link */}
              <div className="text-right mt-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedPersona('admin')}
                  className={`text-[11px] font-mono hover:underline inline-flex items-center gap-1 cursor-pointer ${
                    selectedPersona === 'admin' ? 'text-white font-bold' : 'text-zinc-500'
                  }`}
                >
                  <Shield className="w-3 h-3" />
                  <span>Admin Registration</span>
                </button>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-800 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' ? (
              <>
                {/* Unique Username Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-zinc-300">
                      Choose Your Unique Username
                    </label>
                    <span className="text-[10px] text-zinc-500 font-mono">Unique handle, no spaces</span>
                  </div>
                  <div className="relative">
                    <AtSign className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={e =>
                        setUsername(
                          e.target.value.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '').slice(0, 30)
                        )
                      }
                      placeholder="e.g. shadow_slayer or manga_artist"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/70 text-white placeholder-zinc-500 text-xs font-mono focus:outline-none focus:border-white transition-colors"
                    />
                  </div>
                  {username && (
                    <p className="text-[11px] text-zinc-400 mt-1 font-mono">
                      Your unique profile ID: <span className="text-white font-bold">@{username}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/70 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-white transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Create Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Create a secure password"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/70 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-white transition-colors"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1 font-mono">
                    Must be used every time you sign in to this account.
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* Sign In Mode: Strictly Email & Password ONLY */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
                    <input
                      type="email"
                      required
                      value={email || loginIdentifier}
                      onChange={e => {
                        setEmail(e.target.value);
                        setLoginIdentifier(e.target.value);
                      }}
                      placeholder="name@example.com"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/70 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-white transition-colors"
                      autoComplete="email"
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-zinc-300">Password</label>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/70 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-white transition-colors"
                      autoComplete="current-password"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 font-bold text-sm transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
            >
              <span>
                {loading
                  ? 'Signing in...'
                  : mode === 'signup'
                  ? `Create ${selectedPersona === 'creator' ? 'Creator' : 'Reader'} Account`
                  : 'Sign In'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Social Sign-In (Direct Google OAuth) */}
          <div className="pt-2 space-y-2">
            <div className="relative flex items-center justify-center mb-3">
              <div className="border-t border-zinc-800 w-full" />
              <span className="bg-[#101014] px-3 text-[11px] font-mono text-zinc-500 uppercase shrink-0">
                Or Continue With
              </span>
              <div className="border-t border-zinc-800 w-full" />
            </div>

            <button
              type="button"
              onClick={() => handleGoogleAuth()}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer shadow-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.1c0 2.8.7 5.4 1.9 7.8l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Direct Google Sign-In Fallback when browser origin restricts popup */}
            {showDirectGoogleInput && (
              <form
                onSubmit={handleDirectGoogleLogin}
                className="mt-3 p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-700/80 space-y-2.5 animate-fadeIn"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Instant Google Account Sign-In
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowDirectGoogleInput(false)}
                    className="text-[10px] text-zinc-500 hover:text-zinc-300"
                  >
                    Close
                  </button>
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
                  <input
                    type="email"
                    required
                    value={directGoogleEmail}
                    onChange={e => setDirectGoogleEmail(e.target.value)}
                    placeholder="Enter your Gmail address"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-700 bg-black text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span>Sign In with this Google Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>

          {/* Mode Switcher */}
          <div className="text-center pt-1">
            {mode === 'signup' ? (
              <p className="text-xs text-zinc-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="text-white font-bold hover:underline ml-1"
                >
                  Sign In
                </button>
              </p>
            ) : (
              <p className="text-xs text-zinc-400">
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-white font-bold hover:underline ml-1"
                >
                  Sign Up
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
