import React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: "blue" | "green" | "purple" | "orange" | "red" | "gray";
  trend?: {
    value: number;
    isPositive: boolean;
  };
  delay?: number;
  onClick?: () => void;
}

const colorClasses = {
  blue: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    textColor: "text-blue-900",
    titleColor: "text-blue-600",
  },
  green: {
    bg: "bg-green-50",
    border: "border-green-200",
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    textColor: "text-green-900",
    titleColor: "text-green-600",
  },
  purple: {
    bg: "bg-purple-50",
    border: "border-purple-200",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    textColor: "text-purple-900",
    titleColor: "text-purple-600",
  },
  orange: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    textColor: "text-orange-900",
    titleColor: "text-orange-600",
  },
  red: {
    bg: "bg-red-50",
    border: "border-red-200",
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    textColor: "text-red-900",
    titleColor: "text-red-600",
  },
  gray: {
    bg: "bg-gray-50",
    border: "border-gray-200",
    iconBg: "bg-gray-100",
    iconColor: "text-gray-600",
    textColor: "text-gray-900",
    titleColor: "text-gray-600",
  },
};

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  color = "blue",
  trend,
  delay = 0,
  onClick,
}) => {
  const colors = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      onClick={onClick}
      className={`${colors.bg} ${colors.border} rounded-xl p-6 border cursor-pointer hover:shadow-md transition-shadow`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-sm font-medium ${colors.titleColor}`}>{title}</h3>
        <div className={`p-2 ${colors.iconBg} rounded-lg`}>
          <Icon className={`w-6 h-6 ${colors.iconColor}`} />
        </div>
      </div>

      <div className="flex items-end justify-between">
        <p className={`text-3xl font-bold ${colors.textColor}`}>{value}</p>

        {trend && (
          <div
            className={`flex items-center text-sm ${
              trend.isPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            <span className="mr-1">{trend.isPositive ? "↑" : "↓"}</span>
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
    </motion.div>
  );
};
