import React from "react";
import { cn } from "../lib/utils";

// SVG Scales Icon Component
const ScalesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 3v18" />
    <path d="M5 9h14" />
    <path d="M5 21h14" />
    <path d="M6 9l-3 6h6l-3-6z" />
    <path d="M15 9l-3 6h6l-3-6z" />
  </svg>
);

interface LogoProps {
  className?: string;
  showText?: boolean;
  variant?: "default" | "dark" | "light";
  size?: "sm" | "md" | "lg" | "xl";
}

export const Logo: React.FC<LogoProps> = ({
  className,
  showText = true,
  variant = "default",
  size = "md",
}) => {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
    xl: "h-12 w-12",
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
  };

  const textVariantClasses = {
    default: "text-gray-900 dark:text-gray-100",
    dark: "text-gray-900 dark:text-gray-100",
    light: "text-white",
  };

  return (
    <div className={cn("flex items-center gap-2 sm:gap-3", className)}>
      {/* Logo Icon - Golden scales of justice in a rounded square */}
      <div
        className={cn(
          "relative rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-2 shadow-lg",
        )}
      >
        <ScalesIcon
          className={cn(
            "text-amber-400",
            size === "sm" && "h-4 w-4",
            size === "md" && "h-5 w-5",
            size === "lg" && "h-6 w-6",
            size === "xl" && "h-8 w-8",
          )}
        />
      </div>

      {showText && (
        <span
          className={cn(
            "font-bold",
            textSizeClasses[size as keyof typeof textSizeClasses] ||
              textSizeClasses["default"],
            textVariantClasses[variant],
          )}
        >
          Talk to My Lawyer
        </span>
      )}
    </div>
  );
};

// Alternative version with image when we have the actual logo file
interface LogoImageProps {
  className?: string;
  showText?: boolean;
  variant?: "default" | "dark" | "light";
  size?: "sm" | "md" | "lg" | "xl";
}

export const LogoImage: React.FC<LogoImageProps> = ({
  className,
  showText = true,
  variant = "default",
  size = "md",
}) => {
  const sizeClasses = {
    sm: "h-6",
    md: "h-8",
    lg: "h-10",
    xl: "h-12",
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
  };

  const textVariantClasses = {
    default: "text-gray-900 dark:text-gray-100",
    dark: "text-gray-900 dark:text-gray-100",
    light: "text-white",
  };

  return (
    <div className={cn("flex items-center gap-2 sm:gap-3", className)}>
      <img
        src="/images/talk-to-my-lawyer-logo.png"
        alt="Talk to My Lawyer"
        className={cn(
          "object-contain",
          sizeClasses[size] || sizeClasses["default"],
        )}
      />

      {showText && (
        <span
          className={cn(
            "font-bold",
            textSizeClasses[size],
            textVariantClasses[variant],
          )}
        >
          Talk to My Lawyer
        </span>
      )}
    </div>
  );
};
