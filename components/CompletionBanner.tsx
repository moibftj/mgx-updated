import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CompletionBannerProps {
  show: boolean;
  title: string;
  message?: string;
  type?: "success" | "error" | "warning" | "info";
  duration?: number;
  onClose?: () => void;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary";
  }>;
  progress?: number; // 0-100 for progress indicators
}

const typeStyles = {
  success: {
    bg: "bg-green-50 dark:bg-green-900/20",
    border: "border-green-200 dark:border-green-800",
    text: "text-green-800 dark:text-green-200",
    icon: "✓",
    iconBg: "bg-green-500",
  },
  error: {
    bg: "bg-red-50 dark:bg-red-900/20",
    border: "border-red-200 dark:border-red-800",
    text: "text-red-800 dark:text-red-200",
    icon: "✕",
    iconBg: "bg-red-500",
  },
  warning: {
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    border: "border-yellow-200 dark:border-yellow-800",
    text: "text-yellow-800 dark:text-yellow-200",
    icon: "⚠",
    iconBg: "bg-yellow-500",
  },
  info: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-800",
    text: "text-blue-800 dark:text-blue-200",
    icon: "ℹ",
    iconBg: "bg-blue-500",
  },
};

export const CompletionBanner: React.FC<CompletionBannerProps> = ({
  show,
  title,
  message,
  type = "success",
  duration = 5000,
  onClose,
  actions,
  progress,
}) => {
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    setIsVisible(show);

    if (show && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  const styles = typeStyles[type];

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`fixed top-4 right-4 left-4 md:left-auto md:w-96 z-50 ${styles.bg} ${styles.border} border rounded-lg shadow-lg backdrop-blur-sm`}
        >
          <div className="p-4">
            <div className="flex items-start">
              {/* Icon */}
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full ${styles.iconBg} flex items-center justify-center text-white text-sm font-bold mr-3`}
              >
                {styles.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`font-semibold ${styles.text}`}>{title}</p>
                {message && (
                  <p className={`text-sm mt-1 ${styles.text} opacity-90`}>
                    {message}
                  </p>
                )}

                {/* Progress bar */}
                {progress !== undefined && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <motion.div
                        className={`h-2 rounded-full ${styles.iconBg}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <p className={`text-xs mt-1 ${styles.text} opacity-75`}>
                      {Math.round(progress)}% complete
                    </p>
                  </div>
                )}

                {/* Actions */}
                {actions && actions.length > 0 && (
                  <div className="mt-3 flex gap-2">
                    {actions.map((action, index) => (
                      <button
                        key={index}
                        onClick={action.onClick}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                          action.variant === "primary"
                            ? `${styles.iconBg} text-white hover:opacity-90`
                            : `border ${styles.border} ${styles.text} hover:bg-gray-100 dark:hover:bg-gray-800`
                        }`}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Close button */}
              <button
                onClick={handleClose}
                className={`flex-shrink-0 ml-2 ${styles.text} hover:opacity-70 transition-opacity`}
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Auto-dismiss progress indicator */}
          {duration > 0 && (
            <motion.div
              className={`h-1 ${styles.iconBg} rounded-b-lg`}
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: duration / 1000, ease: "linear" }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Hook for managing multiple banners
export const useBanners = () => {
  const [banners, setBanners] = useState<
    Array<CompletionBannerProps & { id: string }>
  >([]);

  const showBanner = (
    banner: Omit<CompletionBannerProps, "show" | "onClose">,
  ) => {
    const id =
      Date.now().toString() + "-" + Math.random().toString(36).substr(2, 9);
    setBanners((prev) => [
      ...prev,
      { ...banner, show: true, id, onClose: () => removeBanner(id) },
    ]);
    return id;
  };

  const removeBanner = (id: string) => {
    setBanners((prev) => prev.filter((b) => b.id !== id));
  };

  const showSuccess = (title: string, message?: string) =>
    showBanner({ title, message, type: "success" });

  const showError = (title: string, message?: string) =>
    showBanner({ title, message, type: "error" });

  const showWarning = (title: string, message?: string) =>
    showBanner({ title, message, type: "warning" });

  const showInfo = (title: string, message?: string) =>
    showBanner({ title, message, type: "info" });

  return {
    banners,
    showBanner,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeBanner,
  };
};
