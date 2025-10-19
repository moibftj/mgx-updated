import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  content: string;
  title?: string;
}

function PreviewModal({
  isOpen,
  onClose,
  onSubmit,
  content,
  title = "Preview Document",
}: PreviewModalProps) {
  const [isModalOpen, setIsModalOpen] = useState(isOpen);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsModalOpen(isOpen);
  }, [isOpen]);

  // Close modal handler
  const handleClose = () => {
    setIsModalOpen(false);
    onClose();
  };

  // Submit handler
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit();
      handleClose();
    } catch (error) {
      console.error("Error submitting document:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stop propagation on modal content click
  const handleModalContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (!isModalOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-xl flex flex-col"
        onClick={handleModalContentClick}
      >
        {/* Modal header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
          <button
            onClick={handleClose}
            aria-label="Close preview modal"
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
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
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        {/* Modal content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div
            className="prose prose-blue max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>

        {/* Modal footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <Button
            onClick={handleClose}
            variant="outline"
            className="bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {isSubmitting ? "Processing..." : "Submit"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export { PreviewModal };
export default PreviewModal;
