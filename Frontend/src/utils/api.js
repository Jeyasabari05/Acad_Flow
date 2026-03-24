export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://acad-backend-ve2l.onrender.com/api";

export const apiUrl = (path) => `${API_BASE_URL}${path}`;
