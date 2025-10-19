import { createClient } from "@supabase/supabase-js";
import {
  createCorsResponse,
  createJsonResponse,
  createErrorResponse,
} from "../../utils/cors.ts";

interface RequestBody {
  letterId: string;
  amount: number; // Letter generation fee
}

const COMMISSION_RATE = 0.15; // 15% commission
const POINTS_PER_DOLLAR = 0.1; // 1 point per $10

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return createCorsResponse();
  }

  try {
    // Get configuration
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get request body
    const requestBody: RequestBody = await req.json();
    const { letterId, amount } = requestBody;

    if (!letterId || !amount) {
      throw new Error("Missing required fields: letterId and amount");
    }

    // Get employee from coupon usage
    const { data: couponUsage, error: couponError } = await supabase
      .from("coupon_usage")
      .select(
        `
        discount_codes (
          employee_id,
          discount_value,
          discount_type
        )
      `,
      )
      .eq("letter_id", letterId)
      .single();

    if (couponError || !couponUsage) {
      // No coupon was used, so no commission to calculate
      return createJsonResponse({
        success: true,
        message: "No coupon used, no commission calculated",
        commission: 0,
        points: 0,
      });
    }

    const employeeId = (couponUsage as any).discount_codes?.employee_id;

    if (!employeeId) {
      throw new Error("No employee associated with coupon");
    }

    // Calculate commission and points
    const commission = amount * COMMISSION_RATE;
    const points = Math.floor(amount * POINTS_PER_DOLLAR);

    // Update affiliate stats using RPC function
    const { error: updateError } = await supabase.rpc(
      "update_affiliate_stats",
      {
        employee_id: employeeId,
        commission_earned: commission,
        points_earned: points,
      },
    );

    if (updateError) {
      throw updateError;
    }

    // Increment referral count
    const { error: referralError } = await supabase
      .from("affiliate_stats")
      .update({
        referral_count: supabase.sql`referral_count + 1`,
      })
      .eq("employee_id", employeeId);

    if (referralError) {
      console.error("Error updating referral count:", referralError);
    }

    // Log commission transaction
    await supabase.from("commission_transactions").insert({
      employee_id: employeeId,
      letter_id: letterId,
      amount: commission,
      points: points,
      status: "completed",
    });

    return createJsonResponse({
      success: true,
      message: "Commission calculated and recorded",
      employeeId,
      commission,
      points,
    });
  } catch (error: unknown) {
    console.error("Error calculating commission:", error);
    return createErrorResponse(error);
  }
});
