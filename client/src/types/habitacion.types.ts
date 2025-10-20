import type { Booleanish } from "./core";

/** Estado de habitación para UI (no DB) */
export const HAB_STATUS = {
   LIBRE: "Libre",
   OCUPADA: "Ocupada",
   CERRADA: "Cerrada",
} as const;
export type HabStatus = (typeof HAB_STATUS)[keyof typeof HAB_STATUS];

/** ===== RAW tal cual backend ===== */
export type HabitacionRaw = {
   id: number;
   nombre: string;
   disponible: Booleanish;
   activa: Booleanish;
   observaciones?: string | null;
   tipo_id: number;
   descripcion?: string | null;
   tipo_nombre?: string;
   capacidad?: number | null;
   precio_noche?: string | number | null;
};

/** ===== DOMAIN normalizado ===== */
export type HabitacionDomain = {
   id: number;
   nombre: string;
   numero: number;
   tipo: string;
   descripcion?: string | null;
   activa: boolean;
   disponible: boolean;
   observaciones?: string | null;
   capacidad?: number | null;
   precioNoche?: number | null;
   tipo_id?: number;
};

/** ===== VIEWMODEL simple para mapa/grid ===== */
export type RoomVM = {
   id: number;
   numero: number;
   status: HabStatus; // "Libre" | "Ocupada" | "Cerrada"
};
