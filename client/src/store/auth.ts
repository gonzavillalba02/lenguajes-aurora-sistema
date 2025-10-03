import { create } from "zustand";
import { persist } from "zustand/middleware";
// Tipos y funciones para manejo de auth y JWT
export type Role = "operador" | "admin";
export type User = { id: number; role: Role };

type AuthState = {
   token: string | null;
   user: User | null;
   _hydrated: boolean;
   setHydrated: (v: boolean) => void;
   setAuth: (token: string) => void;
   clear: () => void;
};

//Mapeo de roles numéricos a strings
const ROLE_MAP: Record<number, Role> = { 1: "operador", 2: "admin" };
// Decodifica el payload de un JWT (sin validar)
function base64UrlToJson<T>(b64url: string): T {
   // JWT usa base64url: reemplazos y padding
   const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
   const pad = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
   return JSON.parse(atob(pad));
}
// Decodifica un JWT y extrae id y rol (numérico)
function decodeJWT(token: string): { id?: number; rol?: number } {
   try {
      const payload = token.split(".")[1];
      return base64UrlToJson(payload);
   } catch {
      return {};
   }
}
// Store de auth con persistencia en localStorage
export const useAuthStore = create<AuthState>()(
   //Persistencia en localStorage
   persist(
      (set) => ({
         token: null,
         user: null,
         _hydrated: false, // para saber si ya cargó el estado persistente

         //Hidrata el store (marca que ya cargó el estado persistente)
         setHydrated: (v) => set({ _hydrated: v }),
         // Setea token y user decodificando el JWT; si rol no mapeable, user queda null
         setAuth: (token) => {
            const { id, rol } = decodeJWT(token);
            const role = rol != null ? ROLE_MAP[Number(rol)] : undefined;
            // actualiza token y user (si rol no mapeable, user queda null)
            set({
               token,
               user: role
                  ? {
                       id: Number(id ?? 0),
                       role,
                    }
                  : null,
            });
         },
         // Limpia token y user (ej. para logout o token inválido)
         clear: () => set({ token: null, user: null }),
      }),
      {
         name: "auth-store",
         onRehydrateStorage: () => (state) => state?.setHydrated(true), // marca como hidratado al cargar
         partialize: (s) => ({ token: s.token, user: s.user }), // solo persiste token y user
      }
   )
);
