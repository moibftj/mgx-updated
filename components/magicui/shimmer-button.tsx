import React from "react";
import { cn } from "../../lib/utils";

export const ShimmerButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<"button">
>(({ className, children, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "relative isolate overflow-hidden rounded-lg px-6 py-2 font-medium text-white transition-all duration-300",
        "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600",
        "disabled:cursor-not-allowed disabled:bg-slate-400 dark:disabled:bg-slate-600",
        className,
      )}
      {...props}
    >
      <span className="relative z-20">{children}</span>
      <span
        aria-hidden="true"
        className="absolute inset-0 z-10 animate-shimmer bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.4),transparent)] bg-[length:200%_100%]"
      />
    </button>
  );
});
ShimmerButton.displayName = "ShimmerButton";
