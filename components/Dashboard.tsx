import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Plus,
  CreditCard,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Crown,
  BarChart3,
  Briefcase,
} from "lucide-react";
import { LettersTable } from "./LettersTable";
import { LetterGenerationModal } from "./LetterGenerationModal";
import { SubscriptionForm } from "./SubscriptionForm";
import { apiClient } from "../services/apiClient";
import type { LetterRequest, Subscription } from "../types";
import { ConfirmationModal } from "./ConfirmationModal";
import { CompletionBanner, useBanners } from "./CompletionBanner";
import { useAuth } from "../contexts/AuthContext";
import { logger } from "../lib/logger";
import { supabase } from "../services/supabase";

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
  const [letters, setLetters] = useState<LetterRequest[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [remainingLetters, setRemainingLetters] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [editingLetter, setEditingLetter] = useState<LetterRequest | null>(
    null,
  );
  const [showLetterModal, setShowLetterModal] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [letterToDeleteId, setLetterToDeleteId] = useState<string | null>(null);
  const { banners, showSuccess, showError, showInfo } = useBanners();

  useEffect(() => {
    let subscription: any = null;

    const setupRealtimeSubscription = () => {
      if (!user) return;

      // Subscribe to real-time changes on letter_requests table
      subscription = supabase
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
            if (payload.eventType === "INSERT") {
              // New letter created
              const newLetter = payload.new as LetterRequest;
              setLetters((prev) => [newLetter, ...prev]);
              showInfo(
                "New Letter Created",
                `Letter "${newLetter.title}" has been created and is being processed.`,
              );
            } else if (payload.eventType === "UPDATE") {
              // Letter updated
              const updatedLetter = payload.new as LetterRequest;

              setLetters((prev) =>
                prev.map((letter) =>
                  letter.id === updatedLetter.id
                    ? {
                        ...letter,
                        status: updatedLetter.status,
                        updatedAt: updatedLetter.updatedAt,
                        aiGeneratedContent: updatedLetter.aiGeneratedContent,
                        finalContent: updatedLetter.finalContent,
                      }
                    : letter,
                ),
              );

              // Show notification for status changes
              if (payload.old.status !== updatedLetter.status) {
                showInfo(
                  "Status Update",
                  `Letter "${updatedLetter.title}" status updated to ${updatedLetter.status.replace("_", " ")}`,
                );
              }
            } else if (payload.eventType === "DELETE") {
              // Letter deleted
              const deletedLetter = payload.old as LetterRequest;
              setLetters((prev) =>
                prev.filter((letter) => letter.id !== deletedLetter.id),
              );
              showInfo(
                "Letter Deleted",
                `Letter "${deletedLetter.title}" has been removed.`,
              );
            }
          },
        )
        .subscribe();
    };

    const loadUserData = async () => {
      setIsLoading(true);
      showInfo("Loading Dashboard", "Fetching your data...");
      try {
        // Load letters and subscription data in parallel
        const [fetchedLetters, userSubscription] = await Promise.all([
          apiClient.fetchLetters().catch((err) => {
            logger.error("Error fetching letters:", err);
            return []; // Return empty array on error
          }),
          apiClient.getUserSubscription().catch((err) => {
            logger.error("Error fetching subscription:", err);
            return null; // Return null on error
          }),
        ]);

        // Set data even if empty
        setLetters(fetchedLetters || []);
        setSubscription(userSubscription);

        // Calculate remaining letters based on subscription
        if (userSubscription) {
          const usedLetters = (fetchedLetters || []).filter(
            (l) => l.status === "completed",
          ).length;
          let totalAllowed = 0;
          switch (userSubscription.planType) {
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
          setRemainingLetters(Math.max(0, totalAllowed - usedLetters));
          showSuccess(
            "Dashboard Loaded",
            `You have ${Math.max(0, totalAllowed - usedLetters)} letter credits remaining.`,
          );
        } else {
          // New user without subscription
          setRemainingLetters(0);
          showInfo(
            "Welcome!",
            "Get started by subscribing to a plan to generate your first letter.",
          );
        }
      } catch (error) {
        logger.error("Failed to fetch user data:", error);
        // Still allow dashboard to load with empty data
        setLetters([]);
        setSubscription(null);
        setRemainingLetters(0);
        showInfo(
          "Dashboard Ready",
          "Welcome! Subscribe to a plan to start generating letters.",
        );
      } finally {
        setIsLoading(false);
      }
    };
    if (currentView === "dashboard") {
      loadUserData();
      setupRealtimeSubscription();
    }

    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [currentView, user]);

  const navigateTo = (view: View) => setCurrentView(view);

  const handleEditLetter = (letter: LetterRequest) => {
    setEditingLetter(letter);
    setShowLetterModal(true);
  };

  const handleNewLetter = () => {
    // Allow all users (including non-subscribers) to start the letter generation process
    // Subscription check will happen after generation to view/send the letter
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
      setLetters((prevLetters) =>
        prevLetters.filter((l) => l.id !== letterToDeleteId),
      );
      showSuccess(
        "Letter Deleted",
        "The letter has been permanently removed from your dashboard.",
      );
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

  const handleCancelDelete = () => {
    setLetterToDeleteId(null);
  };

  const handleCloseModal = () => {
    setEditingLetter(null);
    setShowLetterModal(false);
  };

  const handleSaveLetter = async (letterData: Partial<LetterRequest>) => {
    try {
      if (letterData.id) {
        // Update existing letter
        showInfo("Updating Letter", "Saving your changes...");
        await apiClient.updateLetter(letterData as LetterRequest);
        showSuccess(
          "Letter Updated",
          "Your changes have been saved successfully.",
        );
      } else {
        // Create new letter - allow for both subscribers and non-subscribers
        // Non-subscribers will be prompted to subscribe after generation
        showInfo("Creating Letter", "Generating your legal letter...");
        await apiClient.createLetter(letterData);

        if (subscription) {
          // Only decrement for subscribers
          setRemainingLetters((prev) => Math.max(0, prev - 1));
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
      // Reload dashboard data
      if (currentView === "dashboard") {
        window.location.reload(); // Simple reload for now, can be optimized later
      }
    } catch (error) {
      logger.error("Failed to save letter:", error);
      showError("Save Failed", "Unable to save the letter. Please try again.");
    }
  };

  const handleStatusUpdate = (letterId: string, newStatus: string) => {
    setLetters((prev) =>
      prev.map((letter) =>
        letter.id === letterId
          ? {
              ...letter,
              status: newStatus as any,
              updatedAt: new Date().toISOString(),
            }
          : letter,
      ),
    );
  };

  const handleSubscribe = async (planId: string, discountCode?: string) => {
    try {
      showInfo("Processing Subscription", "Setting up your subscription...");

      // Here you would integrate with your payment processor
      // For now, we'll simulate a successful subscription
      await new Promise((resolve) => setTimeout(resolve, 2000));

      showSuccess(
        "Subscription Successful",
        `Welcome to ${planId.replace("_", " ")} plan! You can now generate letters.`,
      );

      // Navigate back to dashboard
      navigateTo("dashboard");
    } catch (error) {
      logger.error("Subscription error:", error);
      showError(
        "Subscription Failed",
        "Unable to process subscription. Please try again.",
      );
    }
  };

  if (currentView === "subscription") {
    return <SubscriptionForm />;
  }

  const getStatusColor = (status: string) => {
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
  };

  const recentLetters = letters.slice(0, 3);
  const completedLetters = letters.filter(
    (l) => l.status === "completed",
  ).length;
  const pendingLetters = letters.filter(
    (l) => l.status === "pending" || l.status === "under_review",
  ).length;

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
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-300" />
                </div>
                <span className="text-2xl font-bold">{letters.length}</span>
              </div>
              <p className="text-slate-300 text-sm">Total Letters</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                </div>
                <span className="text-2xl font-bold">{completedLetters}</span>
              </div>
              <p className="text-slate-300 text-sm">Completed</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <Clock className="w-5 h-5 text-orange-300" />
                </div>
                <span className="text-2xl font-bold">{pendingLetters}</span>
              </div>
              <p className="text-slate-300 text-sm">In Progress</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Crown className="w-5 h-5 text-purple-300" />
                </div>
                <span className="text-2xl font-bold">{remainingLetters}</span>
              </div>
              <p className="text-slate-300 text-sm">Credits Left</p>
            </motion.div>
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
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(letter.status)}`}
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
          {/* Subscription Card */}
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
                {subscription?.planType.replace("_", " ").toUpperCase() ||
                  "Free Trial"}
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
              onClick={() => navigateTo("subscription")}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Manage Plan
            </button>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-6 shadow-sm border"
          >
            <h3 className="font-semibold text-slate-800 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={handleNewLetter}
                className="w-full flex items-center px-4 py-3 text-left hover:bg-slate-50 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <Plus className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-slate-800">New Letter</div>
                  <div className="text-sm text-slate-500">
                    Create a new request
                  </div>
                </div>
              </button>

              <button
                onClick={() => navigateTo("subscription")}
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

          {/* Activity Summary */}
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
                  {
                    letters.filter(
                      (l) =>
                        new Date(l.createdAt).getMonth() ===
                        new Date().getMonth(),
                    ).length
                  }{" "}
                  letters
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
            isLoading={isLoading}
            onStatusUpdate={handleStatusUpdate}
          />
        </motion.div>
      )}

      {/* Modals and Overlays */}
      <ConfirmationModal
        isOpen={!!letterToDeleteId}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Letter"
        message="Are you sure you want to delete this letter? This action cannot be undone."
        isConfirming={isDeletingId === letterToDeleteId}
      />

      <LetterGenerationModal
        isOpen={showLetterModal}
        onClose={handleCloseModal}
        onSubmit={handleSaveLetter}
        letterToEdit={editingLetter}
        hasSubscription={!!subscription}
        onSubscribe={() => navigateTo("subscription")}
      />

      {/* Render all banners */}
      <AnimatePresence>
        {banners.map((banner) => (
          <CompletionBanner key={banner.id} {...banner} />
        ))}
      </AnimatePresence>
    </div>
  );
};
