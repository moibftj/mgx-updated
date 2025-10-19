import { createClient } from "@supabase/supabase-js";
import {
  createCorsResponse,
  createJsonResponse,
  createErrorResponse,
} from "../../utils/cors.ts";
import { getUserContext } from "../../utils/auth.ts";

interface UserProfile {
  id: string;
  email: string;
  role: "user" | "employee" | "admin";
  points?: number;
  commission_earned?: number;
  coupon_code?: string;
  referred_by?: string;
  subscription_status?: string;
  created_at: string;
  updated_at: string;
}

interface RequestBody {
  userId?: string;
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

    // Get configuration
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get request body (optional userId parameter)
    const requestBody: RequestBody = await req.json();
    const targetUserId = requestBody.userId || authUser.id;

    // SECURITY: Only allow users to sync their own profile unless they're admin
    if (targetUserId !== authUser.id) {
      // Check if authenticated user is admin
      const { data: adminProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authUser.id)
        .single();

      if (!adminProfile || adminProfile.role !== "admin") {
        throw new Error("Access denied: Cannot sync other user profiles");
      }
    }

    // Get user's profile from profiles table
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", targetUserId)
      .single();

    if (profileError) {
      // If profile doesn't exist, create it
      if (profileError.code === "PGRST116") {
        const { data: newUser } =
          await supabase.auth.admin.getUserById(targetUserId);

        if (!newUser.user) {
          throw new Error("User not found");
        }

        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert({
            id: targetUserId,
            email: newUser.user.email || "",
            role: "user", // Default role
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        return createJsonResponse(
          {
            success: true,
            message: "Profile created and synced successfully",
            profile: newProfile,
          },
          200,
          origin,
        );
      }
      throw profileError;
    }

    // Update profile with latest auth metadata if needed
    const { data: authUserData } =
      await supabase.auth.admin.getUserById(targetUserId);

    if (authUserData.user && authUserData.user.email !== profile.email) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          email: authUserData.user.email || profile.email,
          updated_at: new Date().toISOString(),
        })
        .eq("id", targetUserId);

      if (updateError) {
        throw updateError;
      }
    }

    // Get additional user data
    const enhancedProfile = { ...profile };

    // Get subscription info if user
    if (profile.role === "user") {
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", targetUserId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      enhancedProfile.subscription_status = subscription
        ? "active"
        : "inactive";
    }

    // Get employee analytics if employee
    if (profile.role === "employee") {
      const { data: analytics } = await supabase.rpc("get_employee_analytics", {
        employee_uuid: targetUserId,
      });

      if (analytics) {
        enhancedProfile.points = analytics.current_points;
        enhancedProfile.commission_earned = analytics.current_commission_earned;
        enhancedProfile.coupon_code = analytics.coupon_code;
      }
    }

    // Update last synced timestamp
    await supabase
      .from("profiles")
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq("id", targetUserId);

    return createJsonResponse(
      {
        success: true,
        message: "Profile synced successfully",
        profile: enhancedProfile,
      },
      200,
      origin,
    );
  } catch (error: unknown) {
    console.error("Error syncing profile:", error);
    return createErrorResponse(error, 500, origin);
  }
});
