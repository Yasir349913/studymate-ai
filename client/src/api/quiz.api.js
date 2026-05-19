import api from "./axios";

export const quizAPI = {
  generate: (documentId, difficulty, count) =>
    api.post("/api/quiz", { documentId, difficulty, count }),

  submit: (quizId, answers) =>
    api.post(`/api/quiz/${quizId}/submit`, { answers }),

  getHistory: () => api.get("/api/quiz/history"),

  getOne: (quizId) => api.get(`/api/quiz/${quizId}`),
};
