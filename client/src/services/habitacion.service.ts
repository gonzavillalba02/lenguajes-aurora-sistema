import { api } from "./api";
import type {
   HabitacionRaw,
   HabitacionDomain,
} from "../types/habitacion.types";

// --- utils internas ---
function parseNumeroHabitacion(nombre?: string) {
   if (!nombre) return 0;
   const m = nombre.match(/\d+/);
   return m ? Number(m[0]) : 0;
}
function b(x: boolean | 0 | 1): boolean {
   return typeof x === "boolean" ? x : Boolean(x);
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toNumberOrNull(v: any): number | null {
   if (v === null || v === undefined || v === "") return null;
   const n = Number(v);
   return Number.isNaN(n) ? null : n;
}

// --- RAW -> DOMAIN ---
function mapHabitacion(raw: HabitacionRaw): HabitacionDomain {
   return {
      id: raw.id,
      nombre: raw.nombre,
      numero: parseNumeroHabitacion(raw.nombre),
      tipo: raw.tipo_nombre || "",
      descripcion: raw.descripcion ?? null,
      activa: b(raw.activa),
      disponible: b(raw.disponible),
      observaciones: raw.observaciones ?? null,
      capacidad: raw.capacidad ?? null,
      precioNoche: toNumberOrNull(raw.precio_noche),
      tipo_id: raw.tipo_id,
   };
}

// ==================== SERVICE ====================

export async function fetchHabitaciones(opts?: {
   scope?: "admin" | "operator";
}): Promise<HabitacionDomain[]> {
   const scope = opts?.scope ?? "admin";

   // no cambiamos la URL de backend
   const { data } = await api.get<HabitacionRaw[]>("/habitaciones");
   const arr = (Array.isArray(data) ? data : []).map(mapHabitacion);

   // operador: solo activas (activa=true)
   if (scope === "operator") return arr.filter((h) => h.activa === true);

   // admin: ve todas
   return arr;
}
//Cerrar habitacion (operador)
export async function bloquearHabitacion(id: number) {
   return api.patch(`/habitaciones/${id}/bloquear`, {});
}
//Abrir Habitacion (operador)
export async function desbloquearHabitacion(id: number) {
   return api.patch(`/habitaciones/${id}/desbloquear`, {});
}
//Eliminar habitacion (admin)
export async function desactivarHabitacion(id: number) {
   return api.patch(`/habitaciones/${id}/desactivar`, {});
}
//Reactivar habitacion (admin)
export async function reactivarHabitacion(id: number) {
   return api.patch(`/habitaciones/${id}/reactivar`, {});
}

/**
 * Actualiza SOLO las observaciones de la habitación (no toca el nombre).
 */
export async function actualizarObservacionesHabitacion(
   id: number,
   observaciones: string | null
) {
   return api.patch(`/habitaciones/${id}/observaciones`, { observaciones });
}
export async function actualizarHabitacion(
   id: number,
   body: { tipo_id?: number; tipo_slug?: string; observaciones?: string | null }
) {
   return api.patch(`/habitaciones/${id}`, body);
}
export async function crearHabitacion(payload: {
   nombre: string;
   tipo_id?: number;
   tipo_slug?: string;
   observaciones?: string | null;
}) {
   return api.post(`/habitaciones`, payload);
}
