import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isLoading: true,

      setAuth: (user, accessToken) => {
        // Sab purana data clear karo
        localStorage.removeItem("auth-storage");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("quiz-storage");
        localStorage.removeItem("flashcard-storage");
        localStorage.setItem("accessToken", accessToken);
        set({ user, accessToken, isLoading: false });
      },

      logout: () => {
        localStorage.removeItem("auth-storage");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("quiz-storage");
        localStorage.removeItem("flashcard-storage");
        set({ user: null, accessToken: null, isLoading: false });
      },

      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
      }),
    },
  ),
);
