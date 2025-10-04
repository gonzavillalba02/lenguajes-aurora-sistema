// src/pages/operador/Consultas.tsx
import { useEffect, useMemo, useState } from "react";
import KpiCard from "./components/KpiCard";
import {
   ConsultasService,
   adaptConsultaVM,
} from "../../services/consultas.service";
import type { ConsultaCardVM } from "../../types/types";

function LoadingBlock() {
   return (
      <div className="h-28 rounded-[var(--radius-xl2)] bg-white/5 animate-pulse" />
   );
}

function SectionHeader({
   title,
   children,
}: {
   title: string;
   children?: React.ReactNode;
}) {
   return (
      <div className="flex items-center justify-between gap-3">
         <h2 className="text-xl font-semibold text-white">{title}</h2>
         <div className="flex items-center gap-2">{children}</div>
      </div>
   );
}

function SearchBox({
   value,
   onChange,
   placeholder = "Buscar",
}: {
   value: string;
   onChange: (v: string) => void;
   placeholder?: string;
}) {
   return (
      <input
         value={value}
         onChange={(e) => onChange(e.target.value)}
         placeholder={placeholder}
         className="h-9 w-44 rounded-lg bg-filter px-3 text-sm text-white/90 outline-none ring-1 ring-inset ring-white/10 placeholder:text-white/40"
      />
   );
}

function ConsultaCard({ item }: { item: ConsultaCardVM }) {
   const isPendiente = item.estadoLabel === "Pendiente";
   const badgeClass = isPendiente
      ? "bg-estado-pendienteReserva text-white"
      : "bg-estado-aprobada text-white";

   return (
      <div className="rounded-[var(--radius-xl2)] bg-bg2/80 border border-white/5 p-4 ring-1 ring-inset ring-white/10 hover:shadow-[var(--shadow-card)] transition">
         <div className="flex items-start justify-between gap-3">
            <h4 className="text-white font-semibold leading-tight">
               {item.titulo}
            </h4>
            <span className={`text-xs px-2 py-1 rounded-full ${badgeClass}`}>
               {item.estadoLabel}
            </span>
         </div>
         <p className="mt-2 text-sm text-white/70">Cliente: {item.cliente}</p>
      </div>
   );
}

export default function Consultas() {
   const [loading, setLoading] = useState(true);
   const [pend, setPend] = useState<ConsultaCardVM[]>([]);
   const [resp, setResp] = useState<ConsultaCardVM[]>([]);
   const [kpi, setKpi] = useState({ total: 0, pendientes: 0, respondidas: 0 });

   // filtros locales
   const [qPend, setQPend] = useState("");
   const [qResp, setQResp] = useState("");

   useEffect(() => {
      (async () => {
         setLoading(true);
         const { pendientes, respondidas, kpi } =
            await ConsultasService.fetchGrouped();
         setPend(pendientes.map(adaptConsultaVM));
         setResp(respondidas.map(adaptConsultaVM));
         setKpi(kpi);
         setLoading(false);
      })();
   }, []);

   const filteredPend = useMemo(() => {
      const q = qPend.trim().toLowerCase();
      if (!q) return pend;
      return pend.filter(
         (i) =>
            i.titulo.toLowerCase().includes(q) ||
            i.cliente.toLowerCase().includes(q)
      );
   }, [pend, qPend]);

   const filteredResp = useMemo(() => {
      const q = qResp.trim().toLowerCase();
      if (!q) return resp;
      return resp.filter(
         (i) =>
            i.titulo.toLowerCase().includes(q) ||
            i.cliente.toLowerCase().includes(q)
      );
   }, [resp, qResp]);

   return (
      <div className="p-4 sm:p-6 space-y-6">
         {/* KPIs */}
         {/* KPIs */}
         <div className="mx-auto max-w-5xl px-1">
            <div className="flex flex-wrap justify-center gap-4">
               <KpiCard
                  label="Consultas pendientes"
                  value={kpi.pendientes}
                  variant="pendienteReserva"
                  active
                  className="w-72"
               />
               <KpiCard
                  label="Consultas respondidas"
                  value={kpi.respondidas}
                  variant="aprobada"
                  className="w-72"
               />
               <KpiCard
                  label="Total"
                  value={kpi.total}
                  variant="total"
                  className="w-72"
               />
            </div>
         </div>

         {/* Pendientes */}
         <section className="space-y-3">
            <SectionHeader title="Consultas Pendientes">
               <SearchBox value={qPend} onChange={setQPend} />
               {/* Placeholder para rango de fechas (opcional) */}
               <input
                  type="text"
                  disabled
                  value="01/01/24 - 31/12/25"
                  className="h-9 w-44 rounded-lg bg-bg2/50 px-3 text-sm text-white/40 outline-none ring-1 ring-inset ring-white/10"
                  readOnly
               />
            </SectionHeader>

            {loading ? (
               <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  <LoadingBlock />
                  <LoadingBlock />
                  <LoadingBlock />
               </div>
            ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {filteredPend.map((c) => (
                     <ConsultaCard key={c.id} item={c} />
                  ))}
                  {!filteredPend.length && (
                     <div className="text-white/60 text-sm">
                        Sin resultados…
                     </div>
                  )}
               </div>
            )}
         </section>

         {/* Respondidas */}
         <section className="space-y-3">
            <SectionHeader title="Consultas Respondidas">
               <SearchBox value={qResp} onChange={setQResp} />
               <input
                  type="text"
                  disabled
                  value="01/01/24 - 31/12/25"
                  className="h-9 w-44 rounded-lg bg-bg2/50 px-3 text-sm text-white/40 outline-none ring-1 ring-inset ring-white/10"
                  readOnly
               />
            </SectionHeader>

            {loading ? (
               <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  <LoadingBlock />
                  <LoadingBlock />
               </div>
            ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {filteredResp.map((c) => (
                     <ConsultaCard key={c.id} item={c} />
                  ))}
                  {!filteredResp.length && (
                     <div className="text-white/60 text-sm">
                        Sin resultados…
                     </div>
                  )}
               </div>
            )}
         </section>
      </div>
   );
}
