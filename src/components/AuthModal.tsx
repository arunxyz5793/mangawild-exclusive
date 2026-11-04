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
  KeyRound,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { UserRole } from '../types/auth';
import { PRIMARY_CLIENT_ID } from '../services/googleAuth';
import { StorageService } from '../services/storage';
import { sendFirebasePasswordReset, confirmFirebasePasswordReset } from '../services/firebase';

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
  defaultMode = 'signup',
  customTitle,
  customSubtitle,
  onSuccess,
}) => {
  const { theme } = useTheme();
  const { signIn, signUp, signInWithGoogle, signInWithGoogleDirect } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot_password' | 'verify_otp'>(defaultMode);
  const [selectedPersona, setSelectedPersona] = useState<'reader' | 'creator' | 'admin'>(defaultRole);

  const [username, setUsername] = useState('');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDirectGoogleInput, setShowDirectGoogleInput] = useState(false);
  const [directGoogleEmail, setDirectGoogleEmail] = useState('callmedevoc@gmail.com');
  const [copiedOrigin, setCopiedOrigin] = useState(false);

  // Forgot Password & Verification Code state
  const [resetEmail, setResetEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // Countdown timer for email resend
  React.useEffect(() => {
    if (resendTimer > 0) {
      const timer = setInterval(() => {
        setResendTimer(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [resendTimer]);

  // Auto-clears error message immediately when user modifies input
  const handleEmailChange = (val: string) => {
    setEmail(val);
    setLoginIdentifier(val);
    if (errorMsg) setErrorMsg(null);
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (errorMsg) setErrorMsg(null);
  };

  const handleUsernameChange = (val: string) => {
    setUsername(val);
    if (errorMsg) setErrorMsg(null);
  };

  const handleResetEmailChange = (val: string) => {
    setResetEmail(val);
    if (errorMsg) setErrorMsg(null);
  };

  const handleOtpChange = (val: string) => {
    setOtpCode(val.trim());
    if (errorMsg) setErrorMsg(null);
  };

  const handleNewPasswordChange = (val: string) => {
    setNewPassword(val);
    if (errorMsg) setErrorMsg(null);
  };

  const handleConfirmPasswordChange = (val: string) => {
    setConfirmPassword(val);
    if (errorMsg) setErrorMsg(null);
  };

  const isDedicatedAdmin = defaultRole === 'admin' || selectedPersona === 'admin';

  // Sync mode and persona when modal opens with custom options or Firebase email action link
  React.useEffect(() => {
    if (isOpen) {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const urlMode = urlParams.get('mode');
        const oobCode = urlParams.get('oobCode');
        if (oobCode) {
          setOtpCode(oobCode);
          setMode('verify_otp');
          setErrorMsg(null);
          setSuccessMsg('Verification code detected from email link. Please enter your new password.');
          return;
        } else if (urlMode === 'resetPassword') {
          setMode('forgot_password');
          setErrorMsg(null);
          return;
        }
      }

      if (defaultRole === 'admin') {
        setMode('signin');
        setSelectedPersona('admin');
      } else {
        if (defaultMode) setMode(defaultMode);
        if (defaultRole) setSelectedPersona(defaultRole);
      }
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, defaultMode, defaultRole]);

  React.useEffect(() => {
    if (isOpen) {
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
  }, [isOpen]);

  // Request Firebase / Secure Email Engine to dispatch Password Reset Verification Code
  const handleSendResetOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = resetEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      let dispatched = false;

      // 1. Try Firebase Authentication first
      try {
        await sendFirebasePasswordReset(cleanEmail);
        dispatched = true;
      } catch (fbErr: any) {
        console.warn('Firebase reset dispatch error, falling back to authenticated mail engine:', fbErr);
      }

      // 2. If Firebase encountered an App Check error or restriction, use the authenticated email engine
      if (!dispatched) {
        const resp = await fetch('/api/auth/send-email-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail }),
        });
        const data = await resp.json().catch(() => null);
        if (resp.ok && data?.success) {
          dispatched = true;
        } else {
          throw new Error(data?.error || 'Failed to dispatch verification email');
        }
      }

      // Local backup OTP for offline resilience
      const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
      StorageService.savePasswordResetOTP(cleanEmail, randomOtp);

      setResendTimer(45);
      setMode('verify_otp');
      setSuccessMsg(
        `A secure verification code has been dispatched to ${cleanEmail}. Please check your email inbox and spam folder.`
      );
    } catch (err: any) {
      console.error('Password reset dispatch failed:', err);
      setErrorMsg(err?.message || 'Failed to dispatch verification code. Please check your email and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend code via Firebase / Secure Email Engine
  const handleResendEmail = async () => {
    if (resendTimer > 0 || loading) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    const cleanEmail = resetEmail.trim().toLowerCase();
    try {
      let dispatched = false;

      try {
        await sendFirebasePasswordReset(cleanEmail);
        dispatched = true;
      } catch (fbErr) {
        console.warn('Firebase resend error, using mail engine:', fbErr);
      }

      if (!dispatched) {
        const resp = await fetch('/api/auth/send-email-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail }),
        });
        const data = await resp.json().catch(() => null);
        if (resp.ok && data?.success) {
          dispatched = true;
        } else {
          throw new Error(data?.error || 'Failed to resend email');
        }
      }

      const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
      StorageService.savePasswordResetOTP(cleanEmail, randomOtp);

      setResendTimer(45);
      setSuccessMsg(`A fresh verification email has been dispatched to ${cleanEmail}. Please check your inbox.`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to resend email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP / Action Code and reset password
  const handleVerifyOTPAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = resetEmail.trim().toLowerCase();
    const cleanOtp = otpCode.trim();

    if (!cleanOtp) {
      setErrorMsg('Please enter the verification code received in your email.');
      return;
    }

    if (!newPassword || newPassword.length < 4) {
      setErrorMsg('New password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please ensure both passwords match.');
      return;
    }

    setLoading(true);

    try {
      let verified = false;

      // 1. Try server-side OTP verification first
      try {
        const resp = await fetch('/api/auth/verify-email-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, otp: cleanOtp }),
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data.valid) {
            verified = true;
          }
        }
      } catch (backendErr) {
        console.warn('Server verify attempt:', backendErr);
      }

      // 2. Try Firebase action code confirmation with code from email
      if (!verified) {
        try {
          await confirmFirebasePasswordReset(cleanOtp, newPassword);
          verified = true;
        } catch (fbErr: any) {
          console.warn('Firebase confirm action code:', fbErr);
        }
      }

      // 3. Fallback to local stored OTP
      if (!verified && StorageService.verifyPasswordResetOTP(cleanEmail, cleanOtp)) {
        verified = true;
      }

      if (!verified) {
        setErrorMsg('Invalid or expired verification code. Please check the code in your email and try again.');
        setLoading(false);
        return;
      }

      const resetSuccess = StorageService.resetPassword(cleanEmail, newPassword);
      if (resetSuccess) {
        setSuccessMsg('Your password has been reset successfully! You can now sign in.');
        setEmail(cleanEmail);
        setPassword(newPassword);
        setOtpCode('');
        setNewPassword('');
        setConfirmPassword('');
        setMode('signin');
      } else {
        await signUp(cleanEmail.split('@')[0], cleanEmail, newPassword, 'free_user');
        setSuccessMsg('Your password has been configured! You can now sign in.');
        setEmail(cleanEmail);
        setPassword(newPassword);
        setOtpCode('');
        setNewPassword('');
        setConfirmPassword('');
        setMode('signin');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to reset password. Please check your verification code.');
    } finally {
      setLoading(false);
    }
  };

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
        const cleanUser = username.trim().replace(/^@/, '').toLowerCase().replace(/[^a-zA-Z0-9_]/g, '');
        if (StorageService.isUsernameTaken(cleanUser)) {
          setErrorMsg(`Username "@${cleanUser}" already exists. Please choose a different username.`);
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

        await signUp(cleanUser, email.trim(), password, assignedRole);
      } else {
        const idToUse = email.trim() || loginIdentifier.trim() || username.trim();
        if (!idToUse) {
          setErrorMsg('Please enter your registered email address or username.');
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

  const cleanTypedUsername = username.trim().replace(/^@+/, '').toLowerCase();
  const isSignupUsernameTaken =
    cleanTypedUsername.length >= 3 ? StorageService.isUsernameTaken(cleanTypedUsername) : false;

  const activeSignInIdentifier = (email || loginIdentifier).trim();
  const doesSignInIdentifierExist =
    activeSignInIdentifier.length >= 3
      ? StorageService.checkIdentifierExists(activeSignInIdentifier)
      : false;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop-overlay bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          theme === 'dark'
            ? 'bg-[#101014] border-zinc-800 text-white'
            : 'bg-white border-black text-black'
        }`}
      >
        {/* Header with Title and Close Button */}
        <div className="relative px-6 pt-6 pb-4 border-b border-zinc-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Editorial Emblem Badge (Replacing Stars Icon) */}
            <div
              className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 ${
                theme === 'dark'
                  ? 'bg-zinc-900 border-zinc-700 text-white'
                  : 'bg-black border-black text-white'
              }`}
            >
              {isDedicatedAdmin ? (
                <Shield className="w-5 h-5" />
              ) : (
                <BookOpen className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                <span>
                  {customTitle ||
                    (isDedicatedAdmin
                      ? 'Admin Portal Sign In'
                      : mode === 'signup'
                      ? 'Join MangaWild'
                      : 'Welcome Back')}
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {customSubtitle ||
                  (isDedicatedAdmin
                    ? 'Enter official administrator credentials to access the Editorial Suite'
                    : mode === 'signup'
                    ? 'Select your role and create your customized manga profile'
                    : 'Sign in with your email or username to access your account')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[85vh] overflow-y-auto">
          {/* Redesigned Role Selection Cards during Sign Up */}
          {mode === 'signup' && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                  Select Account Type
                </label>
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  {selectedPersona === 'creator' ? 'Creator Studio Mode' : 'Reader Library Mode'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* I am a Reader Card */}
                <button
                  type="button"
                  onClick={() => setSelectedPersona('reader')}
                  className={`group p-4 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between gap-2.5 ${
                    selectedPersona === 'reader'
                      ? theme === 'dark'
                        ? 'border-white bg-zinc-900 shadow-lg'
                        : 'border-black bg-zinc-50 shadow-md'
                      : 'border-zinc-800/80 hover:border-zinc-700 bg-zinc-950/50 opacity-75 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                        selectedPersona === 'reader'
                          ? 'bg-white text-black'
                          : 'bg-zinc-800/90 text-zinc-300'
                      }`}
                    >
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${
                        selectedPersona === 'reader'
                          ? 'bg-white text-black border-white'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                      }`}
                    >
                      {selectedPersona === 'reader' ? (
                        <>
                          <Check className="w-3 h-3 stroke-[2.5]" />
                          <span>Active</span>
                        </>
                      ) : (
                        <span>Select</span>
                      )}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm font-black tracking-tight text-white">
                      I am a Reader
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                      Read original series, save bookmarks &amp; review chapters
                    </p>
                  </div>

                  <div className="pt-1 border-t border-zinc-800/60 flex items-center justify-between text-[10px] font-mono text-zinc-300">
                    <span>Personal Library</span>
                    <ArrowRight className="w-3 h-3 opacity-70 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>

                {/* I am a Creator Card */}
                <button
                  type="button"
                  onClick={() => setSelectedPersona('creator')}
                  className={`group p-4 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between gap-2.5 ${
                    selectedPersona === 'creator'
                      ? theme === 'dark'
                        ? 'border-white bg-zinc-900 shadow-lg'
                        : 'border-black bg-zinc-50 shadow-md'
                      : 'border-zinc-800/80 hover:border-zinc-700 bg-zinc-950/50 opacity-75 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                        selectedPersona === 'creator'
                          ? 'bg-white text-black'
                          : 'bg-zinc-800/90 text-zinc-300'
                      }`}
                    >
                      <PenTool className="w-5 h-5" />
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${
                        selectedPersona === 'creator'
                          ? 'bg-white text-black border-white'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                      }`}
                    >
                      {selectedPersona === 'creator' ? (
                        <>
                          <Check className="w-3 h-3 stroke-[2.5]" />
                          <span>Active</span>
                        </>
                      ) : (
                        <span>Select</span>
                      )}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm font-black tracking-tight text-white">
                      I am a Creator
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                      Publish manga series, manage chapters &amp; earn 70% share
                    </p>
                  </div>

                  <div className="pt-1 border-t border-zinc-800/60 flex items-center justify-between text-[10px] font-mono text-zinc-300">
                    <span>Creator Studio</span>
                    <ArrowRight className="w-3 h-3 opacity-70 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-200 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && errorMsg.startsWith('ACCOUNT_SUSPENDED:') ? (
            <div
              className={`p-5 rounded-2xl border-2 space-y-3 animate-scale-in ${
                theme === 'dark'
                  ? 'bg-black border-white text-white shadow-2xl'
                  : 'bg-white border-black text-black shadow-xl'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                    theme === 'dark' ? 'bg-white text-black border-white' : 'bg-black text-white border-black'
                  }`}
                >
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="space-y-1 flex-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest font-black block opacity-75">
                    Account Access Restricted
                  </span>
                  <h4 className="text-base font-black tracking-tight">
                    Your Account Has Been Suspended
                  </h4>
                  <p className="text-xs leading-relaxed opacity-90">
                    {errorMsg.replace('ACCOUNT_SUSPENDED:', '')}
                  </p>
                  <p className="text-[11px] font-mono opacity-75 pt-1">
                    You can continue browsing and reading free manga on MangaWild as a guest, or contact mangawildofficial@gmail.com for an appeal.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-current/15">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    onClose();
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-transform active:scale-95 ${
                    theme === 'dark'
                      ? 'bg-white text-black hover:bg-zinc-200'
                      : 'bg-black text-white hover:bg-zinc-800'
                  }`}
                >
                  Continue as Guest
                </button>
              </div>
            </div>
          ) : (
            errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/50 border border-red-800 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )
          )}

          {/* Mode 1: Forgot Password (Request Firebase Reset Email) */}
          {mode === 'forgot_password' ? (
            <form onSubmit={handleSendResetOTP} className="space-y-3.5">
              <div className="flex items-center gap-2 mb-1">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setSuccessMsg(null);
                    setMode('signin');
                  }}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Back to Sign In"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h4 className="text-sm font-bold text-white">Reset Account Password</h4>
                  <p className="text-[11px] text-zinc-400">Enter your email. Firebase will send you a verification code</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Registered Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={e => handleResetEmailChange(e.target.value)}
                    placeholder="Enter the email associated with your account"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/70 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-white transition-colors"
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 font-bold text-sm transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
              >
                <span>{loading ? 'Requesting Firebase to Send Email...' : 'Send Verification Code to Email'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : mode === 'verify_otp' ? (
            /* Mode 2: Verify Code from Email & Enter New Password */
            <form onSubmit={handleVerifyOTPAndReset} className="space-y-3.5">
              <div className="flex items-center gap-2 mb-1">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setMode('forgot_password');
                  }}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h4 className="text-sm font-bold text-white">Enter Verification Code</h4>
                  <p className="text-[11px] text-zinc-400">
                    Code dispatched to <span className="text-zinc-200 font-mono font-semibold">{resetEmail}</span>
                  </p>
                </div>
              </div>

              {/* Secure Info Notice: Absolutely ZERO OTP code shown on screen */}
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-start gap-2.5 text-xs text-zinc-300">
                <Mail className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-white">Verification Email Dispatched</p>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    A secure verification code has been dispatched to <span className="text-zinc-200 font-mono font-bold">{resetEmail}</span>. Please check your email inbox or Spam/Junk folder.
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-zinc-300">
                    Verification Code
                  </label>
                  <button
                    type="button"
                    disabled={resendTimer > 0 || loading}
                    onClick={handleResendEmail}
                    className="text-[11px] text-zinc-400 hover:text-white disabled:opacity-40 disabled:hover:text-zinc-400 cursor-pointer font-mono transition-colors"
                  >
                    {resendTimer > 0 ? `Resend email in ${resendTimer}s` : 'Resend code via email'}
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
                  <input
                    type="text"
                    required
                    value={otpCode}
                    onChange={e => handleOtpChange(e.target.value)}
                    placeholder="Enter code from email"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/70 text-white placeholder-zinc-500 text-sm font-mono tracking-widest text-center focus:outline-none focus:border-white transition-colors"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={e => handleNewPasswordChange(e.target.value)}
                    placeholder="At least 4 characters"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/70 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Confirm New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => handleConfirmPasswordChange(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/70 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-white transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 font-bold text-sm transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
              >
                <span>{loading ? 'Verifying & Updating...' : 'Verify & Reset Password'}</span>
                <Check className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* Mode 3: Sign In or Sign Up Form */
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'signup' ? (
                <>
                  {/* Unique Username Input with Live Side Existence / Active Status */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-zinc-300">
                        Choose Your Unique Username
                      </label>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        Unique handle, no spaces
                      </span>
                    </div>
                    <div className="relative flex items-center">
                      <AtSign className="w-4 h-4 absolute left-3.5 text-zinc-500 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={e =>
                          handleUsernameChange(
                            e.target.value.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '').slice(0, 30)
                          )
                        }
                        placeholder="e.g. shadow_slayer or manga_creator"
                        className="w-full pl-10 pr-36 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/70 text-white placeholder-zinc-500 text-xs font-mono focus:outline-none focus:border-white transition-colors"
                      />

                      {/* Live Side Status Indicator inside Username Input */}
                      {cleanTypedUsername.length > 0 && (
                        <div className="absolute right-2.5 flex items-center pointer-events-none">
                          {cleanTypedUsername.length < 3 ? (
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                              Min 3 chars
                            </span>
                          ) : isSignupUsernameTaken ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-zinc-900 text-white border border-zinc-700">
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              <span>Already Exists</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-white text-black border border-white">
                              <CheckCircle className="w-3 h-3 shrink-0" />
                              <span>Available • Active</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {cleanTypedUsername.length >= 3 && (
                      <div className="flex items-center justify-between mt-1 text-[11px] font-mono">
                        <span>
                          Profile ID: <span className="text-white font-bold">@{cleanTypedUsername}</span>
                        </span>
                        <span className="font-semibold">
                          {isSignupUsernameTaken
                            ? 'This username already exists'
                            : 'Username available & active'}
                        </span>
                      </div>
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
                        onChange={e => handleEmailChange(e.target.value)}
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
                        onChange={e => handlePasswordChange(e.target.value)}
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
                  {/* Sign In Mode: Email/Username & Password with Live Side Existence Check */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      {isDedicatedAdmin ? 'Administrator Email or Username' : 'Email Address or Username'}
                    </label>
                    <div className="relative flex items-center">
                      <UserIcon className="w-4 h-4 absolute left-3.5 text-zinc-500 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={email || loginIdentifier}
                        onChange={e => handleEmailChange(e.target.value)}
                        placeholder={isDedicatedAdmin ? 'admin@mangawild.com or admin' : 'name@example.com or @username'}
                        className="w-full pl-10 pr-32 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/70 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-white transition-colors"
                        autoFocus
                      />

                      {/* Live Side Status Indicator showing if Username/Email Exists */}
                      {activeSignInIdentifier.length >= 3 && (
                        <div className="absolute right-2.5 flex items-center pointer-events-none">
                          {doesSignInIdentifierExist ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-white text-black border border-white">
                              <CheckCircle className="w-3 h-3 shrink-0" />
                              <span>Active</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-zinc-900 text-zinc-400 border border-zinc-700">
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              <span>Not Found</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-zinc-300">Password</label>
                      {!isDedicatedAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            setErrorMsg(null);
                            setSuccessMsg(null);
                            setResetEmail(email || loginIdentifier || '');
                            setMode('forgot_password');
                          }}
                          className="text-[11px] text-zinc-400 hover:text-white hover:underline transition-colors cursor-pointer"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={e => handlePasswordChange(e.target.value)}
                        placeholder={isDedicatedAdmin ? 'Enter Administrator password' : 'Enter your password'}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/70 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-white transition-colors"
                        autoComplete="current-password"
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading || (mode === 'signup' && isSignupUsernameTaken)}
                className="w-full py-3 px-4 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 font-bold text-sm transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
              >
                <span>
                  {loading
                    ? 'Verifying...'
                    : isDedicatedAdmin
                    ? 'Sign In to Admin Suite'
                    : mode === 'signup'
                    ? `Create ${selectedPersona === 'creator' ? 'Creator' : 'Reader'} Account`
                    : 'Sign In'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Social Sign-In (Disabled for Admin mode and password recovery) */}
          {!isDedicatedAdmin && (mode === 'signin' || mode === 'signup') && (
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
                      placeholder="Enter your Google account email"
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
          )}

          {/* Bottom Switcher */}
          {!isDedicatedAdmin && (
            <div className="text-center pt-1">
              {mode === 'signup' ? (
                <p className="text-xs text-zinc-400">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg(null);
                      setSuccessMsg(null);
                      setMode('signin');
                    }}
                    className="text-white font-bold hover:underline ml-1 cursor-pointer"
                  >
                    Sign In
                  </button>
                </p>
              ) : mode === 'signin' ? (
                <p className="text-xs text-zinc-400">
                  Don't have an account yet?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg(null);
                      setSuccessMsg(null);
                      setMode('signup');
                    }}
                    className="text-white font-bold hover:underline ml-1 cursor-pointer"
                  >
                    Sign Up
                  </button>
                </p>
              ) : (
                <p className="text-xs text-zinc-400">
                  Remember your password?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg(null);
                      setSuccessMsg(null);
                      setMode('signin');
                    }}
                    className="text-white font-bold hover:underline ml-1 cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
