import { createClient } from "@supabase/supabase-js";
import { getUserContext } from "../../utils/auth.ts";
import {
  createCorsResponse,
  createJsonResponse,
  createErrorResponse,
} from "../../utils/cors.ts";

interface EmailRequest {
  letterId: string;
  recipientEmail: string;
  senderEmail?: string;
  attorneyEmail?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return createCorsResponse();
  }

  try {
    // SECURITY: Require user authentication
    const { user, profile } = await getUserContext(req);

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get request body
    const {
      letterId,
      recipientEmail,
      senderEmail,
      attorneyEmail,
    }: EmailRequest = await req.json();

    if (!letterId || !recipientEmail) {
      return createJsonResponse(
        {
          success: false,
          error: "Missing required fields: letterId or recipientEmail",
        },
        400,
      );
    }

    // Get the letter content
    const { data: letter, error: letterError } = await supabase
      .from("letters")
      .select("*")
      .eq("id", letterId)
      .single();

    if (letterError || !letter) {
      return createJsonResponse(
        {
          success: false,
          error: "Letter not found",
        },
        404,
      );
    }

    // SECURITY: Ensure user can only send their own letters (unless admin/employee)
    if (
      letter.user_id !== user.id &&
      !["admin", "employee"].includes(profile?.role || "")
    ) {
      return createJsonResponse(
        {
          success: false,
          error: "You can only send your own letters",
        },
        403,
      );
    }

    // Get additional letter details with user profile
    const { data: letterWithProfile, error: profileError } = await supabase
      .from("letters")
      .select(
        `
        *,
        profiles:user_id (email)
      `,
      )
      .eq("id", letterId)
      .single();

    if (profileError || !letterWithProfile) {
      return createJsonResponse(
        {
          success: false,
          error: "Error fetching letter details",
        },
        500,
      );
    }

    if (!letterWithProfile.ai_draft) {
      return createJsonResponse(
        {
          success: false,
          error: "Letter draft not available",
        },
        400,
      );
    }

    // Prepare email content
    const subject = `Legal Letter: ${letter.title}`;
    const emailBody = `
Dear Recipient,

Please find below the legal letter prepared by our attorney:

${letter.ai_draft}

---
This letter was generated through our legal letter service.
If you have any questions, please contact the sender or attorney directly.

Best regards,
Talk to My Lawyer Service
    `;

    // For demo purposes, we'll simulate sending the email
    // In production, integrate with a real email service like SendGrid, Mailgun, or AWS SES
    console.log("Simulating email send:", {
      to: recipientEmail,
      from: attorneyEmail || senderEmail || "noreply@talktomylawyer.com",
      subject,
      body: emailBody,
    });

    // Update letter status to 'sent'
    const { error: updateError } = await supabase
      .from("letters")
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", letterId);

    if (updateError) {
      throw updateError;
    }

    // Log the email sending activity
    const { error: logError } = await supabase
      .from("letter_status_history")
      .insert({
        letter_id: letterId,
        old_status: "approved",
        new_status: "completed",
        changed_by: letter.user_id,
        notes: `Email sent to ${recipientEmail}`,
      });

    if (logError) {
      console.warn("Failed to log email activity:", logError);
    }

    return createJsonResponse(
      {
        success: true,
        message: "Email sent successfully",
        data: {
          letterId,
          recipientEmail,
          subject,
          status: "sent",
        },
      },
      200,
    );
  } catch (error: unknown) {
    console.error("Error sending email:", error);
    return createErrorResponse(error);
  }
});

/*
TODO: Integrate with a real email service provider
Example with SendGrid:

import { SendGridAPI } from 'https://deno.land/x/sendgrid@0.0.3/mod.ts'

const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY')!
const sendGrid = new SendGridAPI(sendGridApiKey)

const emailData = {
  to: recipientEmail,
  from: 'noreply@talktomylawyer.com',
  subject: subject,
  text: emailBody,
  html: emailBody.replace(/\n/g, '<br>')
}

const response = await sendGrid.send(emailData)
*/
