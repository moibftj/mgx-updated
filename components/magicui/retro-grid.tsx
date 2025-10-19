import React from "react";
import { cn } from "../../lib/utils";

interface RetroGridProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function RetroGrid({ className, ...props }: RetroGridProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute h-full w-full overflow-hidden opacity-50 [perspective:200px]",
        className,
      )}
      {...props}
    >
      {/* Grid */}
      <div className="absolute inset-0 [transform:rotateX(45deg)]">
        <div
          className={cn(
            "animate-grid",
            "[background-repeat:repeat] [background-size:60px_60px] [height:300vh] [inset:0%_0px] [margin-left:-50%] [transform-origin:100%_0_0] [width:600vw]",
            // Light
            "[background-image:linear-gradient(to_right,rgba(0,0,0,0.3)_1px,transparent_0),linear-gradient(to_bottom,rgba(0,0,0,0.3)_1px,transparent_0)]",
            // Dark
            "dark:[background-image:linear-gradient(to_right,rgba(255,255,255,0.2)_1px,transparent_0),linear-gradient(to_bottom,rgba(255,255,255,0.2)_1px,transparent_0)]",
          )}
        />
      </div>
      {/* Fading gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent dark:from-gray-950" />
    </div>
  );
}
