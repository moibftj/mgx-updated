// Get allowed origins based on environment
function getAllowedOrigins(): string[] {
  const environment = Deno.env.get("ENVIRONMENT") || "development";

  // Default origins for different environments
  const allowedOrigins = {
    development: [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:4173",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:4173",
      "*", // Fallback for development
    ],
    staging: [
      "https://staging-talktomylawyer.com",
      "https://staging.talktomylawyer.com",
      "https://deploy-preview-1--talktomylawyer.vercel.app",
      "https://deploy-preview-2--talktomylawyer.vercel.app",
      // Add more preview domains as needed
    ],
    production: [
      "https://talktomylawyer.com",
      "https://www.talktomylawyer.com",
      "https://talk-to-my-lawyer.com",
      "https://www.talk-to-my-lawyer.com",
    ],
  };

  // Allow custom origins from environment variable
  const customOrigins = Deno.env.get("ALLOWED_ORIGINS");
  if (customOrigins) {
    return [
      ...allowedOrigins[environment as keyof typeof allowedOrigins],
      ...customOrigins.split(","),
    ];
  }

  return (
    allowedOrigins[environment as keyof typeof allowedOrigins] ||
    allowedOrigins.development
  );
}

// Get the appropriate origin for the request
function getOriginForRequest(requestOrigin?: string): string {
  const allowedOrigins = getAllowedOrigins();

  // If no origin provided (e.g., mobile app, curl), return first allowed origin
  if (!requestOrigin) {
    return allowedOrigins[0];
  }

  // If the requesting origin is allowed, return it
  if (allowedOrigins.includes(requestOrigin) || allowedOrigins.includes("*")) {
    return requestOrigin;
  }

  // Otherwise, return the first allowed origin
  return allowedOrigins[0];
}

// Shared CORS headers for all Supabase Edge Functions
export function getCorsHeaders(requestOrigin?: string): Record<string, string> {
  const origin = getOriginForRequest(requestOrigin);

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Max-Age": "86400", // 24 hours
    Vary: "Origin",
  };
}

// Legacy export for backward compatibility
export const corsHeaders = getCorsHeaders();

// Helper to create CORS preflight response
export function createCorsResponse(requestOrigin?: string): Response {
  const headers = getCorsHeaders(requestOrigin);
  return new Response("ok", { headers });
}

// Helper to create JSON response with CORS headers
export function createJsonResponse(
  data: unknown,
  status = 200,
  requestOrigin?: string,
): Response {
  const headers = getCorsHeaders(requestOrigin);
  return new Response(JSON.stringify(data), {
    headers: { ...headers, "Content-Type": "application/json" },
    status,
  });
}

// Helper to create error response with CORS headers
export function createErrorResponse(
  error: unknown,
  status = 500,
  requestOrigin?: string,
): Response {
  const message =
    error instanceof Error ? error.message : "Internal Server Error";

  return createJsonResponse(
    {
      success: false,
      error: message,
    },
    status,
    requestOrigin,
  );
}
