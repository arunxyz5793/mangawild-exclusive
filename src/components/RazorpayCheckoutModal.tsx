import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Smartphone,
  Building2,
  Lock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { SUBSCRIPTION_PLANS, processSubscriptionSuccess } from '../services/razorpay';
import { useAuth } from '../context/AuthContext';

interface RazorpayCheckoutModalProps {
  isOpen: boolean;
  planId?: 'monthly' | 'yearly';
  onClose: () => void;
  onSuccess: () => void;
}

type PaymentMethod = 'UPI' | 'Card' | 'Netbanking';

export const RazorpayCheckoutModal: React.FC<RazorpayCheckoutModalProps> = ({
  isOpen,
  planId = 'yearly',
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId) || SUBSCRIPTION_PLANS[0];

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [bank, setBank] = useState('HDFC Bank');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !plan) return null;

  const handlePay = async () => {
    setErrorMessage('');
    if (paymentMethod === 'UPI' && !upiId.includes('@')) {
      setErrorMessage('Please enter a valid UPI ID (e.g. yourname@upi or yourname@okaxis)');
      return;
    }
    if (paymentMethod === 'Card' && cardNumber.replace(/\s/g, '').length < 16) {
      setErrorMessage('Please enter a valid 16-digit card number');
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate Razorpay Gateway processing delay
      await new Promise(resolve => setTimeout(resolve, 1200));

      if (user) {
        processSubscriptionSuccess(user, plan.id, paymentMethod);
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsProcessing(false);
        setIsSuccess(false);
        onSuccess();
        onClose();
      }, 1500);
    } catch {
      setIsProcessing(false);
      setErrorMessage('Payment failed. Please try a different payment mode.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-[#101014] text-[#fafafa] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">Razorpay Gateway</h3>
              <p className="text-xs text-stone-400">Secure 256-Bit Test Mode Checkout</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-white tracking-wide font-display">
              PAYMENT SUCCESSFUL!
            </h3>
            <p className="text-sm text-stone-300">
              Welcome to <span className="text-white font-semibold underline decoration-white/40">MangaWild VIP Pass</span>!
              All chapters are unlocked. 70% of your membership goes directly to indie manga creators.
            </p>
            <div className="text-xs text-stone-500 font-mono">
              Razorpay Reference: pay_MW_{Date.now().toString().slice(-8)}
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Plan Info Card */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-300 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-white" /> VIP Membership Plan
                  </span>
                  <h4 className="text-lg font-bold text-white mt-1">{plan.name}</h4>
                  <p className="text-xs text-stone-400">{plan.durationDays} Days Unrestricted VIP Access</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-white font-display tracking-tight">₹{plan.priceInr}</span>
                  <p className="text-[10px] text-stone-400">incl. all taxes</p>
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-stone-300 uppercase tracking-wider">
                Select Payment Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                    paymentMethod === 'UPI'
                      ? 'border-white bg-white/10 text-white shadow-sm'
                      : 'border-white/10 bg-white/5 text-stone-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  <Smartphone className="w-5 h-5 mb-1.5 text-white" />
                  UPI / QR
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Card')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                    paymentMethod === 'Card'
                      ? 'border-white bg-white/10 text-white shadow-sm'
                      : 'border-white/10 bg-white/5 text-stone-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  <CreditCard className="w-5 h-5 mb-1.5 text-white" />
                  Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Netbanking')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                    paymentMethod === 'Netbanking'
                      ? 'border-white bg-white/10 text-white shadow-sm'
                      : 'border-white/10 bg-white/5 text-stone-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  <Building2 className="w-5 h-5 mb-1.5 text-white" />
                  Netbanking
                </button>
              </div>
            </div>

            {/* Payment Details Form */}
            {paymentMethod === 'UPI' && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  {['GPay', 'PhonePe', 'Paytm', 'BHIM'].map(app => (
                    <span
                      key={app}
                      className="px-2 py-1 text-[11px] font-medium rounded bg-white/5 border border-white/10 text-stone-300"
                    >
                      {app}
                    </span>
                  ))}
                </div>
                <div>
                  <label className="block text-xs text-stone-400 mb-1">Enter UPI VPA / ID</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                    placeholder="username@okaxis"
                    className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-stone-500 focus:outline-none focus:border-white"
                  />
                </div>
              </div>
            )}

            {paymentMethod === 'Card' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-stone-400 mb-1">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={e => setCardNumber(e.target.value)}
                    placeholder="4532 0000 0000 0000"
                    className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white font-mono placeholder-stone-500 focus:outline-none focus:border-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-stone-400 mb-1">Expiry Date</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={e => setCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                      className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white font-mono placeholder-stone-500 focus:outline-none focus:border-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-400 mb-1">CVV</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={cardCvv}
                      onChange={e => setCardCvv(e.target.value)}
                      placeholder="123"
                      className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white font-mono placeholder-stone-500 focus:outline-none focus:border-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'Netbanking' && (
              <div>
                <label className="block text-xs text-stone-400 mb-1">Popular Banks</label>
                <select
                  value={bank}
                  onChange={e => setBank(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#18181c] border border-white/10 rounded-lg text-white focus:outline-none focus:border-white"
                >
                  <option value="HDFC Bank">HDFC Bank</option>
                  <option value="State Bank of India">State Bank of India (SBI)</option>
                  <option value="ICICI Bank">ICICI Bank</option>
                  <option value="Axis Bank">Axis Bank</option>
                  <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                  <option value="Punjab National Bank">Punjab National Bank</option>
                </select>
              </div>
            )}

            {errorMessage && (
              <div className="flex items-center gap-2 p-3 text-xs text-rose-300 bg-rose-950/30 border border-rose-800/40 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handlePay}
                disabled={isProcessing}
                className="w-full py-3 px-4 bg-white hover:bg-stone-200 text-black font-bold text-sm tracking-wide rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    <span>Authorizing ₹{plan.priceInr} with Razorpay...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Pay ₹{plan.priceInr} & Activate VIP Access</span>
                  </>
                )}
              </button>
            </div>

            {/* Trust Footer */}
            <div className="flex items-center justify-between text-[11px] text-stone-500 pt-2 border-t border-white/5">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-stone-400" /> 256-Bit SSL Encrypted
              </span>
              <span>Cancel Anytime</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
