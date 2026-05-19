import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useFlashcardStore = create(
  persist(
    (set) => ({
      selectedDoc: null,
      flashcardSet: null,
      currentIndex: 0,
      loading: false, // ← Naya
      generatingFor: null, // ← Kaun sa doc generate ho raha hai

      setLoading: (loading) => set({ loading }),
      setGeneratingFor: (id) => set({ generatingFor: id }),
      setSelectedDoc: (doc) => set({ selectedDoc: doc }),
      setFlashcardSet: (flashcardSet) =>
        set({
          flashcardSet,
          currentIndex: 0,
          loading: false,
          generatingFor: null,
        }),
      setCurrentIndex: (currentIndex) => set({ currentIndex }),
      updateCard: (cardIndex, status, learnedCards) =>
        set((state) => ({
          flashcardSet: {
            ...state.flashcardSet,
            learnedCards,
            cards: state.flashcardSet.cards.map((c, i) =>
              i === cardIndex ? { ...c, status } : c,
            ),
          },
        })),
      resetCards: (cards) =>
        set((state) => ({
          flashcardSet: { ...state.flashcardSet, learnedCards: 0, cards },
          currentIndex: 0,
        })),
      clear: () =>
        set({
          selectedDoc: null,
          flashcardSet: null,
          currentIndex: 0,
          loading: false,
          generatingFor: null,
        }),
    }),
    {
      name: "flashcard-storage",
      partialize: (state) => ({
        selectedDoc: state.selectedDoc,
        flashcardSet: state.flashcardSet,
        currentIndex: state.currentIndex,
        loading: state.loading,
        generatingFor: state.generatingFor,
      }),
    },
  ),
);
