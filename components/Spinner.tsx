import React from "react";
import { IconSpinner } from "../constants";

export const Spinner: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-gray-950">
    <div className="flex flex-col items-center space-y-4">
      <IconSpinner className="h-8 w-8 animate-spin text-blue-600" />
      <p className="text-sm text-gray-600 dark:text-gray-400 animate-pulse">
        Loading...
      </p>
    </div>
  </div>
);
