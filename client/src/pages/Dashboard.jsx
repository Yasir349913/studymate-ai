import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Upload,
  FileText,
  X,
  Trophy,
  MessageSquare,
  CreditCard,
} from "lucide-react";
import PageWrapper from "@/components/layout/PageWrapper";
import DocumentCard from "@/components/document/DocumentCard";
import DocumentSkeleton from "@/components/document/DocumentSkeleton";
import UploadZone from "@/components/document/UploadZone";
import { documentAPI } from "@/api/document.api";
import { useAuthStore } from "@/store/auth.store";
import { useDocumentStatus } from "@/hooks/useDocumentStatus";
import { chatAPI } from "@/api/chat.api";
import { quizAPI } from "@/api/quiz.api";
import toast from "react-hot-toast";
import { Sparkles } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuthStore();
  const [showUpload, setShowUpload] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: () => documentAPI.getAll().then((r) => r.data),
  });

  const documents = data?.documents || [];

  const { data: chatsData } = useQuery({
    queryKey: ["chats"],
    queryFn: () => chatAPI.getAll().then((r) => r.data),
  });

  const { data: quizData } = useQuery({
    queryKey: ["quiz-history"],
    queryFn: () => quizAPI.getHistory().then((r) => r.data),
  });

  const chats = chatsData?.chats || [];
  const quizCount = quizData?.quizzes?.length || 0;

  // Real-time status polling
  useDocumentStatus(documents);

  const readyDocs = documents.filter((d) => d.status === "ready");

  const stats = [
    {
      label: "Documents",
      value: documents.length,
      icon: FileText,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      label: "Ready",
      value: readyDocs.length,
      icon: Trophy,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Chats",
      value: chats.length,
      icon: MessageSquare,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Quizzes",
      value: quizCount,
      icon: CreditCard,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
    },
  ];
  return (
    <PageWrapper>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-medium text-white">
                Good{" "}
                {new Date().getHours() < 12
                  ? "morning"
                  : new Date().getHours() < 17
                    ? "afternoon"
                    : "evening"}
                ,{" "}
                <span className="text-violet-400">
                  {user?.name?.split(" ")[0]}
                </span>
              </h1>

              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-violet-600/15 border border-violet-500/20">
                <Sparkles className="w-3.5 h-3.5 text-violet-300" />
              </div>
            </div>

            <p className="text-white/40 text-sm">
              Upload your notes and start studying smarter
            </p>
          </div>

          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-all"
          >
            <Upload className="w-4 h-4" />
            Upload Document
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {stats.map(({ label, value, icon: Icon, color, bg }) => (
            <div
              key={label}
              className="bg-white/5 border border-white/8 rounded-2xl p-4"
            >
              <div
                className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-3`}
              >
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className="text-2xl font-medium text-white mb-0.5">{value}</p>
              <p className="text-white/30 text-xs">{label}</p>
            </div>
          ))}
        </div>

        {/* Documents */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-white/80 text-sm font-medium">Your Documents</h2>
          {documents.length > 0 && (
            <span className="text-white/30 text-xs">
              {documents.length} total
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <DocumentSkeleton key={i} />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-white/20" />
            </div>
            <h3 className="text-white/60 font-medium mb-2">No documents yet</h3>
            <p className="text-white/25 text-sm mb-6 max-w-sm">
              Upload your first PDF, PPTX, or DOCX to start chatting, quizzing,
              and reviewing with AI
            </p>
            <button
              onClick={() => setShowUpload(true)}
              className="px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-all flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload your first document
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {documents.map((doc) => (
                <DocumentCard key={doc._id} doc={doc} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) =>
              e.target === e.currentTarget && setShowUpload(false)
            }
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="bg-[#111118] border border-white/10 rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-white font-medium">Upload Document</h2>
                <button
                  onClick={() => setShowUpload(false)}
                  className="text-white/30 hover:text-white/60"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <UploadZone onClose={() => setShowUpload(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
