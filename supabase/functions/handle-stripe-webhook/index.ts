import { createClient } from "@supabase/supabase-js";
import {
  createCorsResponse,
  createJsonResponse,
  createErrorResponse,
} from "../../utils/cors.ts";
import { getUserContext } from "../../utils/auth.ts";
import { crypto } from "https://deno.land/std/crypto/mod.ts";

interface StripeWebhookEvent {
  id: string;
  object: string;
  api_version: string;
  created: number;
  data: {
    object: any;
  };
  livemode: boolean;
  pending_webhooks: number;
  request: {
    id: string | null;
    idempotency_key: string | null;
  };
  type: string;
}

interface SubscriptionData {
  id: string;
  customer: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  items: {
    data: Array<{
      id: string;
      price: {
        id: string;
        unit_amount: number;
        recurring?: {
          interval: string;
          interval_count: number;
        };
      };
    }>;
  };
  metadata?: {
    user_id?: string;
    discount_code?: string;
  };
}

// Configuration validation
function getStripeConfig() {
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET environment variable is not set");
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase configuration");
  }

  return { webhookSecret, supabaseUrl, supabaseServiceKey };
}

// Verify Stripe webhook signature
async function verifyStripeSignature(
  req: Request,
  secret: string,
): Promise<any> {
  const body = await req.text();
  const signatureHeader = req.headers.get("stripe-signature");

  if (!signatureHeader) {
    throw new Error("No Stripe signature found");
  }

  // Parse Stripe-Signature header
  // Example: t=timestamp,v1=signature,v0=old_signature
  const sigParts = signatureHeader.split(",").reduce(
    (acc, part) => {
      const [key, value] = part.split("=");
      acc[key] = value;
      return acc;
    },
    {} as Record<string, string>,
  );
  const timestamp = sigParts["t"];
  const v1Signature = sigParts["v1"];
  if (!timestamp || !v1Signature) {
    throw new Error("Malformed Stripe signature header");
  }
  const signedPayload = `${timestamp}.${body}`;

  // Compute HMAC-SHA256
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(signedPayload),
  );
  // Convert ArrayBuffer to hex string
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const computedSignature = signatureArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time comparison
  function safeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }

  if (!safeCompare(computedSignature, v1Signature)) {
    throw new Error("Invalid Stripe webhook signature");
  }
  return JSON.parse(body);
}

// Map Stripe price to plan type
function mapPriceToPlanType(amount: number): string {
  // Map amounts to plan types based on cents
  if (amount === 1999) return "one_letter"; // $19.99
  if (amount === 4999) return "four_monthly"; // $49.99
  if (amount === 19999) return "eight_yearly"; // $199.99
  return "one_letter"; // default
}

// Handle subscription creation
async function handleSubscriptionCreated(
  supabase: any,
  subscription: SubscriptionData,
) {
  const userId = subscription.metadata?.user_id;
  const discountCode = subscription.metadata?.discount_code;

  if (!userId) {
    console.error("No user_id found in subscription metadata");
    return;
  }

  const priceItem = subscription.items.data[0];
  const planType = mapPriceToPlanType(priceItem.price.unit_amount);

  // Create subscription record
  const { error: subError } = await supabase.from("subscriptions").insert({
    user_id: userId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer,
    plan_type: planType,
    amount: priceItem.price.unit_amount / 100, // Convert from cents
    status: subscription.status,
    current_period_start: new Date(
      subscription.current_period_start * 1000,
    ).toISOString(),
    current_period_end: new Date(
      subscription.current_period_end * 1000,
    ).toISOString(),
    discount_code: discountCode,
  });

  if (subError) {
    throw subError;
  }

  // Update user profile subscription status
  await supabase
    .from("profiles")
    .update({
      subscription_status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  // Process discount if used
  if (discountCode) {
    await processDiscountUsage(
      supabase,
      discountCode,
      userId,
      subscription.id,
      priceItem.price.unit_amount / 100,
    );
  }

  console.log(`Subscription created for user ${userId}, plan: ${planType}`);
}

// Handle subscription updates
async function handleSubscriptionUpdated(
  supabase: any,
  subscription: SubscriptionData,
) {
  const { error: updateError } = await supabase
    .from("subscriptions")
    .update({
      status: subscription.status,
      current_period_start: new Date(
        subscription.current_period_start * 1000,
      ).toISOString(),
      current_period_end: new Date(
        subscription.current_period_end * 1000,
      ).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  if (updateError) {
    throw updateError;
  }

  // Update user profile subscription status
  const newStatus = subscription.status === "active" ? "active" : "inactive";
  await supabase
    .from("profiles")
    .update({
      subscription_status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq(
      "id",
      (
        await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subscription.id)
          .single()
      ).data?.user_id,
    );

  console.log(
    `Subscription ${subscription.id} updated to status: ${subscription.status}`,
  );
}

// Handle subscription cancellation/deletion
async function handleSubscriptionDeleted(
  supabase: any,
  subscription: SubscriptionData,
) {
  // Mark subscription as cancelled in database
  const { error: updateError } = await supabase
    .from("subscriptions")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  if (updateError) {
    throw updateError;
  }

  // Update user profile subscription status
  await supabase
    .from("profiles")
    .update({
      subscription_status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq(
      "id",
      (
        await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subscription.id)
          .single()
      ).data?.user_id,
    );

  console.log(`Subscription ${subscription.id} cancelled`);
}

// Process discount usage and calculate commission
async function processDiscountUsage(
  supabase: any,
  discountCode: string,
  userId: string,
  subscriptionId: string,
  amount: number,
) {
  try {
    // Get discount code details
    const { data: discount, error: discountError } = await supabase
      .from("discount_codes")
      .select("*")
      .eq("code", discountCode)
      .single();

    if (discountError || !discount) {
      console.error("Invalid discount code:", discountCode);
      return;
    }

    // Record coupon usage
    await supabase.from("coupon_usage").insert({
      discount_code_id: discount.id,
      user_id: userId,
      subscription_id: subscriptionId,
      subscription_amount: amount,
      discount_amount: amount * (discount.discount_value / 100),
      commission_amount: amount * 0.15, // 15% commission
      used_at: new Date().toISOString(),
    });

    // If this is an employee referral, calculate commission
    if (discount.employee_id) {
      const commission = amount * 0.15; // 15% commission
      const points = Math.floor(amount / 10); // 1 point per $10

      // Update affiliate stats
      await supabase.rpc("update_affiliate_stats", {
        employee_id: discount.employee_id,
        commission_earned: commission,
        points_earned: points,
      });

      console.log(
        `Commission calculated: $${commission} for employee ${discount.employee_id}`,
      );
    }
  } catch (error) {
    console.error("Error processing discount usage:", error);
  }
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
    const config = getStripeConfig();
    const supabase = createClient(
      config.supabaseUrl,
      config.supabaseServiceKey,
    );

    // Verify webhook signature (simplified for this implementation)
    const event: StripeWebhookEvent = await verifyStripeSignature(
      req,
      config.webhookSecret,
    );

    console.log(`Processing Stripe webhook: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case "customer.subscription.created":
        await handleSubscriptionCreated(
          supabase,
          event.data.object as SubscriptionData,
        );
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          supabase,
          event.data.object as SubscriptionData,
        );
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          supabase,
          event.data.object as SubscriptionData,
        );
        break;

      case "invoice.payment_succeeded":
        // Handle successful payment - could trigger notifications, etc.
        console.log("Payment succeeded for invoice:", event.data.object.id);
        break;

      case "invoice.payment_failed":
        // Handle failed payment - could trigger notifications, etc.
        console.log("Payment failed for invoice:", event.data.object.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return createJsonResponse(
      {
        received: true,
        type: event.type,
      },
      200,
      origin,
    );
  } catch (error: unknown) {
    console.error("Stripe webhook error:", error);
    return createErrorResponse(error, 500, origin);
  }
});
