import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./Card";
import { ShimmerButton } from "./magicui/shimmer-button";
import { IconSpinner } from "../constants";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isConfirming: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isConfirming,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full max-w-md p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="shadow-2xl">
              <CardHeader>
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {message}
                </p>
              </CardContent>
              <CardFooter className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  disabled={isConfirming}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  {cancelText}
                </button>
                <ShimmerButton
                  onClick={onConfirm}
                  disabled={isConfirming}
                  className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                >
                  {isConfirming ? (
                    <span className="flex items-center gap-2">
                      <IconSpinner className="w-4 h-4 animate-spin" />
                      Deleting...
                    </span>
                  ) : (
                    confirmText
                  )}
                </ShimmerButton>
              </CardFooter>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
