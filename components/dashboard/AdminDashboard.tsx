import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserCheck,
  DollarSign,
  FileText,
  Activity,
  CheckCircle,
  Calendar,
  TrendingUp,
  Eye,
  Ban,
} from "lucide-react";
import { DashboardLayout } from "./shared/DashboardLayout";
import { DashboardHeader } from "./shared/DashboardHeader";
import { MetricCard } from "./shared/MetricCard";
import { TabNavigation } from "./shared/TabNavigation";
import { useAdminDashboardData } from "../../hooks/useDashboardData";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../services/supabase";
import { logger } from "../../lib/logger";

interface User {
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

interface Employee {
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
  const { profile } = useAuth();
  const { data: adminData, loading, error, refresh } = useAdminDashboardData();
  const [activeTab, setActiveTab] = useState<
    "overview" | "users" | "employees"
  >("overview");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Extract data from adminData
  const metrics = adminData?.metrics as PlatformMetrics | undefined;
  const users = (adminData?.users as User[]) || [];
  const employees = (adminData?.employees as Employee[]) || [];
  const letters = (adminData?.letters as Letter[]) || [];

  // Check if user has admin access
  const hasAccess = profile?.role === "admin";

  if (!hasAccess) {
    return (
      <DashboardLayout
        title="Access Denied"
        subtitle="Admin access required"
        accessDenied={true}
        accessDeniedMessage="This dashboard is only accessible to administrators."
      />
    );
  }

  const handleDeactivateEmployee = async (employeeId: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: "user" })
        .eq("id", employeeId);

      if (error) throw error;
      refresh();
    } catch (error) {
      logger.error("Error deactivating employee:", error);
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

  const tabs = [
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "users", label: "Users", icon: Users, badge: users.length },
    {
      id: "employees",
      label: "Employees",
      icon: UserCheck,
      badge: employees.length,
    },
  ];

  return (
    <DashboardLayout
      title="Admin Dashboard"
      subtitle="Platform management and analytics"
      loading={loading}
      error={error}
    >
      <DashboardHeader
        title="Admin Dashboard"
        subtitle="Platform management and analytics"
        onRefresh={refresh}
      />

      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        className="mb-8"
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "overview" && metrics && (
            <OverviewTab metrics={metrics} formatCurrency={formatCurrency} />
          )}

          {activeTab === "users" && (
            <UsersTab
              users={users}
              letters={letters}
              selectedUserId={selectedUserId}
              onViewUserLetters={handleViewUserLetters}
              getUserLetters={getUserLetters}
              formatDate={formatDate}
              formatCurrency={formatCurrency}
            />
          )}

          {activeTab === "employees" && (
            <EmployeesTab
              employees={employees}
              onDeactivateEmployee={handleDeactivateEmployee}
              formatDate={formatDate}
              formatCurrency={formatCurrency}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </DashboardLayout>
  );
};

// Tab Components
const OverviewTab: React.FC<{
  metrics: PlatformMetrics;
  formatCurrency: (amount: number) => string;
}> = ({ metrics, formatCurrency }) => (
  <div className="space-y-6">
    {/* Primary Metrics */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Total Users"
        value={metrics.total_users}
        icon={Users}
        color="blue"
        delay={0.1}
      />

      <MetricCard
        title="Total Revenue"
        value={formatCurrency(metrics.total_revenue)}
        icon={DollarSign}
        color="green"
        delay={0.2}
      />

      <MetricCard
        title="Total Letters"
        value={metrics.total_letters}
        icon={FileText}
        color="purple"
        delay={0.3}
      />

      <MetricCard
        title="Employees"
        value={metrics.total_employees}
        icon={UserCheck}
        color="orange"
        delay={0.4}
      />
    </div>

    {/* Secondary Metrics */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Active Subscriptions"
        value={metrics.active_subscriptions}
        icon={Activity}
        color="gray"
        delay={0.5}
      />

      <MetricCard
        title="Monthly Revenue"
        value={formatCurrency(metrics.monthly_revenue)}
        icon={TrendingUp}
        color="green"
        delay={0.6}
      />

      <MetricCard
        title="Pending Letters"
        value={metrics.pending_letters}
        icon={Calendar}
        color="orange"
        delay={0.7}
      />

      <MetricCard
        title="Completed Letters"
        value={metrics.completed_letters}
        icon={CheckCircle}
        color="green"
        delay={0.8}
      />
    </div>
  </div>
);

const UsersTab: React.FC<{
  users: User[];
  letters: Letter[];
  selectedUserId: string | null;
  onViewUserLetters: (userId: string) => void;
  getUserLetters: (userId: string) => Letter[];
  formatDate: (dateString: string) => string;
  formatCurrency: (amount: number) => string;
}> = ({
  users,
  letters,
  selectedUserId,
  onViewUserLetters,
  getUserLetters,
  formatDate,
  formatCurrency,
}) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-semibold text-gray-900">All Users</h2>
      <span className="text-gray-500">{users.length} total users</span>
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
                      <span>Joined: {formatDate(user.created_at)}</span>
                      <span>Letters: {user.letter_count}</span>
                      <span>Spent: {formatCurrency(user.total_spent)}</span>
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
                  onClick={() => onViewUserLetters(user.id)}
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
                            <span>{letter.letter_type?.replace("_", " ")}</span>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                letter.timeline_status === "completed"
                                  ? "bg-green-100 text-green-700"
                                  : letter.timeline_status === "under_review"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {letter.timeline_status?.replace("_", " ")}
                            </span>
                            <span>{formatDate(letter.created_at)}</span>
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
);

const EmployeesTab: React.FC<{
  employees: Employee[];
  onDeactivateEmployee: (employeeId: string) => void;
  formatDate: (dateString: string) => string;
  formatCurrency: (amount: number) => string;
}> = ({ employees, onDeactivateEmployee, formatDate, formatCurrency }) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-semibold text-gray-900">All Employees</h2>
      <span className="text-gray-500">{employees.length} total employees</span>
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
                onClick={() => onDeactivateEmployee(employee.id)}
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
                <p className="text-sm text-blue-600 font-medium">Coupon Code</p>
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
            <MetricCard
              title="Total Referrals"
              value={employee.total_referrals}
              icon={TrendingUp}
              color="green"
              delay={0.1}
            />

            <MetricCard
              title="Total Commissions"
              value={formatCurrency(employee.total_commissions)}
              icon={DollarSign}
              color="purple"
              delay={0.2}
            />

            <MetricCard
              title="Current Points"
              value={employee.current_points}
              icon={Activity}
              color="orange"
              delay={0.3}
            />

            <MetricCard
              title="This Month"
              value={employee.monthly_referrals}
              icon={Calendar}
              color="gray"
              delay={0.4}
            />
          </div>

          {/* Performance Indicator */}
          {employee.total_referrals >= 10 && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-yellow-600" />
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
);
