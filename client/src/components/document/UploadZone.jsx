import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { documentAPI } from "@/api/document.api";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { cn, formatFileSize } from "@/lib/utils";

const ACCEPTED = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [
    ".pptx",
  ],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
};

export default function UploadZone({ onClose }) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((accepted) => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024, // 20MB
    onDropRejected: (files) => {
      const err = files[0]?.errors[0];
      if (err?.code === "file-too-large") {
        toast.error("File must be under 20MB");
      } else {
        toast.error("Only PDF, PPTX, DOCX files are supported");
      }
    },
  });

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      await documentAPI.upload(file, setProgress);
      toast.success("File uploaded! Processing started.");
      queryClient.invalidateQueries(["documents"]);
      onClose?.();
    } catch (err) {
      // Backend ka exact error message show karo
      const msg =
        err.response?.data?.error || "Upload failed. Please try again.";
      toast.error(msg, { duration: 5000 });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all",
          isDragActive
            ? "border-violet-500 bg-violet-500/10"
            : "border-white/15 hover:border-violet-500/50 hover:bg-white/5",
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div
            className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
              isDragActive ? "bg-violet-600/30" : "bg-white/8",
            )}
          >
            <Upload
              className={cn(
                "w-6 h-6",
                isDragActive ? "text-violet-400" : "text-white/40",
              )}
            />
          </div>
          <div>
            <p className="text-white/80 text-sm font-medium mb-1">
              {isDragActive ? "Drop it here!" : "Drag & drop your file"}
            </p>
            <p className="text-white/30 text-xs">
              PDF, PPTX, DOCX — max 20MB — text-based only
            </p>
          </div>
          <button
            type="button"
            className="px-4 py-1.5 rounded-lg bg-violet-600/20 text-violet-300 text-xs border border-violet-500/20 hover:bg-violet-600/30 transition-all"
          >
            Browse files
          </button>
        </div>
      </div>

      {/* Selected file */}
      <AnimatePresence>
        {file && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3"
          >
            <div className="w-9 h-9 rounded-lg bg-violet-600/20 flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/80 text-sm font-medium truncate">
                {file.name}
              </p>
              <p className="text-white/30 text-xs">
                {formatFileSize(file.size)}
              </p>
              {uploading && (
                <div className="mt-1.5 h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-violet-500 rounded-full"
                    animate={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
            {!uploading && (
              <button
                onClick={() => setFile(null)}
                className="text-white/30 hover:text-white/60"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload button */}
      {file && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Uploading {progress}%
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" /> Upload Document
            </>
          )}
        </button>
      )}
    </div>
  );
}
