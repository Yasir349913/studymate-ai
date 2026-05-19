import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useQuizStore = create(
  persist(
    (set) => ({
      stage: "setup",
      quizData: null,
      result: null,
      answers: {},
      currentQ: 0,
      generating: false, // ← Naya — tab change pe persist rahega

      setGenerating: (generating) => set({ generating }),
      setStage: (stage) => set({ stage }),
      setQuizData: (quizData) =>
        set({
          quizData,
          stage: "quiz",
          answers: {},
          currentQ: 0,
          generating: false,
        }),
      setResult: (result) => set({ result, stage: "result" }),
      setAnswer: (index, answer) =>
        set((state) => ({
          answers: { ...state.answers, [index]: answer },
        })),
      setCurrentQ: (currentQ) => set({ currentQ }),
      reset: () =>
        set({
          stage: "setup",
          quizData: null,
          result: null,
          answers: {},
          currentQ: 0,
          generating: false,
        }),
    }),
    {
      name: "quiz-storage",
      partialize: (state) => ({
        stage: state.stage,
        quizData: state.quizData,
        result: state.result,
        answers: state.answers,
        currentQ: state.currentQ,
        generating: state.generating,
      }),
    },
  ),
);
