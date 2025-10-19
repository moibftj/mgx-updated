import { loadStripe } from "@stripe/stripe-js";

// Environment variables - these should be set in your .env file
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Price IDs - these should be set in your .env file and match your Stripe products
export const STRIPE_PRICES = {
  ONE_LETTER: import.meta.env.VITE_STRIPE_PRICE_ONE_LETTER, // $19.99
  FOUR_MONTHLY: import.meta.env.VITE_STRIPE_PRICE_FOUR_MONTHLY, // $49.99/month
  EIGHT_YEARLY: import.meta.env.VITE_STRIPE_PRICE_EIGHT_YEARLY, // $199.99/year
} as const;

export interface SubscriptionPlan {
  id: keyof typeof STRIPE_PRICES;
  name: string;
  price: number;
  features: string[];
  period: "month" | "year";
  stripePriceId: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "ONE_LETTER",
    name: "Basic",
    price: 19.99,
    period: "month",
    stripePriceId: STRIPE_PRICES.ONE_LETTER,
    features: [
      "1 legal letter draft",
      "Basic document review",
      "Email support",
      "PDF download",
    ],
  },
  {
    id: "FOUR_MONTHLY",
    name: "Professional",
    price: 49.99,
    period: "month",
    stripePriceId: STRIPE_PRICES.FOUR_MONTHLY,
    features: [
      "4 legal letter drafts per month",
      "Priority document review",
      "Phone and email support",
      "Document storage",
      "PDF download",
    ],
  },
  {
    id: "EIGHT_YEARLY",
    name: "Premium",
    price: 199.99,
    period: "year",
    stripePriceId: STRIPE_PRICES.EIGHT_YEARLY,
    features: [
      "8 legal letter drafts per month",
      "Priority document review",
      "Phone and email support",
      "Document storage",
      "PDF download",
      "Save 15% compared to monthly",
    ],
  },
];

// Initialize Stripe
export const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

// Create Stripe Checkout Session
export const createCheckoutSession = async (
  planId: keyof typeof STRIPE_PRICES,
  userId: string,
  discountCode?: string,
) => {
  try {
    const response = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        planId,
        userId,
        discountCode,
      }),
    });

    const session = await response.json();

    if (!response.ok) {
      throw new Error(session.error || "Failed to create checkout session");
    }

    return session;
  } catch (error) {
    console.error("Error creating checkout session:", error);
    throw error;
  }
};

// Redirect to Stripe Checkout
export const redirectToCheckout = async (
  planId: keyof typeof STRIPE_PRICES,
  userId: string,
  discountCode?: string,
) => {
  try {
    const stripe = await stripePromise;

    if (!stripe) {
      throw new Error("Stripe failed to initialize");
    }

    const session = await createCheckoutSession(planId, userId, discountCode);

    const { error } = await stripe.redirectToCheckout({
      sessionId: session.id,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error redirecting to checkout:", error);
    throw error;
  }
};

// Validate Stripe configuration
export const validateStripeConfig = () => {
  if (!STRIPE_PUBLISHABLE_KEY) {
    throw new Error("Stripe publishable key is not configured");
  }

  if (STRIPE_PUBLISHABLE_KEY.startsWith("sk_")) {
    console.warn(
      "Warning: You are using a secret key in the frontend. This should only be used for testing.",
    );
  }

  return true;
};

// Get plan by ID
export const getPlanById = (planId: string): SubscriptionPlan | undefined => {
  return SUBSCRIPTION_PLANS.find((plan) => plan.id === planId);
};

// Format price for display
export const formatPrice = (amount: number, currency: string = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
};

// Calculate discount amount
export const calculateDiscount = (
  price: number,
  discountPercentage: number,
) => {
  return price * (discountPercentage / 100);
};

// Calculate final price after discount
export const calculateFinalPrice = (
  price: number,
  discountPercentage: number,
) => {
  return Math.max(0, price - calculateDiscount(price, discountPercentage));
};
