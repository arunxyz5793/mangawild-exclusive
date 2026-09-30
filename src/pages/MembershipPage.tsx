import React, { useState } from 'react';
import { Sparkles, Check, ShieldCheck, Receipt, Crown, HelpCircle } from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '../services/razorpay';
import { SubscriptionPlan } from '../types/manga';
import { useAuth } from '../context/AuthContext';
import { StorageService } from '../services/storage';
import { useLanguage } from '../context/LanguageContext';

interface MembershipPageProps {
  onOpenVIPModal: (planId?: 'monthly' | 'yearly') => void;
}

export const MembershipPage: React.FC<MembershipPageProps> = ({ onOpenVIPModal }) => {
  const { user, isVIP } = useAuth();
  const { t } = useLanguage();

  const [selectedPlanId, setSelectedPlanId] = useState<'monthly' | 'yearly'>('yearly');

  const payments = StorageService.getPayments().filter(p => p.userId === user.id);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-16 animate-fade-in">
      {/* 1. Hero Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-stone-300 bg-white/5 px-3 py-1 rounded-full border border-white/10 font-mono">
          <Crown className="w-3.5 h-3.5 text-white" /> MANGAWILD ALL-ACCESS PASS
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Read Unrestricted. Support Independent Creators.
        </h1>
        <p className="text-stone-400 text-sm sm:text-base leading-relaxed">
          {t.membership.subtitle}
        </p>

        {isVIP && (
          <div className="inline-flex items-center gap-2 p-2 px-4 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 text-xs font-semibold">
            <Check className="w-4 h-4" />
            <span>Active VIP Subscription Enabled on your Account</span>
          </div>
        )}
      </div>

      {/* 2. Pricing Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {SUBSCRIPTION_PLANS.map((plan: SubscriptionPlan) => {
          const isSelected = selectedPlanId === plan.id;
          const isYearly = plan.id === 'yearly';

          return (
            <div
              key={plan.id}
              onClick={() => setSelectedPlanId(plan.id)}
              className={`relative rounded-3xl p-8 transition-all cursor-pointer flex flex-col justify-between ${
                isYearly
                  ? 'bg-[#141418] border-2 border-white shadow-2xl ring-1 ring-white/20'
                  : 'bg-[#101014] border border-white/10 hover:border-white/25'
              }`}
            >
              {plan.savingsBadge && (
                <span className="absolute -top-3.5 right-6 bg-white text-black text-xs font-bold font-mono tracking-wider px-3 py-1 rounded-full shadow-lg uppercase">
                  {plan.savingsBadge}
                </span>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center justify-between">
                    <span>{plan.name}</span>
                    {isYearly && (
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/10 text-white border border-white/20">
                        Most Popular
                      </span>
                    )}
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
                    {plan.durationDays} days of total uninterrupted VIP reading
                  </p>
                </div>

                <div className="space-y-3 border-t border-white/10 pt-6">
                  <span className="text-xs font-bold text-stone-300 uppercase tracking-wider block">
                    What&apos;s Included:
                  </span>
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

              <div className="pt-8">
                <button
                  type="button"
                  onClick={() => onOpenVIPModal(plan.id)}
                  className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg ${
                    isYearly
                      ? 'bg-white hover:bg-stone-200 text-black'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Subscribe with Razorpay</span>
                </button>
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
        <span className="font-semibold text-white">Razorpay 256-Bit SSL Secured</span>
      </div>

      {/* User Billing History Table */}
      {payments.length > 0 && (
        <div className="max-w-4xl mx-auto space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-white" />
            <span>My Invoices & Billing History</span>
          </h3>

          <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#101014]">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="bg-[#09090b] uppercase text-[11px] font-bold text-stone-400 border-b border-white/10 font-mono">
                <tr>
                  <th className="py-3 px-4">Invoice</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Status</th>
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
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {pay.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
    </div>
  );
};
