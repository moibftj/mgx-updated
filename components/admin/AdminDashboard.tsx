import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserCheck,
  Mail,
  FileText,
  DollarSign,
  TrendingUp,
  Calendar,
  Award,
  Activity,
  AlertCircle,
  Eye,
  Download,
  Ban,
  CheckCircle,
  XCircle,
  RefreshCw,
  BarChart3,
  PieChart,
  Target,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../services/supabase";

interface UserWithLetters {
  id: string;
  email: string;
  role: string;
  subscription_status: string;
  created_at: string;
  letter_count: number;
  recent_letter: string | null;
  referred_by?: string;
  total_spent: number;
}

interface EmployeeWithAnalytics {
  id: string;
  email: string;
  coupon_code: string;
  total_referrals: number;
  total_commissions: number;
  current_points: number;
  coupon_usage_count: number;
  monthly_referrals: number;
  monthly_commissions: number;
  created_at: string;
  status: "active" | "inactive";
}

interface Letter {
  id: string;
  title: string;
  user_id: string;
  user_email: string;
  letter_type: string;
  status: string;
  timeline_status: string;
  priority: string;
  created_at: string;
  recipient_name?: string;
}

interface PlatformMetrics {
  total_users: number;
  total_employees: number;
  total_letters: number;
  total_revenue: number;
  active_subscriptions: number;
  monthly_revenue: number;
  pending_letters: number;
  completed_letters: number;
}

export const AdminDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "overview" | "users" | "employees"
  >("overview");
  const [users, setUsers] = useState<UserWithLetters[]>([]);
  const [employees, setEmployees] = useState<EmployeeWithAnalytics[]>([]);
  const [letters, setLetters] = useState<Letter[]>([]);
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (user && profile?.role === "admin") {
      loadAdminData();
    }
  }, [user, profile]);

  const loadAdminData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Load platform metrics
      const { data: metricsData, error: metricsError } = await supabase.rpc(
        "get_platform_metrics",
      );

      if (metricsError) {
        console.error("Error loading metrics:", metricsError);
      } else {
        setMetrics(metricsData);
      }

      // Load all users with letter counts
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

      if (usersError) {
        console.error("Error loading users:", usersError);
      } else {
        // Process users data to include letter counts and recent letters
        const processedUsers = await Promise.all(
          usersData.map(async (user) => {
            // Get recent letter
            const { data: recentLetter } = await supabase
              .from("letters")
              .select("title, created_at")
              .eq("user_id", user.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .single();

            // Get subscription data
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

        setUsers(processedUsers);
      }

      // Load all employees with analytics
      const { data: employeesData, error: employeesError } = await supabase
        .from("profiles")
        .select("id, email, coupon_code, created_at")
        .eq("role", "employee")
        .order("created_at", { ascending: false });

      if (employeesError) {
        console.error("Error loading employees:", employeesError);
      } else {
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

        setEmployees(employeesWithAnalytics);
      }

      // Load all letters
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

      if (lettersError) {
        console.error("Error loading letters:", lettersError);
      } else {
        const processedLetters = lettersData.map((letter) => ({
          ...letter,
          user_email: (letter.profiles as any)?.email || "Unknown",
        }));
        setLetters(processedLetters);
      }
    } catch (error) {
      console.error("Error loading admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAdminData();
    setRefreshing(false);
  };

  const handleDeactivateEmployee = async (employeeId: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: "user" })
        .eq("id", employeeId);

      if (error) throw error;

      await loadAdminData();
    } catch (error) {
      console.error("Error deactivating employee:", error);
    }
  };

  const handleViewUserLetters = (userId: string) => {
    setSelectedUserId(selectedUserId === userId ? null : userId);
  };

  const getUserLetters = (userId: string) => {
    return letters.filter((letter) => letter.user_id === userId);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded-2xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Redirect if not admin
  if (profile?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600">
            This dashboard is only accessible to administrators.
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
              Admin Dashboard
            </h1>
            <p className="text-xl text-gray-600">
              Platform management and analytics
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

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex space-x-0 border-b border-gray-100">
            {[
              { id: "overview", label: "Overview", icon: BarChart3 },
              { id: "users", label: "Users", icon: Users },
              { id: "employees", label: "Employees", icon: UserCheck },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                  />
                )}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-6"
            >
              {/* Overview Tab */}
              {activeTab === "overview" && metrics && (
                <div className="space-y-6">
                  {/* Metrics Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-blue-600">
                          Total Users
                        </h3>
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <p className="text-3xl font-bold text-blue-900">
                        {metrics.total_users}
                      </p>
                    </div>

                    <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-green-600">
                          Total Revenue
                        </h3>
                        <DollarSign className="w-6 h-6 text-green-600" />
                      </div>
                      <p className="text-3xl font-bold text-green-900">
                        {formatCurrency(metrics.total_revenue)}
                      </p>
                    </div>

                    <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-purple-600">
                          Total Letters
                        </h3>
                        <FileText className="w-6 h-6 text-purple-600" />
                      </div>
                      <p className="text-3xl font-bold text-purple-900">
                        {metrics.total_letters}
                      </p>
                    </div>

                    <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-orange-600">
                          Employees
                        </h3>
                        <UserCheck className="w-6 h-6 text-orange-600" />
                      </div>
                      <p className="text-3xl font-bold text-orange-900">
                        {metrics.total_employees}
                      </p>
                    </div>
                  </div>

                  {/* Additional Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-600">
                          Active Subscriptions
                        </h3>
                        <Activity className="w-6 h-6 text-gray-600" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {metrics.active_subscriptions}
                      </p>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-600">
                          Monthly Revenue
                        </h3>
                        <TrendingUp className="w-6 h-6 text-gray-600" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(metrics.monthly_revenue)}
                      </p>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-600">
                          Pending Letters
                        </h3>
                        <Calendar className="w-6 h-6 text-gray-600" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {metrics.pending_letters}
                      </p>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-600">
                          Completed Letters
                        </h3>
                        <CheckCircle className="w-6 h-6 text-gray-600" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {metrics.completed_letters}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Users Tab */}
              {activeTab === "users" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold text-gray-900">
                      All Users
                    </h2>
                    <span className="text-gray-500">
                      {users.length} total users
                    </span>
                  </div>

                  <div className="space-y-4">
                    {users.map((user) => (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                      >
                        <div className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-4">
                                <div className="flex-1">
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {user.email}
                                  </h3>
                                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                                    <span>
                                      Joined: {formatDate(user.created_at)}
                                    </span>
                                    <span>Letters: {user.letter_count}</span>
                                    <span>
                                      Spent: {formatCurrency(user.total_spent)}
                                    </span>
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        user.subscription_status === "active"
                                          ? "bg-green-100 text-green-700"
                                          : "bg-gray-100 text-gray-700"
                                      }`}
                                    >
                                      {user.subscription_status}
                                    </span>
                                  </div>
                                  {user.referred_by && (
                                    <p className="text-sm text-blue-600 mt-1">
                                      Referred by employee
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleViewUserLetters(user.id)}
                                className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                                <span>View Letters</span>
                              </button>
                            </div>
                          </div>

                          {/* User Letters */}
                          <AnimatePresence>
                            {selectedUserId === user.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-6 pt-6 border-t border-gray-200"
                              >
                                <h4 className="text-md font-semibold text-gray-900 mb-4">
                                  Letters
                                </h4>
                                <div className="space-y-3">
                                  {getUserLetters(user.id).map((letter) => (
                                    <div
                                      key={letter.id}
                                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                    >
                                      <div className="flex-1">
                                        <h5 className="font-medium text-gray-900">
                                          {letter.title}
                                        </h5>
                                        <div className="flex items-center space-x-3 mt-1 text-sm text-gray-600">
                                          <span>
                                            {letter.letter_type?.replace(
                                              "_",
                                              " ",
                                            )}
                                          </span>
                                          <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                                              letter.timeline_status ===
                                              "completed"
                                                ? "bg-green-100 text-green-700"
                                                : letter.timeline_status ===
                                                    "under_review"
                                                  ? "bg-blue-100 text-blue-700"
                                                  : "bg-yellow-100 text-yellow-700"
                                            }`}
                                          >
                                            {letter.timeline_status?.replace(
                                              "_",
                                              " ",
                                            )}
                                          </span>
                                          <span>
                                            {formatDate(letter.created_at)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                  {getUserLetters(user.id).length === 0 && (
                                    <p className="text-gray-500 text-center py-4">
                                      No letters found
                                    </p>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Employees Tab */}
              {activeTab === "employees" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold text-gray-900">
                      All Employees
                    </h2>
                    <span className="text-gray-500">
                      {employees.length} total employees
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {employees.map((employee) => (
                      <motion.div
                        key={employee.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-xl border border-gray-200 p-6"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {employee.email}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Joined: {formatDate(employee.created_at)}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() =>
                                handleDeactivateEmployee(employee.id)
                              }
                              className="flex items-center space-x-1 px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
                            >
                              <Ban className="w-4 h-4" />
                              <span>Deactivate</span>
                            </button>
                          </div>
                        </div>

                        {/* Coupon Code */}
                        <div className="bg-blue-50 rounded-lg p-4 mb-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-blue-600 font-medium">
                                Coupon Code
                              </p>
                              <p className="text-xl font-bold text-blue-900">
                                {employee.coupon_code}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-blue-600">Used</p>
                              <p className="text-xl font-bold text-blue-900">
                                {employee.coupon_usage_count}x
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Analytics Grid */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center justify-center mb-2">
                              <TrendingUp className="w-5 h-5 text-green-600" />
                            </div>
                            <p className="text-sm text-green-600">
                              Total Referrals
                            </p>
                            <p className="text-xl font-bold text-green-900">
                              {employee.total_referrals}
                            </p>
                          </div>

                          <div className="text-center p-3 bg-purple-50 rounded-lg">
                            <div className="flex items-center justify-center mb-2">
                              <DollarSign className="w-5 h-5 text-purple-600" />
                            </div>
                            <p className="text-sm text-purple-600">
                              Total Commissions
                            </p>
                            <p className="text-xl font-bold text-purple-900">
                              {formatCurrency(employee.total_commissions)}
                            </p>
                          </div>

                          <div className="text-center p-3 bg-orange-50 rounded-lg">
                            <div className="flex items-center justify-center mb-2">
                              <Award className="w-5 h-5 text-orange-600" />
                            </div>
                            <p className="text-sm text-orange-600">
                              Current Points
                            </p>
                            <p className="text-xl font-bold text-orange-900">
                              {employee.current_points}
                            </p>
                          </div>

                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-center mb-2">
                              <Calendar className="w-5 h-5 text-gray-600" />
                            </div>
                            <p className="text-sm text-gray-600">This Month</p>
                            <p className="text-xl font-bold text-gray-900">
                              {employee.monthly_referrals}
                            </p>
                          </div>
                        </div>

                        {/* Performance Indicator */}
                        {employee.total_referrals >= 10 && (
                          <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                            <div className="flex items-center space-x-2">
                              <Target className="w-5 h-5 text-yellow-600" />
                              <span className="text-sm font-medium text-yellow-800">
                                Top Performer! 🌟
                              </span>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
