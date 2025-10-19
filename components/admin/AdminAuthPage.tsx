import React, { useState, FormEvent } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../Card";
import { ShinyButton } from "../magicui/shiny-button";
import { ShimmerButton } from "../magicui/shimmer-button";
import { IconLogo } from "../../constants";
import { isValidEmail } from "../../lib/utils";
import { Tooltip } from "../Tooltip";
import { CompletionBanner, useBanners } from "../CompletionBanner";
import {
  Shield,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

interface AdminAuthPageProps {
  onBackToLanding?: () => void;
  onSuccess?: () => void;
}

// Responsive form components with admin styling
const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({
  className,
  ...props
}) => (
  <label
    className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${className}`}
    {...props}
  />
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({
  className,
  ...props
}) => (
  <input
    className={`mt-1 flex h-8 sm:h-9 md:h-10 lg:h-11 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 dark:placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 ${className}`}
    {...props}
  />
);

export const AdminAuthPage: React.FC<AdminAuthPageProps> = ({
  onBackToLanding,
  onSuccess,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { adminSignIn } = useAuth();
  const { banners, showSuccess, showError, showInfo } = useBanners();

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    if (newEmail && !isValidEmail(newEmail)) {
      setEmailError("Please enter a valid email address.");
    } else {
      setEmailError(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (emailError) return;

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    showInfo("Authenticating", "Verifying admin credentials...");

    try {
      const { error } = await adminSignIn(email, password);

      if (error) {
        throw error;
      }

      showSuccess(
        "Admin Access Granted",
        "Welcome back! Redirecting to admin dashboard...",
      );
      setSuccessMessage("Authentication successful!");

      // Call success callback after a short delay
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Invalid admin credentials");
      showError(
        "Authentication Failed",
        err.message || "Invalid email or password. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-slate-50 to-red-100 dark:from-gray-950 dark:via-slate-900 dark:to-red-950 flex flex-col items-center justify-center p-3 sm:p-4 lg:p-6 xl:p-8">
      {/* Security Notice Banner */}
      <div className="w-full max-w-4xl mx-auto mb-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center space-x-3">
          <Shield className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <div className="text-sm text-red-800 dark:text-red-200">
            <span className="font-semibold">Admin Access Only:</span> This area
            is restricted to authorized administrators. All access attempts are
            logged.
          </div>
        </div>
      </div>

      {/* Back to Landing Button */}
      {onBackToLanding && (
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
          <button
            onClick={onBackToLanding}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Home
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 mb-4 sm:mb-6 lg:mb-8">
        <div className="p-2 bg-red-600 rounded-lg">
          <IconLogo className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-white" />
        </div>
        <span className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 dark:text-white text-center">
          Admin Portal
        </span>
      </div>

      <Card className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl mx-auto border-red-200 dark:border-red-800">
        <CardHeader className="text-center">
          <CardTitle className="text-xl sm:text-2xl flex items-center justify-center gap-2">
            <Lock className="w-6 h-6 text-red-600" />
            Administrator Sign In
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Enter your administrator credentials to access the admin dashboard
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 px-6">
            <div className="space-y-1">
              <Label htmlFor="email">Admin Email Address</Label>
              <Tooltip text="Enter your administrator email address">
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@company.com"
                  required
                  value={email}
                  onChange={handleEmailChange}
                  className="focus-visible:ring-red-500"
                />
              </Tooltip>
              {emailError && (
                <p className="text-xs text-red-500 mt-1">{emailError}</p>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-baseline">
                <Label htmlFor="password">Admin Password</Label>
              </div>
              <div className="relative">
                <Tooltip text="Enter your administrator password">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10 focus-visible:ring-red-500"
                  />
                </Tooltip>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Security Features Notice */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
              <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>Secure encrypted authentication</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>Session management and timeout</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>Access logging and monitoring</span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 px-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-800 dark:text-red-200">
                  {error}
                </p>
              </div>
            )}

            {successMessage && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                <p className="text-sm text-green-800 dark:text-green-200">
                  {successMessage}
                </p>
              </div>
            )}

            {loading ? (
              <Tooltip text="Authenticating...">
                <ShinyButton
                  disabled
                  className="w-full h-10 sm:h-11 bg-red-600"
                >
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating...
                  </span>
                </ShinyButton>
              </Tooltip>
            ) : (
              <Tooltip text="Sign in to admin dashboard">
                <ShimmerButton
                  type="submit"
                  className="w-full h-10 sm:h-11 bg-red-600 hover:bg-red-700"
                  disabled={!email || !password || !!emailError}
                >
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Sign In as Administrator
                  </span>
                </ShimmerButton>
              </Tooltip>
            )}

            {/* Emergency Contact */}
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Having trouble?{" "}
                <button
                  type="button"
                  className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
                  onClick={() => {
                    window.location.href = "mailto:support@company.com";
                  }}
                >
                  Contact IT Support
                </button>
              </p>
            </div>
          </CardFooter>
        </form>
      </Card>

      {/* Render all banners */}
      {banners.map((banner) => (
        <CompletionBanner key={banner.id} {...banner} />
      ))}
    </div>
  );
};
