import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ArrowRight,
  ArrowLeft,
  FileText,
  User,
  Calendar,
  CheckCircle,
  Download,
  Mail,
  Eye,
  Clock,
  AlertCircle,
  Send,
} from "lucide-react";
import type { LetterRequest } from "../types";
import { GenerationTimeline } from "./GenerationTimeline";

interface LetterGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (letterData: Partial<LetterRequest>) => void;
  letterToEdit?: LetterRequest | null;
  hasSubscription?: boolean;
  onSubscribe?: () => void;
}

type StepType = "form" | "generating" | "timeline" | "preview";

interface FormData {
  title: string;
  recipientName: string;
  recipientAddress: string;
  senderName: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  letterType: "demand" | "notice" | "formal_request" | "complaint" | "other";
  additionalInstructions: string;
}

const timelineSteps = [
  {
    id: "submitted",
    title: "Request Submitted",
    description: "Your letter request has been received",
    icon: FileText,
    status: "completed" as const,
  },
  {
    id: "review",
    title: "Attorney Review",
    description: "Our legal team is reviewing your request",
    icon: User,
    status: "current" as const,
  },
  {
    id: "draft",
    title: "Draft Creation",
    description: "Professional letter being drafted",
    icon: FileText,
    status: "pending" as const,
  },
  {
    id: "ready",
    title: "Ready for Review",
    description: "Your letter is ready for preview and download",
    icon: CheckCircle,
    status: "pending" as const,
  },
];

export const LetterGenerationModal: React.FC<LetterGenerationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  letterToEdit,
  hasSubscription = false,
  onSubscribe = () => {},
}) => {
  const [currentStep, setCurrentStep] = useState<StepType>("form");
  const [formData, setFormData] = useState<FormData>({
    title: "",
    recipientName: "",
    recipientAddress: "",
    senderName: "",
    description: "",
    priority: "medium",
    letterType: "demand",
    additionalInstructions: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [savedLetterId, setSavedLetterId] = useState<string>("");

  useEffect(() => {
    if (letterToEdit) {
      setFormData({
        title: letterToEdit.title || "",
        recipientName: letterToEdit.recipientInfo?.name || "",
        recipientAddress: letterToEdit.recipientInfo?.address || "",
        senderName: letterToEdit.senderInfo?.name || "",
        description: letterToEdit.description || "",
        priority: letterToEdit.priority || "medium",
        letterType:
          (letterToEdit.letterType as
            | "demand"
            | "notice"
            | "formal_request"
            | "complaint"
            | "other") || "demand",
        additionalInstructions:
          letterToEdit.templateData?.additionalInstructions || "",
      });
    } else {
      // Reset form for new letter
      setFormData({
        title: "",
        recipientName: "",
        recipientAddress: "",
        senderName: "",
        description: "",
        priority: "medium",
        letterType: "demand",
        additionalInstructions: "",
      });
    }
    setCurrentStep("form");
    setErrors({});
  }, [letterToEdit, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.recipientName.trim())
      newErrors.recipientName = "Recipient name is required";
    if (!formData.recipientAddress.trim())
      newErrors.recipientAddress = "Recipient address is required";
    if (!formData.senderName.trim())
      newErrors.senderName = "Your name is required";
    if (!formData.description.trim())
      newErrors.description = "Letter description is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleNext = () => {
    if (currentStep === "form") {
      if (validateForm()) {
        setCurrentStep("timeline");
      }
    } else if (currentStep === "timeline") {
      setCurrentStep("preview");
    }
  };

  const handleBack = () => {
    if (currentStep === "preview") {
      setCurrentStep("timeline");
    } else if (currentStep === "timeline") {
      setCurrentStep("form");
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setCurrentStep("generating"); // Show generation timeline

    try {
      const letterData = {
        ...formData,
        id: letterToEdit?.id,
        userId: letterToEdit?.userId || "",
        status: letterToEdit ? letterToEdit.status : "draft",
        recipientInfo: {
          name: formData.recipientName,
          address: formData.recipientAddress,
        },
        senderInfo: {
          name: formData.senderName,
        },
        templateData: {
          additionalInstructions: formData.additionalInstructions,
        },
        createdAt: letterToEdit
          ? letterToEdit.createdAt
          : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save the letter and get the ID
      await onSubmit(letterData);

      // If it's a new letter, we'll get the ID from the response
      // For now, generate a temporary ID
      if (!letterToEdit?.id) {
        setSavedLetterId(crypto.randomUUID());
      } else {
        setSavedLetterId(letterToEdit.id);
      }

      // Don't close immediately - let GenerationTimeline handle it
    } catch (error) {
      setCurrentStep("form");
      setIsSubmitting(false);
    }
  };

  const handleGenerateLetter = async () => {
    try {
      // Import Z.AI service
      const { zaiService } = await import("../services/zaiService");

      // Call Z.AI API for letter generation
      const generatedLetter = await zaiService.generateLetter({
        title: formData.title,
        senderName: formData.senderName,
        recipientName: formData.recipientName,
        matter: formData.description,
        desiredResolution: formData.additionalInstructions || "Professional resolution",
        letterType: formData.letterType,
        priority: formData.priority,
      });

      setGeneratedContent(generatedLetter);
    } catch (error) {
      console.error("Error generating letter with Z.AI:", error);
      // Fallback to Supabase Edge Function if Z.AI fails
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-draft`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              letterId: savedLetterId,
              title: formData.title,
              letterRequest: {
                senderName: formData.senderName,
                recipientName: formData.recipientName,
                matter: formData.description,
                desiredResolution:
                  formData.additionalInstructions || "Professional resolution",
                letterType: formData.letterType,
                priority: formData.priority,
              },
            }),
          },
        );

        if (response.ok) {
          const data = await response.json();
          setGeneratedContent(
            data.draft || data.content || "Letter generated successfully!",
          );
        } else {
          // Final fallback to sample content
          setGeneratedContent(generateSampleLetter());
        }
      } catch (fallbackError) {
        console.error("Error with fallback generation:", fallbackError);
        setGeneratedContent(generateSampleLetter());
      }
    }
  };

  const generateSampleLetter = () => {
    return `[Date: ${new Date().toLocaleDateString()}]

${formData.senderName}
[Your Address]

${formData.recipientName}
${formData.recipientAddress}

Re: ${formData.title}

Dear ${formData.recipientName},

I am writing to address the matter of ${formData.description}.

${formData.additionalInstructions || "This letter serves as formal notification regarding the above-referenced matter. We request your immediate attention to this issue."}

We kindly request your prompt response to this matter within 14 business days of receipt of this letter.

Should you have any questions or wish to discuss this matter further, please do not hesitate to contact me at your earliest convenience.

Sincerely,

${formData.senderName}`;
  };

  const handleGenerationComplete = () => {
    if (hasSubscription) {
      // Show preview for subscribers
      setCurrentStep("preview");
    } else {
      // Close modal and dashboard will handle showing subscription
      onClose();
    }
    setIsSubmitting(false);
  };

  const priorityColors = {
    low: "bg-blue-100 text-blue-800",
    medium: "bg-green-100 text-green-800",
    high: "bg-orange-100 text-orange-800",
    urgent: "bg-red-100 text-red-800",
  };

  const letterTypeLabels = {
    demand: "Demand Letter",
    notice: "Legal Notice",
    formal_request: "Formal Request",
    complaint: "Complaint Letter",
    other: "Other",
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">
                {letterToEdit ? "Edit Letter Request" : "New Letter Request"}
              </h2>
              <p className="text-slate-300 text-sm">
                Professional legal correspondence made simple
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-700"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Step Indicator */}
          <div className="px-6 py-4 bg-slate-50 border-b">
            <div className="flex items-center justify-between">
              {[
                { id: "form", label: "Details", icon: FileText },
                { id: "timeline", label: "Process", icon: Clock },
                { id: "preview", label: "Review", icon: Eye },
              ].map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                      currentStep === step.id
                        ? "bg-blue-600 border-blue-600 text-white"
                        : index <
                            ["form", "timeline", "preview"].indexOf(currentStep)
                          ? "bg-green-600 border-green-600 text-white"
                          : "bg-white border-slate-300 text-slate-500"
                    }`}
                  >
                    <step.icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`ml-3 font-medium ${
                      currentStep === step.id
                        ? "text-blue-600"
                        : "text-slate-600"
                    }`}
                  >
                    {step.label}
                  </span>
                  {index < 2 && (
                    <div
                      className={`ml-6 w-16 h-0.5 ${
                        index <
                        ["form", "timeline", "preview"].indexOf(currentStep)
                          ? "bg-green-600"
                          : "bg-slate-300"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 overflow-y-auto max-h-[60vh]">
            <AnimatePresence mode="wait">
              {currentStep === "form" && (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Letter Title */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Letter Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        handleInputChange("title", e.target.value)
                      }
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        errors.title ? "border-red-500" : "border-slate-300"
                      }`}
                      placeholder="Brief description of your letter"
                      autoComplete="off"
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.title}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Letter Type */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Letter Type *
                      </label>
                      <select
                        value={formData.letterType}
                        onChange={(e) =>
                          handleInputChange("letterType", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {Object.entries(letterTypeLabels).map(
                          ([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ),
                        )}
                      </select>
                    </div>

                    {/* Priority */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Priority Level
                      </label>
                      <select
                        value={formData.priority}
                        onChange={(e) =>
                          handleInputChange("priority", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Sender Name */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        value={formData.senderName}
                        onChange={(e) =>
                          handleInputChange("senderName", e.target.value)
                        }
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          errors.senderName
                            ? "border-red-500"
                            : "border-slate-300"
                        }`}
                        placeholder="Your full name"
                        autoComplete="name"
                      />
                      {errors.senderName && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.senderName}
                        </p>
                      )}
                    </div>

                    {/* Recipient Name */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Recipient Name *
                      </label>
                      <input
                        type="text"
                        value={formData.recipientName}
                        onChange={(e) =>
                          handleInputChange("recipientName", e.target.value)
                        }
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          errors.recipientName
                            ? "border-red-500"
                            : "border-slate-300"
                        }`}
                        placeholder="Recipient's full name"
                        autoComplete="off"
                      />
                      {errors.recipientName && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.recipientName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Recipient Address */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Recipient Address *
                    </label>
                    <textarea
                      value={formData.recipientAddress}
                      onChange={(e) =>
                        handleInputChange("recipientAddress", e.target.value)
                      }
                      rows={3}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        errors.recipientAddress
                          ? "border-red-500"
                          : "border-slate-300"
                      }`}
                      placeholder="Complete mailing address"
                    />
                    {errors.recipientAddress && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.recipientAddress}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Letter Description *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        handleInputChange("description", e.target.value)
                      }
                      rows={5}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        errors.description
                          ? "border-red-500"
                          : "border-slate-300"
                      }`}
                      placeholder="Describe the purpose and key points of your letter..."
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.description}
                      </p>
                    )}
                  </div>

                  {/* Additional Instructions */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Additional Instructions
                    </label>
                    <textarea
                      value={formData.additionalInstructions}
                      onChange={(e) =>
                        handleInputChange(
                          "additionalInstructions",
                          e.target.value,
                        )
                      }
                      rows={3}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Any specific requirements or additional context..."
                    />
                  </div>
                </motion.div>
              )}

              {currentStep === "generating" && (
                <motion.div
                  key="generating"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <GenerationTimeline
                    onComplete={handleGenerationComplete}
                    hasSubscription={hasSubscription}
                    onSubscribe={() => {
                      onClose();
                      onSubscribe();
                    }}
                    onGenerateLetter={handleGenerateLetter}
                    generatedContent={generatedContent}
                  />
                </motion.div>
              )}

              {currentStep === "timeline" && (
                <motion.div
                  key="timeline"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">
                      Letter Processing Timeline
                    </h3>
                    <p className="text-slate-600">
                      Here's what happens after you submit your request
                    </p>
                  </div>

                  <div className="space-y-6">
                    {timelineSteps.map((step, index) => {
                      const Icon = step.icon;
                      return (
                        <div key={step.id} className="flex items-start">
                          <div
                            className={`flex items-center justify-center w-12 h-12 rounded-full mr-4 ${
                              step.status === "completed"
                                ? "bg-green-100 text-green-600"
                                : step.status === "current"
                                  ? "bg-blue-100 text-blue-600"
                                  : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            <Icon className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <h4
                              className={`font-semibold ${
                                step.status === "completed"
                                  ? "text-green-700"
                                  : step.status === "current"
                                    ? "text-blue-700"
                                    : "text-slate-500"
                              }`}
                            >
                              {step.title}
                            </h4>
                            <p className="text-slate-600 text-sm">
                              {step.description}
                            </p>
                            {step.status === "current" && (
                              <div className="mt-2">
                                <div className="flex items-center text-sm text-blue-600">
                                  <Clock className="w-4 h-4 mr-1" />
                                  Expected: 24-48 hours
                                </div>
                              </div>
                            )}
                          </div>
                          {step.status === "completed" && (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {currentStep === "preview" && (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">
                      Review Your Request
                    </h3>
                    <p className="text-slate-600">
                      Please review the details before submitting
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-slate-700 mb-1">
                          Letter Title
                        </h4>
                        <p className="text-slate-900">{formData.title}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-700 mb-1">
                          Type & Priority
                        </h4>
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-900">
                            {letterTypeLabels[formData.letterType]}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[formData.priority]}`}
                          >
                            {formData.priority.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-slate-700 mb-1">
                          From
                        </h4>
                        <p className="text-slate-900">{formData.senderName}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-700 mb-1">To</h4>
                        <p className="text-slate-900">
                          {formData.recipientName}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-slate-700 mb-1">
                        Address
                      </h4>
                      <p className="text-slate-900 whitespace-pre-line">
                        {formData.recipientAddress}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-slate-700 mb-1">
                        Description
                      </h4>
                      <p className="text-slate-900">{formData.description}</p>
                    </div>

                    {formData.additionalInstructions && (
                      <div>
                        <h4 className="font-medium text-slate-700 mb-1">
                          Additional Instructions
                        </h4>
                        <p className="text-slate-900">
                          {formData.additionalInstructions}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t flex items-center justify-between">
            <button
              onClick={currentStep === "form" ? onClose : handleBack}
              className="flex items-center px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {currentStep === "form" ? "Cancel" : "Back"}
            </button>

            <div className="flex items-center space-x-3">
              {currentStep !== "preview" ? (
                <button
                  onClick={handleNext}
                  className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      {letterToEdit ? "Update Letter" : "Submit Request"}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
