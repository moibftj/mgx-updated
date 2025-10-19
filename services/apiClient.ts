import { supabase } from "./supabase";
import { logger } from "../lib/logger";

// Define API base URL - uses environment variable or default
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

// Generic interface for API responses
interface ApiResponse<T = any> {
  data?: T;
  error?: {
    message: string;
    code?: string;
    status?: number;
  };
}

// Type for request options
interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string>;
  signal?: AbortSignal;
}

/**
 * General purpose fetch wrapper with error handling
 */
async function fetchWithAuth<T>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  body?: any,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    // Construct URL with query parameters if provided
    let url = `${API_BASE_URL}${endpoint}`;
    if (options.params) {
      const queryParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        queryParams.append(key, value);
      });
      url += `?${queryParams.toString()}`;
    }

    // Default headers
    const headers = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    // Prepare request
    const requestOptions: RequestInit = {
      method,
      headers,
      signal: options.signal,
    };

    // Add body for non-GET requests
    if (method !== "GET" && body !== undefined) {
      requestOptions.body = JSON.stringify(body);
    }

    // Execute request
    const response = await fetch(url, requestOptions);

    // Parse response
    let data: any;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Handle API response
    if (!response.ok) {
      return {
        error: {
          message: data.message || "API request failed",
          code: data.code,
          status: response.status,
        },
      };
    }

    return { data };
  } catch (error: any) {
    return {
      error: {
        message: error.message || "Network error",
        code: "NETWORK_ERROR",
      },
    };
  }
}

// Export convenience methods for different HTTP verbs
export const apiClient = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    fetchWithAuth<T>(endpoint, "GET", undefined, options),

  post: <T>(endpoint: string, data?: any, options?: RequestOptions) =>
    fetchWithAuth<T>(endpoint, "POST", data, options),

  put: <T>(endpoint: string, data?: any, options?: RequestOptions) =>
    fetchWithAuth<T>(endpoint, "PUT", data, options),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    fetchWithAuth<T>(endpoint, "DELETE", undefined, options),

  // Helper for checking if the API is available
  checkHealth: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
    } catch (error) {
      logger.error("API health check failed:", error);
      return false;
    }
  },

  // Fetch letters for the current user
  fetchLetters: async () => {
    try {
      const { data: letters, error } = await supabase
        .from("letters")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        logger.error("Failed to fetch letters:", error);
        // Return empty array for new users or when there's no data
        return [];
      }
      return letters || [];
    } catch (error) {
      logger.error("Failed to fetch letters:", error);
      // Return empty array instead of throwing - allows dashboard to load
      return [];
    }
  },

  // Get user subscription
  getUserSubscription: async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: subscriptions, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;
      return subscriptions?.[0] || null;
    } catch (error) {
      logger.error("Failed to fetch subscription:", error);
      return null;
    }
  },

  // Create a new letter
  createLetter: async (letterData: any) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("letters")
        .insert({
          ...letterData,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error("Failed to create letter:", error);
      throw error;
    }
  },

  // Update an existing letter
  updateLetter: async (letterData: any) => {
    try {
      const { data, error } = await supabase
        .from("letters")
        .update({
          ...letterData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", letterData.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error("Failed to update letter:", error);
      throw error;
    }
  },

  // Delete a letter
  deleteLetter: async (letterId: string) => {
    try {
      const { error } = await supabase
        .from("letters")
        .delete()
        .eq("id", letterId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("Failed to delete letter:", error);
      throw error;
    }
  },
};

export default apiClient;
