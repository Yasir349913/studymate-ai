import api from "./axios";

export const documentAPI = {
  upload: (file, onProgress) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/api/documents", formData, {
      onUploadProgress: (e) => {
        const percent = Math.round((e.loaded * 100) / e.total);
        onProgress?.(percent);
      },
    });
  },

  getAll: () => api.get("/api/documents"),

  getOne: (id) => api.get(`/api/documents/${id}`),

  getStatus: (id) => api.get(`/api/documents/${id}/status`),

  delete: (id) => api.delete(`/api/documents/${id}`),
};
