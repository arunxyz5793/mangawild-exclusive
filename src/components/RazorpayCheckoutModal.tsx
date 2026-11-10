import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Lock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ExternalLink,
  Check,
} from 'lucide-react';
import {
  SUBSCRIPTION_PLANS,
  loadRazorpayScript,
  launchRazorpayCheckout,
} from '../services/razorpay';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

type PaymentFlowStatus = 'idle' | 'initiating' | 'opened' | 'completed' | 'failed';

interface RazorpayCheckoutModalProps {
  isOpen: boolean;
  planId?: 'monthly' | 'yearly';
  onClose: () => void;
  onSuccess: () => void;
}

export const RazorpayCheckoutModal: React.FC<RazorpayCheckoutModalProps> = ({
  isOpen,
  planId = 'yearly',
  onClose,
  onSuccess,
}) => {
  const { user, isAuthenticated, openAuthModal, activateSubscription } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId) || SUBSCRIPTION_PLANS[0];

  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<PaymentFlowStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [lastPaymentId, setLastPaymentId] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadRazorpayScript();
      setErrorMessage('');
      setStatus('idle');
    }
  }, [isOpen]);

  if (!isOpen || !plan || typeof document === 'undefined') return null;

  // Launch official Razorpay standard checkout flow via payment service
  const handleLaunchRazorpay = async () => {
    setErrorMessage('');
    setIsProcessing(true);

    if (!isAuthenticated || !user || user.id === 'guest_reader' || user.id.startsWith('guest_')) {
      setErrorMessage('Please sign in to your account before purchasing.');
      setIsProcessing(false);
      onClose();
      openAuthModal({
        title: 'Sign In to Get Exclusive',
        subtitle: `Sign in to activate your ${plan.name} (₹${plan.priceInr}) and unlock Exclusive chapters.`,
        defaultMode: 'signin',
      });
      return;
    }

    setStatus('initiating');
    await launchRazorpayCheckout({
      plan,
      user,
      onSuccess: (razorpayPaymentId: string) => {
        activateSubscription(plan.id, 'Razorpay', razorpayPaymentId);
        setLastPaymentId(razorpayPaymentId);
        setIsSuccess(true);
        setStatus('completed');
        setTimeout(() => {
          setIsProcessing(false);
          setIsSuccess(false);
          onSuccess();
          onClose();
        }, 1600);
      },
      onDismiss: () => {
        setIsProcessing(false);
        setStatus('idle');
      },
      onError: (err: any) => {
        console.warn('[RazorpayCheckoutModal] payment error:', err);
        setIsProcessing(false);
        setStatus('failed');
        setErrorMessage(
          err?.message || 'Payment could not be completed. Please check your details and try again.'
        );
      },
    });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 modal-backdrop-overlay bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden transition-colors ${
          isLight
            ? 'bg-white text-black border-black'
            : 'bg-black text-white border-white/25'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className={`p-5 border-b flex items-center justify-between ${
            isLight
              ? 'bg-white border-black text-black'
              : 'bg-black border-white/20 text-white'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                isLight
                  ? 'bg-white text-black border-black'
                  : 'bg-black text-white border-white/25'
              }`}
            >
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black tracking-tight uppercase">
                  Razorpay Checkout
                </h3>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                    isLight
                      ? 'bg-white text-black border-black'
                      : 'bg-black text-white border-white/25'
                  }`}
                >
                  Verified
                </span>
              </div>
              <p className="text-[11px] font-mono mt-0.5 opacity-75">
                256-Bit SSL Encrypted • Official Payment Gateway
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isLight
                ? 'border-black text-black hover:bg-black hover:text-white'
                : 'border-white/20 text-white hover:bg-white hover:text-black'
            }`}
            aria-label="Close Checkout Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!isAuthenticated ? (
          <div className="p-8 text-center space-y-5">
            <div
              className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center border ${
                isLight
                  ? 'bg-white text-black border-black'
                  : 'bg-black text-white border-white/25'
              }`}
            >
              <Lock className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl font-black tracking-tight">Sign In Required</h3>
              <p className="text-xs max-w-sm mx-auto leading-relaxed">
                Please sign in with your email and password to link the{' '}
                <strong className="font-bold">
                  {plan.name} (₹{plan.priceInr})
                </strong>{' '}
                to your account.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-2 max-w-xs mx-auto">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openAuthModal({
                    title: 'Sign In to Get Exclusive',
                    subtitle: `Sign in to activate your ${plan.name} (₹${plan.priceInr}) membership.`,
                    defaultMode: 'signin',
                  });
                }}
                className={`w-full py-3 px-5 rounded-xl font-bold text-xs uppercase tracking-wider border transition-all active:scale-98 cursor-pointer ${
                  isLight
                    ? 'bg-black text-white border-black light-invert-pill'
                    : 'bg-white text-black border-white'
                }`}
              >
                Sign In to Continue
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openAuthModal({
                    title: 'Create Account to Get Exclusive',
                    subtitle: `Create an account to activate your ${plan.name} (₹${plan.priceInr}) membership.`,
                    defaultMode: 'signup',
                  });
                }}
                className={`w-full py-3 px-5 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                  isLight
                    ? 'bg-white text-black border-black'
                    : 'bg-black text-white border-white/25'
                }`}
              >
                Create Account
              </button>
            </div>
          </div>
        ) : isSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div
              className={`w-14 h-14 mx-auto rounded-full border flex items-center justify-center ${
                isLight
                  ? 'bg-white text-black border-black'
                  : 'bg-black text-white border-white/25'
              }`}
            >
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black tracking-tight">Payment Successful!</h3>
            <p className="text-xs leading-relaxed max-w-sm mx-auto">
              Your Exclusive Subscription is now active. All Exclusive chapters (including Silent Heads &amp; Chintu) are unlocked.
            </p>
            <div
              className={`text-xs font-mono py-2 px-3 rounded-xl border ${
                isLight
                  ? 'bg-white text-black border-black'
                  : 'bg-black text-white border-white/25'
              }`}
            >
              Razorpay Ref: <strong>{lastPaymentId}</strong>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Plan Info Card */}
            <div
              className={`p-4 rounded-2xl border ${
                isLight
                  ? 'bg-white text-black border-black'
                  : 'bg-black text-white border-white/25'
              }`}
            >
              <div className="flex justify-between items-start gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest font-mono block">
                    Exclusive Subscription
                  </span>
                  <h4 className="text-base font-black mt-0.5">{plan.name}</h4>
                  <p className="text-xs mt-0.5">{plan.durationDays} Days Unrestricted Reading</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-2xl font-black font-mono block">₹{plan.priceInr}</span>
                  <p className="text-[10px] font-mono">all taxes included</p>
                </div>
              </div>
            </div>

            {/* Benefits list */}
            <div
              className={`space-y-2.5 border-t pt-4 ${
                isLight ? 'border-black' : 'border-white/20'
              }`}
            >
              <span className="text-[11px] font-black uppercase tracking-wider block">
                Subscription Benefits
              </span>
              <div className="space-y-2 text-xs font-medium">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Instant unlock for all exclusive manga (Silent Heads &amp; Chintu)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>100% Ad-Free uninterrupted reading experience</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>70% royalty directly paid to original creators</span>
                </div>
              </div>
            </div>

            {errorMessage && (
              <div
                className={`flex items-center gap-2 p-3 text-xs border rounded-xl font-medium ${
                  isLight
                    ? 'bg-white text-black border-black'
                    : 'bg-black text-white border-white/30'
                }`}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Razorpay Launch Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleLaunchRazorpay}
                disabled={isProcessing}
                className={`w-full py-3.5 px-4 font-black text-xs uppercase tracking-wider rounded-xl border transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.98] ${
                  isLight
                    ? 'bg-black text-white border-black light-invert-pill'
                    : 'bg-white text-black border-white'
                }`}
              >
                {isProcessing ? (
                  <>
                    <div
                      className={`w-4 h-4 border-2 rounded-full animate-spin ${
                        isLight
                          ? 'border-white/30 border-t-white'
                          : 'border-black/30 border-t-black'
                      }`}
                    />
                    <span>
                      {status === 'initiating' && 'Connecting to Razorpay gateway...'}
                      {status === 'opened' && 'Payment window active...'}
                      {(status === 'idle' || status === 'completed' || status === 'failed') &&
                        'Processing payment...'}
                    </span>
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4" />
                    <span>Pay ₹{plan.priceInr} via Razorpay</span>
                  </>
                )}
              </button>
            </div>

            {/* Trust Footer */}
            <div
              className={`flex items-center justify-between text-[11px] font-mono pt-3 border-t ${
                isLight ? 'border-black' : 'border-white/20'
              }`}
            >
              <span className="flex items-center gap-1.5 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" /> Razorpay Secure Payment
              </span>
              <span className="font-semibold">UPI · Cards · Netbanking</span>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
