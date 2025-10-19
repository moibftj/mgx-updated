import { createClient } from "@supabase/supabase-js";
import {
  createCorsResponse,
  createJsonResponse,
  createErrorResponse,
} from "../../utils/cors.ts";
import { getUserContext } from "../../utils/auth.ts";

interface RequestBody {
  planId: string;
  userId: string;
  discountCode?: string;
}

interface DummyCheckoutSessionResponse {
  id: string;
  success: boolean;
  plan: {
    id: string;
    name: string;
    price: number;
    period: string;
  };
  transactionId?: string;
}

// Plan configurations
const PLANS = {
  ONE_LETTER: {
    name: "Basic Plan",
    price: 1999, // $19.99 in cents
    currency: "usd",
    period: "month",
    features: [
      "1 legal letter draft",
      "Basic document review",
      "Email support",
      "PDF download",
    ],
  },
  FOUR_MONTHLY: {
    name: "Professional Plan",
    price: 4999, // $49.99 in cents
    currency: "usd",
    period: "month",
    features: [
      "4 legal letter drafts per month",
      "Priority document review",
      "Phone and email support",
      "Document storage",
      "PDF download",
    ],
  },
  EIGHT_YEARLY: {
    name: "Premium Plan",
    price: 19999, // $199.99 in cents
    currency: "usd",
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
};

// Configuration validation
function getConfig() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase configuration");
  }

  return { supabaseUrl, supabaseServiceKey };
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

// Generate dummy transaction ID
function generateTransactionId() {
  return "txn_" + Math.random().toString(36).substr(2, 9) + Date.now();
}

// Generate dummy session ID
function generateSessionId() {
  return "sess_" + Math.random().toString(36).substr(2, 9);
}

// Create dummy checkout session
async function createDummyCheckoutSession(
  supabase: any,
  planId: string,
  userId: string,
  discountCode?: string,
): Promise<DummyCheckoutSessionResponse> {
  const plan = PLANS[planId as keyof typeof PLANS];

  if (!plan) {
    throw new Error("Invalid plan ID");
  }

  const sessionId = generateSessionId();
  const transactionId = generateTransactionId();

  // Validate discount code if provided
  let discountPercentage = 0;
  let employeeId = null;

  if (discountCode) {
    const discountValidation = await validateDiscountCode(
      supabase,
      discountCode,
    );
    if (discountValidation.valid) {
      discountPercentage = discountValidation.discountPercentage || 0;
      employeeId = discountValidation.employeeId || null;
    }
  }

  // Calculate final price
  const discountAmount = Math.floor((plan.price * discountPercentage) / 100);
  const finalPrice = plan.price - discountAmount;

  // Create subscription record immediately (since this is dummy checkout)
  const subscriptionData = {
    user_id: userId,
    plan_id: planId,
    status: "active",
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(
      Date.now() + (plan.period === "month" ? 30 : 365) * 24 * 60 * 60 * 1000,
    ).toISOString(),
    stripe_subscription_id: transactionId, // Use transaction ID as subscription ID
    discount_code: discountCode || null,
    price_amount: finalPrice,
    created_at: new Date().toISOString(),
  };

  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .insert(subscriptionData)
    .select()
    .single();

  if (subscriptionError) {
    console.error("Error creating subscription:", subscriptionError);
    throw new Error("Failed to create subscription");
  }

  // Create commission record if discount code was used
  if (discountCode && employeeId) {
    try {
      const commissionAmount = Math.floor(finalPrice * 0.1); // 10% commission

      const { error: commissionError } = await supabase
        .from("commissions")
        .insert({
          employee_id: employeeId,
          user_id: userId,
          subscription_id: subscription.id,
          plan_id: planId,
          commission_amount: commissionAmount,
          discount_code: discountCode,
          status: "paid",
          created_at: new Date().toISOString(),
        });

      if (!commissionError) {
        // Update discount code usage
        await supabase
          .from("discount_codes")
          .update({ usage_count: supabase.rpc("increment", { amount: 1 }) })
          .eq("code", discountCode.toUpperCase());
      }
    } catch (commissionError) {
      console.error("Error creating commission record:", commissionError);
      // Don't fail the whole process if commission creation fails
    }
  }

  return {
    id: sessionId,
    success: true,
    plan: {
      id: planId,
      name: plan.name,
      price: finalPrice / 100, // Convert back to dollars
      period: plan.period,
    },
    transactionId,
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

    const config = getConfig();
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
    const validPlans = Object.keys(PLANS);
    if (!validPlans.includes(planId)) {
      throw new Error(`Invalid plan ID. Valid plans: ${validPlans.join(", ")}`);
    }

    // Create dummy checkout session
    const session = await createDummyCheckoutSession(
      supabase,
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
    console.error("Error creating dummy checkout session:", error);
    return createErrorResponse(error, 500, origin);
  }
});
