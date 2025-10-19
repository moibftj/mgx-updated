import React from "react";
import { cn } from "../../lib/utils";

export const ShinyButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ children, className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "relative isolate overflow-hidden rounded-lg px-6 py-2 font-medium text-white",
        "bg-blue-600/90 dark:bg-blue-500/90",
        "disabled:cursor-not-allowed",
        "animate-pulse-fast",
        className,
      )}
      {...props}
    >
      <span className="relative z-20">{children}</span>
      <span
        aria-hidden="true"
        className="absolute inset-0 z-10 animate-shiny bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.6),transparent)] bg-[length:200%_100%]"
      />
    </button>
  );
});
ShinyButton.displayName = "ShinyButton";
