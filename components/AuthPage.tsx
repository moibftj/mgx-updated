import React, { useState, FormEvent } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./Card";
import { ShinyButton } from "./magicui/shiny-button";
import { ShimmerButton } from "./magicui/shimmer-button";
import { Logo } from "./Logo";
import type { UserRole } from "../types";
import { isValidEmail } from "../lib/utils";
import { Tooltip } from "./Tooltip";
import { CompletionBanner, useBanners } from "./CompletionBanner";

type View = "login" | "signup" | "forgot_password";

// Responsive form components with original styling
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
    className={`mt-1 flex h-8 sm:h-9 md:h-10 lg:h-11 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 dark:placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 ${className}`}
    {...props}
  />
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({
  className,
  children,
  ...props
}) => (
  <select
    className={`mt-1 flex h-8 sm:h-9 md:h-10 lg:h-11 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 ${className}`}
    {...props}
  >
    {children}
  </select>
);

interface AuthPageProps {
  initialView?: "login" | "signup";
  onBackToLanding?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialView = "login",
  onBackToLanding,
}) => {
  const [view, setView] = useState<View>(initialView);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [affiliateCode, setAffiliateCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [employeeCouponCode, setEmployeeCouponCode] = useState<string | null>(
    null,
  );
  const { login, signup, requestPasswordReset } = useAuth();
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

    if (view === "login") {
      showInfo("Signing In", "Verifying your credentials...");
    } else if (view === "signup") {
      showInfo("Creating Account", "Setting up your new account...");
    } else {
      showInfo(
        "Sending Reset Link",
        "Processing your password reset request...",
      );
    }

    try {
      if (view === "login") {
        await login(email, password);
        showSuccess("Welcome Back!", "Successfully signed in to your account.");
      } else if (view === "signup") {
        const result = await signup(email, password, role, affiliateCode);

        // If employee and coupon was created, show the coupon code
        if (role === "employee" && result.couponCode) {
          setEmployeeCouponCode(result.couponCode);
          showSuccess(
            "Employee Account Created!",
            `Your employee referral code is: ${result.couponCode}. Share this code with users to earn 15% commission on their signups. Please check your email to verify your account.`,
          );
        } else {
          showSuccess(
            "Please Check Email For Verification Link",
            "We've sent a verification link to your email address. Please check your inbox and click the link to activate your account.",
          );
        }
      } else {
        // forgot_password
        await requestPasswordReset(email);
        setSuccessMessage(
          "If an account with that email exists, a password reset link has been sent.",
        );
        showSuccess(
          "Reset Link Sent",
          "Check your email for password reset instructions.",
        );
      }
    } catch (err: any) {
      setError(err.message);
      showError(
        "Authentication Failed",
        err.message || "Please check your credentials and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const switchView = (newView: View) => {
    setView(newView);
    setEmail("");
    setPassword("");
    setError(null);
    setSuccessMessage(null);
    setEmailError(null);
    setEmployeeCouponCode(null);
  };

  const renderContent = () => {
    if (view === "forgot_password") {
      return (
        <>
          <CardHeader className="text-center">
            <CardTitle className="text-xl sm:text-2xl">
              Reset Password
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Enter your email to receive a password reset link.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 px-6">
              <div className="space-y-1">
                <Label htmlFor="email">Email Address</Label>
                <Tooltip
                  text="Enter the email address associated with your account. We'll send you a secure password reset link."
                  size="md"
                  delay={500}
                >
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={handleEmailChange}
                  />
                </Tooltip>
                {emailError && (
                  <p className="text-xs text-red-500 mt-1">{emailError}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 px-6">
              {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}
              {successMessage && (
                <p className="text-sm text-green-600 dark:text-green-500 text-center">
                  {successMessage}
                </p>
              )}

              {loading ? (
                <Tooltip text="Processing your password reset request...">
                  <ShinyButton disabled className="w-full h-10 sm:h-11">
                    Processing...
                  </ShinyButton>
                </Tooltip>
              ) : (
                <Tooltip text="Click to receive a password reset link via email">
                  <ShimmerButton
                    type="submit"
                    className="w-full h-10 sm:h-11"
                    disabled={!email || !!emailError}
                  >
                    Send Reset Link
                  </ShimmerButton>
                </Tooltip>
              )}

              <Tooltip text="Return to the sign in page">
                <button
                  type="button"
                  onClick={() => switchView("login")}
                  className="w-full text-sm text-blue-600 hover:underline dark:text-blue-400 transition-colors duration-200 text-center"
                >
                  Back to Sign In
                </button>
              </Tooltip>
            </CardFooter>
          </form>
        </>
      );
    }

    return (
      <>
        <CardHeader className="text-center">
          <CardTitle className="text-xl sm:text-2xl">
            {view === "login" ? "Welcome Back" : "Create an Account"}
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            {view === "login"
              ? "Sign in to access your dashboard."
              : "Enter your details to get started."}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 px-6">
            <div className="space-y-1">
              <Label htmlFor="email">Email Address</Label>
              <Tooltip text="Enter your email address for account access">
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={handleEmailChange}
                />
              </Tooltip>
              {emailError && (
                <p className="text-xs text-red-500 mt-1">{emailError}</p>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-baseline">
                <Label htmlFor="password">Password</Label>
                {view === "login" && (
                  <Tooltip text="Click to reset your password via email">
                    <button
                      type="button"
                      onClick={() => switchView("forgot_password")}
                      className="text-xs text-blue-600 hover:underline dark:text-blue-400 transition-colors duration-200"
                    >
                      Forgot Password?
                    </button>
                  </Tooltip>
                )}
              </div>
              <Tooltip text="Enter your password (minimum 6 characters)">
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Tooltip>
            </div>

            {view === "signup" && (
              <>
                <div className="space-y-1">
                  <Label htmlFor="role">I am a...</Label>
                  <Tooltip
                    text="Select your account type: Users can create and manage legal letters, Employees can track referrals and earn commissions from user signups."
                    size="md"
                    delay={300}
                  >
                    <Select
                      id="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                    >
                      <option value="user">User</option>
                      <option value="employee">Employee</option>
                    </Select>
                  </Tooltip>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="affiliateCode">
                    Affiliate Code (Optional)
                  </Label>
                  <Tooltip
                    text="Optional: Enter an employee's referral code to give them credit for bringing you to our platform. They'll receive a commission when you sign up."
                    size="md"
                    delay={300}
                  >
                    <Input
                      id="affiliateCode"
                      type="text"
                      placeholder="e.g., EMP123XYZ"
                      value={affiliateCode}
                      onChange={(e) => setAffiliateCode(e.target.value)}
                    />
                  </Tooltip>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4 px-6">
            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            {employeeCouponCode && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  🎉 Your Employee Referral Code:
                </p>
                <div className="bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 rounded-md px-4 py-2 font-mono text-lg font-bold text-blue-800 dark:text-blue-200">
                  {employeeCouponCode}
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                  Share this code with users to earn 15% commission on their
                  signups!
                </p>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(employeeCouponCode);
                    showSuccess("Copied!", "Referral code copied to clipboard");
                  }}
                  className="mt-3 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md transition-colors duration-200"
                >
                  Copy Code
                </button>
              </div>
            )}

            {loading ? (
              <Tooltip text="Processing your authentication...">
                <ShinyButton disabled className="w-full h-10 sm:h-11">
                  Processing...
                </ShinyButton>
              </Tooltip>
            ) : (
              <Tooltip
                text={
                  view === "login"
                    ? "Click to sign in to your account"
                    : "Click to create your new account"
                }
              >
                <ShimmerButton
                  type="submit"
                  className="w-full h-10 sm:h-11"
                  disabled={!email || !password || !!emailError}
                >
                  {view === "login" ? "Sign In" : "Sign Up"}
                </ShimmerButton>
              </Tooltip>
            )}

            <Tooltip
              text={
                view === "login"
                  ? "Switch to create a new account"
                  : "Switch to sign in with existing account"
              }
            >
              <button
                type="button"
                onClick={() =>
                  switchView(view === "login" ? "signup" : "login")
                }
                className="w-full text-sm text-blue-600 hover:underline dark:text-blue-400 transition-colors duration-200 text-center"
              >
                {view === "login"
                  ? "Need an account? Sign Up"
                  : "Already have an account? Sign In"}
              </button>
            </Tooltip>
          </CardFooter>
        </form>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex flex-col items-center justify-center p-3 sm:p-4 lg:p-6 xl:p-8">
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
      <div className="flex justify-center mb-4 sm:mb-6 lg:mb-8">
        <Logo size="lg" showText={true} variant="default" />
      </div>
      <Card className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl mx-auto">
        {renderContent()}
      </Card>

      {/* Render all banners */}
      {banners.map((banner) => (
        <CompletionBanner key={banner.id} {...banner} />
      ))}
    </div>
  );
};
