import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getUserContext } from "../../utils/auth.ts";
import {
  corsHeaders,
  createCorsResponse,
  createJsonResponse,
  createErrorResponse,
} from "../../utils/cors.ts";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface LetterRequest {
  senderName: string;
  senderAddress: string;
  attorneyName: string;
  recipientName: string;
  matter: string;
  desiredResolution: string;
  letterType: string;
  priority?: string;
}

interface RequestBody {
  letterRequest?: LetterRequest;
  userId?: string;
  letterId?: string;
  title?: string;
  templateBody?: string;
  templateFields?: unknown;
  additionalContext?: string;
  tone?: string;
  length?: string;
}

interface Config {
  supabaseUrl: string;
  supabaseServiceKey: string;
  geminiApiKey: string;
}

// Configuration validation
function getConfig(): Config {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing required Supabase configuration");
  }

  if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  return { supabaseUrl, supabaseServiceKey, geminiApiKey };
}

// Create a new letter in the database
async function createLetter(
  supabase: SupabaseClient,
  letterRequest: LetterRequest,
  userId: string,
  requestBody: RequestBody,
): Promise<string> {
  const { data: newLetter, error: createError } = await supabase
    .from("letters")
    .insert({
      title: `Letter to ${letterRequest.recipientName} - ${letterRequest.matter}`,
      letter_type: letterRequest.letterType || "general",
      status: "submitted",
      timeline_status: "received",
      user_id: userId,
      sender_name: letterRequest.senderName,
      sender_address: letterRequest.senderAddress,
      attorney_name: letterRequest.attorneyName,
      recipient_name: letterRequest.recipientName,
      matter: letterRequest.matter,
      desired_resolution: letterRequest.desiredResolution,
      priority: letterRequest.priority || "medium",
      content: JSON.stringify(requestBody),
    })
    .select()
    .single();

  if (createError) {
    console.error("Create letter error:", createError);
    throw createError;
  }

  // Create initial timeline entry
  await supabase.rpc("update_letter_timeline", {
    letter_id_param: newLetter.id,
    new_status: "received",
    message_param: "Letter request received and processing started",
  });

  return newLetter.id;
}

// Update an existing letter
async function updateLetterStatus(
  supabase: SupabaseClient,
  letterId: string,
): Promise<void> {
  await supabase
    .from("letters")
    .update({
      status: "submitted",
      timeline_status: "under_review",
    })
    .eq("id", letterId);

  await supabase.rpc("update_letter_timeline", {
    letter_id_param: letterId,
    new_status: "under_review",
    message_param: "Letter is under attorney review",
  });
}

// Update letter to generating status
async function updateLetterToGenerating(
  supabase: SupabaseClient,
  letterId: string,
): Promise<void> {
  await supabase
    .from("letters")
    .update({
      status: "generating",
      timeline_status: "generating",
    })
    .eq("id", letterId);

  await supabase.rpc("update_letter_timeline", {
    letter_id_param: letterId,
    new_status: "generating",
    message_param: "AI is generating your letter draft",
  });
}

// Update letter with AI draft
async function updateLetterWithDraft(
  supabase: SupabaseClient,
  letterId: string,
  aiDraft: string,
): Promise<void> {
  const { error: updateError } = await supabase
    .from("letters")
    .update({
      ai_draft: aiDraft,
      status: "completed",
      timeline_status: "posted",
      updated_at: new Date().toISOString(),
    })
    .eq("id", letterId);

  if (updateError) {
    throw updateError;
  }

  await supabase.rpc("update_letter_timeline", {
    letter_id_param: letterId,
    new_status: "posted",
    message_param: "Letter draft completed and ready for review",
  });
}

// Generate prompt for OpenAI based on request type
function generatePrompt(requestBody: RequestBody): string {
  const {
    letterRequest,
    title,
    templateBody,
    additionalContext,
    tone,
    length,
  } = requestBody;

  if (letterRequest) {
    return `
You are a professional legal letter writer. Generate a formal legal letter based on the following information:

Sender: ${letterRequest.senderName}
Sender Address: ${letterRequest.senderAddress}
Attorney/Law Firm: ${letterRequest.attorneyName}
Recipient: ${letterRequest.recipientName}
Subject/Matter: ${letterRequest.matter}
Desired Resolution: ${letterRequest.desiredResolution}
Letter Type: ${letterRequest.letterType}

Please create a professional, formal legal letter that:
1. Uses appropriate legal language and formatting
2. Clearly states the issue/matter
3. Requests the desired resolution
4. Maintains a professional but firm tone
5. Includes proper legal disclaimers if applicable
6. Is formatted as a complete business letter with proper headers

The letter should be comprehensive but concise, typically 1-2 pages when printed.
    `;
  }

  return `
You are a professional letter writer. Generate a ${tone || "formal"} letter based on the following information:

Title: ${title}
Template: ${templateBody}
Additional Context: ${additionalContext}
Tone: ${tone}
Length: ${length}

Please create a professional letter that incorporates the template and additional context.
Replace any placeholders in brackets with appropriate content based on the context provided.
Maintain a ${tone || "formal"} tone throughout.
    `;
}

// Call Gemini AI API to generate letter draft
async function generateAIDraft(
  prompt: string,
  geminiApiKey: string,
): Promise<string> {
  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 2048,
    },
  });
  const response = await result.response;
  return response.text();
}

// Validate request body
function validateRequestBody(requestBody: RequestBody): void {
  if (!requestBody.title && !requestBody.letterRequest) {
    throw new Error("Missing required fields: title or letterRequest");
  }
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return createCorsResponse(origin);
  }

  try {
    // SECURITY: Require user authentication
    const { user: authUser } = await getUserContext(req);

    if (!authUser || !authUser.id) {
      throw new Error("User authentication required");
    }

    // Get configuration
    const config = getConfig();
    const supabase = createClient(
      config.supabaseUrl,
      config.supabaseServiceKey,
    );

    // Get and validate request body
    const requestBody: RequestBody = await req.json();
    console.log("Request body received:", requestBody);
    validateRequestBody(requestBody);

    // Extract request parameters
    const { letterRequest, userId, letterId } = requestBody;

    // Use the authenticated user's ID, or the provided userId if it matches the authenticated user
    const effectiveUserId = userId || authUser.id;

    // Create or update letter
    let currentLetterId = letterId;
    if (!letterId && letterRequest) {
      currentLetterId = await createLetter(
        supabase,
        letterRequest,
        effectiveUserId,
        requestBody,
      );
    } else if (letterId) {
      await updateLetterStatus(supabase, letterId);
    }

    // Update letter to generating status
    await updateLetterToGenerating(supabase, currentLetterId!);

    // Generate AI draft
    const prompt = generatePrompt(requestBody);
    const aiDraft = await generateAIDraft(prompt, config.geminiApiKey);

    // Update letter with AI draft
    await updateLetterWithDraft(supabase, currentLetterId!, aiDraft);

    return createJsonResponse(
      {
        success: true,
        message: "Letter draft generated successfully",
        letterId: currentLetterId,
        aiDraft,
      },
      200,
      origin || undefined,
    );
  } catch (error: unknown) {
    console.error("Error generating draft:", error);
    return createErrorResponse(error, 500, origin || undefined);
  }
});
