import api from "./axios";

export const chatAPI = {
  getAll: () => api.get("/api/chat"),

  getOne: (chatId) => api.get(`/api/chat/${chatId}`),

  delete: (chatId) => api.delete(`/api/chat/${chatId}`),

  updateTitle: (chatId, title) =>
    api.patch(`/api/chat/${chatId}/title`, { title }),
};
