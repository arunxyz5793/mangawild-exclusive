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
  ExternalLink,
  HelpCircle,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { UserRole } from '../types/auth';
import { PRIMARY_CLIENT_ID, PROJECT_CLIENT_ID, getCurrentAppOrigin } from '../services/googleAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: 'reader' | 'creator' | 'admin';
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultRole = 'reader',
  onSuccess,
}) => {
  const { theme } = useTheme();
  const { signIn, signUp, signInWithGoogle } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [selectedPersona, setSelectedPersona] = useState<'reader' | 'creator' | 'admin'>(defaultRole);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedOrigin, setCopiedOrigin] = useState(false);
  const [showOriginGuide, setShowOriginGuide] = useState(false);

  if (!isOpen) return null;

  const currentOrigin = getCurrentAppOrigin();

  const handleCopyOrigin = () => {
    navigator.clipboard.writeText(currentOrigin);
    setCopiedOrigin(true);
    setTimeout(() => setCopiedOrigin(false), 3000);
  };

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
        if (!name.trim()) {
          setErrorMsg('Please enter your full name.');
          setLoading(false);
          return;
        }
        if (!username.trim() || username.length < 3) {
          setErrorMsg('Please enter a username with at least 3 characters.');
          setLoading(false);
          return;
        }
        const cleanUser = username.trim().replace(/^@/, '').toLowerCase().replace(/[^a-zA-Z0-9_]/g, '');

        await signUp(name.trim(), email.trim(), password, assignedRole, cleanUser);
      } else {
        await signIn(email.trim(), password, assignedRole);
      }

      setLoading(false);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authentication failed. Please try again.');
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
    const ok = await signInWithGoogle(assignedRole, cleanUser, overrideClientId);
    setLoading(false);
    if (ok) {
      onClose();
      if (onSuccess) onSuccess();
    } else {
      setErrorMsg('Google sign-in was canceled or encountered an issue. If you see "Error 400: origin_mismatch", check the Google OAuth Origin Fix below.');
      setShowOriginGuide(true);
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
              <span>{mode === 'signup' ? 'Join MangaWild' : 'Welcome Back'}</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              {mode === 'signup'
                ? 'Select your role and create your customized manga profile'
                : 'Sign in to access your manga library and dashboards'}
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
          {/* Role Selection First: Reader vs Creator */}
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
                className={`text-[11px] font-mono hover:underline inline-flex items-center gap-1 ${
                  selectedPersona === 'admin' ? 'text-white font-bold' : 'text-zinc-500'
                }`}
              >
                <Shield className="w-3 h-3" />
                <span>Admin Login Mode</span>
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-800 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Full Name</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Akira Toriyama or Arjun"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/70 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-white transition-colors"
                    />
                  </div>
                </div>

                {/* Custom Username Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-zinc-300">
                      Choose Your Unique Username
                    </label>
                    <span className="text-[10px] text-zinc-500 font-mono">No spaces, letters & numbers</span>
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
                      Your handle will be: <span className="text-white font-bold">@{username}</span>
                    </p>
                  )}
                </div>
              </>
            )}

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
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/70 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-white transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 font-bold text-sm transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
            >
              <span>
                {loading
                  ? 'Processing...'
                  : mode === 'signup'
                  ? `Create ${selectedPersona === 'creator' ? 'Creator' : 'Reader'} Account`
                  : `Sign In as ${selectedPersona.toUpperCase()}`}
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
              <span>Continue with Google (OAuth)</span>
            </button>

            {/* Instant Pre-Authorized Cloud Project OAuth Option */}
            <button
              type="button"
              onClick={() => handleGoogleAuth(PROJECT_CLIENT_ID)}
              disabled={loading}
              className="w-full py-1.5 px-3 rounded-lg border border-zinc-800/80 hover:border-zinc-700 bg-zinc-950/60 hover:bg-zinc-900 text-zinc-400 hover:text-white text-[11px] font-mono flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              title="Sign in using the pre-authorized Cloud Run OAuth Client ID"
            >
              <Sparkles className="w-3 h-3 text-purple-400 shrink-0" />
              <span>Instant Google Sign-In (Pre-Authorized Client)</span>
            </button>

            {/* Error 400: origin_mismatch Helper Card */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowOriginGuide(!showOriginGuide)}
                className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center justify-center gap-1 mx-auto font-mono cursor-pointer transition-colors"
              >
                <HelpCircle className="w-3 h-3" />
                <span>Fix Google &quot;Error 400: origin_mismatch&quot;</span>
              </button>

              {showOriginGuide && (
                <div className="mt-2 p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-left space-y-2 text-[11px] animate-fade-in font-mono">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400 text-xs">Origin Mismatch Fix</span>
                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 flex items-center gap-0.5 text-[10px] underline"
                    >
                      <span>Google Cloud Console</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>

                  <p className="text-zinc-400 text-[10px] leading-relaxed">
                    Google requires your app&apos;s exact URL in <b>Authorized JavaScript origins</b> for your OAuth Client ID (<code>886153338264-...</code>).
                  </p>

                  <div className="space-y-1">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold">Copy Your App Origin URL:</p>
                    <div className="flex items-center gap-1.5 bg-zinc-900 p-1.5 rounded-lg border border-zinc-800">
                      <code className="text-zinc-300 text-[10px] truncate flex-1">{currentOrigin}</code>
                      <button
                        type="button"
                        onClick={handleCopyOrigin}
                        className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        {copiedOrigin ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <ol className="text-[10px] text-zinc-400 space-y-0.5 list-decimal pl-4 leading-normal">
                    <li>Open <b>Google Cloud Console</b> &gt; <b>Credentials</b>.</li>
                    <li>Click your OAuth 2.0 Web Client ID.</li>
                    <li>Under <b>Authorized JavaScript origins</b>, click <b>+ ADD URI</b> and paste the copied URL.</li>
                    <li>Click <b>SAVE</b>. (Takes ~1 min to activate).</li>
                  </ol>
                </div>
              )}
            </div>
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
