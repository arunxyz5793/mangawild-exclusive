/**
 * MangaWild Exclusive - Razorpay Subscription & Payment Gateway Integration
 */

import { SubscriptionPlan, PaymentRecord } from '../types/manga';
import { StorageService } from './storage';
import { User } from '../types/auth';

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'monthly',
    name: 'MangaWild VIP Monthly Pass',
    priceInr: 199,
    originalPriceInr: 299,
    billingPeriod: 'month',
    durationDays: 30,
    features: [
      'Instant access to all VIP exclusive chapters',
      'Early access to chapters 14 days before free release',
      '100% Ad-Free uninterrupted reading',
      'VIP Member crest on comments and profile',
      '70% direct royalty payout to indie creators',
      'HD webtoon and page-turn reader with panel zoom',
    ],
  },
  {
    id: 'yearly',
    name: 'MangaWild VIP Annual Pass',
    priceInr: 1499,
    originalPriceInr: 2388,
    billingPeriod: 'year',
    durationDays: 365,
    savingsBadge: 'Save 37%',
    features: [
      'Everything in Monthly VIP Pass',
      'Full catalog download & offline cache',
      'Exclusive digital artwork wallpapers',
      'Founding VIP crest on reader profile',
      'Direct creator tipping power multiplier',
      'Save over ₹889 compared to monthly billing',
    ],
  },
];

export interface RazorpayOptions {
  key: string;
  amount: number; // in paise
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => {
      open: () => void;
    };
  }
}

/**
 * Dynamically loads Razorpay checkout script if not already present
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('Failed to load external Razorpay checkout.js script.');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

/**
 * Process a successful subscription transaction
 */
export function processSubscriptionSuccess(
  user: User,
  planId: 'monthly' | 'yearly',
  paymentMethod: 'UPI' | 'Card' | 'Netbanking',
  customPaymentId?: string
): { updatedUser: User; paymentRecord: PaymentRecord } {
  const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId) || SUBSCRIPTION_PLANS[0];
  const paymentId = customPaymentId || `pay_MW_${Date.now()}`;
  const orderId = `order_MW_${Date.now().toString().slice(-8)}`;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000).toISOString();

  const updatedUser: User = {
    ...user,
    isVIP: true,
    role: user.role === 'free_user' ? 'subscriber' : user.role,
    subscription: {
      planId,
      status: 'active',
      startDate: now.toISOString(),
      expiresAt,
      razorpayPaymentId: paymentId,
    },
  };

  StorageService.setCurrentUser(updatedUser);

  const paymentRecord = StorageService.recordPayment({
    razorpayOrderId: orderId,
    razorpayPaymentId: paymentId,
    userId: user.id,
    userEmail: user.email,
    planId,
    amountInr: plan.priceInr,
    currency: 'INR',
    status: 'captured',
    paymentMethod,
  });

  // Add confirmation notification
  StorageService.addNotification({
    id: `notif_${Date.now()}`,
    userId: user.id,
    title: 'VIP Pass Activated! 🌟',
    message: `Welcome to MangaWild VIP! You now have unrestricted access to all exclusive chapters and 100% ad-free reading.`,
    type: 'payment',
    read: false,
    createdAt: new Date().toISOString(),
    link: '/library',
  });

  return { updatedUser, paymentRecord };
}
