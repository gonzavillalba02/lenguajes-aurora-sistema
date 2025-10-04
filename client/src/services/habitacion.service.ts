import { api } from "./api";
import type { HabitacionRaw, HabitacionDomain } from "../types/types";

// --- utils internas ---
function parseNumeroHabitacion(nombre?: string) {
   if (!nombre) return 0;
   const m = nombre.match(/\d+/);
   return m ? Number(m[0]) : 0;
}
function b(x: boolean | 0 | 1): boolean {
   return typeof x === "boolean" ? x : Boolean(x);
}

// --- RAW -> DOMAIN ---
function mapHabitacion(raw: HabitacionRaw): HabitacionDomain {
   return {
      id: raw.id,
      nombre: raw.nombre,
      numero: parseNumeroHabitacion(raw.nombre),
      tipo: raw.tipo_nombre,
      activa: b(raw.activa),
      disponible: b(raw.disponible),
   };
}

// ==================== SERVICE ====================

/** Trae todas las habitaciones (Domain) */
export async function fetchHabitaciones(): Promise<HabitacionDomain[]> {
   const { data } = await api.get<HabitacionRaw[]>("/habitaciones");
   const arr = Array.isArray(data) ? data : [];
   return arr.map(mapHabitacion);
}

export async function bloquearHabitacion(id: number) {
   return api.patch(`/habitaciones/${id}/bloquear`, {});
}

export async function desbloquearHabitacion(id: number) {
   return api.patch(`/habitaciones/${id}/desbloquear`, {});
}

export async function desactivarHabitacion(id: number) {
   return api.patch(`/habitaciones/${id}/desactivar`, {});
}

export async function reactivarHabitacion(id: number) {
   return api.patch(`/habitaciones/${id}/reactivar`, {});
}
