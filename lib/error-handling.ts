import { PostgrestError } from "@supabase/supabase-js";

export interface ErrorResponse {
  message: string;
  code?: string;
  details?: unknown;
}

export function handleSupabaseError(
  error: PostgrestError | null,
): ErrorResponse {
  if (!error) {
    return { message: "An unknown error occurred" };
  }

  // Log error for monitoring
  console.error("Supabase Error:", error);

  return {
    message: error.message,
    code: error.code,
    details: error.details,
  };
}

export function handleApiError(error: unknown): ErrorResponse {
  // Log error for monitoring
  console.error("API Error:", error);

  if (error instanceof Error) {
    return {
      message: error.message,
      details: error.stack,
    };
  }

  return {
    message: "An unexpected error occurred",
    details: error,
  };
}

export function handleAuthError(error: Error): ErrorResponse {
  // Log error for monitoring
  console.error("Auth Error:", error);

  return {
    message: error.message,
    details: error.stack,
  };
}
