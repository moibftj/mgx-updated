import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Plus,
  CreditCard,
  Crown,
  Briefcase,
  BarChart3,
} from "lucide-react";
import { LettersTable } from "../LettersTable";
import { LetterGenerationModal } from "../LetterGenerationModal";
import { SubscriptionForm } from "../SubscriptionForm";
import { ConfirmationBanner, useBanners } from "../CompletionBanner";
import { DashboardHeader } from "./shared/DashboardHeader";
import { MetricCard } from "./shared/MetricCard";
import { useUserDashboardData } from "../../hooks/useDashboardData";
import { useAuth } from "../../contexts/AuthContext";
import { apiClient } from "../../services/apiClient";
import { logger } from "../../lib/logger";
import { supabase } from "../../services/supabase";
import type { LetterRequest, Subscription } from "../../types";

type View = "dashboard" | "new_letter_form" | "subscription";

interface UserDashboardProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  currentView,
  setCurrentView,
}) => {
  const { user } = useAuth();
  const { data: userData, loading, error, refresh } = useUserDashboardData();
  const { banners, showSuccess, showError, showInfo } = useBanners();

  // Local state
  const [editingLetter, setEditingLetter] = useState<LetterRequest | null>(
    null,
  );
  const [showLetterModal, setShowLetterModal] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [letterToDeleteId, setLetterToDeleteId] = useState<string | null>(null);

  // Derived state
  const letters = userData?.letters || [];
  const subscription = userData?.subscription;
  const remainingLetters = calculateRemainingLetters(letters, subscription);
  const recentLetters = letters.slice(0, 3);
  const completedLetters = letters.filter(
    (l) => l.status === "completed",
  ).length;
  const pendingLetters = letters.filter(
    (l) => l.status === "pending" || l.status === "under_review",
  ).length;

  // Calculate remaining letters based on subscription
  function calculateRemainingLetters(
    letters: LetterRequest[],
    subscription: Subscription | null,
  ): number {
    if (!subscription) return 0;

    const usedLetters = letters.filter((l) => l.status === "completed").length;
    let totalAllowed = 0;

    switch (subscription.planType) {
      case "one_letter":
        totalAllowed = 1;
        break;
      case "four_monthly":
        totalAllowed = 4;
        break;
      case "eight_yearly":
        totalAllowed = 8;
        break;
    }

    return Math.max(0, totalAllowed - usedLetters);
  }

  // Real-time subscription
  useEffect(() => {
    if (currentView !== "dashboard" || !user) return;

    const subscription = supabase
      .channel("letter-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "letter_requests",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          handleRealtimeUpdate(payload);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [currentView, user]);

  const handleRealtimeUpdate = (payload: any) => {
    if (payload.eventType === "INSERT") {
      const newLetter = payload.new as LetterRequest;
      showInfo(
        "New Letter Created",
        `Letter "${newLetter.title}" has been created and is being processed.`,
      );
    } else if (
      payload.eventType === "UPDATE" &&
      payload.old.status !== payload.new.status
    ) {
      showInfo(
        "Status Update",
        `Letter "${payload.new.title}" status updated to ${payload.new.status.replace("_", " ")}`,
      );
    } else if (payload.eventType === "DELETE") {
      showInfo(
        "Letter Deleted",
        `Letter "${payload.old.title}" has been removed.`,
      );
    }
    // Refresh data to get latest state
    refresh();
  };

  const navigateTo = (view: View) => setCurrentView(view);

  const handleEditLetter = (letter: LetterRequest) => {
    setEditingLetter(letter);
    setShowLetterModal(true);
  };

  const handleNewLetter = () => {
    setEditingLetter(null);
    setShowLetterModal(true);
  };

  const handleDeleteRequest = (id: string) => {
    setLetterToDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!letterToDeleteId) return;

    setIsDeletingId(letterToDeleteId);
    const letterToDelete = letters.find((l) => l.id === letterToDeleteId);

    showInfo(
      "Deleting Letter",
      `Removing "${letterToDelete?.title || "letter"}" from your dashboard...`,
    );

    try {
      await apiClient.deleteLetter(letterToDeleteId);
      showSuccess(
        "Letter Deleted",
        "The letter has been permanently removed from your dashboard.",
      );
      refresh();
    } catch (error) {
      logger.error("Failed to delete letter:", error);
      showError(
        "Delete Failed",
        "Unable to delete the letter. Please try again.",
      );
    } finally {
      setIsDeletingId(null);
      setLetterToDeleteId(null);
    }
  };

  const handleSaveLetter = async (letterData: Partial<LetterRequest>) => {
    try {
      if (letterData.id) {
        showInfo("Updating Letter", "Saving your changes...");
        await apiClient.updateLetter(letterData as LetterRequest);
        showSuccess(
          "Letter Updated",
          "Your changes have been saved successfully.",
        );
      } else {
        showInfo("Creating Letter", "Generating your legal letter...");
        await apiClient.createLetter(letterData);

        if (subscription) {
          showSuccess(
            "Letter Created",
            `Your letter has been generated. ${Math.max(0, remainingLetters - 1)} credits remaining.`,
          );
        } else {
          showSuccess(
            "Letter Generated",
            "Subscribe now to preview and send your letter!",
          );
        }
      }

      setEditingLetter(null);
      setShowLetterModal(false);
      refresh();
    } catch (error) {
      logger.error("Failed to save letter:", error);
      showError("Save Failed", "Unable to save the letter. Please try again.");
    }
  };

  const handleStatusUpdate = (letterId: string, newStatus: string) => {
    // This will be handled by real-time updates
    refresh();
  };

  if (currentView === "subscription") {
    return <SubscriptionForm />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-8 text-white relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
              <p className="text-slate-300 text-lg">
                Manage your legal correspondence with ease
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNewLetter}
              className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Letter
            </motion.button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <MetricCard
              title="Total Letters"
              value={letters.length}
              icon={FileText}
              color="blue"
              delay={0.1}
            />

            <MetricCard
              title="Completed"
              value={completedLetters}
              icon={Briefcase}
              color="green"
              delay={0.2}
            />

            <MetricCard
              title="In Progress"
              value={pendingLetters}
              icon={BarChart3}
              color="orange"
              delay={0.3}
            />

            <MetricCard
              title="Credits Left"
              value={remainingLetters}
              icon={Crown}
              color="purple"
              delay={0.4}
            />
          </div>
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Letters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-slate-800 flex items-center">
              <Briefcase className="w-5 h-5 mr-2 text-slate-600" />
              Recent Letters
            </h3>
            <button
              onClick={() => {
                /* Show all letters view */
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All
            </button>
          </div>

          {recentLetters.length > 0 ? (
            <div className="space-y-4">
              {recentLetters.map((letter, index) => (
                <motion.div
                  key={letter.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="p-4 border border-slate-200 rounded-xl hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleEditLetter(letter)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-800 mb-1">
                        {letter.title}
                      </h4>
                      <p className="text-sm text-slate-600 mb-2">
                        To: {letter.recipientName}
                      </p>
                      <div className="flex items-center space-x-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            letter.status,
                          )}`}
                        >
                          {letter.status.replace("_", " ").toUpperCase()}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(letter.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-slate-600" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <h4 className="text-lg font-medium text-slate-600 mb-2">
                No letters yet
              </h4>
              <p className="text-slate-500 mb-4">
                Create your first professional letter to get started
              </p>
              <button
                onClick={handleNewLetter}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Letter
              </button>
            </div>
          )}
        </motion.div>

        {/* Sidebar */}
        <div className="space-y-6">
          <SubscriptionCard
            subscription={subscription}
            remainingLetters={remainingLetters}
            onManagePlan={() => navigateTo("subscription")}
          />

          <QuickActions
            onNewLetter={handleNewLetter}
            onUpgradePlan={() => navigateTo("subscription")}
          />

          <ActivitySummary letters={letters} />
        </div>
      </div>

      {/* Full Letters Table */}
      {letters.length > 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <LettersTable
            letters={letters}
            onNewLetterClick={handleNewLetter}
            onEditLetterClick={handleEditLetter}
            onDeleteLetter={handleDeleteRequest}
            isDeletingId={isDeletingId}
            isLoading={loading}
            onStatusUpdate={handleStatusUpdate}
          />
        </motion.div>
      )}

      {/* Modals and Overlays */}
      <AnimatePresence>
        {banners.map((banner) => (
          <ConfirmationBanner key={banner.id} {...banner} />
        ))}
      </AnimatePresence>

      <LetterGenerationModal
        isOpen={showLetterModal}
        onClose={() => {
          setEditingLetter(null);
          setShowLetterModal(false);
        }}
        onSubmit={handleSaveLetter}
        letterToEdit={editingLetter}
        hasSubscription={!!subscription}
        onSubscribe={() => navigateTo("subscription")}
      />
    </div>
  );
};

// Helper components
const SubscriptionCard: React.FC<{
  subscription?: Subscription | null;
  remainingLetters: number;
  onManagePlan: () => void;
}> = ({ subscription, remainingLetters, onManagePlan }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3 }}
    className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200"
  >
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-semibold text-slate-800">Current Plan</h3>
      <Crown className="w-5 h-5 text-blue-600" />
    </div>

    <div className="mb-4">
      <div className="text-2xl font-bold text-blue-600 mb-1">
        {subscription?.planType.replace("_", " ").toUpperCase() || "Free Trial"}
      </div>
      <p className="text-sm text-slate-600">
        {remainingLetters} credits remaining
      </p>
    </div>

    <div className="w-full bg-white rounded-full h-2 mb-4">
      <div
        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
        style={{
          width: `${Math.max(
            10,
            (remainingLetters /
              (subscription
                ? subscription.planType === "one_letter"
                  ? 1
                  : subscription.planType === "four_monthly"
                    ? 4
                    : 8
                : 1)) *
              100,
          )}%`,
        }}
      />
    </div>

    <button
      onClick={onManagePlan}
      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
    >
      Manage Plan
    </button>
  </motion.div>
);

const QuickActions: React.FC<{
  onNewLetter: () => void;
  onUpgradePlan: () => void;
}> = ({ onNewLetter, onUpgradePlan }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.4 }}
    className="bg-white rounded-2xl p-6 shadow-sm border"
  >
    <h3 className="font-semibold text-slate-800 mb-4">Quick Actions</h3>
    <div className="space-y-3">
      <button
        onClick={onNewLetter}
        className="w-full flex items-center px-4 py-3 text-left hover:bg-slate-50 rounded-lg transition-colors"
      >
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
          <Plus className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <div className="font-medium text-slate-800">New Letter</div>
          <div className="text-sm text-slate-500">Create a new request</div>
        </div>
      </button>

      <button
        onClick={onUpgradePlan}
        className="w-full flex items-center px-4 py-3 text-left hover:bg-slate-50 rounded-lg transition-colors"
      >
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
          <CreditCard className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <div className="font-medium text-slate-800">Upgrade Plan</div>
          <div className="text-sm text-slate-500">Get more credits</div>
        </div>
      </button>
    </div>
  </motion.div>
);

const ActivitySummary: React.FC<{ letters: LetterRequest[] }> = ({
  letters,
}) => {
  const completedLetters = letters.filter(
    (l) => l.status === "completed",
  ).length;
  const thisMonthLetters = letters.filter(
    (l) => new Date(l.createdAt).getMonth() === new Date().getMonth(),
  ).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-white rounded-2xl p-6 shadow-sm border"
    >
      <h3 className="font-semibold text-slate-800 mb-4 flex items-center">
        <BarChart3 className="w-5 h-5 mr-2 text-slate-600" />
        Activity
      </h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">This Month</span>
          <span className="font-medium text-slate-800">
            {thisMonthLetters} letters
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Success Rate</span>
          <span className="font-medium text-green-600">
            {letters.length > 0
              ? Math.round((completedLetters / letters.length) * 100)
              : 0}
            %
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Avg. Processing</span>
          <span className="font-medium text-slate-800">2-3 days</span>
        </div>
      </div>
    </motion.div>
  );
};

function getStatusColor(status: string): string {
  switch (status) {
    case "completed":
      return "text-green-600 bg-green-100";
    case "under_review":
    case "underReview":
      return "text-blue-600 bg-blue-100";
    case "pending":
      return "text-orange-600 bg-orange-100";
    case "draft":
      return "text-purple-600 bg-purple-100";
    default:
      return "text-slate-600 bg-slate-100";
  }
}
