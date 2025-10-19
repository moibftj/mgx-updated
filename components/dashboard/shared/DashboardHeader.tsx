import React from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  actionButton?: {
    label: string;
    onClick: () => void;
    icon?: React.ComponentType<any>;
  };
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  subtitle,
  onRefresh,
  refreshing = false,
  actionButton,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between"
    >
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-xl text-gray-600">{subtitle}</p>
      </div>

      <div className="flex space-x-3">
        {onRefresh && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </motion.button>
        )}

        {actionButton && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={actionButton.onClick}
            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            {actionButton.icon && <actionButton.icon className="w-5 h-5" />}
            <span>{actionButton.label}</span>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};
