import { createClient } from "@supabase/supabase-js";
import {
  createCorsResponse,
  createJsonResponse,
  createErrorResponse,
} from "../../utils/cors.ts";
import { getUserContext } from "../../utils/auth.ts";

interface RequestBody {
  userId: string;
  email?: string;
}

// Generate unique coupon code for employee
function generateCouponCode(userId: string): string {
  return `EMP-${userId.slice(0, 8).toUpperCase()}`;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return createCorsResponse(origin);
  }

  try {
    // SECURITY: Require user authentication
    const { user } = await getUserContext(req);

    // Get configuration
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get request body
    const requestBody: RequestBody = await req.json();
    const { userId } = requestBody;

    // Verify user is an employee
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (!profile || profile.role !== "employee") {
      throw new Error("User is not an employee");
    }

    // Generate unique coupon code
    const code = generateCouponCode(userId);

    // Check if coupon already exists
    const { data: existingCoupon } = await supabase
      .from("discount_codes")
      .select("code")
      .eq("employee_id", userId)
      .single();

    if (existingCoupon) {
      return createJsonResponse({
        success: true,
        message: "Employee coupon already exists",
        code: existingCoupon.code,
      });
    }

    // Create new discount code
    const { data: newCoupon, error: createError } = await supabase
      .from("discount_codes")
      .insert({
        code,
        discount_type: "percentage",
        discount_value: 10, // 10% discount
        employee_id: userId,
        max_uses: null, // Unlimited uses
        is_active: true,
        description: `Employee referral code for ${profile.email || userId}`,
      })
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    // Initialize affiliate stats for the employee
    await supabase
      .from("affiliate_stats")
      .insert({
        employee_id: userId,
        total_earnings: 0,
        points_balance: 0,
        referral_count: 0,
      })
      .onConflict("employee_id")
      .ignoreDuplicates();

    return createJsonResponse({
      success: true,
      message: "Employee coupon created successfully",
      code: newCoupon.code,
      discount_value: newCoupon.discount_value,
    });
  } catch (error: unknown) {
    console.error("Error creating employee coupon:", error);
    return createErrorResponse(error);
  }
});
