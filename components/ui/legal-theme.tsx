import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import {
  Scale,
  Shield,
  BookOpen,
  Gavel,
  FileText,
  Award,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
} from "lucide-react";

// Legal Brand Colors and Typography
export const legalTheme = {
  colors: {
    primary: {
      50: "#f0f4f8",
      100: "#d9e2ec",
      200: "#bcccdc",
      300: "#9fb3c8",
      400: "#829ab1",
      500: "#627d98", // Main legal blue
      600: "#486581",
      700: "#334e68",
      800: "#243b53",
      900: "#1a202c",
    },
    gold: {
      50: "#fffbeb",
      100: "#fef3c7",
      200: "#fde68a",
      300: "#fcd34d",
      400: "#fbbf24",
      500: "#f59e0b", // Legal gold accent
      600: "#d97706",
      700: "#b45309",
      800: "#92400e",
      900: "#78350f",
    },
    slate: {
      50: "#f8fafc",
      100: "#f1f5f9",
      200: "#e2e8f0",
      300: "#cbd5e1",
      400: "#94a3b8",
      500: "#64748b",
      600: "#475569",
      700: "#334155",
      800: "#1e293b",
      900: "#0f172a",
    },
  },
  shadows: {
    legal:
      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    "legal-lg":
      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    "legal-xl":
      "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  },
};

// Legal Status Badge Component
interface LegalStatusBadgeProps {
  status: "pending" | "under_review" | "approved" | "completed" | "rejected";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const LegalStatusBadge: React.FC<LegalStatusBadgeProps> = ({
  status,
  size = "md",
  className,
}) => {
  const statusConfig = {
    pending: {
      color: "bg-amber-100 text-amber-800 border-amber-200",
      icon: AlertTriangle,
      label: "Pending Review",
    },
    under_review: {
      color: "bg-blue-100 text-blue-800 border-blue-200",
      icon: FileText,
      label: "Under Review",
    },
    approved: {
      color: "bg-green-100 text-green-800 border-green-200",
      icon: CheckCircle2,
      label: "Approved",
    },
    completed: {
      color: "bg-emerald-100 text-emerald-800 border-emerald-200",
      icon: Award,
      label: "Completed",
    },
    rejected: {
      color: "bg-red-100 text-red-800 border-red-200",
      icon: XCircle,
      label: "Rejected",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-2 text-base",
  };

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "inline-flex items-center font-medium rounded-full border",
        config.color,
        sizeClasses[size],
        className,
      )}
    >
      <Icon
        className={cn(
          "mr-1",
          size === "sm" ? "w-3 h-3" : size === "lg" ? "w-5 h-5" : "w-4 h-4",
        )}
      />
      {config.label}
    </motion.span>
  );
};

// Legal Brand Header Component
interface LegalBrandHeaderProps {
  brandName?: string;
  tagline?: string;
  variant?: "full" | "compact" | "minimal";
  className?: string;
}

export const LegalBrandHeader: React.FC<LegalBrandHeaderProps> = ({
  brandName = "talk-to-my-lawyer",
  tagline = "Professional Legal Correspondence",
  variant = "full",
  className,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex items-center", className)}
    >
      <div className="flex items-center space-x-3">
        <div className="relative">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg">
            <Scale className="w-6 h-6 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center">
            <Gavel className="w-2 h-2 text-white" />
          </div>
        </div>

        {variant !== "minimal" && (
          <div>
            <h1
              className={cn(
                "font-bold text-slate-800",
                variant === "full" ? "text-xl" : "text-lg",
              )}
            >
              {brandName}
            </h1>
            {variant === "full" && (
              <p className="text-sm text-slate-600">{tagline}</p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Legal Process Timeline Component
interface TimelineStep {
  id: string;
  title: string;
  description: string;
  status: "completed" | "current" | "pending";
  icon?: React.ComponentType<{ className?: string }>;
  date?: string;
}

interface LegalTimelineProps {
  steps: TimelineStep[];
  orientation?: "vertical" | "horizontal";
  className?: string;
}

export const LegalTimeline: React.FC<LegalTimelineProps> = ({
  steps,
  orientation = "vertical",
  className,
}) => {
  return (
    <div
      className={cn(
        "relative",
        orientation === "horizontal"
          ? "flex items-center space-x-8"
          : "space-y-6",
        className,
      )}
    >
      {steps.map((step, index) => {
        const Icon = step.icon || FileText;
        const isLast = index === steps.length - 1;

        return (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "relative flex",
              orientation === "horizontal"
                ? "flex-col items-center"
                : "items-start space-x-4",
            )}
          >
            {/* Timeline Line */}
            {!isLast && orientation === "vertical" && (
              <div className="absolute left-6 top-12 w-0.5 h-full bg-slate-200" />
            )}
            {!isLast && orientation === "horizontal" && (
              <div className="absolute top-6 left-full w-8 h-0.5 bg-slate-200" />
            )}

            {/* Step Icon */}
            <div
              className={cn(
                "relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300",
                step.status === "completed" &&
                  "bg-green-100 border-green-500 text-green-600",
                step.status === "current" &&
                  "bg-blue-100 border-blue-500 text-blue-600",
                step.status === "pending" &&
                  "bg-slate-100 border-slate-300 text-slate-400",
              )}
            >
              <Icon className="w-6 h-6" />
            </div>

            {/* Step Content */}
            <div
              className={cn(
                "flex-1",
                orientation === "horizontal" ? "text-center mt-3" : "pb-8",
              )}
            >
              <h3
                className={cn(
                  "font-semibold",
                  step.status === "completed" && "text-green-700",
                  step.status === "current" && "text-blue-700",
                  step.status === "pending" && "text-slate-500",
                )}
              >
                {step.title}
              </h3>
              <p className="text-sm text-slate-600 mt-1">{step.description}</p>
              {step.date && (
                <p className="text-xs text-slate-500 mt-2">{step.date}</p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

// Legal Info Card Component
interface LegalInfoCardProps {
  type: "info" | "warning" | "success" | "error";
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const LegalInfoCard: React.FC<LegalInfoCardProps> = ({
  type,
  title,
  description,
  action,
  className,
}) => {
  const typeConfig = {
    info: {
      bg: "bg-blue-50 border-blue-200",
      icon: Info,
      iconColor: "text-blue-600",
      titleColor: "text-blue-900",
      buttonColor: "bg-blue-600 hover:bg-blue-700",
    },
    warning: {
      bg: "bg-amber-50 border-amber-200",
      icon: AlertTriangle,
      iconColor: "text-amber-600",
      titleColor: "text-amber-900",
      buttonColor: "bg-amber-600 hover:bg-amber-700",
    },
    success: {
      bg: "bg-green-50 border-green-200",
      icon: CheckCircle2,
      iconColor: "text-green-600",
      titleColor: "text-green-900",
      buttonColor: "bg-green-600 hover:bg-green-700",
    },
    error: {
      bg: "bg-red-50 border-red-200",
      icon: XCircle,
      iconColor: "text-red-600",
      titleColor: "text-red-900",
      buttonColor: "bg-red-600 hover:bg-red-700",
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn("p-6 border rounded-xl", config.bg, className)}
    >
      <div className="flex items-start space-x-4">
        <div className={cn("p-2 rounded-lg bg-white/50", config.iconColor)}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className={cn("font-semibold mb-2", config.titleColor)}>
            {title}
          </h3>
          <p className="text-slate-700 text-sm leading-relaxed">
            {description}
          </p>
          {action && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={action.onClick}
              className={cn(
                "mt-4 px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors",
                config.buttonColor,
              )}
            >
              {action.label}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Legal Document Preview Component
interface LegalDocumentPreviewProps {
  title: string;
  type: string;
  pages: number;
  status: "draft" | "final" | "signed";
  lastModified: string;
  onPreview: () => void;
  onDownload: () => void;
  className?: string;
}

export const LegalDocumentPreview: React.FC<LegalDocumentPreviewProps> = ({
  title,
  type,
  pages,
  status,
  lastModified,
  onPreview,
  onDownload,
  className,
}) => {
  const statusColors = {
    draft: "text-amber-600 bg-amber-100",
    final: "text-blue-600 bg-blue-100",
    signed: "text-green-600 bg-green-100",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={cn(
        "p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200",
        className,
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3">
          <div className="p-3 bg-slate-100 rounded-lg">
            <FileText className="w-6 h-6 text-slate-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 mb-1">{title}</h3>
            <p className="text-sm text-slate-600">{type}</p>
          </div>
        </div>
        <span
          className={cn(
            "px-2 py-1 text-xs font-medium rounded-full",
            statusColors[status],
          )}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
        <span>
          {pages} page{pages !== 1 ? "s" : ""}
        </span>
        <span>Modified {lastModified}</span>
      </div>

      <div className="flex space-x-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onPreview}
          className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
        >
          Preview
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onDownload}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Download
        </motion.button>
      </div>
    </motion.div>
  );
};
