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
      tipo: raw.tipo_label || raw.tipo_nombre, // preferí el label del backend
      tipoSlug: raw.tipo_nombre,
      descripcion: raw.descripcion ?? null,
      activa: b(raw.activa),
      disponible: b(raw.disponible),
      observaciones: raw.observaciones ?? null,
      capacidad: raw.capacidad ?? null,
      precioNoche: toNumberOrNull(raw.precio_noche),
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

/**
 * Actualiza SOLO las observaciones de la habitación (no toca el nombre).
 * Si tu backend expone otra ruta, cambia la URL acá.
 */
export async function actualizarObservacionesHabitacion(
   id: number,
   observaciones: string | null
) {
   return api.patch(`/habitaciones/${id}/observaciones`, { observaciones });
}
