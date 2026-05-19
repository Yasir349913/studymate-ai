import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";

const steps = [
  { id: "upload", label: "File uploaded" },
  { id: "extract", label: "Extracting text" },
  { id: "chunking", label: "Splitting into sections" },
  { id: "embedding", label: "Creating AI index" },
  { id: "summary", label: "Generating summary" },
  { id: "ready", label: "Ready to study" },
];

export default function ProcessingTimeline({ status }) {
  // Status ke hisaab se step determine karo
  const currentStep =
    status === "uploaded"
      ? 1
      : status === "processing"
        ? 3
        : status === "ready"
          ? 6
          : status === "failed"
            ? -1
            : 0;

  return (
    <div className="space-y-2 py-2">
      {steps.map((step, i) => {
        const stepNum = i + 1;
        const done = stepNum < currentStep;
        const active = stepNum === currentStep;
        const pending = stepNum > currentStep;

        return (
          <div key={step.id} className="flex items-center gap-3">
            {/* Indicator */}
            <div
              className={`
              w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs
              ${done ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : ""}
              ${active ? "bg-violet-500/20 text-violet-400 border border-violet-500/30" : ""}
              ${pending ? "bg-white/5 text-white/20 border border-white/10" : ""}
            `}
            >
              {done && <Check className="w-3 h-3" />}
              {active && <Loader2 className="w-3 h-3 animate-spin" />}
              {pending && (
                <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
              )}
            </div>

            {/* Label */}
            <span
              className={`text-xs ${
                done
                  ? "text-white/50"
                  : active
                    ? "text-white/80"
                    : "text-white/20"
              }`}
            >
              {step.label}
            </span>

            {/* Active pulse */}
            {active && (
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-violet-400 ml-auto"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
