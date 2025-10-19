// Follow this guide to deploy the function to your Supabase project:
// https://supabase.com/docs/guides/functions/deploy

/// <reference types="https://deno.land/x/xhr@0.3.0/mod.d.ts" />
/// <reference lib="deno.ns" />

import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "../../utils/auth.ts";
import {
  createCorsResponse,
  createJsonResponse,
  createErrorResponse,
} from "../../utils/cors.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return createCorsResponse();
  }

  try {
    // SECURITY: Require admin authentication
    const { user, profile } = await requireAdmin(req);

    // Create a Supabase client with the service_role key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Fetch all letters from the letters table
    const { data: letters, error } = await supabaseAdmin
      .from("letters")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return createJsonResponse(
      {
        letters,
        requestedBy: { id: user.id, role: profile.role },
      },
      200,
    );
  } catch (error: unknown) {
    console.error("Error fetching letters:", error);
    return createErrorResponse(error);
  }
});
