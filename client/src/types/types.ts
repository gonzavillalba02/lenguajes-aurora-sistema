/** =========================
 *  Tipos base y utilitarios
 *  ========================= */
export type ID = number | string;
export type ISODateString = string; // e.g. "2025-10-10T03:00:00.000Z" o "2025-10-10"
export type MoneyString = string; // e.g. "100.00"
export type Booleanish = boolean | 0 | 1;

/** Estados válidos de una reserva (según DB) */
export type ReservaEstadoDB =
   | "pendiente_verificacion"
   | "pendiente_pago"
   | "aprobada"
   | "rechazada"
   | "cancelada";

/** Etiquetas de estado para UI (texto mostrado) */
export type ReservaEstadoLabel =
   | "Pendiente"
   | "Pendiente de pago"
   | "Aprobada"
   | "Rechazada"
   | "Cancelada";

/** Estado de habitación para UI (mapa) */
export type HabStatus = "Libre" | "Ocupada" | "Cerrada";

/** =========================
 *  Capa RAW (tal cual backend)
 *  ========================= */
export type ReservaRaw = {
   id: number;
   persona_nombre: string;
   persona_apellido: string;
   fecha_inicio: ISODateString; // puede llegar ISO completo o YYYY-MM-DD
   fecha_fin: ISODateString;
   habitacion_id: number;
   habitacion_nombre: string; // p.ej. "H101"
   tipo_habitacion: string; // nombre real que envía el back
   estado: ReservaEstadoDB;
   // Campos opcionales que a veces trae el back:
   observaciones?: string | null;
   creada_por_nombre?: string | null;
   aprobada_por_nombre?: string | null;
};

export type HabitacionRaw = {
   id: number;
   nombre: string; // p.ej. "H101"
   disponible: Booleanish; // 1/0 o boolean
   activa: Booleanish; // 1/0 o boolean
   tipo_id?: number;
   tipo_nombre: string;
   capacidad?: number;
   precio_noche?: MoneyString;
   observaciones?: string | null;
};

/** =========================
 *  Capa DOMAIN (normalizada)
 *  ========================= */
export type Persona = {
   nombre: string;
   apellido: string;
   email?: string;
};

export type RangoFecha = {
   desde: Date; // normalizado a Date en adaptadores (fuera de este archivo)
   hasta: Date;
};

export type HabitacionDomain = {
   id: number;
   nombre: string; // "H101"
   numero: number; // 101
   tipo: string; // "parejas_estandar"
   activa: boolean;
   disponible: boolean;
};

export type ReservaDomain = {
   id: number;
   cliente: Persona; // { nombre, apellido }
   rango: RangoFecha; // { desde: Date, hasta: Date }
   habitacion: {
      id: number;
      nombre: string;
      numero: number;
      tipo: string;
   };
   estado: ReservaEstadoDB;
   meta?: {
      observaciones?: string | null;
      creadaPor?: string | null;
      aprobadaPor?: string | null;
   };
};

/** Resumen para KPIs (derivado en front a partir de Domain) */
export type KpiSummary = {
   pendientesVerificacion: number;
   pendientesPago: number;
   aprobadas: number;
   rechazadas: number;
   canceladas: number;
   habitacionesDisponibles: number;
};

/** =========================
 *  Capa VIEWMODEL (para la UI)
 *  ========================= */
export type ReservaRowVM = {
   id: number;
   cliente: string; // "Apellido, Nombre"
   fecha: string; // "DD/MM/YY - DD/MM/YY"
   habitacionNumero: number; // 101
   tipoHabitacion: string; // "parejas_estandar"
   statusLabel: ReservaEstadoLabel;
};

export type RoomVM = {
   id: number;
   numero: number; // 101
   status: HabStatus; // "Libre" | "Ocupada" | "Cerrada"
};

/** =========================
 *  Contratos para componentes
 *  ========================= */
// Tabla de reservas pendientes
export type ReservasTableProps = {
   rows: ReservaRowVM[];
   loading: boolean;
};

// Grilla/mapa de habitaciones
export type RoomsGridProps = {
   rooms: RoomVM[];
};

// Encabezado de card/panel
export type HeaderProps = {
   title: string;
   children?: React.ReactNode;
};

/** =========================
 *  Contratos de servicios (front)
 *  ========================= */
// Si querés tipar los servicios a nivel de retorno (recomendado)
export type ReservasService = {
   fetchAll: () => Promise<ReservaDomain[]>;
   fetchPendientes: (limit?: number) => Promise<ReservaDomain[]>;
};

export type HabitacionesService = {
   fetchAll: () => Promise<HabitacionDomain[]>;
};

export type DashboardData = {
   loading: boolean;
   rows: ReservaRowVM[];
   rooms: RoomVM[];
   summary: KpiSummary;
};

// Estados que devuelve la tabla estado_consulta
export type ConsultaEstadoDB = "pendiente" | "resuelta";

// RAW tal cual lo envía el backend /api/consultas
export type ConsultaRaw = {
   id: number;
   texto: string;
   estado_id: number;
   estado: ConsultaEstadoDB;
   persona_id: number;
   persona_nombre: string;
   persona_apellido: string;
   persona_email: string;
   resuelta_por: number | null;
   usuario_nombre: string | null;
};

// DOMAIN normalizado para lógica de front
export type ConsultaDomain = {
   id: number;
   texto: string;
   estado: ConsultaEstadoDB;
   cliente: Persona; // { nombre, apellido, email }
   resueltaPor?: string | null; // nombre del usuario que respondió (si hay)
};

// VIEWMODEL simple para tarjetas/listas en UI
export type ConsultaCardVM = {
   id: number;
   titulo: string; // texto (posible recorte si lo hacés en UI)
   cliente: string; // "Apellido, Nombre"
   estadoLabel: "Pendiente" | "Resuelta";
};

// Resumen mínimo para KPIs relacionados a consultas
export type ConsultasKpi = {
   total: number;
   pendientes: number;
   respondidas: number;
};

//Crear reserva
export type CrearReservaByIdDTO = {
   persona_id: number;
   habitacion_id: number;
   fecha_inicio: ISODateString; // "YYYY-MM-DD"
   fecha_fin: ISODateString; // "YYYY-MM-DD"
   observaciones?: string | null;
};

export type CrearReservaResponse = {
   message: string; // "Reserva creada y aprobada"
   reservaId: number; // 13
   personaId: number; // 5
};
