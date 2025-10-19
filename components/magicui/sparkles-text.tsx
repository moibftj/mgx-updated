import React, { ReactElement } from "react";
import { cn } from "../../lib/utils";

// The props interface is kept for compatibility, even though sparkle-related props are no longer used.
interface SparklesTextProps {
  as?: ReactElement;
  className?: string;
  children?: React.ReactNode;
  sparklesCount?: number;
  colors?: {
    first: string;
    second: string;
  };
}

export const SparklesText: React.FC<SparklesTextProps> = ({
  children,
  className,
  ...props
}) => {
  // The sparkle animation functionality has been removed.
  // The component now renders its children inside a simple span,
  // preserving any passed class names and props.
  return (
    <span className={cn(className)} {...props}>
      {children}
    </span>
  );
};
