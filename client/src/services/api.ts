import axios from "axios";
import { useAuthStore } from "../store/auth";

// Instancia de axios con configuración base.
export const api = axios.create({
   baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
});
// Interceptor para agregar el token JWT en cada request si está disponible.
api.interceptors.request.use((config) => {
   const { token } = useAuthStore.getState();
   if (token) config.headers["Authorization"] = `Bearer ${token}`;
   return config;
});
// (opcional) manejar 401 → limpiar sesión
api.interceptors.response.use(
   (r) => r,
   (err) => {
      if (err?.response?.status === 401) {
         useAuthStore.getState().clear();
      }
      return Promise.reject(err);
   }
);
