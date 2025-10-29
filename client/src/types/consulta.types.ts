import type { ValueOf } from "./core";

/** Estados que devuelve la tabla estado_consulta */
export const CONSULTA_ESTADO = {
   PENDIENTE: "pendiente",
   RESUELTA: "resuelta",
} as const;
export type ConsultaEstadoDB = ValueOf<typeof CONSULTA_ESTADO>;

export const CONSULTA_LABEL: Record<ConsultaEstadoDB, string> = {
   pendiente: "Pendiente",
   resuelta: "Resuelta",
};

/** RAW tal cual /api/consultas */
export type ConsultaRaw = {
   id: number;
   texto: string;
   estado_id: number; // si lo usás
   estado: ConsultaEstadoDB;
   persona_id: number;
   persona_nombre: string;
   persona_apellido: string;
   persona_email: string;
   resuelta_por: number | null;
   usuario_nombre: string | null;
};

/** DOMAIN normalizado */
export type ConsultaDomain = {
   id: number;
   texto: string;
   estado: ConsultaEstadoDB;
   cliente: { nombre: string; apellido: string; email?: string };
   resueltaPor?: string | null;
};

/** VIEWMODEL para tarjetas/listas */
export type ConsultaCardVM = {
   id: number;
   titulo: string; // quizás texto truncado en UI
   cliente: string; // "Apellido, Nombre"
   estadoLabel: string; // derivado de CONSULTA_LABEL
};

/** Detalle para modal/vista */
export type ConsultaDetailVM = {
   id: number;
   estadoLabel: string; // "Pendiente" | "Resuelta"
   clienteNombre: string;
   clienteEmail: string;
   asunto: string; // fallback "Consulta"
   mensajeCliente: string; // del RAW.texto
   respuesta?: string;
   operadorNombre?: string; // RAW.usuario_nombre
   createdAt?: string;
   respondedAt?: string;
};

/** KPIs de consultas */
export type ConsultasKpi = {
   total: number;
   pendientes: number;
   respondidas: number;
};
