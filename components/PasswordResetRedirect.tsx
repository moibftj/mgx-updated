import React, { useEffect } from "react";

interface PasswordResetRedirectProps {}

export const PasswordResetRedirect: React.FC<
  PasswordResetRedirectProps
> = () => {
  useEffect(() => {
    // Check if we're on 127.0.0.1 and redirect to localhost
    if (window.location.hostname === "127.0.0.1") {
      const newUrl = window.location.href.replace("127.0.0.1", "localhost");
      console.log("Redirecting from 127.0.0.1 to localhost:", newUrl);
      window.location.href = newUrl;
      return;
    }

    // Check for password recovery tokens
    const hash = window.location.hash;
    if (hash.includes("type=recovery") && hash.includes("access_token=")) {
      // Force the AuthContext to detect the recovery
      window.dispatchEvent(new Event("hashchange"));
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 text-center">
        <div className="mb-4">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3.586l4.293-4.293A6 6 0 0119 9z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Processing Password Reset
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            We're setting up your password reset. If you're not automatically
            redirected, please wait a moment.
          </p>
        </div>

        <div className="space-y-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p>If you continue to have issues:</p>
            <ul className="mt-2 text-left space-y-1">
              <li>• Make sure you're using the exact link from your email</li>
              <li>
                • Try copying the link and opening it in a new browser tab
              </li>
              <li>
                • Replace "127.0.0.1" with "localhost" in the URL if needed
              </li>
            </ul>
          </div>

          <button
            onClick={() => (window.location.href = "http://localhost:5174")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Go to Main App
          </button>
        </div>
      </div>
    </div>
  );
};
