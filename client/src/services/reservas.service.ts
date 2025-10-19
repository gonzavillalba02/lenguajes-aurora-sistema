import { api } from "./api";
import type {
   ReservaRaw,
   ReservaDomain,
   ReservaEstadoDB,
   CrearReservaByIdDTO,
   CrearReservaResponse,
} from "../types/reserva.types";

// --- utils internas (sin dependencia de UI) ---
function toDateSafe(s: string): Date {
   return s.includes("T") ? new Date(s) : new Date(`${s}T00:00:00`);
}
function parseNumeroHabitacion(nombre?: string) {
   if (!nombre) return 0;
   const m = nombre.match(/\d+/);
   return m ? Number(m[0]) : 0;
}

// --- RAW -> DOMAIN ---
function mapReserva(raw: ReservaRaw): ReservaDomain {
   return {
      id: raw.id,
      cliente: {
         nombre: raw.persona_nombre,
         apellido: raw.persona_apellido,
         email: undefined, // si lo necesitás y viene en el back, agrégalo al Raw
      },
      rango: {
         desde: toDateSafe(raw.fecha_inicio),
         hasta: toDateSafe(raw.fecha_fin),
      },
      habitacion: {
         id: raw.habitacion_id,
         nombre: raw.habitacion_nombre,
         numero: parseNumeroHabitacion(raw.habitacion_nombre),
         tipo: raw.tipo_habitacion, // nombre real del back
      },
      estado: raw.estado,
      meta: {
         observaciones: raw.observaciones ?? null,
         creadaPor: raw.creada_por_nombre ?? null,
         aprobadaPor: raw.aprobada_por_nombre ?? null,
      },
   };
}

// ==================== SERVICES ====================

/** Trae todas las reservas (Domain) */
export async function fetchReservasAll(): Promise<ReservaDomain[]> {
   const { data } = await api.get<ReservaRaw[]>("/reservas");
   const arr = Array.isArray(data) ? data : [];
   return arr.map(mapReserva);
}

/** Filtra pendientes (verificación o pago), ordenadas por fecha de inicio asc */
export async function fetchReservasPendientes(
   limit = 6
): Promise<ReservaDomain[]> {
   const all = await fetchReservasAll();
   return all
      .filter(
         (r) =>
            r.estado === "pendiente_verificacion" ||
            r.estado === "pendiente_pago"
      )
      .sort((a, b) => a.rango.desde.getTime() - b.rango.desde.getTime())
      .slice(0, limit);
}

/** Cuenta por estado (para KPIs) a partir de un arreglo Domain */
export function contarPorEstado(
   reservas: ReservaDomain[]
): Record<ReservaEstadoDB, number> {
   return reservas.reduce(
      (acc, r) => {
         acc[r.estado] = (acc[r.estado] ?? 0) + 1;
         return acc;
      },
      {
         pendiente_verificacion: 0,
         pendiente_pago: 0,
         aprobada: 0,
         rechazada: 0,
         cancelada: 0,
      } as Record<ReservaEstadoDB, number>
   );
}

export async function crearReserva(
   payload: CrearReservaByIdDTO
): Promise<CrearReservaResponse> {
   const { data } = await api.post<CrearReservaResponse>("/reservas", payload, {
      headers: { "Content-Type": "application/json" },
   });
   return data;
}

// ---- STATE TRANSITIONS ----
export async function pasarAPendientePago(id: number | string) {
   await api.patch(`/reservas/${id}/pendiente-pago`);
}
export async function aprobarReserva(id: number | string) {
   await api.patch(`/reservas/${id}/aprobar`);
}
export async function rechazarReserva(id: number | string) {
   await api.patch(`/reservas/${id}/rechazar`);
}
export async function cancelarReserva(id: number | string) {
   await api.patch(`/reservas/${id}/cancelar`);
}

export async function fetchReservaById(id: number): Promise<ReservaDomain> {
   const { data } = await api.get<ReservaRaw>(`/reservas/${id}`);
   return mapReserva(data);
}
