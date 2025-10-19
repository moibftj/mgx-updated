import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  Calendar,
  BarChart3,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Target,
  Users,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../services/supabase";
import { CompletionBanner, useBanners } from "../CompletionBanner";
import { AnimatedCouponBox } from "./AnimatedCouponBox";

interface EmployeeAnalytics {
  total_referrals: number;
  total_commissions: number;
  total_points: number;
  current_points: number;
  current_commission_earned: number;
  coupon_code: string;
  coupon_usage_count: number;
  monthly_referrals: number;
  monthly_commissions: number;
  recent_referrals: Array<{
    user_email: string;
    commission_amount: number;
    created_at: string;
  }>;
}

interface MonthlyData {
  month: string;
  referrals: number;
  commissions: number;
}

export const EnhancedEmployeeDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const [analytics, setAnalytics] = useState<EmployeeAnalytics | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { banners, showSuccess, showError, showInfo } = useBanners();

  useEffect(() => {
    if (user && profile?.role === "employee") {
      loadEmployeeData();
    }
  }, [user, profile]);

  const loadEmployeeData = async () => {
    if (!user) return;

    setLoading(true);
    showInfo("Loading Dashboard", "Fetching your employee analytics...");

    try {
      // Fetch employee analytics using the database function
      const { data: analyticsData, error: analyticsError } = await supabase.rpc(
        "get_employee_analytics",
        { employee_uuid: user.id },
      );

      if (analyticsError) {
        throw analyticsError;
      }

      setAnalytics(analyticsData);

      // Fetch monthly data for the last 6 months
      const { data: monthlyCommissions, error: monthlyError } = await supabase
        .from("commission_payments")
        .select("commission_amount, created_at")
        .eq("employee_id", user.id)
        .gte(
          "created_at",
          new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
        )
        .order("created_at", { ascending: true });

      if (monthlyError) {
        console.error("Error fetching monthly data:", monthlyError);
      } else if (monthlyCommissions) {
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

        const processedMonthlyData = Array.from(monthlyMap.entries()).map(
          ([month, data]) => ({
            month,
            referrals: data.referrals,
            commissions: data.commissions,
          }),
        );

        setMonthlyData(processedMonthlyData);
      }

      showSuccess(
        "Dashboard Loaded",
        `Welcome back! You have ${analyticsData?.total_referrals || 0} total referrals and earned $${analyticsData?.current_commission_earned?.toFixed(2) || "0.00"}.`,
      );
    } catch (error) {
      console.error("Error loading employee data:", error);
      showError(
        "Loading Failed",
        "Unable to load your dashboard data. Please refresh the page.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEmployeeData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded-2xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Redirect if not employee
  if (profile?.role !== "employee") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600">
            This dashboard is only accessible to employees.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Affiliate Dashboard
            </h1>
            <p className="text-xl text-gray-600">
              Track your referrals and earnings
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </motion.button>
        </motion.div>

        {/* Main Coupon Box */}
        <AnimatedCouponBox
          couponCode={analytics?.coupon_code || profile?.coupon_code || ""}
          analytics={analytics}
          loading={loading}
        />

        {/* Additional Analytics */}
        {monthlyData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <BarChart3 className="w-6 h-6 mr-2 text-blue-600" />
              Monthly Performance
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {monthlyData.map((data, index) => (
                <motion.div
                  key={data.month}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="p-4 bg-gray-50 rounded-lg border"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">
                      {data.month}
                    </h4>
                    <Calendar className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Referrals:</span>
                      <span className="font-medium text-blue-600">
                        {data.referrals}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Commissions:</span>
                      <span className="font-medium text-green-600">
                        ${data.commissions.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Getting Started Guide (if no referrals yet) */}
        {(!analytics || analytics.total_referrals === 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200"
          >
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Ready to Start Earning?
                </h3>
                <p className="text-gray-600 mb-4">
                  Share your exclusive coupon code with friends and family. For
                  every user who signs up with your code, you'll earn $14.95
                  commission plus 1 point!
                </p>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Users get 20% discount on legal letters</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>You earn $14.95 commission per referral</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Earn 1 point for each successful referral</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Success Stories */}
        {analytics && analytics.total_referrals > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-green-50 rounded-xl p-6 border border-green-200"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Congratulations! 🎉
                </h3>
                <p className="text-gray-600">
                  You've successfully referred {analytics.total_referrals} user
                  {analytics.total_referrals !== 1 ? "s" : ""} and earned $
                  {analytics.current_commission_earned.toFixed(2)}!
                </p>
              </div>
            </div>

            {analytics.total_referrals >= 5 && (
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <p className="text-sm text-green-700 font-medium">
                  🌟 Super Affiliate Status! You've referred 5+ users. Keep up
                  the great work!
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Render banners */}
      <AnimatePresence>
        {banners.map((banner) => (
          <CompletionBanner key={banner.id} {...banner} />
        ))}
      </AnimatePresence>
    </div>
  );
};
