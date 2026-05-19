import api from "./axios";

export const flashcardAPI = {
  generate: (documentId) => api.post("/api/flashcards", { documentId }),

  regenerate: (documentId) =>
    api.post("/api/flashcards/regenerate", { documentId }),

  getByDocument: (documentId) =>
    api.get(`/api/flashcards/document/${documentId}`),

  updateCard: (flashcardId, cardIndex, status) =>
    api.patch(`/api/flashcards/${flashcardId}/card`, { cardIndex, status }),

  reset: (flashcardId) => api.post(`/api/flashcards/${flashcardId}/reset`),
};
