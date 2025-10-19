import type { ReactNode } from "react";
import type { ReservaRowVM } from "./reserva.types";
import type { RoomVM } from "./habitacion.types";

/** Encabezado de card/panel */
export type HeaderProps = {
   title: string;
   children?: ReactNode;
};

/** Tabla de reservas pendientes */
export type ReservasTableProps = {
   rows: ReservaRowVM[];
   loading: boolean;
};

/** Grilla/mapa de habitaciones */
export type RoomsGridProps = {
   rooms: RoomVM[];
};

/** KPIs del dashboard (derivados en front) */
export type KpiSummary = {
   pendientesVerificacion: number;
   pendientesPago: number;
   aprobadas: number;
   rechazadas: number;
   canceladas: number;
   habitacionesDisponibles: number;
   consultasPendientes: number;
};

/** Contratos de servicios (front) */
export type ReservasService = {
   fetchAll: () => Promise<import("./reserva.types").ReservaDomain[]>;
   fetchPendientes: (
      limit?: number
   ) => Promise<import("./reserva.types").ReservaDomain[]>;
};

export type HabitacionesService = {
   fetchAll: () => Promise<import("./habitacion.types").HabitacionDomain[]>;
};

/** Paquete de datos para dashboards */
export type DashboardData = {
   loading: boolean;
   rows: ReservaRowVM[];
   rooms: RoomVM[];
   summary: KpiSummary;
};
