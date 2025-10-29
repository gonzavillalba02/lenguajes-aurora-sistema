import type { ISODateString, Persona, RangoFecha, ValueOf } from "./core";

export const RESERVA_ESTADO = {
   APROBADA: "aprobada",
   RECHAZADA: "rechazada",
   CANCELADA: "cancelada",
} as const;
export type ReservaEstadoDB = ValueOf<typeof RESERVA_ESTADO>;

export const RESERVA_LABEL: Record<ReservaEstadoDB, string> = {
   aprobada: "Aprobada",
   rechazada: "Rechazada",
   cancelada: "Cancelada",
};

/** ===== RAW tal cual backend ===== */
export type ReservaRaw = {
   id: number;
   persona_nombre: string;
   persona_apellido: string;
   persona_email?: string | null;
   persona_telefono?: string | null;
   persona_ubicacion?: string | null;

   fecha_inicio: ISODateString;
   fecha_fin: ISODateString;

   habitacion_id: number;
   habitacion_nombre: string; // p.ej. "H101"
   tipo_habitacion: string; // nombre del tipo que manda el back

   estado: ReservaEstadoDB;
   observaciones?: string | null;

   creada_por_nombre?: string | null;
   modificada_por_nombre?: string | null;
};

/** ===== DOMAIN normalizado ===== */
export type ReservaDomain = {
   id: number;
   cliente: Persona & {
      email?: string | null;
      telefono?: string | null;
      ubicacion?: string | null;
   };
   rango: RangoFecha;
   habitacion: {
      id: number;
      nombre: string;
      numero: number;
      tipo: string; // label amigable
   };
   estado: ReservaEstadoDB;
   meta?: {
      observaciones?: string | null;
      creadaPor?: string | null; // null => Reservado online
      modificadaPor?: string | null; // null => sin cambios
   };
};

/** ===== VIEWMODEL para tablas/listas ===== */
export type ReservaRowVM = {
   id: number;
   cliente: string; // "Nombre Apellido"
   fechaInicio: string; // "YYYY-MM-DD"
   fechaFin: string; // "YYYY-MM-DD"
   habitacionNumero: number;
   tipoHabitacion: string;
   status: "Aprobada" | "Rechazada" | "Cancelada";
};

/** ===== DTOs ===== */
export type CrearReservaByIdDTO = {
   persona_id: number;
   habitacion_id: number;
   fecha_inicio: ISODateString;
   fecha_fin: ISODateString;
   observaciones?: string | null;
};

export type CrearReservaResponse = {
   message: string;
   reservaId: number;
   personaId: number;
};
