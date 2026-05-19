import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  FileText,
  Loader2,
  ChevronRight,
  Check,
  X,
  RotateCcw,
  BookOpen,
} from "lucide-react";
import PageWrapper from "@/components/layout/PageWrapper";
import { documentAPI } from "@/api/document.api";
import { quizAPI } from "@/api/quiz.api";
import { useQuizStore } from "@/store/quiz.store";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

// ── Quiz Setup ────────────────────────────────────────
function QuizSetup({ documents, onStart, loading }) {
  const { documentId } = useParams();
  const [selectedDoc, setSelectedDoc] = useState(
    documentId || documents[0]?._id || "",
  );
  const [difficulty, setDifficulty] = useState("mixed");
  const [count, setCount] = useState(10);

  const difficulties = [
    {
      value: "easy",
      label: "Easy",
      desc: "Factual questions",
      color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    },
    {
      value: "medium",
      label: "Medium",
      desc: "Conceptual questions",
      color: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
    },
    {
      value: "hard",
      label: "Hard",
      desc: "Application questions",
      color: "text-red-400 border-red-500/30 bg-red-500/10",
    },
    {
      value: "mixed",
      label: "Mixed",
      desc: "All difficulty levels",
      color: "text-violet-400 border-violet-500/30 bg-violet-500/10",
    },
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-white font-medium text-lg">Generate Quiz</h1>
          <p className="text-white/40 text-sm">
            Test your knowledge from your notes
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
            Select Document
          </label>
          <div className="grid gap-2">
            {documents.map((doc) => (
              <button
                key={doc._id}
                onClick={() => setSelectedDoc(doc._id)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                  selectedDoc === doc._id
                    ? "bg-violet-600/20 border-violet-500/30 text-violet-300"
                    : "bg-white/5 border-white/10 text-white/60 hover:bg-white/8",
                )}
              >
                <FileText className="w-4 h-4 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {doc.originalName}
                  </p>
                  <p className="text-xs opacity-50">
                    {doc.chunkCount} sections
                  </p>
                </div>
                {selectedDoc === doc._id && (
                  <Check className="w-4 h-4 ml-auto flex-shrink-0" />
                )}
              </button>
            ))}
            {documents.length === 0 && (
              <div className="text-center py-8 text-white/30 text-sm">
                No documents ready. Upload a document first.
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
            Difficulty
          </label>
          <div className="grid grid-cols-2 gap-2">
            {difficulties.map((d) => (
              <button
                key={d.value}
                onClick={() => setDifficulty(d.value)}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all",
                  difficulty === d.value
                    ? d.color
                    : "bg-white/5 border-white/10 text-white/50 hover:bg-white/8",
                )}
              >
                <p className="text-sm font-medium">{d.label}</p>
                <p className="text-xs opacity-60">{d.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
            Questions: <span className="text-white">{count}</span>
          </label>
          <input
            type="range"
            min={5}
            max={20}
            step={5}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-full accent-violet-500"
          />
          <div className="flex justify-between text-xs text-white/25 mt-1">
            <span>5</span>
            <span>10</span>
            <span>15</span>
            <span>20</span>
          </div>
        </div>

        <button
          onClick={() =>
            onStart({ documentId: selectedDoc, difficulty, count })
          }
          disabled={!selectedDoc || loading}
          className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Generating quiz...
            </>
          ) : (
            <>
              <Trophy className="w-4 h-4" /> Start Quiz
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Quiz Question ─────────────────────────────────────
function QuizQuestion({ questions, onSubmit }) {
  const { answers, currentQ, setAnswer, setCurrentQ } = useQuizStore();
  const [submitting, setSubmitting] = useState(false);

  const q = questions[currentQ];
  const totalQ = questions.length;
  const answered = Object.keys(answers).length;

  const handleSubmit = async () => {
    setSubmitting(true);
    const formatted = Object.entries(answers).map(([idx, ans]) => ({
      questionIndex: Number(idx),
      answer: ans,
    }));
    await onSubmit(formatted);
    setSubmitting(false);
  };

  if (!q) return null;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/40 text-xs">
            Question {currentQ + 1} of {totalQ}
          </span>
          <span className="text-white/40 text-xs">{answered} answered</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-violet-500 rounded-full"
            animate={{ width: `${((currentQ + 1) / totalQ) * 100}%` }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <div className="mb-3">
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full border",
                q.difficulty === "easy"
                  ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                  : q.difficulty === "medium"
                    ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
                    : q.difficulty === "hard"
                      ? "text-red-400 bg-red-500/10 border-red-500/20"
                      : "text-violet-400 bg-violet-500/10 border-violet-500/20",
              )}
            >
              {q.difficulty || "mixed"}
            </span>
          </div>

          <h2 className="text-white text-base font-medium leading-relaxed mb-5">
            {q.question}
          </h2>

          <div className="space-y-2.5 mb-6">
            {q.options.map((option, i) => {
              const selected = answers[currentQ] === i;
              const letter = ["A", "B", "C", "D"][i];
              return (
                <button
                  key={i}
                  onClick={() => setAnswer(currentQ, i)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all",
                    selected
                      ? "bg-violet-600/20 border-violet-500/40 text-white"
                      : "bg-white/5 border-white/8 text-white/60 hover:bg-white/8 hover:text-white/80",
                  )}
                >
                  <span
                    className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-medium flex-shrink-0",
                      selected
                        ? "bg-violet-600 text-white"
                        : "bg-white/10 text-white/50",
                    )}
                  >
                    {letter}
                  </span>
                  <span className="text-sm">{option}</span>
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
          disabled={currentQ === 0}
          className="px-4 py-2.5 rounded-xl bg-white/5 text-white/50 text-sm border border-white/10 hover:bg-white/10 disabled:opacity-30 transition-all"
        >
          Previous
        </button>

        {currentQ < totalQ - 1 ? (
          <button
            onClick={() => setCurrentQ(currentQ + 1)}
            className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-all flex items-center justify-center gap-2"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
              </>
            ) : (
              <>
                <Trophy className="w-4 h-4" /> Submit Quiz
              </>
            )}
          </button>
        )}
      </div>

      <div className="flex gap-1.5 justify-center mt-4 flex-wrap">
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentQ(i)}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              i === currentQ
                ? "bg-violet-500 scale-125"
                : answers[i] !== undefined
                  ? "bg-violet-500/40"
                  : "bg-white/20",
            )}
          />
        ))}
      </div>
    </div>
  );
}

// ── Quiz Result ───────────────────────────────────────
function QuizResult({ result, onRetry }) {
  const { score, correctAnswers, totalQuestions, passed, questions } = result;
  const [showReview, setShowReview] = useState(false);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center mb-8"
      >
        <div
          className={cn(
            "w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-4 text-3xl font-medium",
            passed
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-red-500/20 text-red-400",
          )}
        >
          {score}%
        </div>
        <h2
          className={cn(
            "text-xl font-medium mb-1",
            passed ? "text-emerald-400" : "text-red-400",
          )}
        >
          {passed ? "🎉 Well done!" : "📚 Keep studying!"}
        </h2>
        <p className="text-white/40 text-sm">
          {correctAnswers} out of {totalQuestions} correct
        </p>

        <div className="flex gap-3 justify-center mt-6">
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition-all"
          >
            <RotateCcw className="w-4 h-4" /> Try again
          </button>
          <button
            onClick={() => setShowReview(!showReview)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-300 text-sm hover:bg-violet-600/30 transition-all"
          >
            <BookOpen className="w-4 h-4" />
            {showReview ? "Hide review" : "Review answers"}
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showReview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            {questions.map((q, i) => (
              <div
                key={i}
                className={cn(
                  "p-4 rounded-xl border",
                  q.isCorrect
                    ? "bg-emerald-500/5 border-emerald-500/20"
                    : "bg-red-500/5 border-red-500/20",
                )}
              >
                <div className="flex items-start gap-2 mb-2">
                  {q.isCorrect ? (
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <p className="text-white/80 text-sm">{q.question}</p>
                </div>
                {!q.isCorrect && (
                  <div className="ml-6 space-y-1">
                    <p className="text-red-400 text-xs">
                      Your answer:{" "}
                      {q.userAnswer !== null
                        ? q.options[q.userAnswer]
                        : "Skipped"}
                    </p>
                    <p className="text-emerald-400 text-xs">
                      Correct: {q.options[q.correctAnswer]}
                    </p>
                  </div>
                )}
                <div className="ml-6 mt-2 p-2.5 bg-white/5 rounded-lg">
                  <p className="text-white/40 text-xs leading-relaxed">
                    {q.explanation}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────
export default function Quiz() {
  const queryClient = useQueryClient();
  const {
    stage,
    quizData,
    result,
    generating,
    setQuizData,
    setResult,
    setGenerating,
    reset,
  } = useQuizStore();

  const { data: docsData } = useQuery({
    queryKey: ["documents"],
    queryFn: () => documentAPI.getAll().then((r) => r.data),
  });

  const readyDocs =
    docsData?.documents?.filter((d) => d.status === "ready") || [];

  const handleStart = async ({ documentId, difficulty, count }) => {
    if (!documentId) {
      toast.error("Please select a document");
      return;
    }

    setGenerating(true); // ← store mein
    try {
      const { data } = await quizAPI.generate(documentId, difficulty, count);
      setQuizData(data); // ← automatically generating: false set hoga
    } catch (err) {
      toast.error(
        err.response?.data?.error ||
          "Failed to generate quiz. Please try again.",
      );
      setGenerating(false); // ← error pe bhi reset
    }
  };

  const handleSubmit = async (answers) => {
    try {
      const { data } = await quizAPI.submit(quizData.quizId, answers);
      setResult(data);
      // Dashboard stats update karo
      queryClient.invalidateQueries(["quiz-history"]);
    } catch {
      toast.error("Failed to submit quiz");
    }
  };

  return (
    <PageWrapper>
      <div className="min-h-screen py-6">
        <AnimatePresence mode="wait">
          {/* Setup Screen */}
          {stage === "setup" && !generating && (
            <motion.div
              key="setup"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <QuizSetup
                documents={readyDocs}
                onStart={handleStart}
                loading={generating}
              />
            </motion.div>
          )}

          {/* Quiz Generating Screen */}
          {stage === "setup" && generating && (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 max-w-2xl mx-auto"
            >
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-violet-600/20 flex items-center justify-center mx-auto mb-6">
                  <Trophy className="w-8 h-8 text-violet-400" />
                </div>

                <h2 className="text-white font-medium text-lg mb-2">
                  Generating Quiz
                </h2>

                <p className="text-white/40 text-sm mb-8">
                  AI is creating questions from your notes...
                </p>

                {/* Steps */}
                <div className="max-w-xs mx-auto space-y-3 text-left">
                  {[
                    "Reading your document",
                    "Identifying key concepts",
                    "Creating MCQ questions",
                    "Adding explanations",
                  ].map((step, i) => (
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.8 }}
                      className="flex items-center gap-3"
                    >
                      <motion.div
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: i * 0.3,
                        }}
                        className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0"
                      />

                      <span className="text-white/50 text-sm">{step}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          {stage === "quiz" && quizData && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <QuizQuestion
                questions={quizData.questions}
                onSubmit={handleSubmit}
              />
            </motion.div>
          )}
          {stage === "result" && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <QuizResult result={result} onRetry={reset} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  );
}
