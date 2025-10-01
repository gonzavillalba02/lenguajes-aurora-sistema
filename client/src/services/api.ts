import axios from "axios";
import { useAuthStore } from "../store/auth";

export const api = axios.create({
   baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000",
});

api.interceptors.request.use((config) => {
   const { token } = useAuthStore.getState();
   if (token) config.headers["Authorization"] = `Bearer ${token}`;
   return config;
});
