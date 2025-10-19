import jsPDF from "jspdf";
import type { LetterRequest } from "../types";

export const generateLetterPDF = (letter: LetterRequest): void => {
  const doc = new jsPDF();

  // Set up page margins
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const lineHeight = 7;
  let currentY = margin;

  // Extract information from letter
  const senderInfo = letter.senderInfo || {};
  const recipientInfo = letter.recipientInfo || {};
  const senderName = senderInfo.name || "Sender";
  const senderAddress = senderInfo.address || "Address not available";
  const recipientName = recipientInfo.name || "Recipient";
  const matter = letter.title || "Legal Letter";

  // Add letterhead - Attorney/Law Firm Name
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Legal Letter Service", margin, currentY);
  currentY += lineHeight + 3;

  // Add horizontal line
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += lineHeight;

  // Add date
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  const formattedDate = new Date(letter.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.text(`Date: ${formattedDate}`, margin, currentY);
  currentY += lineHeight + 3;

  // Add recipient info
  doc.text(`To: ${recipientName}`, margin, currentY);
  currentY += lineHeight;

  // Add subject/matter
  doc.setFont("helvetica", "bold");
  doc.text(`Re: ${matter}`, margin, currentY);
  currentY += lineHeight + 5;

  // Add letter body (AI-generated content)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  // Split text to fit page width
  const maxWidth = pageWidth - margin * 2;
  const letterContent =
    letter.aiGeneratedContent ||
    letter.finalContent ||
    "Letter content not available";
  const splitText = doc.splitTextToSize(letterContent, maxWidth);

  // Add text with page breaks if needed
  splitText.forEach((line: string) => {
    if (currentY > pageHeight - margin - 10) {
      doc.addPage();
      currentY = margin;
    }
    doc.text(line, margin, currentY);
    currentY += lineHeight;
  });

  // Add footer with sender info at the bottom of last page
  currentY += lineHeight * 2;
  if (currentY > pageHeight - margin - 30) {
    doc.addPage();
    currentY = margin;
  }

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Sincerely,", margin, currentY);
  currentY += lineHeight * 2;

  doc.setFont("helvetica", "bold");
  doc.text(senderName, margin, currentY);
  currentY += lineHeight;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const addressLines = doc.splitTextToSize(senderAddress, maxWidth);
  addressLines.forEach((line: string) => {
    doc.text(line, margin, currentY);
    currentY += lineHeight - 1;
  });

  // Download the PDF
  const filename = `letter-${recipientName.replace(/\s+/g, "-")}-${new Date().getTime()}.pdf`;
  doc.save(filename);
};

// Helper function to check if letter is ready for download
export const isLetterReadyForDownload = (letter: LetterRequest): boolean => {
  return (
    letter.status === "completed" &&
    (letter.aiGeneratedContent || letter.finalContent) &&
    (letter.aiGeneratedContent || letter.finalContent)!.length > 0
  );
};
