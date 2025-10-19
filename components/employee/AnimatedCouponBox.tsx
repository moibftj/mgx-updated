import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  Check,
  Share2,
  Sparkles,
  TrendingUp,
  Users,
  DollarSign,
  Trophy,
} from "lucide-react";

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

interface AnimatedCouponBoxProps {
  couponCode: string;
  analytics: EmployeeAnalytics | null;
  loading?: boolean;
}

export const AnimatedCouponBox: React.FC<AnimatedCouponBoxProps> = ({
  couponCode,
  analytics,
  loading = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(couponCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: "Get 20% Off Legal Letters!",
      text: `Use my exclusive coupon code "${couponCode}" to get 20% off professional legal letter generation at TalkToMyLawyer.com`,
      url: `https://talktomylawyer.com?ref=${couponCode}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(
          `🎯 Get 20% off legal letters with code "${couponCode}" at https://talktomylawyer.com?ref=${couponCode}`,
        );
        setShowShare(true);
        setTimeout(() => setShowShare(false), 3000);
      }
    } catch (error) {
      console.error("Failed to share:", error);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  const pulseVariants = {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border animate-pulse">
          <div className="h-8 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-16 bg-gray-200 rounded-xl mb-4"></div>
          <div className="flex space-x-3">
            <div className="h-10 bg-gray-200 rounded-lg flex-1"></div>
            <div className="h-10 bg-gray-200 rounded-lg w-20"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-4 shadow-sm border animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded mb-3"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Main Coupon Display */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-2xl p-8 text-white shadow-2xl"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute top-4 right-4 w-32 h-32 border border-white/20 rounded-full"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="absolute bottom-4 left-4 w-24 h-24 border border-white/20 rounded-full"
            />
          </div>
        </div>

        <div className="relative z-10">
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-between mb-6"
          >
            <div>
              <h2 className="text-2xl font-bold mb-2 flex items-center">
                <Sparkles className="w-6 h-6 mr-2" />
                Your Exclusive Coupon
              </h2>
              <p className="text-blue-100 text-lg">
                Share and earn 20% + 5% commission
              </p>
            </div>
            <motion.div
              animate={pulseVariants}
              className="bg-white/20 backdrop-blur-sm rounded-full p-3"
            >
              <Trophy className="w-8 h-8 text-yellow-300" />
            </motion.div>
          </motion.div>

          {/* Coupon Code Display */}
          <motion.div
            variants={itemVariants}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/20"
          >
            <div className="text-center">
              <p className="text-blue-100 text-sm font-medium mb-2">
                COUPON CODE
              </p>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="text-4xl font-bold tracking-wider mb-4 font-mono bg-white/20 rounded-lg py-3 px-6 inline-block"
              >
                {couponCode}
              </motion.div>
              <p className="text-blue-100 text-sm">
                Gives users 20% discount • Earns you 5% commission + 1 point
              </p>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-3"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCopy}
              className="flex-1 bg-white text-blue-600 rounded-xl py-3 px-6 font-medium flex items-center justify-center space-x-2 transition-all hover:bg-blue-50"
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.div
                    key="checked"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="flex items-center space-x-2"
                  >
                    <Check className="w-5 h-5" />
                    <span>Copied!</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="copy"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="flex items-center space-x-2"
                  >
                    <Copy className="w-5 h-5" />
                    <span>Copy Code</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleShare}
              className="flex-1 bg-white/20 backdrop-blur-sm text-white rounded-xl py-3 px-6 font-medium flex items-center justify-center space-x-2 border border-white/30 hover:bg-white/30 transition-all"
            >
              <Share2 className="w-5 h-5" />
              <span>Share Code</span>
            </motion.button>
          </motion.div>

          {/* Share Confirmation */}
          <AnimatePresence>
            {showShare && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-3 bg-green-500/20 border border-green-400/30 rounded-lg p-3 text-center"
              >
                <p className="text-green-100 text-sm">
                  📋 Share link copied to clipboard!
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Performance Metrics */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {analytics?.total_referrals || 0}
            </span>
          </div>
          <div>
            <p className="text-gray-600 text-sm font-medium">Total Referrals</p>
            <p className="text-gray-500 text-xs">
              {analytics?.monthly_referrals || 0} this month
            </p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              ${analytics?.current_commission_earned?.toFixed(2) || "0.00"}
            </span>
          </div>
          <div>
            <p className="text-gray-600 text-sm font-medium">Total Earnings</p>
            <p className="text-gray-500 text-xs">
              ${analytics?.monthly_commissions?.toFixed(2) || "0.00"} this month
            </p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Trophy className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {analytics?.current_points || 0}
            </span>
          </div>
          <div>
            <p className="text-gray-600 text-sm font-medium">Total Points</p>
            <p className="text-gray-500 text-xs">1 point per referral</p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {analytics?.coupon_usage_count || 0}
            </span>
          </div>
          <div>
            <p className="text-gray-600 text-sm font-medium">Code Uses</p>
            <p className="text-gray-500 text-xs">Total applications</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Recent Referrals */}
      {analytics?.recent_referrals && analytics.recent_referrals.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
            Recent Referrals
          </h3>
          <div className="space-y-3">
            {analytics.recent_referrals.map((referral, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {referral.user_email}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(referral.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">
                    +${referral.commission_amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">+1 point</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
