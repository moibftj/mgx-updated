import React from "react";

interface TooltipProps {
  children: React.ReactNode;
  text: string;
  position?: "top" | "bottom" | "left" | "right";
  size?: "sm" | "md" | "lg";
  delay?: number;
  disabled?: boolean;
  className?: string;
}

const positionClasses = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

const sizeClasses = {
  sm: "px-2 py-1 text-xs",
  md: "px-3 py-2 text-sm",
  lg: "px-4 py-3 text-base",
};

const arrowClasses = {
  top: "top-full left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800 dark:border-t-gray-100",
  bottom:
    "bottom-full left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-800 dark:border-b-gray-100",
  left: "left-full top-1/2 -translate-y-1/2 border-t-4 border-b-4 border-l-4 border-transparent border-l-gray-800 dark:border-l-gray-100",
  right:
    "right-full top-1/2 -translate-y-1/2 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-800 dark:border-r-gray-100",
};

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  text,
  position = "top",
  size = "sm",
  delay = 0,
  disabled = false,
  className = "",
}) => {
  if (disabled || !text) {
    return <>{children}</>;
  }

  const delayStyle = delay > 0 ? { transitionDelay: `${delay}ms` } : {};

  return (
    <div className={`group relative inline-flex items-center ${className}`}>
      {children}
      <div
        className={`absolute ${positionClasses[position]} z-50 whitespace-nowrap rounded-md bg-gray-800 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:bg-gray-100 dark:text-gray-900 pointer-events-none shadow-lg border border-gray-700 dark:border-gray-300 ${sizeClasses[size]}`}
        style={delayStyle}
      >
        {text}
        {/* Arrow */}
        <div className={`absolute ${arrowClasses[position]} w-0 h-0`} />
      </div>
    </div>
  );
};
