import { api } from "./api"; // <- ajustá el path si tu axios client está en otro lugar
import type {
   ConsultaRaw,
   ConsultaDomain,
   ConsultaCardVM,
   ConsultasKpi,
} from "../types/types";

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

/* =========================
 *  Helpers
 *  ========================= */

export function splitConsultas(all: ConsultaDomain[]): {
   pendientes: ConsultaDomain[];
   respondidas: ConsultaDomain[];
} {
   const pendientes: ConsultaDomain[] = [];
   const respondidas: ConsultaDomain[] = [];
   for (const c of all) {
      (c.estado === "pendiente" ? pendientes : respondidas).push(c);
   }
   return { pendientes, respondidas };
}

export function consultasKpi(all: ConsultaDomain[]): ConsultasKpi {
   const { pendientes, respondidas } = splitConsultas(all);
   return {
      total: all.length,
      pendientes: pendientes.length,
      respondidas: respondidas.length,
   };
}

/* =========================
 *  Servicio HTTP
 *  ========================= */

const BASE = "/consultas";

export const ConsultasService = {
   /** Trae TODAS las consultas y las normaliza a Domain */
   async fetchAll(): Promise<ConsultaDomain[]> {
      const { data } = await api.get<ConsultaRaw[]>(BASE);
      return data.map(adaptConsultaDomain);
   },

   /** Trae todas y las devuelve separadas por estado */
   async fetchGrouped(): Promise<{
      pendientes: ConsultaDomain[];
      respondidas: ConsultaDomain[];
      kpi: ConsultasKpi;
   }> {
      const all = await ConsultasService.fetchAll();
      const groups = splitConsultas(all);
      const kpi = consultasKpi(all);
      return { ...groups, kpi };
   },
};
