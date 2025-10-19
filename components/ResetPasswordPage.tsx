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
import { IconLogo } from "../constants";
import { AuthPage } from "./AuthPage";

export const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { updateUserPassword } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await updateUserPassword(password);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return <AuthPage />; // Or a dedicated success page that redirects to login
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="flex items-center gap-3 mb-8">
        <IconLogo className="h-10 w-10 text-blue-600 dark:text-blue-400" />
        <span className="text-3xl font-bold text-gray-900 dark:text-white">
          Law Letter AI
        </span>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Set New Password</CardTitle>
          <CardDescription>
            Enter a new password for your account.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="password">New Password</label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`mt-1 flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 dark:placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                id="confirmPassword"
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`mt-1 flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 dark:placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            {loading ? (
              <ShinyButton disabled className="w-full">
                Saving...
              </ShinyButton>
            ) : (
              <ShimmerButton
                type="submit"
                className="w-full"
                disabled={!password || password !== confirmPassword}
              >
                Set New Password
              </ShimmerButton>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
