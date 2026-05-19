import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { documentAPI } from "@/api/document.api";
import toast from "react-hot-toast";

export function useDocumentStatus(documents) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const processingDocs = documents.filter(
      (d) => d.status === "processing" || d.status === "uploaded",
    );

    if (processingDocs.length === 0) return;

    const intervals = processingDocs.map((doc) => {
      return setInterval(async () => {
        try {
          const { data } = await documentAPI.getStatus(doc._id);

          if (data.status !== doc.status) {
            queryClient.invalidateQueries(["documents"]);

            if (data.status === "ready") {
              toast.success(`"${doc.originalName}" is ready!`);
            }

            // ← YEH ADD KIYA
            if (data.status === "failed") {
              toast.error(
                data.errorMessage || `Failed to process "${doc.originalName}"`,
                { duration: 6000 },
              );
            }
          }
        } catch {
          // Ignore errors — polling continue karo
        }
      }, 2000);
    });

    return () => intervals.forEach(clearInterval);
  }, [documents.map((d) => d._id + d.status).join(",")]);
}
