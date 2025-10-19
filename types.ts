// Based on ENUMs in the database schema
export type UserRole = "user" | "employee" | "admin";
export type LetterStatus =
  | "draft"
  | "submitted"
  | "in_review"
  | "approved"
  | "completed"
  | "cancelled";
export type PriorityLevel = "low" | "medium" | "high" | "urgent";
export type SubscriptionStatus =
  | "inactive"
  | "active"
  | "past_due"
  | "cancelled"
  | "unpaid";
export type MessageType = "text" | "system" | "file";
export type PaymentStatus =
  | "pending"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "refunded";

// User interface
export interface User {
  email: string;
  role: UserRole;
}

// Employee interface
export interface Employee {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Letter Template structure
export interface LetterTemplate {
  value: string;
  label: string;
  description: string;
  body: string;
  requiredFields: string[];
}

// Based on letter_requests table
export interface LetterRequest {
  id: string; // UUID
  userId: string; // UUID
  lawyerId?: string; // UUID
  title: string;
  letterType: string; // Corresponds to the LetterTemplate's value
  description: string; // Now used for additional context
  recipientInfo: Record<string, any>; // JSONB
  senderInfo: Record<string, any>; // JSONB
  status: LetterStatus;
  priority: PriorityLevel;
  dueDate?: string; // DATE
  aiGeneratedContent?: string;
  templateData?: Record<string, string>; // Stores user input for template fields
  finalContent?: string;
  createdAt: string; // TIMESTAMPTZ
  updatedAt: string; // TIMESTAMPTZ
}

// Email service interfaces
export interface EmailRequest {
  to: string;
  subject: string;
  body: string;
  from?: string;
}

export interface SendEmailRequest extends EmailRequest {
  templateId?: string;
  templateData?: Record<string, any>;
}

// Discount Code interface
export interface DiscountCode {
  id: string;
  code: string;
  employeeId: string;
  discountPercentage: number;
  isActive: boolean;
  usageCount: number;
  maxUses?: number;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Discount Usage interface
export interface DiscountUsage {
  id: string;
  discountCodeId: string;
  userId: string;
  employeeId: string;
  subscriptionAmount: number;
  discountAmount: number;
  commissionAmount: number;
  usedAt: string;
}

// Subscription interfaces
export interface Subscription {
  id: string;
  userId: string;
  planType: "one_letter" | "four_monthly" | "eight_yearly";
  amount: number;
  status: SubscriptionStatus;
  discountCodeId?: string;
  createdAt: string;
  updatedAt: string;
}

// Employee Analytics interface
export interface EmployeeAnalytics {
  totalReferrals: number;
  totalCommissions: number;
  activeDiscountCodes: number;
  monthlyEarnings: number;
  codeUsageStats: {
    code: string;
    usageCount: number;
    totalRevenue: number;
    totalCommissions: number;
  }[];
}

// Admin Statistics interface
export interface AdminStats {
  totalUsers: number;
  totalEmployees: number;
  activeEmployees: number;
  totalLetters: number;
  totalRevenue: number;
  activeDiscountCodes: number;
  totalDiscountCodes: number;
  totalCommissionsGenerated: number;
  monthlyCommissions: number;
  monthlyGrowth: number;
}
