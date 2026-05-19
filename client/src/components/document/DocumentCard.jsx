import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ProcessingTimeline from "@/components/document/ProcessingTimeline";
import { motion } from "framer-motion";
import {
  FileText,
  MessageSquare,
  Trophy,
  CreditCard,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { documentAPI } from "@/api/document.api";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { cn, formatFileSize, formatDate, truncate } from "@/lib/utils";

const statusConfig = {
  uploaded: {
    label: "Uploaded",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    icon: Clock,
  },
  processing: {
    label: "Processing",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    icon: Loader2,
  },
  ready: {
    label: "Ready",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    icon: CheckCircle,
  },
  failed: {
    label: "Failed",
    color: "text-red-400",
    bg: "bg-red-500/10",
    icon: AlertCircle,
  },
};

const typeConfig = {
  pdf: { label: "PDF", color: "text-red-400", bg: "bg-red-500/10" },
  pptx: { label: "PPTX", color: "text-orange-400", bg: "bg-orange-500/10" },
  docx: { label: "DOCX", color: "text-blue-400", bg: "bg-blue-500/10" },
};

export default function DocumentCard({ doc }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [deleting, setDeleting] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const status = statusConfig[doc.status] || statusConfig.uploaded;
  const type = typeConfig[doc.fileType] || typeConfig.pdf;

  const StatusIcon = status.icon;
  const isReady = doc.status === "ready";

  const handleDelete = async () => {
    setDeleting(true);

    try {
      await documentAPI.delete(doc._id);

      toast.success("Document deleted");

      queryClient.invalidateQueries(["documents"]);
    } catch {
      toast.error("Failed to delete");
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 border border-white/8 rounded-2xl p-5 hover:border-white/15 transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
              type.bg,
            )}
          >
            <FileText className={cn("w-5 h-5", type.color)} />
          </div>

          <div className="min-w-0">
            <p
              className="text-white/90 text-sm font-medium truncate"
              title={doc.originalName}
            >
              {truncate(doc.originalName, 30)}
            </p>

            <p className="text-white/30 text-xs mt-0.5">
              {formatFileSize(doc.fileSize)} · {formatDate(doc.createdAt)}
            </p>
          </div>
        </div>

        {/* Status badge */}
        <div
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0",
            status.bg,
            status.color,
          )}
        >
          <StatusIcon
            className={cn(
              "w-3 h-3",
              doc.status === "processing" && "animate-spin",
            )}
          />

          {status.label}
        </div>
      </div>

      {/* Processing Timeline */}
      {(doc.status === "processing" || doc.status === "uploaded") && (
        <div className="mb-3 p-3 bg-white/3 rounded-xl border border-white/8">
          <ProcessingTimeline status={doc.status} />
        </div>
      )}

      {/* Chunk count */}
      {isReady && doc.chunkCount > 0 && (
        <p className="text-white/25 text-xs mb-3">
          {doc.chunkCount} sections indexed
        </p>
      )}

      {/* Summary toggle */}
      {isReady && doc.summary && (
        <div className="mb-3">
          <button
            onClick={() => setShowSummary(!showSummary)}
            className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            {showSummary ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
            {showSummary ? "Hide summary" : "View AI summary"}
          </button>

          {showSummary && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-2 p-3 bg-violet-500/5 rounded-xl border border-violet-500/15"
            >
              {/* Summary ko sections mein parse karo */}
              <div className="space-y-2">
                {doc.summary
                  .split("\n")
                  .filter(Boolean)
                  .map((line, i) => {
                    // Numbered points detect karo
                    const isPoint =
                      /^\d+\./.test(line) ||
                      line.startsWith("•") ||
                      line.startsWith("-");
                    const isHeader = line.includes(":") && line.length < 40;

                    return (
                      <div
                        key={i}
                        className={`
                text-xs leading-relaxed
                ${isHeader ? "text-white/70 font-medium" : ""}
                ${isPoint ? "text-white/50 flex gap-2" : ""}
                ${!isHeader && !isPoint ? "text-white/40" : ""}
              `}
                      >
                        {isPoint && (
                          <span className="text-violet-400 flex-shrink-0">
                            •
                          </span>
                        )}
                        <span>{line.replace(/^[\d\.\-\•]\s*/, "")}</span>
                      </div>
                    );
                  })}
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => navigate(`/chat?doc=${doc._id}`)}
          disabled={!isReady}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all",
            isReady
              ? "bg-violet-600/20 text-violet-300 border border-violet-500/20 hover:bg-violet-600/30"
              : "bg-white/5 text-white/20 cursor-not-allowed border border-white/5",
          )}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Chat
        </button>

        <button
          onClick={() => navigate(`/quiz/${doc._id}`)}
          disabled={!isReady}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all",
            isReady
              ? "bg-emerald-600/20 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-600/30"
              : "bg-white/5 text-white/20 cursor-not-allowed border border-white/5",
          )}
        >
          <Trophy className="w-3.5 h-3.5" />
          Quiz
        </button>

        <button
          onClick={() => navigate(`/flashcards/${doc._id}`)}
          disabled={!isReady}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all",
            isReady
              ? "bg-blue-600/20 text-blue-300 border border-blue-500/20 hover:bg-blue-600/30"
              : "bg-white/5 text-white/20 cursor-not-allowed border border-white/5",
          )}
        >
          <CreditCard className="w-3.5 h-3.5" />
          Cards
        </button>

        <button
          onClick={() => setShowDeleteDialog(true)}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        {/* Delete Dialog */}
        <ConfirmDialog
          open={showDeleteDialog}
          title="Delete Document"
          message={`"${doc.originalName}" and all related chats, quizzes, and flashcards will be deleted. This action cannot be undone.`}
          confirmLabel="Delete"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteDialog(false)}
        />
      </div>
    </motion.div>
  );
}
