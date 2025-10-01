// Importa la función `create` para crear el store y `persist` para persistirlo en storage (localStorage por defecto).
import { create } from "zustand";
import { persist } from "zustand/middleware";

//Roles posibles
export type Role = "operador" | "admin";
// Defineción del usuario autenticado
export type User = { id: number; name: string; role: Role };

// Define el estado y las acciones del store de autenticación.
type AuthState = {
   token: string | null; // JWT crudo (lo devolvió el backend al hacer login)
   user: User | null; // Usuario decodificado (id, nombre, rol)
   _hydrated: boolean; // Flag para saber si ya se rehidrató desde storage
   setAuth: (token: string, user?: Partial<User> | null) => void; // Setea token y usuario
   clear: () => void; //Limpia sesión (logout)
   setHydrated: (v: boolean) => void; //Marca hidratación completa
};

// Ajustá estos IDs a la BD.
const ROLE_MAP: Record<number, Role> = {
   1: "operador",
   2: "admin",
};
// Si no es convertible a número o no existe en el mapa, devuelve undefined.
function roleFromRolId(rol: unknown): Role | undefined {
   const n = Number(rol);
   return Number.isFinite(n) ? ROLE_MAP[n] : undefined;
}

export function decodeJWT(token: string): Partial<User> & { role?: Role } {
   try {
      const p = token.split(".")[1];
      const pad = p.padEnd(p.length + ((4 - (p.length % 4)) % 4), "=");
      const pay = JSON.parse(atob(pad));
      return {
         id: Number(pay.id ?? pay.sub ?? 0),
         name: String(pay.name ?? pay.nombre ?? pay.username ?? "Usuario"),
         role: roleFromRolId(pay.rol), // viene numérico en claim "rol"
      };
   } catch {
      return {};
   }
}

export const useAuthStore = create<AuthState>()(
   persist(
      (set, get) => ({
         token: null,
         user: null,
         _hydrated: false,
         setHydrated: (v) => set({ _hydrated: v }),
         setAuth: (token, user) => {
            const fromToken = decodeJWT(token);
            const role =
               (user?.role as Role | undefined) ??
               roleFromRolId((user as any)?.rol) ??
               fromToken.role;

            set({
               token,
               user: role
                  ? {
                       id: Number(user?.id ?? fromToken.id ?? 0),
                       name: String(user?.name ?? fromToken.name ?? "Usuario"),
                       role,
                    }
                  : null,
            });
         },
         clear: () => set({ token: null, user: null }),
      }),
      {
         name: "auth-store",
         onRehydrateStorage: () => (state) => state?.setHydrated(true),
         // por seguridad, solo persisto lo necesario
         partialize: (s) => ({ token: s.token, user: s.user }),
      }
   )
);
