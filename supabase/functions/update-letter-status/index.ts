import { createClient } from "@supabase/supabase-js";
import { getUserContext } from "../../utils/auth.ts";
import {
  createCorsResponse,
  createJsonResponse,
  createErrorResponse,
} from "../../utils/cors.ts";

interface StatusUpdateRequest {
  letterId: string;
  newStatus: string;
  adminNotes?: string;
  assignedLawyerId?: string;
  dueDateInternal?: string;
}

interface UpdateData {
  status: string;
  updated_at: string;
  admin_notes?: string;
  assigned_lawyer_id?: string;
  due_date_internal?: string;
}

// Valid status transitions
const validStatuses = [
  "draft",
  "submitted",
  "in_review",
  "approved",
  "completed",
  "cancelled",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return createCorsResponse();
  }

  try {
    // SECURITY: Require user authentication
    const { user: _user, profile } = await getUserContext(req);

    // SECURITY: Only admin and employee roles can update letter status
    if (profile.role !== "admin" && profile.role !== "employee") {
      return createJsonResponse(
        {
          error: "Insufficient permissions. Admin or employee role required.",
        },
        403,
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get request body
    const {
      letterId,
      newStatus,
      adminNotes,
      assignedLawyerId,
      dueDateInternal,
    }: StatusUpdateRequest = await req.json();

    if (!letterId || !newStatus) {
      throw new Error("Missing required fields: letterId or newStatus");
    }

    // Validate status
    if (!validStatuses.includes(newStatus)) {
      throw new Error(
        `Invalid status. Valid statuses are: ${validStatuses.join(", ")}`,
      );
    }

    // Get current letter details
    const { data: currentLetter, error: fetchError } = await supabase
      .from("letters")
      .select("*")
      .eq("id", letterId)
      .single();

    if (fetchError || !currentLetter) {
      throw new Error("Letter not found");
    }

    // Prepare update object
    const updateData: UpdateData = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    // Add optional fields if provided
    if (adminNotes !== undefined) {
      updateData.admin_notes = adminNotes;
    }

    if (assignedLawyerId !== undefined) {
      updateData.assigned_lawyer_id = assignedLawyerId;
    }

    if (dueDateInternal !== undefined) {
      updateData.due_date_internal = dueDateInternal;
    }

    // Update the letter
    const { error: updateError } = await supabase
      .from("letters")
      .update(updateData)
      .eq("id", letterId);

    if (updateError) {
      throw updateError;
    }

    // The status history will be automatically created by the database trigger
    // But we can also manually add more detailed notes if needed
    if (adminNotes) {
      const { error: historyError } = await supabase
        .from("letter_status_history")
        .insert({
          letter_id: letterId,
          old_status: currentLetter.status,
          new_status: newStatus,
          changed_by: assignedLawyerId || currentLetter.user_id,
          notes: adminNotes,
        });

      if (historyError) {
        console.warn("Failed to add detailed status history:", historyError);
      }
    }

    // Get updated letter with related data
    const { data: updatedLetter, error: finalFetchError } = await supabase
      .from("letters")
      .select(
        `
        *,
        profiles:user_id (email, role),
        assigned_lawyer:assigned_lawyer_id (email)
      `,
      )
      .eq("id", letterId)
      .single();

    if (finalFetchError) {
      throw finalFetchError;
    }

    return createJsonResponse(
      {
        success: true,
        message: `Letter status updated to ${newStatus}`,
        data: {
          letter: updatedLetter,
          previousStatus: currentLetter.status,
          newStatus: newStatus,
        },
      },
      200,
    );
  } catch (error: unknown) {
    console.error("Error updating letter status:", error);
    return createErrorResponse(error);
  }
});
