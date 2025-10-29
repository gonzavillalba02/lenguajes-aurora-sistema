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
   const { data } = await api.get<HabitacionRaw[]>("/habitaciones");
   const arr = (Array.isArray(data) ? data : []).map(mapHabitacion);

   /** Eliminada = !activa && !disponible */
   const isEliminada = (h: Pick<HabitacionDomain, "activa" | "disponible">) =>
      h.activa === false && h.disponible === false;

   if (scope === "operator") {
      // Operador: solo activas y NO eliminadas
      return arr.filter((h) => h.activa === true && !isEliminada(h));
   }

   // Admin: devolver TODO (incluidas eliminadas y desactivadas).
   // La pantalla de admin ya controla el toggle "Mostrar eliminadas".
   return arr;
}

// ==== resto igual ====

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
function toTitleLabelLocal(slug?: string | null) {
   if (!slug) return "";
   return slug
      .replace(/_/g, " ")
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ")
      .replace("Suit", "Suite");
}

// === NUEVO: tipo de resumen para la UI rápida ===
export type TipoHabitacionResumen = {
   id: number;
   slug: string; // viene como `nombre` en la tabla tipo_habitacion
   label: string; // “Parejas Estándar”
   capacidad: number;
   descripcion: string;
   precio_noche: number; // en número
   cantidad: number; // # de habitaciones ACTIVAS de este tipo
};

// === NUEVO: fetch de /tipos-habitacion ===
export async function fetchTiposHabitacionResumen(): Promise<
   TipoHabitacionResumen[]
> {
   const { data } = await api.get<
      Array<{
         id: number;
         nombre: string; // OJO: es el slug en la DB
         capacidad: number;
         descripcion: string;
         precio_noche: string | number | null;
         cantidad: number;
      }>
   >("/habitaciones/tipos/lista");

   const toNum = (v: string | number | null) =>
      v == null ? 0 : (typeof v === "number" ? v : Number(v)) || 0;

   return (Array.isArray(data) ? data : []).map((r) => ({
      id: r.id,
      slug: r.nombre,
      label: toTitleLabelLocal(r.nombre),
      capacidad: r.capacidad,
      descripcion: r.descripcion,
      precio_noche: toNum(r.precio_noche),
      cantidad: r.cantidad ?? 0,
   }));
}
