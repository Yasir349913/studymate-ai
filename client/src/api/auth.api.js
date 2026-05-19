import api from "./axios";

export const authAPI = {
  signup: (data) => api.post("/api/auth/signup", data),

  login: (data) => api.post("/api/auth/login", data),

  logout: () => api.post("/api/auth/logout"),

  me: () => api.get("/api/auth/me"),

  forgotPassword: (email) => api.post("/api/auth/forgot-password", { email }),

  resetPassword: (token, password) =>
    api.post(`/api/auth/reset-password/${token}`, { password }),
};
