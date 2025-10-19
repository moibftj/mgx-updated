// Dummy checkout service for testing subscription flow
// This replaces Stripe integration with a simulated payment process

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  period: "month" | "year";
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "ONE_LETTER",
    name: "Basic",
    price: 19.99,
    period: "month",
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

// Simulate payment processing delay
const simulatePaymentDelay = () =>
  new Promise((resolve) => setTimeout(resolve, 2000));

// Generate a fake transaction ID
const generateTransactionId = () => {
  return "txn_" + Math.random().toString(36).substr(2, 9) + Date.now();
};

// Create dummy checkout session
export const createDummyCheckoutSession = async (
  planId: string,
  userId: string,
  discountCode?: string,
) => {
  try {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    if (!plan) {
      throw new Error("Invalid plan ID");
    }

    // Generate dummy session
    const sessionId = "sess_" + Math.random().toString(36).substr(2, 9);

    return {
      id: sessionId,
      url: null, // No redirect URL for dummy checkout
      plan: plan,
      userId: userId,
      discountCode: discountCode,
      amount: plan.price * 100, // Convert to cents
    };
  } catch (error) {
    console.error("Error creating dummy checkout session:", error);
    throw error;
  }
};

// Process dummy payment
export const processDummyPayment = async (
  sessionId: string,
  paymentMethod: "card" | "bank" = "card",
) => {
  try {
    // Simulate payment processing
    await simulatePaymentDelay();

    // Simulate 95% success rate
    if (Math.random() > 0.95) {
      throw new Error("Payment failed: Insufficient funds");
    }

    // Generate transaction details
    const transactionId = generateTransactionId();
    const timestamp = new Date().toISOString();

    return {
      success: true,
      transactionId,
      sessionId,
      paymentMethod,
      status: "completed",
      timestamp,
      amount: Math.floor(Math.random() * 20000) + 1000, // Random amount between $10-$210
      currency: "USD",
    };
  } catch (error) {
    console.error("Error processing dummy payment:", error);
    throw error;
  }
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

// Validate dummy checkout configuration
export const validateDummyConfig = () => {
  // Always valid for dummy implementation
  return true;
};
