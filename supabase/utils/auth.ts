import { createClient } from "@supabase/supabase-js";

export async function requireAdmin(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Response(
      JSON.stringify({
        error: "Missing or invalid Authorization header",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const token = authHeader.substring("Bearer ".length).trim();

  // Create client with anon key for auth verification
  const supabaseAuth = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
  );

  const {
    data: { user },
    error: userError,
  } = await supabaseAuth.auth.getUser(token);
  if (userError || !user) {
    throw new Response(JSON.stringify({ error: "Invalid or expired token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Check admin role using service role client
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "admin") {
    throw new Response(JSON.stringify({ error: "Admin role required" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  return { user, profile };
}

export async function getUserContext(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Response(
      JSON.stringify({
        error: "Missing or invalid Authorization header",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const token = authHeader.substring("Bearer ".length).trim();

  // Create client with anon key for auth verification
  const supabaseAuth = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
  );

  const {
    data: { user },
    error: userError,
  } = await supabaseAuth.auth.getUser(token);
  if (userError || !user) {
    throw new Response(JSON.stringify({ error: "Invalid or expired token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Get user profile using service role client
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    throw new Response(JSON.stringify({ error: "Profile not found" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  return { user, profile };
}
