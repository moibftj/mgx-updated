import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "../services/supabase";
import { Session, User } from "@supabase/supabase-js";
import { UserRole } from "../types";
import { logger } from "../lib/logger";

interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  points?: number;
  commission_earned?: number;
  coupon_code?: string;
  referred_by?: string;
  subscription_status?: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isLoading: boolean; // alias for compatibility
  authEvent: string | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (
    email: string,
    password: string,
    role?: UserRole,
    couponCode?: string,
  ) => Promise<{ error: any; user: User | null; couponCode?: string }>;
  adminSignIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: any }>;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    role?: UserRole,
    couponCode?: string,
  ) => Promise<{ user: User | null; couponCode?: string }>;
  requestPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserPassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authEvent, setAuthEvent] = useState<string | null>(null);

  // Fetch user profile from profiles table
  const fetchUserProfile = async (
    userId: string,
  ): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error || !data) {
        logger.error("Error fetching user profile:", error);
        return null;
      }

      return data as UserProfile;
    } catch (error) {
      logger.error("Error fetching user profile:", error);
      return null;
    }
  };

  // Refresh profile data
  const refreshProfile = async () => {
    if (user) {
      const userProfile = await fetchUserProfile(user.id);
      setProfile(userProfile);
    }
  };

  useEffect(() => {
    // Check for authentication callbacks in URL hash (recovery, email confirmation, etc.)
    const checkForAuthCallback = async () => {
      const hash = window.location.hash;
      logger.logAuth("Checking URL hash for auth callback", {
        hasHash: !!hash,
      });

      // Handle password recovery
      if (hash.includes("type=recovery") && hash.includes("access_token=")) {
        logger.info("Password recovery detected");

        try {
          // Extract the access token from the hash
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get("access_token");
          const refreshToken = params.get("refresh_token");

          if (accessToken) {
            // Verify the session with Supabase
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || "",
            });

            if (!error && data.session) {
              logger.info("Recovery session established successfully");
              setAuthEvent("PASSWORD_RECOVERY");
              // Clear the hash to clean up the URL
              window.history.replaceState(null, "", window.location.pathname);
            } else {
              logger.error("Failed to establish recovery session:", error);
              // Clear the invalid hash
              window.history.replaceState(null, "", window.location.pathname);
            }
          }
        } catch (error) {
          logger.error("Error processing recovery token:", error);
          // Clear the hash on error
          window.history.replaceState(null, "", window.location.pathname);
        }
      }
      // Handle email confirmation
      else if (
        (hash.includes("type=signup") || hash.includes("type=email")) &&
        hash.includes("access_token=")
      ) {
        logger.info("Email confirmation detected");

        try {
          // Extract tokens from the hash
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get("access_token");
          const refreshToken = params.get("refresh_token");

          if (accessToken) {
            // Set the session for confirmed user
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || "",
            });

            if (!error && data.session) {
              logger.info(
                "Email confirmation session established successfully",
              );
              setAuthEvent("SIGNED_IN");
              // Clear the hash to clean up the URL
              window.history.replaceState(null, "", window.location.pathname);
            } else {
              logger.error("Failed to establish confirmation session:", error);
              window.history.replaceState(null, "", window.location.pathname);
            }
          }
        } catch (error) {
          logger.error("Error processing email confirmation:", error);
          window.history.replaceState(null, "", window.location.pathname);
        }
      }
    };

    // Check immediately
    checkForAuthCallback();

    // Add a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      logger.warn("Auth loading timeout - forcing loading to false");
      setLoading(false);
    }, 5000); // 5 second timeout

    // Get initial session
    supabase.auth
      .getSession()
      .then(async ({ data: { session }, error }) => {
        clearTimeout(loadingTimeout);

        if (error) {
          logger.error("Error getting session:", error);
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const userProfile = await fetchUserProfile(session.user.id);
          setProfile(userProfile);
        }

        setLoading(false);
      })
      .catch((err) => {
        clearTimeout(loadingTimeout);
        logger.error("Session check failed:", err);
        setLoading(false);
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.logAuth("Auth state changed", { event });

      setSession(session);
      setUser(session?.user ?? null);
      setAuthEvent(event);

      if (session?.user) {
        const userProfile = await fetchUserProfile(session.user.id);
        setProfile(userProfile);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (
    email: string,
    password: string,
    role: UserRole = "user",
    couponCode?: string,
  ) => {
    try {
      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: role, // Pass role in metadata
          },
        },
      });

      if (error) {
        return { error, user: null };
      }

      // If user is created, create profile entry and handle role-specific setup
      if (data.user) {
        // Process referral if coupon code provided and user is signing up as 'user'
        if (couponCode && role === "user") {
          try {
            const { data: referralResult, error: referralError } =
              await supabase.rpc("process_referral_signup", {
                new_user_id: data.user.id,
                coupon_code_param: couponCode,
              });

            if (referralError) {
              logger.error("Error processing referral:", referralError);
              // Don't fail signup for referral errors, just log
            } else if (referralResult?.success) {
              logger.info("Referral processed successfully:", referralResult);
            }
          } catch (referralError) {
            logger.error("Error processing referral:", referralError);
            // Don't fail signup for referral errors
          }
        }

        // Create employee coupon if signing up as employee
        let employeeCouponCode: string | undefined;
        if (role === "employee") {
          try {
            const supabaseUrl =
              Deno?.env?.get("SUPABASE_URL") ||
              process.env.NEXT_PUBLIC_SUPABASE_URL;
            const supabaseAnonKey =
              Deno?.env?.get("SUPABASE_ANON_KEY") ||
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            if (supabaseUrl && supabaseAnonKey) {
              const response = await fetch(
                `${supabaseUrl}/functions/v1/create-employee-coupon`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${supabaseAnonKey}`,
                  },
                  body: JSON.stringify({
                    userId: data.user.id,
                    email: email,
                  }),
                },
              );

              if (response.ok) {
                const result = await response.json();
                employeeCouponCode = result.code;
                logger.info("Employee coupon created successfully:", result);
              } else {
                logger.error(
                  "Failed to create employee coupon:",
                  await response.text(),
                );
              }
            } else {
              logger.error(
                "Missing Supabase configuration for employee coupon creation",
              );
            }
          } catch (couponError) {
            logger.error("Error creating employee coupon:", couponError);
            // Don't fail signup for coupon creation errors
          }
        }
      }

      return { error: null, user: data.user, couponCode: employeeCouponCode };
    } catch (error) {
      return { error, user: null };
    }
  };

  const login = async (email: string, password: string) => {
    const { error } = await signIn(email, password);
    if (error) {
      throw error;
    }
  };

  const signup = async (
    email: string,
    password: string,
    role: UserRole = "user",
    couponCode?: string,
  ) => {
    const {
      error,
      user: newUser,
      couponCode: employeeCouponCode,
    } = await signUp(email, password, role, couponCode);
    if (error) {
      throw error;
    }
    return { user: newUser, couponCode: employeeCouponCode };
  };

  const requestPasswordReset = async (email: string) => {
    const { error } = await resetPassword(email);
    if (error) {
      throw error;
    }
  };

  const logout = async () => {
    await signOut();
  };

  const updateUserPassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      throw error;
    }
  };

  const adminSignIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error };
    }

    // Verify admin role
    if (data.user) {
      const userProfile = await fetchUserProfile(data.user.id);
      if (!userProfile || userProfile.role !== "admin") {
        await supabase.auth.signOut();
        return {
          error: { message: "Access denied. Admin privileges required." },
        };
      }
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  // Function to update user profile
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      return { error: { message: "No user logged in" } };
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

      if (error) {
        return { error };
      }

      // Refresh profile data
      await refreshProfile();
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const value = {
    session,
    user,
    profile,
    loading,
    isLoading: loading, // alias for compatibility
    authEvent,
    signIn,
    signUp,
    adminSignIn,
    signOut,
    resetPassword,
    refreshProfile,
    updateProfile,
    login,
    signup,
    requestPasswordReset,
    logout,
    updateUserPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
