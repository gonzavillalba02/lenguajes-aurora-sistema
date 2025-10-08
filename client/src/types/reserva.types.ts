import type { ISODateString, Persona, RangoFecha, ValueOf } from "./core";

/** ===== Estados de reserva (DB) + labels (UI) desde una sola fuente ===== */
export const RESERVA_ESTADO = {
   PENDIENTE_VERIFICACION: "pendiente_verificacion",
   PENDIENTE_PAGO: "pendiente_pago",
   APROBADA: "aprobada",
   RECHAZADA: "rechazada",
   CANCELADA: "cancelada",
} as const;
export type ReservaEstadoDB = ValueOf<typeof RESERVA_ESTADO>;

export const RESERVA_LABEL: Record<ReservaEstadoDB, string> = {
   pendiente_verificacion: "Pendiente",
   pendiente_pago: "Pendiente de pago",
   aprobada: "Aprobada",
   rechazada: "Rechazada",
   cancelada: "Cancelada",
};

/** ===== RAW tal cual backend ===== */
export type ReservaRaw = {
   id: number;
   persona_nombre: string;
   persona_apellido: string;
   fecha_inicio: ISODateString;
   fecha_fin: ISODateString;
   habitacion_id: number;
   habitacion_nombre: string; // p.ej. "H101"
   tipo_habitacion: string; // slug/nombre del tipo que manda el back
   estado: ReservaEstadoDB;
   observaciones?: string | null;
   creada_por_nombre?: string | null;
   aprobada_por_nombre?: string | null;
};

/** ===== DOMAIN normalizado ===== */
export type ReservaDomain = {
   id: number;
   cliente: Persona;
   rango: RangoFecha;
   habitacion: {
      id: number;
      nombre: string;
      numero: number;
      tipo: string; // label amigable
      tipoSlug?: string; // opcional si lo querés guardar
   };
   estado: ReservaEstadoDB;
   meta?: {
      observaciones?: string | null;
      creadaPor?: string | null;
      aprobadaPor?: string | null;
   };
};

/** ===== VIEWMODEL para tablas/listas ===== */
export type ReservaRowVM = {
   id: number;
   cliente: string; // "Apellido, Nombre"
   fecha: string; // "DD/MM/YY - DD/MM/YY"
   habitacionNumero: number;
   tipoHabitacion: string; // slug o label (definilo en tu adaptador)
   statusLabel: string; // derivado de RESERVA_LABEL
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
