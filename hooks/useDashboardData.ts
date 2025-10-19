import { useState, useEffect, useCallback } from "react";
import { supabase } from "../services/supabase";
import { useAuth } from "../contexts/AuthContext";
import { logger } from "../lib/logger";

interface UseDashboardDataOptions {
  refreshInterval?: number;
  enabled?: boolean;
  onError?: (error: any) => void;
  onSuccess?: (data: any) => void;
}

interface UseDashboardDataReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  refresh: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useDashboardData<T>(
  dataFetcher: () => Promise<T>,
  options: UseDashboardDataOptions = {},
): UseDashboardDataReturn<T> {
  const { refreshInterval, enabled = true, onError, onSuccess } = options;
  const { user } = useAuth();

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (!user || !enabled) return;

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const result = await dataFetcher();
        setData(result);
        onSuccess?.(result);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An error occurred";
        setError(errorMessage);
        logger.error("Dashboard data fetch error:", err);
        onError?.(err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user, enabled, dataFetcher, onSuccess, onError],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!refreshInterval || !enabled) return;

    const interval = setInterval(() => {
      fetchData(true);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, enabled, fetchData]);

  return {
    data,
    loading,
    error,
    refreshing,
    refresh: () => fetchData(true),
    refetch: () => fetchData(false),
  };
}

// Specific hooks for different dashboard types
export function useUserDashboardData() {
  const { user } = useAuth();

  const fetchUserData = async () => {
    if (!user) throw new Error("User not authenticated");

    const { apiClient } = await import("../services/apiClient");

    const [letters, subscription] = await Promise.all([
      apiClient.fetchLetters().catch((err) => {
        logger.error("Error fetching letters:", err);
        return [];
      }),
      apiClient.getUserSubscription().catch((err) => {
        logger.error("Error fetching subscription:", err);
        return null;
      }),
    ]);

    return { letters, subscription };
  };

  return useDashboardData(fetchUserData, {
    refreshInterval: 30000, // 30 seconds
    onError: (error) => {
      logger.error("User dashboard data error:", error);
    },
  });
}

export function useAdminDashboardData() {
  const { user, profile } = useAuth();

  const fetchAdminData = async () => {
    if (!user || profile?.role !== "admin") {
      throw new Error("Access denied");
    }

    // Fetch platform metrics
    const { data: metricsData, error: metricsError } = await supabase.rpc(
      "get_platform_metrics",
    );

    if (metricsError) throw metricsError;

    // Fetch all users with letter counts
    const { data: usersData, error: usersError } = await supabase
      .from("profiles")
      .select(
        `
        id,
        email,
        role,
        subscription_status,
        created_at,
        referred_by,
        letters:letters(count)
      `,
      )
      .eq("role", "user")
      .order("created_at", { ascending: false });

    if (usersError) throw usersError;

    // Process users data
    const processedUsers = await Promise.all(
      usersData.map(async (user) => {
        const { data: recentLetter } = await supabase
          .from("letters")
          .select("title, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        const { data: subscriptions } = await supabase
          .from("subscriptions")
          .select("amount")
          .eq("user_id", user.id);

        const totalSpent =
          subscriptions?.reduce(
            (sum, sub) => sum + parseFloat(sub.amount.toString()),
            0,
          ) || 0;

        return {
          ...user,
          letter_count: user.letters?.[0]?.count || 0,
          recent_letter: recentLetter?.title || null,
          total_spent: totalSpent,
        };
      }),
    );

    // Fetch employees
    const { data: employeesData, error: employeesError } = await supabase
      .from("profiles")
      .select("id, email, coupon_code, created_at")
      .eq("role", "employee")
      .order("created_at", { ascending: false });

    if (employeesError) throw employeesError;

    // Get analytics for each employee
    const employeesWithAnalytics = await Promise.all(
      employeesData.map(async (employee) => {
        const { data: analytics } = await supabase.rpc(
          "get_employee_analytics",
          { employee_uuid: employee.id },
        );

        return {
          ...employee,
          total_referrals: analytics?.total_referrals || 0,
          total_commissions: analytics?.total_commissions || 0,
          current_points: analytics?.current_points || 0,
          coupon_usage_count: analytics?.coupon_usage_count || 0,
          monthly_referrals: analytics?.monthly_referrals || 0,
          monthly_commissions: analytics?.monthly_commissions || 0,
          status: "active" as const,
        };
      }),
    );

    // Fetch letters
    const { data: lettersData, error: lettersError } = await supabase
      .from("letters")
      .select(
        `
        id,
        title,
        user_id,
        letter_type,
        status,
        timeline_status,
        priority,
        created_at,
        recipient_name,
        profiles:user_id (email)
      `,
      )
      .order("created_at", { ascending: false })
      .limit(50);

    if (lettersError) throw lettersError;

    const processedLetters = lettersData.map((letter) => ({
      ...letter,
      user_email: (letter.profiles as any)?.email || "Unknown",
    }));

    return {
      metrics: metricsData,
      users: processedUsers,
      employees: employeesWithAnalytics,
      letters: processedLetters,
    };
  };

  return useDashboardData(fetchAdminData, {
    refreshInterval: 60000, // 1 minute
    onError: (error) => {
      logger.error("Admin dashboard data error:", error);
    },
  });
}

export function useEmployeeDashboardData() {
  const { user, profile } = useAuth();

  const fetchEmployeeData = async () => {
    if (!user || profile?.role !== "employee") {
      throw new Error("Access denied");
    }

    // Fetch employee analytics
    const { data: analyticsData, error: analyticsError } = await supabase.rpc(
      "get_employee_analytics",
      { employee_uuid: user.id },
    );

    if (analyticsError) throw analyticsError;

    // Fetch monthly data
    const { data: monthlyCommissions, error: monthlyError } = await supabase
      .from("commission_payments")
      .select("commission_amount, created_at")
      .eq("employee_id", user.id)
      .gte(
        "created_at",
        new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      )
      .order("created_at", { ascending: true });

    if (monthlyError) throw monthlyError;

    // Process monthly data
    const monthlyMap = new Map<
      string,
      { referrals: number; commissions: number }
    >();

    monthlyCommissions.forEach((item) => {
      const month = new Date(item.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      });

      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, { referrals: 0, commissions: 0 });
      }

      const existing = monthlyMap.get(month)!;
      existing.referrals += 1;
      existing.commissions += parseFloat(item.commission_amount.toString());
    });

    const monthlyData = Array.from(monthlyMap.entries()).map(
      ([month, data]) => ({
        month,
        referrals: data.referrals,
        commissions: data.commissions,
      }),
    );

    return {
      analytics: analyticsData,
      monthlyData,
    };
  };

  return useDashboardData(fetchEmployeeData, {
    refreshInterval: 45000, // 45 seconds
    onError: (error) => {
      logger.error("Employee dashboard data error:", error);
    },
  });
}
