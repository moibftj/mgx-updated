// ai-letter-generation Edge Function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "supabase";
import { OpenAI } from "openai";

// Environment variables (set in Supabase dashboard)
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const openai = new OpenAI(OPENAI_API_KEY);

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { user_id, letter_type, letter_data } = body;
  if (!user_id || !letter_type || !letter_data) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Compose prompt for AI
  const prompt = `Generate a ${letter_type} legal letter with the following details: ${JSON.stringify(letter_data)}`;

  let aiResponse;
  try {
    aiResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a legal document generator AI." },
        { role: "user", content: prompt },
      ],
      max_tokens: 1200,
      temperature: 0.2,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "AI generation failed", details: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const letter_content = aiResponse.choices?.[0]?.message?.content || "";

  // Store letter in DB
  const { data, error } = await supabase.from("letters").insert([
    {
      user_id,
      letter_type,
      letter_data,
      letter_content,
      status: "generated",
      created_at: new Date().toISOString(),
    },
  ]);

  if (error) {
    return new Response(JSON.stringify({ error: "DB insert failed", details: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true, letter_content }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
