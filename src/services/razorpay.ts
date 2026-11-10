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
  import.meta.env.VITE_RAZORPAY_KEY_ID &&
  String(import.meta.env.VITE_RAZORPAY_KEY_ID).startsWith('rzp_live_')
    ? (import.meta.env.VITE_RAZORPAY_KEY_ID as string)
    : 'rzp_live_TyPIbdkIBH1OQU';

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
 * Helper to create a live Razorpay order on the server
 */
async function createRazorpayServerOrder(params: {
  planId: string;
  amountInPaise: number;
  notes?: Record<string, string>;
}): Promise<{ orderId?: string; keyId?: string }> {
  try {
    const res = await fetch('/api/payment/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId: params.planId,
        amountInPaise: params.amountInPaise,
        currency: 'INR',
        notes: params.notes || {},
      }),
    });
    if (!res.ok) return {};
    const data = await res.json();
    if (data && data.success && data.orderId) {
      return { orderId: data.orderId, keyId: data.keyId };
    }
    return {};
  } catch {
    return {};
  }
}

/**
 * Launch official Razorpay standard checkout popup (Live Mode)
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

  const amountInPaise = Math.round(plan.priceInr * 100);
  const notes = {
    planId: plan.id,
    userId: user.id,
    platform: 'MangaWild VIP Subscriptions',
  };

  const serverOrder = await createRazorpayServerOrder({
    planId: plan.id,
    amountInPaise,
    notes,
  });

  const prefill: { name?: string; email?: string; contact?: string } = {
    name: user.name || undefined,
    email: user.email || undefined,
  };
  if ((user as any)?.phone) {
    prefill.contact = (user as any).phone;
  }

  const options: RazorpayOptions = {
    key: serverOrder.keyId || RAZORPAY_KEY_ID,
    amount: amountInPaise,
    currency: 'INR',
    name: 'MangaWild',
    description: `${plan.name} · ${plan.durationDays} Days Unrestricted VIP Access`,
    ...(serverOrder.orderId ? { order_id: serverOrder.orderId } : {}),
    prefill,
    notes,
    theme: {
      color: '#000000',
    },
    handler: async (response) => {
      if (response.razorpay_order_id && response.razorpay_signature) {
        try {
          const verifyRes = await fetch('/api/payment/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId: plan.id,
              userId: user.id,
            }),
          });
          const verifyData = await verifyRes.json();
          if (!verifyRes.ok || !verifyData.verified) {
            if (onError) {
              onError(new Error(verifyData.error || 'Payment verification failed.'));
            }
            return;
          }
        } catch (err: any) {
          if (onError) onError(err);
          return;
        }
      }
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
 * Launch Razorpay checkout specifically for Creator Tipping (Live Mode)
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

  const amountInPaise = Math.round(amountInr * 100);
  const notes = {
    creatorId,
    creatorName,
    tipMessage: message || 'Fan appreciation',
    platform: 'MangaWild Direct Creator Payouts',
  };

  const serverOrder = await createRazorpayServerOrder({
    planId: `tip_${creatorId}`,
    amountInPaise,
    notes,
  });

  const prefill: { name?: string; email?: string; contact?: string } = {
    name: user?.name || undefined,
    email: user?.email || undefined,
  };
  if ((user as any)?.phone) {
    prefill.contact = (user as any).phone;
  }

  const options: RazorpayOptions = {
    key: serverOrder.keyId || RAZORPAY_KEY_ID,
    amount: amountInPaise,
    currency: 'INR',
    name: 'MangaWild Creator Tip',
    description: `Support Creator: ${creatorName}${seriesTitle ? ` (${seriesTitle})` : ''}`,
    ...(serverOrder.orderId ? { order_id: serverOrder.orderId } : {}),
    prefill,
    notes,
    theme: {
      color: '#000000',
    },
    handler: async (response) => {
      if (response.razorpay_order_id && response.razorpay_signature) {
        try {
          const verifyRes = await fetch('/api/payment/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId: `tip_${creatorId}`,
              userId: user?.id,
            }),
          });
          const verifyData = await verifyRes.json();
          if (!verifyRes.ok || !verifyData.verified) {
            if (onError) {
              onError(new Error(verifyData.error || 'Tip payment verification failed.'));
            }
            return;
          }
        } catch (err: any) {
          if (onError) onError(err);
          return;
        }
      }
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

