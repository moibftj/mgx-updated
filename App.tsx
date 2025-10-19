import React, { useState, useEffect, Suspense, lazy } from "react";
import { Header } from "./components/Header";
import { Spotlight } from "./components/magicui/spotlight";
import { SparklesText } from "./components/magicui/sparkles-text";
import { useAuth } from "./contexts/AuthContext";
import { AuthPage } from "./components/AuthPage";
import { AdminAuthPage } from "./components/admin/AdminAuthPage";
import { LandingPage } from "./components/LandingPage";
import { Spinner } from "./components/Spinner";
import { logger } from "./lib/logger";

// Lazy load role-specific dashboards for code splitting
const UserDashboard = lazy(() =>
  import("./components/Dashboard").then((module) => ({
    default: module.UserDashboard,
  })),
);
const EmployeeDashboard = lazy(() =>
  import("./components/employee/EnhancedEmployeeDashboard").then((module) => ({
    default: module.EnhancedEmployeeDashboard,
  })),
);
const AdminDashboard = lazy(() =>
  import("./components/admin/AdminDashboard").then((module) => ({
    default: module.AdminDashboard,
  })),
);
const ResetPasswordPage = lazy(() =>
  import("./components/ResetPasswordPage").then((module) => ({
    default: module.ResetPasswordPage,
  })),
);

type UserDashboardView = "dashboard" | "new_letter_form" | "subscription";
type AppView = "landing" | "auth" | "dashboard" | "admin-auth";
type AuthView = "login" | "signup";

const App: React.FC = () => {
  const { user, profile, isLoading, authEvent } = useAuth();
  const [userDashboardView, setUserDashboardView] =
    useState<UserDashboardView>("dashboard");
  const [appView, setAppView] = useState<AppView>("landing");
  const [authView, setAuthView] = useState<AuthView>("signup");

  // Check for email confirmation, password recovery, or admin login in URL on mount
  React.useEffect(() => {
    const checkAuthCallback = () => {
      const hash = window.location.hash;
      const path = window.location.pathname;

      // Handle admin login route
      if (path.includes("/admin/login")) {
        logger.info("Admin login route detected");
        setAppView("admin-auth");
        return;
      }

      // Handle password recovery
      if (
        (hash.includes("type=recovery") && hash.includes("access_token=")) ||
        path.includes("reset-password")
      ) {
        // Allow the AuthContext to handle the token processing
        return;
      }

      // Handle email confirmation redirect
      if (hash.includes("type=signup") || hash.includes("type=email")) {
        logger.info(
          "Email confirmation detected, user will be redirected to dashboard",
        );
        // Clean up the URL hash
        window.history.replaceState(null, "", window.location.pathname);
      }
    };

    checkAuthCallback();
  }, []);

  // Automatically show dashboard when user is authenticated (including after email confirmation)
  React.useEffect(() => {
    if (user && profile) {
      if (appView === "landing" || appView === "admin-auth") {
        logger.info("User authenticated, redirecting to dashboard");
        setAppView("dashboard");
      }
    }
  }, [user, profile, appView]);

  if (isLoading) {
    return <Spinner />;
  }

  // Supabase sends a PASSWORD_RECOVERY event when the user clicks the reset link.
  // We use this to show the password update form.
  if (authEvent === "PASSWORD_RECOVERY") {
    return (
      <Suspense fallback={<Spinner />}>
        <ResetPasswordPage />
      </Suspense>
    );
  }

  // Handle navigation between views
  const handleGetStarted = () => {
    setAuthView("signup");
    setAppView("auth");
  };

  const handleLogin = () => {
    setAuthView("login");
    setAppView("auth");
  };

  const handleBackToLanding = () => {
    setAppView("landing");
  };

  const handleAdminLoginSuccess = () => {
    logger.info("Admin login successful, redirecting to admin dashboard");
    setAppView("dashboard");
  };

  // Show landing page if no user and not in auth view
  if (!user) {
    if (appView === "auth") {
      return (
        <AuthPage
          initialView={authView}
          onBackToLanding={handleBackToLanding}
        />
      );
    }
    if (appView === "admin-auth") {
      return (
        <AdminAuthPage
          onBackToLanding={handleBackToLanding}
          onSuccess={handleAdminLoginSuccess}
        />
      );
    }
    return (
      <LandingPage onGetStarted={handleGetStarted} onLogin={handleLogin} />
    );
  }

  // If user is authenticated, always show dashboard (not landing page)
  // This handles post-confirmation redirects

  const renderDashboard = () => {
    return (
      <Suspense fallback={<Spinner />}>
        {(() => {
          switch (profile?.role) {
            case "admin":
              return <AdminDashboard />;
            case "employee":
              return <EmployeeDashboard />;
            case "user":
            default:
              return (
                <UserDashboard
                  currentView={userDashboardView}
                  setCurrentView={setUserDashboardView}
                />
              );
          }
        })()}
      </Suspense>
    );
  };

  const getTitle = () => {
    switch (profile?.role) {
      case "admin":
        return "Admin Panel";
      case "employee":
        return "Affiliate Dashboard";
      case "user":
      default:
        return "Your Legal Dashboard";
    }
  };

  const getDescription = () => {
    switch (
      profile?.role // ✅ FIXED: Use profile?.role consistently
    ) {
      case "admin":
        return "Manage users, letters, and system settings.";
      case "employee":
        return "Track your referrals and earnings.";
      case "user":
      default:
        return "Generate, manage, and track your legal letters with AI.";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-gray-800 dark:text-gray-200 font-sans">
      <Spotlight className="relative flex h-96 w-full flex-col items-center justify-center overflow-hidden rounded-b-2xl border-b border-slate-800 bg-gradient-to-br from-gray-950 to-slate-900">
        <Header
          userDashboardView={
            profile?.role === "user" ? userDashboardView : undefined // ✅ FIXED: Use profile?.role consistently
          }
          setUserDashboardView={
            profile?.role === "user" ? setUserDashboardView : undefined // ✅ FIXED: Use profile?.role consistently
          }
          onBackToLanding={handleBackToLanding}
        />
        <div className="text-center absolute bottom-12 z-10 p-4">
          <h1 className="text-4xl font-bold tracking-tighter text-gray-100 sm:text-5xl">
            <SparklesText>{getTitle()}</SparklesText>
          </h1>
          <p className="mt-4 text-lg text-gray-400">{getDescription()}</p>
        </div>
      </Spotlight>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-20">
        {renderDashboard()}
      </main>
    </div>
  );
};

export default App;
