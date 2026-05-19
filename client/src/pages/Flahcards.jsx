import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  FileText,
  Loader2,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Check,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import PageWrapper from "@/components/layout/PageWrapper";
import { documentAPI } from "@/api/document.api";
import { flashcardAPI } from "@/api/flashcard.api";
import { useFlashcardStore } from "@/store/flashcard.store";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

function FlashCard({ card, index, onGotIt, onReview }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative w-full max-w-md h-52 cursor-pointer"
        onClick={() => setFlipped(!flipped)}
        style={{ perspective: "1000px" }}
      >
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          style={{ transformStyle: "preserve-3d" }}
          className="relative w-full h-full"
        >
          <div
            className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-white/5 border border-white/10 rounded-2xl"
            style={{ backfaceVisibility: "hidden" }}
          >
            <p className="text-white/30 text-xs mb-3 uppercase tracking-wider">
              Term
            </p>
            <p className="text-white text-lg font-medium text-center leading-relaxed">
              {card.term}
            </p>
            <p className="text-white/25 text-xs mt-4">Click to reveal</p>
          </div>
          <div
            className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-violet-600/10 border border-violet-500/20 rounded-2xl"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <p className="text-violet-400/60 text-xs mb-3 uppercase tracking-wider">
              Definition
            </p>
            <p className="text-white/80 text-sm text-center leading-relaxed">
              {card.definition}
            </p>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {flipped && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="flex gap-3 mt-4"
          >
            <button
              onClick={() => {
                setFlipped(false);
                onReview(index);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-sm hover:bg-red-500/20 transition-all"
            >
              <ThumbsDown className="w-4 h-4" /> Review again
            </button>
            <button
              onClick={() => {
                setFlipped(false);
                onGotIt(index);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm hover:bg-emerald-500/20 transition-all"
            >
              <ThumbsUp className="w-4 h-4" /> Got it!
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Flashcards() {
  // ── Sab kuch store se — tab change pe persist rahega ──
  const {
    selectedDoc,
    flashcardSet,
    currentIndex,
    loading, // ← Store se
    setLoading, // ← Store se
    setGeneratingFor, // ← Store se
    setSelectedDoc,
    setFlashcardSet,
    setCurrentIndex,
    updateCard,
    resetCards,
    clear,
  } = useFlashcardStore();

  const [regenerating, setRegenerating] = useState(false);

  const { data: docsData } = useQuery({
    queryKey: ["documents"],
    queryFn: () => documentAPI.getAll().then((r) => r.data),
  });

  const readyDocs =
    docsData?.documents?.filter((d) => d.status === "ready") || [];

  const handleSelectDoc = async (doc) => {
    // Pehle clear karo — multiple doc issue fix
    clear();

    // Store mein loading set karo — tab change pe bhi dikhega
    setSelectedDoc(doc);
    setLoading(true);
    setGeneratingFor(doc._id);

    try {
      const { data } = await flashcardAPI.generate(doc._id);
      setFlashcardSet(data); // ← Ye automatically loading: false karta hai
    } catch {
      toast.error("Failed to generate flashcards. Please try again.");
      clear();
    }
  };

  const handleGotIt = async (cardIndex) => {
    try {
      const { data } = await flashcardAPI.updateCard(
        flashcardSet.flashcardId,
        cardIndex,
        "learned",
      );
      updateCard(cardIndex, "learned", data.learnedCards);
      if (currentIndex < flashcardSet.cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    } catch {
      toast.error("Failed to update card");
    }
  };

  const handleReview = async (cardIndex) => {
    try {
      await flashcardAPI.updateCard(
        flashcardSet.flashcardId,
        cardIndex,
        "learning",
      );
      updateCard(cardIndex, "learning", flashcardSet.learnedCards);
      if (currentIndex < flashcardSet.cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    } catch {
      toast.error("Failed to update card");
    }
  };

  const handleRegenerate = async () => {
    if (!selectedDoc) return;
    setRegenerating(true);
    try {
      const { data } = await flashcardAPI.regenerate(selectedDoc._id);
      setFlashcardSet(data);
      toast.success("Flashcards regenerated!");
    } catch {
      toast.error("Failed to regenerate. Please try again.");
    } finally {
      setRegenerating(false);
    }
  };

  const handleReset = async () => {
    try {
      await flashcardAPI.reset(flashcardSet.flashcardId);
      resetCards(flashcardSet.cards.map((c) => ({ ...c, status: "new" })));
      toast.success("Flashcards reset!");
    } catch {
      toast.error("Failed to reset");
    }
  };

  const progress = flashcardSet
    ? Math.round((flashcardSet.learnedCards / flashcardSet.totalCards) * 100)
    : 0;
  const allLearned =
    flashcardSet && flashcardSet.learnedCards === flashcardSet.totalCards;

  // ── Render Logic ─────────────────────────────────────
  // Loading state — store se aata hai, tab change pe bhi dikhega
  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-violet-400 mx-auto mb-3" />
            <p className="text-white/40 text-sm">Generating flashcards...</p>
            <p className="text-white/20 text-xs mt-1">
              Please wait — this may take a moment
            </p>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="min-h-screen py-6">
        {/* Doc Selector */}
        {!selectedDoc && !flashcardSet ? (
          <div className="p-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h1 className="text-white font-medium text-lg">Flashcards</h1>
                <p className="text-white/40 text-sm">
                  Review key terms from your notes
                </p>
              </div>
            </div>

            <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
              Select Document
            </label>
            <div className="grid gap-2">
              {readyDocs.map((doc) => (
                <button
                  key={doc._id}
                  onClick={() => handleSelectDoc(doc)}
                  className="flex items-center gap-3 p-4 rounded-xl border bg-white/5 border-white/10 text-white/60 hover:bg-white/8 hover:border-white/20 text-left transition-all"
                >
                  <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white/80 truncate">
                      {doc.originalName}
                    </p>
                    <p className="text-xs text-white/30">
                      {doc.chunkCount} sections
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 ml-auto opacity-30" />
                </button>
              ))}
              {readyDocs.length === 0 && (
                <div className="text-center py-8 text-white/30 text-sm">
                  No documents ready. Upload a document first.
                </div>
              )}
            </div>
          </div>
        ) : flashcardSet ? (
          <div className="p-6 max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <button
                  onClick={clear}
                  className="text-white/30 text-xs hover:text-white/60 mb-1 transition-colors"
                >
                  ← Back
                </button>
                <h2 className="text-white font-medium text-base">
                  {selectedDoc?.originalName}
                </h2>
                <p className="text-white/30 text-xs">
                  {flashcardSet.learnedCards}/{flashcardSet.totalCards} learned
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  className="p-2 rounded-xl bg-white/5 text-white/40 border border-white/10 hover:bg-white/10 transition-all"
                  title="Reset"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  className="p-2 rounded-xl bg-white/5 text-white/40 border border-white/10 hover:bg-white/10 transition-all"
                  title="Regenerate"
                >
                  {regenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Progress */}
            <div className="mb-6">
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-emerald-500 rounded-full"
                  animate={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-white/25 mt-1">
                <span>Progress: {progress}%</span>
                <span>
                  {flashcardSet.totalCards - flashcardSet.learnedCards}{" "}
                  remaining
                </span>
              </div>
            </div>

            {allLearned ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-white text-lg font-medium mb-2">
                  All cards learned! 🎉
                </h3>
                <p className="text-white/40 text-sm mb-6">
                  You've mastered all {flashcardSet.totalCards} flashcards.
                </p>
                <button
                  onClick={handleReset}
                  className="px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-all"
                >
                  Review again
                </button>
              </motion.div>
            ) : (
              <>
                <div className="flex gap-1 justify-center mb-6 flex-wrap">
                  {flashcardSet.cards.map((card, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentIndex(i)}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all",
                        i === currentIndex
                          ? "bg-violet-500 scale-125"
                          : card.status === "learned"
                            ? "bg-emerald-500/60"
                            : card.status === "learning"
                              ? "bg-yellow-500/60"
                              : "bg-white/20",
                      )}
                    />
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FlashCard
                      card={flashcardSet.cards[currentIndex]}
                      index={currentIndex}
                      onGotIt={handleGotIt}
                      onReview={handleReview}
                    />
                  </motion.div>
                </AnimatePresence>

                <div className="flex justify-between mt-6">
                  <button
                    onClick={() =>
                      setCurrentIndex(Math.max(0, currentIndex - 1))
                    }
                    disabled={currentIndex === 0}
                    className="px-4 py-2 rounded-xl bg-white/5 text-white/40 text-sm border border-white/10 hover:bg-white/10 disabled:opacity-30 transition-all"
                  >
                    Previous
                  </button>
                  <span className="text-white/25 text-sm self-center">
                    {currentIndex + 1} / {flashcardSet.totalCards}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentIndex(
                        Math.min(flashcardSet.totalCards - 1, currentIndex + 1),
                      )
                    }
                    disabled={currentIndex === flashcardSet.totalCards - 1}
                    className="px-4 py-2 rounded-xl bg-white/5 text-white/40 text-sm border border-white/10 hover:bg-white/10 disabled:opacity-30 transition-all"
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </div>
        ) : null}
      </div>
    </PageWrapper>
  );
}
