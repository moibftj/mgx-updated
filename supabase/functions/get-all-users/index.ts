// Follow this guide to deploy the function to your Supabase project:
// https://supabase.com/docs/guides/functions/deploy

import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "../../utils/auth.ts";
import {
  createCorsResponse,
  createJsonResponse,
  createErrorResponse,
} from "../../utils/cors.ts";

interface AuthUser {
  id: string;
  email?: string;
  [key: string]: unknown;
}

interface UserProfile {
  id: string;
  role: string;
}

interface CombinedUser {
  id: string;
  email: string;
  role: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return createCorsResponse();
  }

  try {
    // SECURITY: Require admin authentication
    const { user, profile } = await requireAdmin(req);

    // 1. Create a Supabase client with the service_role key
    // This will bypass all RLS policies and allow you to read all data.
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // 2. Fetch all users from the auth schema
    const {
      data: { users },
      error,
    } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      throw error;
    }

    // 3. Fetch corresponding profiles to get the role for each user
    const userIds = users.map((user) => user.id);
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, role")
      .in("id", userIds);

    if (profileError) {
      throw profileError;
    }

    // 4. Combine user and profile data
    const combinedUsers: CombinedUser[] = users.map((user) => {
      const profile = (profiles as UserProfile[])?.find(
        (p) => p.id === user.id,
      );
      return {
        id: user.id,
        email: user.email || "",
        role: profile?.role || "user", // Default to 'user' if no profile found
      };
    });

    // 5. Return the list of users
    return createJsonResponse(
      {
        users: combinedUsers,
        requestedBy: { id: user.id, role: profile.role },
      },
      200,
    );
  } catch (error: unknown) {
    console.error("Error fetching users:", error);
    return createErrorResponse(error);
  }
});
