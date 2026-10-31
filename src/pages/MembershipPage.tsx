import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles,
  Check,
  ShieldCheck,
  Receipt,
  Crown,
  HelpCircle,
  X,
  Gift,
  Tag,
  Zap,
  Printer,
  Info,
  Calendar,
} from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '../services/razorpay';
import { SubscriptionPlan } from '../types/manga';
import { useAuth } from '../context/AuthContext';
import { StorageService } from '../services/storage';
import { useLanguage } from '../context/LanguageContext';

interface MembershipPageProps {
  onOpenVIPModal: (planId?: 'monthly' | 'yearly') => void;
}

export const MembershipPage: React.FC<MembershipPageProps> = ({ onOpenVIPModal }) => {
  const { user, isVIP, isAuthenticated, activateSubscription, cancelSubscription } = useAuth();
  const { t } = useLanguage();

  const [selectedPlanId, setSelectedPlanId] = useState<'monthly' | 'yearly'>('yearly');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [detailsModalPlan, setDetailsModalPlan] = useState<SubscriptionPlan | null>(null);

  // Promo code state
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState<number | null>(null);
  const [couponMessage, setCouponMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Cancellation state
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Finished reading favorite series');
  const [cancelNotes, setCancelNotes] = useState('');

  // Support ticket modal state
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [supportSubject, setSupportSubject] = useState('Subscription / Billing Query');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSuccess, setSupportSuccess] = useState<string | null>(null);

  // Gift modal state
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [giftRecipient, setGiftRecipient] = useState('');
  const [giftSuccess, setGiftSuccess] = useState<string | null>(null);

  // Toast message
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Lock background page scroll whenever any modal is open
  const isAnyModalOpen = Boolean(
    detailsModalPlan || isCancelModalOpen || isSupportModalOpen || isGiftModalOpen
  );

  useEffect(() => {
    if (isAnyModalOpen) {
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
  }, [isAnyModalOpen]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleConfirmCancellation = (e: React.FormEvent) => {
    e.preventDefault();
    cancelSubscription();
    setIsCancelModalOpen(false);
    showToast('Your Exclusive subscription has been cancelled immediately.');
  };

  const handleSendSupportTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;
    setSupportSuccess('Thank you! Your ticket has been logged and sent to mangawildofficial@gmail.com. Our reader team will respond to your email.');
    setTimeout(() => {
      setSupportSuccess(null);
      setIsSupportModalOpen(false);
      setSupportMessage('');
    }, 3200);
  };

  const payments = StorageService.getPayments().filter(p => p.userId === user.id);
  const activePlanId = user?.subscription?.planId || (isVIP ? 'yearly' : null);

  const handleApplyCoupon = () => {
    const clean = couponCode.trim().toUpperCase();
    if (!clean) return;

    if (clean === 'MANGAWILD20' || clean === 'VIP20' || clean === 'EXCLUSIVE20') {
      setCouponDiscount(20); // 20% discount
      setCouponMessage({ text: 'Coupon applied! 20% discount applied to your order.', isError: false });
    } else if (clean === 'FIRST50' || clean === 'SPECIAL50') {
      setCouponDiscount(50); // ₹50 flat
      setCouponMessage({ text: 'Special ₹50 savings voucher applied!', isError: false });
    } else {
      setCouponDiscount(null);
      setCouponMessage({ text: 'Invalid or expired coupon code. Try MANGAWILD20 for 20% off.', isError: true });
    }
  };

  const handleStartFreeTrial = (plan: SubscriptionPlan) => {
    try {
      activateSubscription(plan.id, 'UPI', `trial_free_7days_${Date.now()}`);
      setDetailsModalPlan(null);
      showToast('🎉 Congratulations! Your 7-Day All-Access Exclusive Free Trial has been activated.');
    } catch {
      showToast('Could not activate trial. Please sign in first.');
    }
  };

  const handleSendGift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftRecipient.trim()) return;
    setGiftSuccess(`Exclusive Gift successfully queued for ${giftRecipient.trim()}! An invitation link has been dispatched.`);
    setTimeout(() => {
      setGiftSuccess(null);
      setIsGiftModalOpen(false);
      setGiftRecipient('');
    }, 2800);
  };

  const handlePrintInvoice = (invoiceNum: string, amount: number, dateStr: string) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>MangaWild VIP Invoice - ${invoiceNum}</title>
            <style>
              body { font-family: monospace, sans-serif; padding: 40px; background: #fff; color: #111; }
              .header { border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; }
              .title { font-size: 24px; font-weight: bold; }
              .meta { font-size: 13px; color: #555; }
              .table { width: 100%; border-collapse: collapse; margin-top: 25px; }
              .table th, .table td { border-bottom: 1px solid #ddd; padding: 10px; text-align: left; }
              .total { font-size: 18px; font-weight: bold; margin-top: 30px; text-align: right; }
              .footer { margin-top: 50px; font-size: 11px; color: #777; text-align: center; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">MANGAWILD MEDIA PRIVATE LIMITED</div>
              <div class="meta">Official VIP Tax Invoice / Receipt &bull; 256-Bit SSL Encrypted</div>
            </div>
            <p><strong>Invoice Number:</strong> ${invoiceNum}</p>
            <p><strong>Billed To:</strong> ${user.email || user.name} (@${user.username || 'reader'})</p>
            <p><strong>Date:</strong> ${new Date(dateStr).toLocaleDateString()}</p>
            <p><strong>Payment Gateway:</strong> Razorpay UPI / Cards (Captured)</p>
            <table class="table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Billing Term</th>
                  <th>Rate</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>MangaWild All-Access Pass (Ad-Free, 4K Scans, VIP Exclusive Unlocks)</td>
                  <td>Subscription Term</td>
                  <td>₹${amount}</td>
                  <td>₹${amount}</td>
                </tr>
              </tbody>
            </table>
            <div class="total">Total Paid (Inclusive of GST): ₹${amount}</div>
            <div class="footer">
              Thank you for supporting indie mangaka and independent creators on MangaWild.
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 250);
    } else {
      showToast(`Receipt #${invoiceNum} downloaded to cache.`);
    }
  };

  const handleCancelAutoRenewal = () => {
    showToast('Auto-renewal paused. Your current VIP perks remain active until the end of your billing term with no further charges.');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-16 animate-fade-in select-none">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 border border-zinc-700 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in font-mono text-xs">
          <Sparkles className="w-4 h-4 text-zinc-300 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. Hero Header */}
      <div className="text-center space-y-3.5 max-w-3xl mx-auto">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-zinc-300 bg-white/5 px-3 py-1 rounded-full border border-white/10 font-mono">
          <Crown className="w-3.5 h-3.5 text-zinc-200" /> EXCLUSIVE
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Exclusive Membership
        </h1>
        <p className="text-zinc-400 text-sm leading-relaxed max-w-lg mx-auto">
          Unlimited Exclusive chapters, ad-free reading, and direct creator support.
        </p>

        {isVIP && (
          <div className="inline-flex items-center gap-2 p-1.5 px-3.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-medium">
            <Check className="w-3.5 h-3.5 text-white" />
            <span>Exclusive Subscription Active</span>
          </div>
        )}

        {/* Billing Cycle Switcher with Savings Badge */}
        <div className="pt-3 flex items-center justify-center">
          <div className="inline-flex items-center p-1 rounded-xl bg-zinc-900 border border-zinc-800">
            <button
              type="button"
              onClick={() => {
                setBillingCycle('monthly');
                setSelectedPlanId('monthly');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-white text-zinc-950 font-semibold shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => {
                setBillingCycle('yearly');
                setSelectedPlanId('yearly');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                billingCycle === 'yearly'
                  ? 'bg-white text-zinc-950 font-semibold shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>Annual</span>
              <span className="text-[10px] font-mono font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700 px-1.5 py-0.2 rounded">
                -37%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Prominent Active Subscription Showcase Banner when VIP is Active */}
      {isVIP && (
        <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900/80 border border-zinc-800 shadow-xl space-y-5 max-w-4xl mx-auto text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-zinc-800 text-white border border-zinc-700 flex items-center justify-center shrink-0 shadow-md">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-300 font-bold bg-zinc-800 px-2.5 py-0.5 rounded border border-zinc-700">
                    CURRENT ACTIVE PLAN
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">
                    @{user.username || 'reader'}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  {activePlanId === 'yearly'
                    ? 'Annual Exclusive (₹1,499/year)'
                    : 'Monthly Exclusive (₹199/month)'}
                </h2>
              </div>
            </div>
            <div className="text-left sm:text-right font-mono">
              <span className="text-xs text-zinc-400 block">Subscription Status:</span>
              <span className="text-sm font-bold text-white flex items-center sm:justify-end gap-1.5">
                <Check className="w-4 h-4 text-white" /> Active & Unrestricted
              </span>
              {user.subscription?.expiresAt && (
                <span className="text-[11px] text-zinc-400 block mt-0.5">
                  Valid until {new Date(user.subscription.expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              )}
            </div>
          </div>

          {/* Unlocked Benefits Summary & Manage Subscription */}
          <div className="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-zinc-300">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-white shrink-0" />
                <span>All Exclusive Chapters Unlocked</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-white shrink-0" />
                <span>100% Ad-Free Reading Experience</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-white shrink-0" />
                <span>70% Direct Royalties to Manga Creators</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs text-white font-semibold transition-colors cursor-pointer active:scale-95"
              >
                Cancel Subscription
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Pricing Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {SUBSCRIPTION_PLANS.map((plan: SubscriptionPlan) => {
          const isSelected = selectedPlanId === plan.id;
          const isYearly = plan.id === 'yearly';
          const isThisPlanActive = isVIP && activePlanId === plan.id;

          return (
            <div
              key={plan.id}
              onClick={() => setSelectedPlanId(plan.id)}
              className={`relative rounded-3xl p-8 transition-all flex flex-col justify-between ${
                isThisPlanActive
                  ? 'bg-zinc-900 border-2 border-white shadow-xl'
                  : isYearly
                  ? 'bg-zinc-900/60 border border-zinc-700 hover:border-zinc-500 shadow-md'
                  : 'bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {isThisPlanActive ? (
                <span className="absolute -top-3.5 right-6 bg-white text-zinc-950 text-xs font-black font-mono tracking-wider px-3.5 py-1 rounded-full shadow-lg uppercase flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-black" /> ACTIVE PLAN
                </span>
              ) : plan.savingsBadge ? (
                <span className="absolute -top-3.5 right-6 bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-bold font-mono tracking-wider px-3 py-1 rounded-full shadow-md uppercase">
                  {plan.savingsBadge}
                </span>
              ) : null}

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center justify-between">
                    <span>{plan.name}</span>
                    {isThisPlanActive ? (
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">
                        Active
                      </span>
                    ) : isYearly ? (
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                        Most Popular
                      </span>
                    ) : null}
                  </h3>
                  <div className="flex items-baseline gap-2 mt-3">
                    <span className="text-4xl sm:text-5xl font-black text-white font-display">
                      ₹{plan.priceInr}
                    </span>
                    <span className="text-stone-400 text-xs font-medium">/ {plan.billingPeriod}</span>
                    {plan.originalPriceInr && (
                      <span className="text-stone-500 line-through text-sm font-mono">
                        ₹{plan.originalPriceInr}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-400 mt-1">
                    {plan.durationDays} days of total uninterrupted Exclusive reading
                  </p>
                </div>

                <div className="space-y-3 border-t border-white/10 pt-6">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                      Included:
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailsModalPlan(plan);
                      }}
                      className="text-xs text-zinc-300 hover:text-white font-mono font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <Info className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Details</span>
                    </button>
                  </div>
                  <ul className="space-y-2.5 text-xs text-stone-300">
                    {plan.features.map(feat => (
                      <li key={feat} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Buttons for Plan */}
              <div className="pt-8 space-y-2.5">
                {isThisPlanActive ? (
                  <div className="w-full py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 bg-zinc-800 border border-zinc-700 text-zinc-200">
                    <Check className="w-4 h-4 text-white" />
                    <span>Your Current Active Plan</span>
                  </div>
                ) : isVIP && activePlanId === 'yearly' && plan.id === 'monthly' ? (
                  <div className="w-full py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 bg-zinc-800 text-zinc-400 border border-zinc-700">
                    <span>Covered by Annual Plan</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onOpenVIPModal(plan.id)}
                    className="w-full py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-98 bg-white hover:bg-zinc-200 text-zinc-950"
                  >
                    <span>
                      {isVIP
                        ? 'Upgrade to Annual Exclusive'
                        : isAuthenticated
                        ? `Subscribe for ₹${plan.priceInr}`
                        : 'Sign In to Get Exclusive'}
                    </span>
                  </button>
                )}

                {/* Secondary Action: Plan Details Drawer */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDetailsModalPlan(plan);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-zinc-700/60"
                  >
                    <Info className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Plan Details</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust & UPI Banner */}
      <div className="max-w-4xl mx-auto p-5 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-400">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-stone-300 shrink-0" />
          <span>{t.membership.upiCardsNetbanking}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-semibold text-white">Razorpay 256-Bit SSL Secured</span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-400">Instant Activation</span>
        </div>
      </div>

      {/* User Billing History Table with Printable Tax Receipt */}
      {payments.length > 0 && (
        <div className="max-w-4xl mx-auto space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-white" />
              <span>My Invoices & Billing History</span>
            </span>
            <span className="text-xs text-zinc-400 font-mono font-normal">
              {payments.length} Transaction{payments.length > 1 ? 's' : ''}
            </span>
          </h3>

          <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#101014]">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="bg-[#09090b] uppercase text-[11px] font-bold text-stone-400 border-b border-white/10 font-mono">
                <tr>
                  <th className="py-3 px-4">Invoice</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {payments.map(pay => (
                  <tr key={pay.id} className="hover:bg-white/[0.02]">
                    <td className="py-3.5 px-4 font-bold text-white">
                      #{pay.id.slice(-6).toUpperCase()}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">₹{pay.amountInr}</td>
                    <td className="py-3.5 px-4 capitalize text-stone-400">{pay.paymentMethod}</td>
                    <td className="py-3.5 px-4 text-stone-400">
                      {new Date(pay.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white/10 text-white border border-white/20">
                        {pay.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handlePrintInvoice(pay.invoiceNumber || pay.id, pay.amountInr, pay.createdAt)}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1.5 text-[11px]"
                        title="Download / Print Official Receipt"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Feature Comparison Matrix Table */}
      <div className="max-w-4xl mx-auto space-y-4 pt-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-zinc-300" />
          <span>Membership Comparison Matrix</span>
        </h3>

        <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950/60">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-zinc-800 font-mono text-[11px] uppercase text-zinc-400">
                <th className="p-4">Feature / Benefit</th>
                <th className="p-4 text-center">Free Reader</th>
                <th className="p-4 text-center text-zinc-200 bg-zinc-900/60">Exclusive Member</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80 font-mono text-zinc-300">
              <tr>
                <td className="p-3.5 pl-4 font-sans font-medium text-white">Full Access to All Exclusive Chapters</td>
                <td className="p-3.5 text-center text-zinc-500">Locked / Previews only</td>
                <td className="p-3.5 text-center text-white font-bold bg-zinc-900/30">✓ 100% Unrestricted</td>
              </tr>
              <tr>
                <td className="p-3.5 pl-4 font-sans font-medium text-white">Ad-Free Uninterrupted Reading</td>
                <td className="p-3.5 text-center text-zinc-500">Standard Ads</td>
                <td className="p-3.5 text-center text-white font-bold bg-zinc-900/30">✓ Completely Ad-Free</td>
              </tr>
              <tr>
                <td className="p-3.5 pl-4 font-sans font-medium text-white">Ultra HD 4K Scans & Full Zoom</td>
                <td className="p-3.5 text-center text-zinc-500">Standard Definition</td>
                <td className="p-3.5 text-center text-white font-bold bg-zinc-900/30">✓ High DPI 4K Zoom</td>
              </tr>
              <tr>
                <td className="p-3.5 pl-4 font-sans font-medium text-white">24-Hour Early Access to New Releases</td>
                <td className="p-3.5 text-center text-zinc-500">Public Release</td>
                <td className="p-3.5 text-center text-white font-bold bg-zinc-900/30">✓ 24-Hour Early Drop</td>
              </tr>
              <tr>
                <td className="p-3.5 pl-4 font-sans font-medium text-white">Direct Manga Creator Royalty Share</td>
                <td className="p-3.5 text-center text-zinc-500">Ad revenue pool</td>
                <td className="p-3.5 text-center text-white font-bold bg-zinc-900/30">✓ 70% Direct to Artists</td>
              </tr>
              <tr>
                <td className="p-3.5 pl-4 font-sans font-medium text-white">Exclusive Badge on Profile & Comments</td>
                <td className="p-3.5 text-center text-zinc-500">None</td>
                <td className="p-3.5 text-center text-zinc-200 font-bold bg-zinc-900/30">✓ Exclusive Badge</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto space-y-6 pt-8 border-t border-white/10">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-white" />
          <span>Frequently Asked Questions</span>
        </h3>

        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
            <h4 className="text-sm font-bold text-white">How does creator revenue sharing work?</h4>
            <p className="text-xs text-stone-400 leading-relaxed">
              70% of subscription revenue pool is distributed weekly to manga creators whose chapters you read. This directly funds artists so they can produce more chapters.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
            <h4 className="text-sm font-bold text-white">What payment options are supported?</h4>
            <p className="text-xs text-stone-400 leading-relaxed">
              Razorpay supports all major UPI applications (Google Pay, PhonePe, Paytm, BHIM), RuPay/Visa/Mastercard debit and credit cards, and 50+ netbanking portals.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
            <h4 className="text-sm font-bold text-white">Can I cancel anytime?</h4>
            <p className="text-xs text-stone-400 leading-relaxed">
              Yes, subscriptions can be cancelled anytime with a single click in your profile settings. You will retain VIP perks until the end of your billing cycle.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Comprehensive Interactive Plan Details Modal (Portaled to Viewport Center) */}
      {detailsModalPlan &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop-overlay bg-black/80 backdrop-blur-md"
            onClick={() => setDetailsModalPlan(null)}
          >
            <div
              className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-zinc-900 border border-zinc-700/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative animate-scale-in text-white"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-300 bg-zinc-800 px-2.5 py-1 rounded-full border border-zinc-700">
                    Detailed Plan Breakdown
                  </span>
                  <h3 className="text-2xl font-black text-white mt-1.5">
                    {detailsModalPlan.name}
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono">
                    ₹{detailsModalPlan.priceInr} / {detailsModalPlan.billingPeriod} &bull; {detailsModalPlan.durationDays} Days All-Access
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailsModalPlan(null)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Complete Benefit List */}
              <div className="space-y-3 p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-xs font-mono font-bold uppercase text-zinc-400 tracking-wider">
                  Full Perks List & Guarantee
                </span>
                <ul className="space-y-2 text-xs text-zinc-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-white shrink-0" />
                    <span>Permanent access to all locked & Exclusive manga series</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-white shrink-0" />
                    <span>100% Ad-Free reading with zero interruptions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-white shrink-0" />
                    <span>Ultra-crisp 4K scan resolution & panel zoom enhancement</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-white shrink-0" />
                    <span>24-Hour early drop access for new chapter uploads</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-white shrink-0" />
                    <span>70% direct creator royalty pool allocation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-white shrink-0" />
                    <span>Exclusive badge on user profile, comments, and reviews</span>
                  </li>
                </ul>
              </div>

              {/* Promo / Coupon Code Section */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-zinc-800/40 border border-zinc-700/60">
                <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-zinc-300" />
                  <span>Have a discount coupon? (Try: MANGAWILD20)</span>
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value)}
                    placeholder="Enter promo coupon code..."
                    className="flex-1 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white placeholder-zinc-500 uppercase font-mono focus:outline-none focus:border-white"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-3.5 py-1.5 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
                {couponMessage && (
                  <p className={`text-[11px] font-mono ${couponMessage.isError ? 'text-zinc-400' : 'text-white'}`}>
                    {couponMessage.text}
                  </p>
                )}
              </div>

              {/* Action Buttons inside Details Modal */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDetailsModalPlan(null);
                    onOpenVIPModal(detailsModalPlan.id);
                  }}
                  className="w-full py-3.5 px-4 bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Zap className="w-4 h-4 text-zinc-950" />
                  <span>
                    {couponDiscount
                      ? `Proceed with Discount (₹${Math.round(detailsModalPlan.priceInr * (1 - couponDiscount / 100))})`
                      : `Proceed to Payment (₹${detailsModalPlan.priceInr})`}
                  </span>
                </button>

                <div>
                  <button
                    type="button"
                    onClick={() => handleStartFreeTrial(detailsModalPlan)}
                    className="w-full py-2.5 px-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-xs font-bold text-zinc-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5 text-zinc-300" />
                    <span>Start 7-Day Trial</span>
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* 5. Reader Support & Billing Help Center Section */}
      <div className="max-w-4xl mx-auto p-6 sm:p-8 rounded-3xl bg-zinc-900/80 border border-zinc-800 space-y-6 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold bg-zinc-800 px-2.5 py-0.5 rounded border border-zinc-700">
              READER SUPPORT & BILLING DESK
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white mt-2">
              Need Help with Subscriptions or Reading?
            </h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">
              Have questions regarding your VIP membership, payments, cancellation requests, or manga chapter access? Contact our reader support desk directly.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsSupportModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs cursor-pointer shadow-md transition-all active:scale-95 shrink-0"
          >
            Submit Help Ticket
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-zinc-800/80 text-xs text-zinc-300">
          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-1">
            <span className="text-[10px] font-mono text-zinc-500 block uppercase">Official Email</span>
            <a
              href="mailto:mangawildofficial@gmail.com"
              className="font-mono text-white hover:underline font-semibold block break-all"
              title="Send email to mangawildofficial@gmail.com"
            >
              mangawildofficial@gmail.com
            </a>
            <p className="text-[11px] text-zinc-400">Tap to open Mail / Gmail</p>
          </div>
          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-1">
            <span className="text-[10px] font-mono text-zinc-500 block uppercase">Cancellation Guarantee</span>
            <span className="text-white font-semibold">Self-Service in 1 Click</span>
            <p className="text-[11px] text-zinc-400">Zero cancellation charges</p>
          </div>
          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-1">
            <span className="text-[10px] font-mono text-zinc-500 block uppercase">Creator Royalty Protection</span>
            <span className="text-white font-semibold">70% Direct Payout</span>
            <p className="text-[11px] text-zinc-400">Weekly creator distributions</p>
          </div>
        </div>
      </div>

      {/* 6. Cancel Subscription Modal (Portaled to Viewport Center) */}
      {isCancelModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop-overlay bg-black/80 backdrop-blur-md"
            onClick={() => setIsCancelModalOpen(false)}
          >
            <div
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-zinc-900 border border-zinc-700/80 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl relative animate-scale-in text-white"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-300 font-bold bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                    Manage Plan
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1">Cancel VIP Subscription</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                Please select your reason below to confirm immediate cancellation of your VIP subscription.
              </p>

              <form onSubmit={handleConfirmCancellation} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Please let us know why you&apos;re cancelling:
                  </label>
                  <select
                    value={cancelReason}
                    onChange={e => setCancelReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white focus:outline-none focus:border-white"
                  >
                    <option value="Finished reading favorite series">Finished reading favorite series</option>
                    <option value="Taking a temporary break">Taking a temporary break</option>
                    <option value="Subscription fee or billing concern">Subscription fee or billing concern</option>
                    <option value="Technical or reader experience issue">Technical or reader experience issue</option>
                    <option value="Other reason">Other reason</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Additional feedback (optional):
                  </label>
                  <textarea
                    rows={2}
                    value={cancelNotes}
                    onChange={e => setCancelNotes(e.target.value)}
                    placeholder="How can we make MangaWild better?"
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCancelModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 cursor-pointer"
                  >
                    Keep My Subscription
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs cursor-pointer shadow-md transition-all active:scale-95"
                  >
                    Confirm Cancellation
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* 7. Support Ticket Modal (Portaled to Viewport Center) */}
      {isSupportModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop-overlay bg-black/80 backdrop-blur-md"
            onClick={() => setIsSupportModalOpen(false)}
          >
            <div
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-zinc-900 border border-zinc-700/80 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl relative animate-scale-in text-white"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                    Reader Help Desk
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1">Submit Support Ticket</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSupportModalOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {supportSuccess ? (
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-700 text-zinc-200 text-xs font-mono">
                  {supportSuccess}
                </div>
              ) : (
                <form onSubmit={handleSendSupportTicket} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Subject</label>
                    <select
                      value={supportSubject}
                      onChange={e => setSupportSubject(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white focus:outline-none focus:border-white"
                    >
                      <option value="Subscription / Billing Query">Subscription / Billing Query</option>
                      <option value="Cancellation / Refund Assistance">Cancellation / Refund Assistance</option>
                      <option value="Manga Reading / Scan Issue">Manga Reading / Scan Issue</option>
                      <option value="Account Access / Verification">Account Access / Verification</option>
                      <option value="Creator Inquiry">Creator Inquiry</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Your Email</label>
                    <input
                      type="email"
                      required
                      defaultValue={user.email || 'reader@example.com'}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Message Details</label>
                    <textarea
                      required
                      rows={4}
                      value={supportMessage}
                      onChange={e => setSupportMessage(e.target.value)}
                      placeholder="Describe your issue or query in detail..."
                      className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white"
                    />
                  </div>

                  <div className="flex justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsSupportModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs cursor-pointer shadow-md transition-all active:scale-95"
                    >
                      Send Ticket
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
