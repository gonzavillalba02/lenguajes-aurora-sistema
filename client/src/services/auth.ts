import { api } from "./api";
import type { User } from "../store/auth";

export async function login(payload: { email: string; password: string }) {
   // Expected backend response: { token: string, user: { id, name, role } }
   const { data } = await api.post("/auth/login", payload);
   return data as { token: string; user: User };
}
