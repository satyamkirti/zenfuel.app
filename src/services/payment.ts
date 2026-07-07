/**
 * Payment Service — Provider Abstraction Layer
 *
 * This file is ready for integration with:
 * - Stripe (web)
 * - Razorpay (India)
 * - Google Play Billing (Android)
 * - Apple In-App Purchases (iOS)
 *
 * To activate a provider:
 * 1. Install the SDK: npm install @stripe/stripe-js  OR  razorpay
 * 2. Add env vars to .env.local
 * 3. Uncomment the provider block below
 * 4. Create a backend webhook at /api/subscription/webhook to validate purchases
 */

import { SubscriptionPlan, PaymentProvider } from '@/types/subscription';
import { Subscription } from '@/types/subscription';

// ─── Plan IDs per provider ────────────────────────────────────────────────────
// Fill these after creating products in each payment dashboard

export const STRIPE_PRICE_IDS: Partial<Record<SubscriptionPlan, string>> = {
  // monthly: 'price_xxxxx',
  // yearly:  'price_xxxxx',
  // lifetime:'price_xxxxx',
};

export const RAZORPAY_PLAN_IDS: Partial<Record<SubscriptionPlan, string>> = {
  // monthly: 'plan_xxxxx',
  // yearly:  'plan_xxxxx',
};

export const GOOGLE_PLAY_SKUs: Partial<Record<SubscriptionPlan, string>> = {
  // monthly: 'com.yourapp.premium.monthly',
  // yearly:  'com.yourapp.premium.yearly',
  // lifetime:'com.yourapp.premium.lifetime',
};

export const APPLE_IAP_PRODUCT_IDS: Partial<Record<SubscriptionPlan, string>> = {
  // monthly: 'com.yourapp.premium.monthly',
  // yearly:  'com.yourapp.premium.yearly',
  // lifetime:'com.yourapp.premium.lifetime',
};

// ─── Pricing (shown in UI) ────────────────────────────────────────────────────
// Amounts in INR (₹). Multiply by 100 for Razorpay paise:
//   monthly  → 9900   paise (₹99)
//   yearly   → 110000 paise (₹1,100)
//   lifetime → 299900 paise (₹2,999)
export const PLAN_PRICES_INR: Record<SubscriptionPlan, number> = {
  free: 0,
  monthly: 99,
  yearly: 1100,
  lifetime: 2999,
};

export const PLAN_PRICES_USD: Record<SubscriptionPlan, number> = {
  free: 0,
  monthly: 1.19,
  yearly: 13.19,
  lifetime: 35.99,
};

// ─── Checkout initiators ──────────────────────────────────────────────────────

export interface CheckoutOptions {
  plan: SubscriptionPlan;
  provider: PaymentProvider;
  currency?: 'INR' | 'USD';
  userEmail?: string;
  onSuccess?: (sub: Subscription) => void;
  onError?: (error: Error) => void;
}

export async function initiateCheckout(options: CheckoutOptions): Promise<void> {
  const { plan, provider } = options;

  switch (provider) {
    case 'stripe': {
      // 1. Install: npm install @stripe/stripe-js
      // 2. Set NEXT_PUBLIC_STRIPE_KEY in .env.local
      // 3. Uncomment:
      //
      // const { loadStripe } = await import('@stripe/stripe-js');
      // const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY!);
      // const res = await fetch('/api/subscription/create-checkout', {
      //   method: 'POST',
      //   body: JSON.stringify({ plan, priceId: STRIPE_PRICE_IDS[plan], email: options.userEmail }),
      // });
      // const { sessionId } = await res.json();
      // await stripe!.redirectToCheckout({ sessionId });
      throw new Error('Stripe not configured. See src/services/payment.ts for setup instructions.');
    }

    case 'razorpay': {
      // 1. Install: npm install razorpay (backend)  +  load script on frontend
      // 2. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local
      // 3. Uncomment:
      //
      // const res = await fetch('/api/subscription/razorpay-order', {
      //   method: 'POST', body: JSON.stringify({ plan, amount: PLAN_PRICES_INR[plan] * 100 }),
      // });
      // const { orderId } = await res.json();
      // const rzp = new (window as any).Razorpay({
      //   key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      //   amount: PLAN_PRICES_INR[plan] * 100,
      //   currency: 'INR',
      //   order_id: orderId,
      //   handler: (response: any) => options.onSuccess?.({ ... }),
      // });
      // rzp.open();
      throw new Error('Razorpay not configured. See src/services/payment.ts for setup instructions.');
    }

    case 'google_play': {
      // Use @react-native-google-play-billing (React Native / Capacitor)
      throw new Error('Google Play Billing: available on Android builds only.');
    }

    case 'apple_iap': {
      // Use @react-native-iap or RevenueCat SDK
      throw new Error('Apple IAP: available on iOS builds only.');
    }

    case 'demo': {
      // Demo activation — no real payment
      return;
    }

    default:
      throw new Error(`Unknown payment provider: ${provider}`);
  }
}

// ─── Webhook verification (server-side) ──────────────────────────────────────
// Create /api/subscription/webhook/route.ts to handle:
// - stripe: stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)
// - razorpay: validateWebhookSignature(body, signature, RAZORPAY_WEBHOOK_SECRET)
// Then call saveSubscription() or update your DB

export function getWebhookInstructions(): string {
  return `
Webhook Endpoint: POST /api/subscription/webhook

For Stripe:
  1. Add STRIPE_WEBHOOK_SECRET to .env.local
  2. Create app/api/subscription/webhook/route.ts
  3. Verify signature + activate subscription in DB/localStorage

For Razorpay:
  1. Add RAZORPAY_WEBHOOK_SECRET to .env.local
  2. Same endpoint, different validation

Full setup guide: https://docs.stripe.com/webhooks
`;
}
