import { createClient } from "@supabase/supabase-js";
import {
  createCorsResponse,
  createJsonResponse,
  createErrorResponse,
} from "../../utils/cors.ts";
import { getUserContext } from "../../utils/auth.ts";
import { crypto } from "https://deno.land/std/crypto/mod.ts";

interface RequestBody {
  planId: string;
  userId: string;
  discountCode?: string;
}

interface CheckoutSessionResponse {
  id: string;
  url: string;
}

// Stripe price IDs (should match your Stripe products)
const STRIPE_PRICES = {
  ONE_LETTER: "price_one_letter", // Replace with actual Stripe price ID
  FOUR_MONTHLY: "price_four_monthly", // Replace with actual Stripe price ID
  EIGHT_YEARLY: "price_eight_yearly", // Replace with actual Stripe price ID
} as const;

// Configuration validation
function getStripeConfig() {
  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY environment variable is not set");
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase configuration");
  }

  return { stripeSecretKey, supabaseUrl, supabaseServiceKey };
}

// Get plan details
function getPlanDetails(planId: string) {
  const plans = {
    ONE_LETTER: {
      name: "Basic Plan",
      price: 1999, // $19.99 in cents
      currency: "usd",
      interval: "month",
      intervalCount: 1,
    },
    FOUR_MONTHLY: {
      name: "Professional Plan",
      price: 4999, // $49.99 in cents
      currency: "usd",
      interval: "month",
      intervalCount: 1,
    },
    EIGHT_YEARLY: {
      name: "Premium Plan",
      price: 19999, // $199.99 in cents
      currency: "usd",
      interval: "year",
      intervalCount: 1,
    },
  };

  return plans[planId as keyof typeof plans];
}

// Validate discount code
async function validateDiscountCode(
  supabase: any,
  code: string,
): Promise<{
  valid: boolean;
  discountPercentage?: number;
  employeeId?: string;
}> {
  try {
    const { data: discount, error } = await supabase
      .from("discount_codes")
      .select("*")
      .eq("code", code.toUpperCase())
      .eq("is_active", true)
      .single();

    if (error || !discount) {
      return { valid: false };
    }

    // Check if discount has expired
    if (discount.expires_at && new Date(discount.expires_at) < new Date()) {
      return { valid: false };
    }

    // Check max uses
    if (discount.max_uses && discount.usage_count >= discount.max_uses) {
      return { valid: false };
    }

    return {
      valid: true,
      discountPercentage: discount.discount_value,
      employeeId: discount.employee_id,
    };
  } catch (error) {
    console.error("Error validating discount code:", error);
    return { valid: false };
  }
}

// Create Stripe Checkout Session
async function createStripeCheckoutSession(
  stripeSecretKey: string,
  planId: string,
  userId: string,
  discountCode?: string,
): Promise<CheckoutSessionResponse> {
  const plan = getPlanDetails(planId);

  if (!plan) {
    throw new Error("Invalid plan ID");
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Validate discount code if provided
  let discountId: string | undefined;
  if (discountCode) {
    const discountValidation = await validateDiscountCode(
      supabase,
      discountCode,
    );
    if (discountValidation.valid) {
      // In a real implementation, you would create a Stripe coupon
      // For now, we'll pass the discount info in metadata
    }
  }

  // Create checkout session data
  const sessionData = {
    payment_method_types: ["card"],
    mode: "subscription",
    customer_email: (await supabase.auth.admin.getUserById(userId)).data.user
      ?.email,
    line_items: [
      {
        price: STRIPE_PRICES[planId as keyof typeof STRIPE_PRICES],
        quantity: 1,
      },
    ],
    metadata: {
      userId,
      planId,
      discountCode: discountCode || "",
    },
    success_url: `${request.headers.get("origin")}/dashboard?success=true`,
    cancel_url: `${request.headers.get("origin")}/subscription?cancelled=true`,
    allow_promotion_codes: true,
  };

  // Create session via Stripe API
  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      ...sessionData,
      line_items: JSON.stringify(sessionData.line_items),
      metadata: JSON.stringify(sessionData.metadata),
    } as any),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Stripe API error: ${error}`);
  }

  const session = await response.json();

  // Record pending subscription in database
  await supabase.from("pending_subscriptions").insert({
    user_id: userId,
    stripe_session_id: session.id,
    plan_id: planId,
    discount_code: discountCode,
    status: "pending",
    created_at: new Date().toISOString(),
  });

  return {
    id: session.id,
    url: session.url,
  };
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return createCorsResponse(origin);
  }

  if (req.method !== "POST") {
    return createErrorResponse("Method not allowed", 405, origin);
  }

  try {
    // SECURITY: Require user authentication
    const { user: authUser } = await getUserContext(req);

    if (!authUser || !authUser.id) {
      throw new Error("User authentication required");
    }

    const config = getStripeConfig();
    const supabase = createClient(
      config.supabaseUrl,
      config.supabaseServiceKey,
    );

    // Get request body
    const requestBody: RequestBody = await req.json();
    const { planId, userId, discountCode } = requestBody;

    // SECURITY: Only allow users to create sessions for themselves
    if (userId !== authUser.id) {
      throw new Error("Access denied: Cannot create sessions for other users");
    }

    // Validate plan ID
    const validPlans = Object.keys(STRIPE_PRICES);
    if (!validPlans.includes(planId)) {
      throw new Error(`Invalid plan ID. Valid plans: ${validPlans.join(", ")}`);
    }

    // Create Stripe Checkout Session
    const session = await createStripeCheckoutSession(
      config.stripeSecretKey,
      planId,
      userId,
      discountCode,
    );

    return createJsonResponse(
      {
        success: true,
        session,
      },
      200,
      origin,
    );
  } catch (error: unknown) {
    console.error("Error creating checkout session:", error);
    return createErrorResponse(error, 500, origin);
  }
});
