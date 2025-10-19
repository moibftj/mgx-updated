"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  TooltipProvider,
  TooltipEnhanced,
  TooltipTrigger,
  TooltipContent,
} from "./ui/tooltip-enhanced";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { cn } from "../lib/utils";
import { useState } from "react";
import {
  Eye,
  Edit,
  Trash2,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Download,
} from "lucide-react";
import { ShimmerButton } from "./magicui/shimmer-button";
import type { LetterRequest } from "../types";
import { STATUS_STYLES, getTemplateLabel, IconSpinner } from "../constants";
import { StatusTimelineCompact } from "./StatusTimeline";
import { PreviewModal } from "./PreviewModal";
import {
  generateLetterPDF,
  isLetterReadyForDownload,
} from "../services/pdfService";

interface LettersTableProps {
  letters: LetterRequest[];
  onNewLetterClick: () => void;
  onEditLetterClick: (letter: LetterRequest) => void;
  onDeleteLetter: (id: string) => void;
  isDeletingId: string | null;
  isLoading?: boolean;
  onStatusUpdate?: (letterId: string, newStatus: string) => void;
}

const allColumns = [
  "Title",
  "Template",
  "Status",
  "Progress",
  "Created",
  "Updated",
  "Actions",
] as const;

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case "pending":
      return <Clock className="w-4 h-4 text-yellow-500" />;
    case "failed":
      return <XCircle className="w-4 h-4 text-red-500" />;
    default:
      return <Clock className="w-4 h-4 text-gray-500" />;
  }
};

const LettersTableSkeleton = () => (
  <div className="container my-4 space-y-4 p-6 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 shadow-sm">
    <div className="animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-48"></div>
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg w-32"></div>
      </div>
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 py-4">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export function LettersTable({
  letters,
  onNewLetterClick,
  onEditLetterClick,
  onDeleteLetter,
  isDeletingId,
  isLoading = false,
  onStatusUpdate,
}: LettersTableProps) {
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    ...allColumns,
  ]);
  const [statusFilter, setStatusFilter] = useState("");
  const [titleFilter, setTitleFilter] = useState("");
  const [previewLetter, setPreviewLetter] = useState<LetterRequest | null>(
    null,
  );

  if (isLoading) {
    return <LettersTableSkeleton />;
  }

  const filteredData = letters.filter((letter) => {
    return (
      (!statusFilter || letter.status === statusFilter) &&
      (!titleFilter ||
        letter.title.toLowerCase().includes(titleFilter.toLowerCase()))
    );
  });

  const toggleColumn = (col: string) => {
    setVisibleColumns((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col],
    );
  };

  return (
    <div className="container my-4 space-y-4 p-6 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 shadow-sm overflow-x-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            My Letter Requests
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage your AI-generated legal letters
          </p>
        </div>

        <ShimmerButton onClick={onNewLetterClick} className="h-10 px-4">
          <span className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            New Letter
          </span>
        </ShimmerButton>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
        <div className="flex gap-2 flex-wrap">
          <Input
            placeholder="Search letters..."
            value={titleFilter}
            onChange={(e) => setTitleFilter(e.target.value)}
            className="w-48"
          />
          <Input
            placeholder="Filter by status..."
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-48"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48">
            {allColumns.map((col) => (
              <DropdownMenuCheckboxItem
                key={col}
                checked={visibleColumns.includes(col)}
                onCheckedChange={() => toggleColumn(col)}
              >
                {col}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <Table className="w-full">
        <TableHeader>
          <TableRow>
            {visibleColumns.includes("Title") && (
              <TableHead className="w-[200px]">Letter Title</TableHead>
            )}
            {visibleColumns.includes("Template") && (
              <TableHead className="w-[180px]">Template Type</TableHead>
            )}
            {visibleColumns.includes("Status") && (
              <TableHead className="w-[120px]">Status</TableHead>
            )}
            {visibleColumns.includes("Progress") && (
              <TableHead className="w-[200px]">Progress</TableHead>
            )}
            {visibleColumns.includes("Created") && (
              <TableHead className="w-[120px]">Created</TableHead>
            )}
            {visibleColumns.includes("Updated") && (
              <TableHead className="w-[120px]">Updated</TableHead>
            )}
            {visibleColumns.includes("Actions") && (
              <TableHead className="w-[150px]">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.length ? (
            filteredData.map((letter) => {
              const style = STATUS_STYLES[letter.status];
              return (
                <TableRow
                  key={letter.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  {visibleColumns.includes("Title") && (
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span
                          className="truncate max-w-[150px]"
                          title={letter.title}
                        >
                          {letter.title}
                        </span>
                      </div>
                    </TableCell>
                  )}

                  {visibleColumns.includes("Template") && (
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                      {getTemplateLabel(letter.letterType)}
                    </TableCell>
                  )}

                  {visibleColumns.includes("Status") && (
                    <TableCell>
                      <Badge
                        className={cn(
                          "flex items-center gap-1.5",
                          style.bg,
                          style.text,
                        )}
                      >
                        {getStatusIcon(letter.status)}
                        <span className="capitalize">
                          {letter.status.replace("_", " ")}
                        </span>
                      </Badge>
                    </TableCell>
                  )}

                  {visibleColumns.includes("Progress") && (
                    <TableCell>
                      <StatusTimelineCompact
                        currentStatus={letter.status}
                        className="max-w-[180px]"
                      />
                    </TableCell>
                  )}

                  {visibleColumns.includes("Created") && (
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(letter.createdAt).toLocaleDateString()}
                    </TableCell>
                  )}

                  {visibleColumns.includes("Updated") && (
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(letter.updatedAt).toLocaleDateString()}
                    </TableCell>
                  )}

                  {visibleColumns.includes("Actions") && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {isLetterReadyForDownload(letter) && (
                          <TooltipProvider>
                            <TooltipEnhanced>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => generateLetterPDF(letter)}
                                  disabled={isDeletingId === letter.id}
                                  className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Download PDF</p>
                              </TooltipContent>
                            </TooltipEnhanced>
                          </TooltipProvider>
                        )}

                        {(letter.status === "approved" ||
                          letter.status === "completed") &&
                          letter.aiGeneratedContent && (
                            <TooltipProvider>
                              <TooltipEnhanced>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setPreviewLetter(letter)}
                                    disabled={isDeletingId === letter.id}
                                    className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Preview Letter</p>
                                </TooltipContent>
                              </TooltipEnhanced>
                            </TooltipProvider>
                          )}

                        <TooltipProvider>
                          <TooltipEnhanced>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEditLetterClick(letter)}
                                disabled={isDeletingId === letter.id}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit Letter</p>
                            </TooltipContent>
                          </TooltipEnhanced>
                        </TooltipProvider>

                        <TooltipProvider>
                          <TooltipEnhanced>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDeleteLetter(letter.id)}
                                disabled={isDeletingId === letter.id}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                {isDeletingId === letter.id ? (
                                  <IconSpinner className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Delete Letter</p>
                            </TooltipContent>
                          </TooltipEnhanced>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell
                colSpan={visibleColumns.length}
                className="text-center py-12"
              >
                <div className="flex flex-col items-center gap-4">
                  <FileText className="h-12 w-12 text-gray-400" />
                  <div>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">
                      No letters found
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {titleFilter || statusFilter
                        ? "Try adjusting your filters or search terms."
                        : "Create your first AI-generated legal letter to get started."}
                    </p>
                  </div>
                  {!titleFilter && !statusFilter && (
                    <ShimmerButton onClick={onNewLetterClick} className="mt-2">
                      <span className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Create First Letter
                      </span>
                    </ShimmerButton>
                  )}
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Stats */}
      {letters.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 pt-4 border-t border-slate-200 dark:border-slate-700">
          <span>
            Showing {filteredData.length} of {letters.length} letters
          </span>
          <div className="flex gap-4">
            <span>
              Completed:{" "}
              {letters.filter((l) => l.status === "completed").length}
            </span>
            <span>
              In Review:{" "}
              {letters.filter((l) => l.status === "in_review").length}
            </span>
            <span>
              Submitted:{" "}
              {letters.filter((l) => l.status === "submitted").length}
            </span>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewLetter && (
        <PreviewModal
          isOpen={true}
          onClose={() => setPreviewLetter(null)}
          letter={previewLetter}
          onStatusUpdate={(newStatus) => {
            if (onStatusUpdate) {
              onStatusUpdate(previewLetter.id, newStatus);
            }
            setPreviewLetter(null);
          }}
        />
      )}
    </div>
  );
}
