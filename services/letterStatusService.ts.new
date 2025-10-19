import { supabase } from './supabase';

// Define the letter status types
export enum LetterStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// Interface for status update parameters
interface StatusUpdateParams {
  letterId: string;
  status: LetterStatus;
  notes?: string;
  userId?: string;
}

// Interface for status history records
export interface StatusHistoryRecord {
  id: string;
  letter_id: string;
  status: LetterStatus;
  created_at: string;
  user_id?: string;
  notes?: string;
}

/**
 * Update the status of a letter and record the change in history
 * @param params - The status update parameters
 * @returns Success flag and optional error message
 */
export async function updateLetterStatus({
  letterId,
  status,
  notes,
  userId
}: StatusUpdateParams): Promise<{ success: boolean; error?: string }> {
  // Start a transaction to ensure both updates succeed or fail together
  const { data, error } = await supabase.rpc('update_letter_status', {
    p_letter_id: letterId,
    p_status: status,
    p_notes: notes || '',
    p_user_id: userId || null
  });

  if (error) {
    console.error('Error updating letter status:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get the complete status history for a letter
 * @param letterId - The ID of the letter
 * @returns Array of status history records
 */
export async function getLetterStatusHistory(letterId: string): Promise<StatusHistoryRecord[]> {
  const { data, error } = await supabase
    .from('letter_status_history')
    .select('*')
    .eq('letter_id', letterId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching letter status history:', error);
    return [];
  }

  return data as StatusHistoryRecord[];
}

/**
 * Get the current status of a letter
 * @param letterId - The ID of the letter
 * @returns The current status or null if not found
 */
export async function getCurrentLetterStatus(letterId: string): Promise<LetterStatus | null> {
  const { data, error } = await supabase
    .from('letters')
    .select('status')
    .eq('id', letterId)
    .single();

  if (error || !data) {
    console.error('Error fetching current letter status:', error);
    return null;
  }

  return data.status as LetterStatus;
}

/**
 * Check if a status transition is valid
 * @param currentStatus - The current status of the letter
 * @param newStatus - The proposed new status
 * @returns Whether the transition is allowed
 */
export function isValidStatusTransition(currentStatus: LetterStatus, newStatus: LetterStatus): boolean {
  // Define valid transitions for each status
  const validTransitions: Record<LetterStatus, LetterStatus[]> = {
    [LetterStatus.DRAFT]: [
      LetterStatus.PENDING_REVIEW,
      LetterStatus.CANCELLED
    ],
    [LetterStatus.PENDING_REVIEW]: [
      LetterStatus.UNDER_REVIEW,
      LetterStatus.DRAFT,
      LetterStatus.CANCELLED
    ],
    [LetterStatus.UNDER_REVIEW]: [
      LetterStatus.APPROVED,
      LetterStatus.REJECTED,
      LetterStatus.PENDING_REVIEW,
      LetterStatus.CANCELLED
    ],
    [LetterStatus.APPROVED]: [
      LetterStatus.COMPLETED,
      LetterStatus.UNDER_REVIEW,
      LetterStatus.CANCELLED
    ],
    [LetterStatus.REJECTED]: [
      LetterStatus.DRAFT,
      LetterStatus.CANCELLED
    ],
    [LetterStatus.COMPLETED]: [
      LetterStatus.CANCELLED
    ],
    [LetterStatus.CANCELLED]: [
      LetterStatus.DRAFT
    ]
  };

  // Check if the transition is allowed
  return validTransitions[currentStatus]?.includes(newStatus) || false;
}

/**
 * Get a description of a letter status
 * @param status - The letter status
 * @returns A user-friendly description of the status
 */
export function getStatusDescription(status: LetterStatus): string {
  const descriptions: Record<LetterStatus, string> = {
    [LetterStatus.DRAFT]: 'Letter is in draft state and can be edited.',
    [LetterStatus.PENDING_REVIEW]: 'Letter has been submitted and is waiting for review.',
    [LetterStatus.UNDER_REVIEW]: 'Letter is currently being reviewed by a legal professional.',
    [LetterStatus.APPROVED]: 'Letter has been approved and is ready for finalization.',
    [LetterStatus.REJECTED]: 'Letter was rejected and needs revisions.',
    [LetterStatus.COMPLETED]: 'Letter has been finalized and completed.',
    [LetterStatus.CANCELLED]: 'Letter request has been cancelled.'
  };
  
  return descriptions[status] || 'Unknown status';
}
