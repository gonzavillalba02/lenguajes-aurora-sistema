import { api } from "./api"; // <- tu axios client
import type {
   ConsultaRaw,
   ConsultaDomain,
   ConsultaCardVM,
   ConsultasKpi,
   ConsultaDetailVM,
} from "../types/consulta.types";

/* =========================
 *  Adaptadores
 *  ========================= */
function adaptConsultaDomain(raw: ConsultaRaw): ConsultaDomain {
   return {
      id: raw.id,
      texto: raw.texto,
      estado: raw.estado,
      cliente: {
         nombre: raw.persona_nombre,
         apellido: raw.persona_apellido,
         email: raw.persona_email,
      },
      resueltaPor: raw.usuario_nombre ?? null,
   };
}

export function adaptConsultaVM(c: ConsultaDomain): ConsultaCardVM {
   return {
      id: c.id,
      titulo: c.texto,
      cliente: `${c.cliente.apellido}, ${c.cliente.nombre}`,
      estadoLabel: c.estado === "pendiente" ? "Pendiente" : "Resuelta",
   };
}
/** Adaptador para el DETALLE del modal a partir del domain */
export function adaptConsultaDetailFromDomain(
   c: ConsultaDomain
): ConsultaDetailVM {
   return {
      id: c.id,
      estadoLabel: c.estado === "pendiente" ? "Pendiente" : "Resuelta",
      clienteNombre: `${c.cliente.nombre} ${c.cliente.apellido}`.trim(),
      clienteEmail: c.cliente.email ?? "",
      asunto: "Consulta",
      mensajeCliente: c.texto ?? "",
      respuesta: undefined,
      operadorNombre: c.resueltaPor ?? undefined,
      createdAt: undefined,
      respondedAt: undefined,
   };
}
/* =========================
 *  Helpers
 *  ========================= */
// helpers KPI
function splitConsultas(all: ConsultaDomain[]) {
   const pendientes: ConsultaDomain[] = [];
   const respondidas: ConsultaDomain[] = [];
   for (const c of all)
      (c.estado === "pendiente" ? pendientes : respondidas).push(c);
   return { pendientes, respondidas };
}
function consultasKpi(all: ConsultaDomain[]): ConsultasKpi {
   const { pendientes, respondidas } = splitConsultas(all);
   return {
      total: all.length,
      pendientes: pendientes.length,
      respondidas: respondidas.length,
   };
}

const BASE = "/consultas";

export const ConsultasService = {
   async fetchAll(): Promise<ConsultaDomain[]> {
      const { data } = await api.get<ConsultaRaw[]>(BASE);
      return data.map(adaptConsultaDomain);
   },

   async fetchGrouped(): Promise<{
      pendientes: ConsultaDomain[];
      respondidas: ConsultaDomain[];
      kpi: ConsultasKpi;
   }> {
      const all = await this.fetchAll();
      const groups = splitConsultas(all);
      const kpi = consultasKpi(all);
      return { ...groups, kpi };
   },

   // No existe GET /consultas/:id -> buscamos en el listado
   async fetchById(id: number): Promise<ConsultaDetailVM> {
      const all = await this.fetchAll();
      const found = all.find((c) => c.id === id);
      if (!found) throw new Error("Consulta no encontrada");
      return adaptConsultaDetailFromDomain(found);
   },

   // PATCH /consultas/:id/responder  { respuesta }
   async responder(id: number, respuesta: string): Promise<void> {
      await api.patch(`${BASE}/${id}/responder`, { respuesta });
   },

   // POST /consultas (por si lo necesitás)
   async crear(payload: { texto: string; persona_id: number }) {
      const { data } = await api.post(BASE, payload);
      return data;
   },
};
