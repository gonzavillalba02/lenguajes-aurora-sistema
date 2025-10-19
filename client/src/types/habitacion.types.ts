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
   nombre: string; // p.ej. "H101"
   disponible: Booleanish;
   activa: Booleanish;
   observaciones?: string | null;
   tipo_id: number;
   tipo_nombre: string; // slug del tipo (p.ej. "parejas_estandar")
   descripcion?: string | null; // descripción del tipo (si el back ya la trae)
   tipo_label?: string; // label bonita del tipo (si el back ya la trae)
   capacidad?: number | null;
   precio_noche?: string | number | null;
};

/** ===== DOMAIN normalizado ===== */
export type HabitacionDomain = {
   id: number;
   nombre: string; // "H101"
   numero: number; // 101 (derivado)
   tipo: string; // label amigable (preferir label si existe)
   tipoSlug: string; // slug
   descripcion?: string | null;
   activa: boolean;
   disponible: boolean;
   observaciones?: string | null;
   capacidad?: number | null;
   precioNoche?: number | null;
};

/** ===== VIEWMODEL simple para mapa/grid ===== */
export type RoomVM = {
   id: number;
   numero: number;
   status: HabStatus; // "Libre" | "Ocupada" | "Cerrada"
};
