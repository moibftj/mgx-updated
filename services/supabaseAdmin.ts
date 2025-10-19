import { createClient } from "@supabase/supabase-js";

/**
 * Secure server-only Supabase admin client.
 * NEVER import this into browser bundles. Only use inside Netlify functions or edge/server contexts.
 */
export function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.VITE_SUPABASE_ANON_URL; // fallback if only anon vars set
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "SUPABASE_URL (or VITE_SUPABASE_URL/VITE_SUPABASE_ANON_URL) env var not set",
    );
  }
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY env var not set (server-only)");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { "X-Client-Info": "supabase-admin-server" } },
  });
}
