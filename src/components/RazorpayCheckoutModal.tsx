import React, { useState, useEffect } from 'react';
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
  RAZORPAY_KEY_ID,
  launchRazorpayCheckout,
} from '../services/razorpay';
import { useAuth } from '../context/AuthContext';

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

  if (!isOpen || !plan) return null;

  // Launch official Razorpay standard checkout flow via payment service
  const handleLaunchRazorpay = async () => {
    setErrorMessage('');
    setIsProcessing(true);

    if (!isAuthenticated || !user || user.id === 'guest_reader' || user.id.startsWith('guest_')) {
      setErrorMessage('Please sign in to your account before purchasing.');
      setIsProcessing(false);
      onClose();
      openAuthModal({
        title: 'Sign In to Purchase VIP',
        subtitle: `Sign in to activate your ${plan.name} (₹${plan.priceInr}) and unlock exclusive chapters.`,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#0c0d10] text-[#fafafa] border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">Razorpay Checkout</h3>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                  Verified
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono">
                Key: {RAZORPAY_KEY_ID ? `${RAZORPAY_KEY_ID.slice(0, 10)}...` : 'Connected'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isAuthenticated ? (
          <div className="p-8 text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 text-white mx-auto flex items-center justify-center border border-zinc-800 shadow-md">
              <Lock className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-white tracking-tight">Sign In Required</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                Please sign in with your email and password to link the <strong className="text-white">{plan.name} (₹{plan.priceInr})</strong> to your account.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-2 max-w-xs mx-auto">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openAuthModal({
                    title: 'Sign In to Purchase VIP',
                    subtitle: `Sign in to activate your ${plan.name} (₹${plan.priceInr}) membership.`,
                    defaultMode: 'signin',
                  });
                }}
                className="w-full py-3 px-5 rounded-xl bg-white text-zinc-950 font-bold text-xs uppercase tracking-wider shadow-md hover:bg-zinc-200 transition-all active:scale-98 cursor-pointer"
              >
                Sign In to Continue
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openAuthModal({
                    title: 'Create Account to Purchase VIP',
                    subtitle: `Create an account to activate your ${plan.name} (₹${plan.priceInr}) membership.`,
                    defaultMode: 'signup',
                  });
                }}
                className="w-full py-3 px-5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Create Account
              </button>
            </div>
          </div>
        ) : isSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-zinc-800 text-white border border-zinc-700 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Payment Successful!
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed max-w-sm mx-auto">
              Your VIP Subscription is now active. All exclusive chapters (including Silent Heads & Chintu) are unlocked.
            </p>
            <div className="text-xs text-zinc-400 font-mono bg-zinc-900 py-2 px-3 rounded-lg border border-zinc-800">
              Razorpay Ref: <strong className="text-white">{lastPaymentId}</strong>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Plan Info Card */}
            <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 font-mono">
                    VIP Subscription
                  </span>
                  <h4 className="text-base font-bold text-white mt-0.5">{plan.name}</h4>
                  <p className="text-xs text-zinc-400">{plan.durationDays} Days Unrestricted Reading</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-white font-mono">₹{plan.priceInr}</span>
                  <p className="text-[10px] text-zinc-500">all taxes included</p>
                </div>
              </div>
            </div>

            {/* Benefits list */}
            <div className="space-y-2 border-t border-zinc-800/80 pt-4">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                Subscription Benefits
              </span>
              <div className="space-y-2 text-xs text-zinc-300">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span>Instant unlock for all exclusive manga (Silent Heads & Chintu)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span>100% Ad-Free uninterrupted reading experience</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span>70% royalty directly paid to original creators</span>
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 p-3 text-xs text-rose-300 bg-rose-950/30 border border-rose-800/50 rounded-xl">
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
                className="w-full py-3.5 px-4 bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.98]"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
                    <span>
                      {status === 'initiating' && 'Connecting to Razorpay gateway...'}
                      {status === 'opened' && 'Payment window active...'}
                      {(status === 'idle' || status === 'completed' || status === 'failed') && 'Processing payment...'}
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
            <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-3 border-t border-zinc-800/80">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" /> Razorpay Secure Payment
              </span>
              <span>UPI · Cards · Netbanking</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
