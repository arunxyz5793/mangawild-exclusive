import React, { useState, useMemo } from 'react';
import {
  Calculator,
  X,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  Crown,
  HeartHandshake,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SubscriptionCancellationCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmCancel?: (reason: string, isImmediate: boolean) => void;
}

export const SubscriptionCancellationCalculatorModal: React.FC<SubscriptionCancellationCalculatorModalProps> = ({
  isOpen,
  onClose,
  onConfirmCancel,
}) => {
  const { user, isVIP } = useAuth();

  // Active or selected plan simulation
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>(() => {
    return user.subscription?.planId === 'yearly' ? 'yearly' : 'monthly';
  });

  const planPrice = selectedPlan === 'yearly' ? 1499 : 199;
  const totalDaysInCycle = selectedPlan === 'yearly' ? 365 : 30;

  // Calculate actual days used based on user's subscription, or default to interactive slider
  const actualDaysUsed = useMemo(() => {
    if (user.subscription?.startDate) {
      const start = new Date(user.subscription.startDate).getTime();
      const now = Date.now();
      const diffDays = Math.max(1, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
      return Math.min(diffDays, totalDaysInCycle);
    }
    return selectedPlan === 'yearly' ? 45 : 8; // Sensible default for interactive preview
  }, [user.subscription, totalDaysInCycle, selectedPlan]);

  const [daysUsedInput, setDaysUsedInput] = useState<number>(actualDaysUsed);
  const [cancelReason, setCancelReason] = useState<string>('Finished current reading catalog');
  const [customReason, setCustomReason] = useState<string>('');
  const [cancellationMode, setCancellationMode] = useState<'end_of_period' | 'immediate'>('end_of_period');
  const [isSuccessSubmitted, setIsSuccessSubmitted] = useState<boolean>(false);

  // Financial calculations
  const daysUsed = Math.min(Math.max(1, daysUsedInput), totalDaysInCycle);
  const daysRemaining = Math.max(0, totalDaysInCycle - daysUsed);

  const dailyRate = planPrice / totalDaysInCycle;
  const usedValue = Math.round(daysUsed * dailyRate);
  const unusedValue = Math.max(0, planPrice - usedValue);

  // Mangaka direct creator pool (70% support)
  const creatorSupportContributed = Math.round(usedValue * 0.7);
  const estimatedRefundValue = Math.max(0, unusedValue);

  const handleProcessCancellation = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('mw_sub_cancelled', 'true');
    localStorage.setItem('mw_cancellation_calc', JSON.stringify({
      plan: selectedPlan,
      daysUsed,
      daysRemaining,
      estimatedRefundValue,
      mode: cancellationMode,
      date: new Date().toISOString(),
    }));

    if (onConfirmCancel) {
      onConfirmCancel(customReason || cancelReason, cancellationMode === 'immediate');
    }
    setIsSuccessSubmitted(true);
    setTimeout(() => {
      setIsSuccessSubmitted(false);
      onClose();
    }, 2800);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 modal-backdrop-overlay bg-black/85 backdrop-blur-md animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl max-h-[92vh] overflow-y-auto bg-black border border-white/25 rounded-3xl p-5 sm:p-7 space-y-6 shadow-2xl relative animate-scale-in text-white scrollbar-thin"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-800/80 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-zinc-800 text-white border border-zinc-700">
                <Calculator className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
                Subscription Calculator & Cancellation
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Prorated Cancellation & Refund Calculator
            </h2>
            <p className="text-xs text-zinc-400">
              Calculate remaining days, prorated values, and manage VIP auto-renewal with full transparency.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
            title="Close Calculator"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccessSubmitted ? (
          <div className="py-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-zinc-800 border border-zinc-700 text-white flex items-center justify-center mx-auto shadow-lg animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white">Cancellation Request Processed</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
              {cancellationMode === 'end_of_period'
                ? `Your VIP auto-renewal has been paused. You will retain all VIP reader privileges for the remaining ${daysRemaining} days with zero further charges.`
                : `Your subscription has been cancelled. An estimated refund request of ₹${estimatedRefundValue} has been queued to your original payment method.`}
            </p>
            <span className="text-[11px] font-mono text-zinc-500 block">
              Official Reference ID: MW-CANCEL-{Math.floor(100000 + Math.random() * 900000)}
            </span>
          </div>
        ) : (
          <form onSubmit={handleProcessCancellation} className="space-y-5">
            {/* Step 1: Select Plan to Calculate */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300 uppercase font-mono tracking-wider flex items-center justify-between">
                <span>1. Select Subscription Tier</span>
                {isVIP && (
                  <span className="text-[10px] text-zinc-200 font-mono flex items-center gap-1 font-bold">
                    <Crown className="w-3 h-3 text-white" /> User Active: {user.subscription?.planId || 'VIP'}
                  </span>
                )}
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlan('monthly');
                    setDaysUsedInput(Math.min(daysUsedInput, 30));
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedPlan === 'monthly'
                      ? 'border-white bg-zinc-800/80 shadow-md ring-1 ring-white/50'
                      : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/40 text-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Monthly Pass</span>
                    <span className="text-xs font-black font-mono text-white">₹199</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 font-mono mt-1">30 Days Cycle &bull; ₹6.63/day</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlan('yearly');
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedPlan === 'yearly'
                      ? 'border-white bg-zinc-800/80 shadow-md ring-1 ring-white/50'
                      : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/40 text-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Annual VIP Pass</span>
                    <span className="text-xs font-black font-mono text-white">₹1,499</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 font-mono mt-1">365 Days Cycle &bull; ₹4.10/day</p>
                </button>
              </div>
            </div>

            {/* Step 2: Interactive Days Used Slider / Calculator */}
            <div className="space-y-2 p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-300 flex items-center gap-1.5 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Days Consumed in Period</span>
                </span>
                <span className="font-mono font-bold text-white bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                  {daysUsed} of {totalDaysInCycle} Days
                </span>
              </div>

              <input
                type="range"
                min="1"
                max={totalDaysInCycle}
                value={daysUsed}
                onChange={e => setDaysUsedInput(parseInt(e.target.value, 10))}
                className="w-full accent-white h-2 bg-zinc-800 rounded-lg cursor-pointer"
              />

              <div className="flex justify-between text-[10px] font-mono text-zinc-500 pt-0.5">
                <span>Day 1 (New)</span>
                <span>Day {Math.round(totalDaysInCycle / 2)} (Mid-Cycle)</span>
                <span>Day {totalDaysInCycle} (Renewal)</span>
              </div>
            </div>

            {/* Step 3: Proration Breakdown Card */}
            <div className="space-y-3 p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold block">
                Calculated Breakdown
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-[10px] font-mono text-zinc-400 block">Total Paid</span>
                  <span className="text-sm font-black text-white font-mono">₹{planPrice}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-[10px] font-mono text-zinc-400 block">Days Left</span>
                  <span className="text-sm font-black text-white font-mono">{daysRemaining}d</span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-[10px] font-mono text-zinc-400 block">Consumed</span>
                  <span className="text-sm font-black text-zinc-400 font-mono">₹{usedValue}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-[10px] font-mono text-zinc-300 block">Remaining Value</span>
                  <span className="text-sm font-black text-white font-mono">₹{unusedValue}</span>
                </div>
              </div>

              {/* Creator Support transparency notice */}
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-[11px] text-zinc-400 font-mono">
                <HeartHandshake className="w-4 h-4 text-zinc-300 shrink-0" />
                <span>
                  70% of used period (₹{creatorSupportContributed}) has already supported independent mangaka artists.
                </span>
              </div>
            </div>

            {/* Step 4: Cancellation Preference */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300 uppercase font-mono tracking-wider block">
                2. Select Cancellation Mode
              </label>

              <div className="space-y-2">
                <label
                  className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                    cancellationMode === 'end_of_period'
                      ? 'border-white bg-zinc-800/80 text-white'
                      : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:bg-zinc-800/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="cancel_mode"
                    checked={cancellationMode === 'end_of_period'}
                    onChange={() => setCancellationMode('end_of_period')}
                    className="mt-1 accent-white"
                  />
                  <div className="space-y-0.5 text-xs">
                    <p className="font-bold text-white flex items-center gap-1.5">
                      <span>Cancel Auto-Renewal (Recommended)</span>
                      <span className="text-[9px] bg-zinc-700 text-zinc-200 px-1.5 py-0.5 rounded font-mono">
                        Keep VIP
                      </span>
                    </p>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Keep your full VIP benefits active for the remaining {daysRemaining} days. Your subscription will simply not renew at expiry, and you will not be charged.
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                    cancellationMode === 'immediate'
                      ? 'border-white bg-zinc-800/80 text-white'
                      : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:bg-zinc-800/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="cancel_mode"
                    checked={cancellationMode === 'immediate'}
                    onChange={() => setCancellationMode('immediate')}
                    className="mt-1 accent-white"
                  />
                  <div className="space-y-0.5 text-xs">
                    <p className="font-bold text-white flex items-center gap-1.5">
                      <span>Immediate Cancellation & Prorated Refund Claim</span>
                    </p>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Relinquish VIP perks right away and request an estimated prorated refund of ₹{estimatedRefundValue} to your original payment method.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Step 5: Cancellation Reason */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 block">
                Reason for Cancellation (Optional):
              </label>
              <select
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white focus:outline-none focus:border-white font-mono"
              >
                <option value="Finished current reading catalog">Finished current reading catalog</option>
                <option value="Taking a temporary break">Taking a temporary break</option>
                <option value="Switching reading devices">Switching reading devices</option>
                <option value="Testing subscription features">Testing subscription features</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Footer Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="submit"
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg active:scale-98 flex items-center justify-center gap-2"
              >
                <span>
                  {cancellationMode === 'end_of_period'
                    ? 'Confirm Cancellation (Keep Remaining Days)'
                    : `Confirm & Claim ₹${estimatedRefundValue} Refund`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto py-3 px-5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Keep Subscription
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
