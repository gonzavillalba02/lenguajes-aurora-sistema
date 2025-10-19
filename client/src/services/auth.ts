import { api } from "./api";

export async function login(payload: { email: string; password: string }) {
   // backend devuelve el token JWT
   const { data } = await api.post("/auth/login", payload);
   return data as { token: string };
}
