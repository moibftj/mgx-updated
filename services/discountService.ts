import { supabase } from "./supabase";

// Interface for discount code data
interface DiscountCode {
  id: string;
  code: string;
  discount_percentage: number;
  usage_count: number;
  is_active: boolean;
  employee_id: string;
  created_at: string;
  updated_at: string;
}

interface EmployeeDiscountStats {
  total_discounts: number;
  total_revenue_generated: number;
  total_usage: number;
  active_codes: number;
}

// Get all employee discount codes with stats
export async function getEmployeeDiscountCodes(employeeId: string): Promise<{
  codes: DiscountCode[];
  stats: EmployeeDiscountStats;
}> {
  try {
    // Get employee's discount codes
    const { data: codes, error: codesError } = await supabase
      .from("employee_coupons")
      .select("*")
      .eq("employee_id", employeeId)
      .order("created_at", { ascending: false });

    if (codesError) {
      throw codesError;
    }

    // Calculate stats
    const stats: EmployeeDiscountStats = {
      total_discounts: codes?.length || 0,
      total_revenue_generated: 0, // This would need to be calculated from actual revenue
      total_usage: codes?.reduce((sum, code) => sum + code.usage_count, 0) || 0,
      active_codes: codes?.filter((code) => code.is_active).length || 0,
    };

    return {
      codes: codes || [],
      stats,
    };
  } catch (error) {
    console.error("Error fetching employee discount codes:", error);
    throw error;
  }
}

// Generate a new discount code for an employee
export async function generateDiscountCode(
  employeeId: string,
): Promise<string> {
  try {
    // Use the database function to generate coupon
    const { data, error } = await supabase.rpc("generate_employee_coupon", {
      employee_uuid: employeeId,
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error generating discount code:", error);
    throw error;
  }
}

// Validate a discount code
export async function validateDiscountCode(code: string): Promise<{
  isValid: boolean;
  percent_off?: number;
  employee_id?: string;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from("employee_coupons")
      .select("*")
      .eq("code", code)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      return {
        isValid: false,
        error: "Invalid or inactive coupon code",
      };
    }

    return {
      isValid: true,
      percent_off: data.discount_percentage,
      employee_id: data.employee_id,
    };
  } catch (error) {
    console.error("Error validating discount code:", error);
    return {
      isValid: false,
      error: "Error validating coupon code",
    };
  }
}

// Apply a discount code during subscription
export async function applyDiscountCode(
  code: string,
  userId: string,
  subscriptionType: string,
  originalAmount: number,
): Promise<any> {
  try {
    const response = await fetch("/api/apply-coupon", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        couponCode: code,
        userId,
        subscriptionType,
        originalAmount,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to apply discount code");
    }

    return await response.json();
  } catch (error) {
    console.error("Error applying discount code:", error);
    throw error;
  }
}

// Get admin discount analytics
export async function getAdminDiscountAnalytics(): Promise<any> {
  try {
    const { data, error } = await supabase.from("employee_coupons").select(`
        *,
        profiles!employee_id (email, points, commission_earned)
      `);

    if (error) {
      throw error;
    }

    // Process analytics data
    const analytics = {
      total_codes: data?.length || 0,
      total_usage: data?.reduce((sum, code) => sum + code.usage_count, 0) || 0,
      active_codes: data?.filter((code) => code.is_active).length || 0,
      top_performers:
        data?.sort((a, b) => b.usage_count - a.usage_count).slice(0, 5) || [],
    };

    return analytics;
  } catch (error) {
    console.error("Error fetching admin discount analytics:", error);
    throw error;
  }
}
