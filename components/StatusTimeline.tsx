import React from "react";
import { LetterStatus } from "../services/letterStatusService";

interface StatusStep {
  status: LetterStatus;
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface StatusTimelineProps {
  currentStatus: LetterStatus;
  className?: string;
}

export default function StatusTimeline({
  currentStatus,
  className = "",
}: StatusTimelineProps) {
  // Define status steps with icons and descriptions
  const statusSteps: StatusStep[] = [
    {
      status: LetterStatus.DRAFT,
      label: "Draft",
      description: "Letter is being drafted and can be edited",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      ),
    },
    {
      status: LetterStatus.PENDING_REVIEW,
      label: "Pending Review",
      description: "Letter has been submitted and is waiting for review",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      status: LetterStatus.UNDER_REVIEW,
      label: "Under Review",
      description: "Letter is being reviewed by a legal professional",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      status: LetterStatus.APPROVED,
      label: "Approved",
      description: "Letter has been approved and is ready for finalization",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      ),
    },
    {
      status: LetterStatus.COMPLETED,
      label: "Completed",
      description: "Letter has been finalized and completed",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
  ];

  // Check if the letter is in a terminal state
  const isTerminalState =
    currentStatus === LetterStatus.CANCELLED ||
    currentStatus === LetterStatus.REJECTED;

  // Get the current step index
  const getCurrentStepIndex = () => {
    if (isTerminalState) return -1;
    return statusSteps.findIndex((step) => step.status === currentStatus);
  };

  const currentStepIndex = getCurrentStepIndex();

  // Get step status (completed, current, or upcoming)
  const getStepStatus = (index: number) => {
    if (isTerminalState) {
      return "upcoming"; // All steps are inactive if in terminal state
    }
    if (index < currentStepIndex) return "completed";
    if (index === currentStepIndex) return "current";
    return "upcoming";
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Terminal state banner */}
      {isTerminalState && (
        <div
          className={`mb-4 p-3 rounded-md ${
            currentStatus === LetterStatus.CANCELLED
              ? "bg-gray-100 text-gray-800 border border-gray-300"
              : "bg-red-50 text-red-800 border border-red-300"
          }`}
        >
          <div className="flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className="font-medium">
              {currentStatus === LetterStatus.CANCELLED
                ? "This letter request has been cancelled."
                : "This letter has been rejected. Please review the feedback and make necessary revisions."}
            </span>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        {statusSteps.map((step, index) => {
          const stepStatus = getStepStatus(index);

          return (
            <div
              key={step.status}
              className="relative flex items-start mb-8 last:mb-0"
            >
              {/* Connector line */}
              {index < statusSteps.length - 1 && (
                <div
                  className={`absolute left-3.5 top-6 w-0.5 h-full -mt-3 ${
                    stepStatus === "completed" ? "bg-blue-500" : "bg-gray-200"
                  }`}
                ></div>
              )}

              {/* Step icon */}
              <div
                className={`flex items-center justify-center w-7 h-7 rounded-full z-10 mr-4 ${
                  stepStatus === "completed"
                    ? "bg-blue-500 text-white"
                    : stepStatus === "current"
                      ? "bg-blue-100 text-blue-600 ring-2 ring-blue-500"
                      : "bg-gray-100 text-gray-400"
                }`}
              >
                {step.icon}
              </div>

              {/* Step content */}
              <div className="flex-1">
                <h4
                  className={`font-medium ${
                    stepStatus === "completed"
                      ? "text-blue-600"
                      : stepStatus === "current"
                        ? "text-blue-800"
                        : "text-gray-500"
                  }`}
                >
                  {step.label}
                </h4>
                <p
                  className={`text-sm ${
                    stepStatus === "upcoming"
                      ? "text-gray-400"
                      : "text-gray-600"
                  }`}
                >
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Compact version of the timeline for use in tables
export function StatusTimelineCompact({
  currentStatus,
  className = "",
}: StatusTimelineProps) {
  // Define status colors and labels
  const statusConfig = {
    [LetterStatus.DRAFT]: {
      color: "bg-gray-200",
      textColor: "text-gray-800",
      label: "Draft",
    },
    [LetterStatus.PENDING_REVIEW]: {
      color: "bg-yellow-100",
      textColor: "text-yellow-800",
      label: "Pending",
    },
    [LetterStatus.UNDER_REVIEW]: {
      color: "bg-blue-100",
      textColor: "text-blue-800",
      label: "Reviewing",
    },
    [LetterStatus.APPROVED]: {
      color: "bg-green-100",
      textColor: "text-green-800",
      label: "Approved",
    },
    [LetterStatus.COMPLETED]: {
      color: "bg-green-500",
      textColor: "text-white",
      label: "Completed",
    },
    [LetterStatus.REJECTED]: {
      color: "bg-red-100",
      textColor: "text-red-800",
      label: "Rejected",
    },
    [LetterStatus.CANCELLED]: {
      color: "bg-gray-100",
      textColor: "text-gray-500",
      label: "Cancelled",
    },
  };

  // Determine number of steps and current position
  const totalSteps = 5; // Draft -> Pending -> Review -> Approved -> Completed
  let currentStep = 0;

  // Map status to step number
  if (currentStatus === LetterStatus.DRAFT) currentStep = 1;
  else if (currentStatus === LetterStatus.PENDING_REVIEW) currentStep = 2;
  else if (currentStatus === LetterStatus.UNDER_REVIEW) currentStep = 3;
  else if (currentStatus === LetterStatus.APPROVED) currentStep = 4;
  else if (currentStatus === LetterStatus.COMPLETED) currentStep = 5;
  else currentStep = 0; // For rejected/cancelled

  // Calculate percentage completion
  const percentComplete =
    currentStatus === LetterStatus.REJECTED ||
    currentStatus === LetterStatus.CANCELLED
      ? 0
      : Math.min(Math.round((currentStep / totalSteps) * 100), 100);

  // Get the status config
  const config = statusConfig[currentStatus];

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Status label */}
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color} ${config.textColor} mb-2`}
      >
        {config.label}
      </span>

      {/* Progress bar */}
      {currentStatus !== LetterStatus.REJECTED &&
        currentStatus !== LetterStatus.CANCELLED && (
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className={`bg-blue-600 h-1.5 rounded-full transition-all duration-300 ${
                percentComplete === 0
                  ? "w-0"
                  : percentComplete <= 20
                    ? "w-1/5"
                    : percentComplete <= 40
                      ? "w-2/5"
                      : percentComplete <= 60
                        ? "w-3/5"
                        : percentComplete <= 80
                          ? "w-4/5"
                          : "w-full"
              }`}
            ></div>
          </div>
        )}

      {/* Cancelled/Rejected indicator */}
      {(currentStatus === LetterStatus.REJECTED ||
        currentStatus === LetterStatus.CANCELLED) && (
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full w-full ${
              currentStatus === LetterStatus.REJECTED
                ? "bg-red-500"
                : "bg-gray-400"
            }`}
          ></div>
        </div>
      )}
    </div>
  );
}
