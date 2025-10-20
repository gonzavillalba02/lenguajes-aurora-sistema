import type { Operador, CreateOperadorDTO } from "../types/operador.types";
import { api } from "../services/api";

export async function fetchOperadores(): Promise<Operador[]> {
   const { data } = await api.get<Operador[]>("/usuarios/operadores");
   return data;
}

export async function crearOperador(dto: CreateOperadorDTO) {
   await api.post("/usuarios/operadores", dto);
}

export async function desactivarOperador(id: number) {
   await api.delete(`/usuarios/operadores/${id}`);
}

export async function reactivarOperador(id: number) {
   await api.patch(`/usuarios/operadores/${id}/reactivar`);
}

export async function getOperadorById(id: number) {
   const { data } = await api.get<Operador>(`/usuarios/operadores/${id}`);
   return data;
}
