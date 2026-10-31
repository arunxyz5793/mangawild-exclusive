/**
 * MangaWild Exclusive - Razorpay Subscription & Payment Gateway Integration
 */

import { SubscriptionPlan, PaymentRecord } from '../types/manga';
import { StorageService } from './storage';
import { User } from '../types/auth';

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'monthly',
    name: 'Monthly Exclusive',
    priceInr: 199,
    originalPriceInr: 299,
    billingPeriod: 'month',
    durationDays: 30,
    features: [
      'Instant access to all Exclusive chapters',
      'Early access to chapters 14 days before free release',
      '100% Ad-Free uninterrupted reading',
      'Exclusive Member crest on comments and profile',
      '70% direct royalty payout to indie creators',
      'HD webtoon and page-turn reader with panel zoom',
    ],
  },
  {
    id: 'yearly',
    name: 'Annual Exclusive',
    priceInr: 1499,
    originalPriceInr: 2388,
    billingPeriod: 'year',
    durationDays: 365,
    savingsBadge: 'Save 37%',
    features: [
      'Everything in Monthly Exclusive',
      'Full catalog download & offline cache',
      'Exclusive digital artwork wallpapers',
      'Founding Exclusive crest on reader profile',
      'Direct creator tipping power multiplier',
      'Save over ₹889 compared to monthly billing',
    ],
  },
];

export const RAZORPAY_KEY_ID =
  (import.meta.env.VITE_RAZORPAY_KEY_ID as string) || 'rzp_test_TiGD6mgGZQcUBE';

export interface RazorpayOptions {
  key: string;
  amount: number; // in paise
  currency: string;
  name: string;
  description: string;
  order_id?: string;
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
    razorpay_order_id?: string;
    razorpay_signature?: string;
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
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const existingScript = document.querySelector('script[src*="checkout.razorpay.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
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
 * Launch official Razorpay standard checkout popup
 */
export async function launchRazorpayCheckout({
  plan,
  user,
  onSuccess,
  onDismiss,
  onError,
}: {
  plan: SubscriptionPlan;
  user: User;
  onSuccess: (paymentId: string) => void;
  onDismiss?: () => void;
  onError?: (err: Error) => void;
}): Promise<boolean> {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded || !window.Razorpay) {
    if (onError) onError(new Error('Razorpay checkout SDK could not be loaded'));
    return false;
  }

  const options: RazorpayOptions = {
    key: RAZORPAY_KEY_ID,
    amount: plan.priceInr * 100, // paise
    currency: 'INR',
    name: 'MangaWild',
    description: `${plan.name} · ${plan.durationDays} Days Unrestricted VIP Access`,
    prefill: {
      name: user.name || 'MangaWild Reader',
      email: user.email || 'reader@mangawild.com',
      contact: (user as any).phone || '9999999999',
    },
    notes: {
      planId: plan.id,
      userId: user.id,
      platform: 'MangaWild VIP Subscriptions',
    },
    theme: {
      color: '#000000',
    },
    handler: (response) => {
      onSuccess(response.razorpay_payment_id);
    },
    modal: {
      ondismiss: () => {
        if (onDismiss) onDismiss();
      },
    },
  };

  try {
    const rzp = new window.Razorpay(options);
    rzp.open();
    return true;
  } catch (err: any) {
    if (onError) onError(err);
    return false;
  }
}

/**
 * Process a successful subscription transaction
 */
export function processSubscriptionSuccess(
  user: User,
  planId: 'monthly' | 'yearly',
  paymentMethod: 'UPI' | 'Card' | 'Netbanking' | 'Razorpay',
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

  // Persist updated user in users collection
  const allUsers = StorageService.getUsers();
  const uIdx = allUsers.findIndex(u => u.id === user.id || (u.email && user.email && u.email.toLowerCase() === user.email.toLowerCase()));
  if (uIdx >= 0) {
    allUsers[uIdx] = updatedUser;
    StorageService.saveUsers(allUsers);
  }

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

/**
 * Launch Razorpay checkout specifically for Creator Tipping
 */
export async function launchRazorpayTipCheckout({
  amountInr,
  creatorName,
  creatorId,
  seriesTitle,
  user,
  message,
  onSuccess,
  onDismiss,
  onError,
}: {
  amountInr: number;
  creatorName: string;
  creatorId: string;
  seriesTitle?: string;
  user?: User | null;
  message?: string;
  onSuccess: (paymentId: string) => void;
  onDismiss?: () => void;
  onError?: (err: Error) => void;
}): Promise<boolean> {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded || !window.Razorpay) {
    if (onError) onError(new Error('Razorpay payment gateway could not be loaded.'));
    return false;
  }

  const options: RazorpayOptions = {
    key: RAZORPAY_KEY_ID,
    amount: Math.round(amountInr * 100), // paise
    currency: 'INR',
    name: 'MangaWild Creator Tip',
    description: `Support Mangaka: ${creatorName}${seriesTitle ? ` (${seriesTitle})` : ''}`,
    prefill: {
      name: user?.name || 'Manga Supporter',
      email: user?.email || 'reader@mangawild.com',
      contact: (user as any)?.phone || '9999999999',
    },
    notes: {
      creatorId,
      creatorName,
      tipMessage: message || 'Fan appreciation',
      platform: 'MangaWild Direct Mangaka Payouts',
    },
    theme: {
      color: '#000000',
    },
    handler: (response) => {
      onSuccess(response.razorpay_payment_id);
    },
    modal: {
      ondismiss: () => {
        if (onDismiss) onDismiss();
      },
    },
  };

  try {
    const rzp = new window.Razorpay(options);
    rzp.open();
    return true;
  } catch (err: any) {
    if (onError) onError(err);
    return false;
  }
}

