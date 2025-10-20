// src/pages/admin/Reservas.tsx
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import KpiCard from "../../components/KpiCard";
import ReservasTable from "./components/ReservasTable";
import CreateReservaModal from "../operador/components/CreateReservaModal";
import ReservaDetailsModal from "../operador/components/ReservaDetailsModal";

import {
   fetchReservasAll,
   contarPorEstado,
} from "../../services/reservas.service";

import type { ISODateString } from "../../types/core";
import type { ReservaDomain, ReservaEstadoDB } from "../../types/reserva.types";
import { RESERVA_LABEL } from "../../types/reserva.types";

// Animations
const listVariants = {
   hidden: { opacity: 0 },
   visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const itemVariants = {
   hidden: { opacity: 0, y: 8 },
   visible: { opacity: 1, y: 0, transition: { duration: 0.18 } },
};
const fadeInUp = {
   hidden: { opacity: 0, y: 10 },
   visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

// ======= helpers =======
function toISODateOnly(d: Date) {
   const y = d.getFullYear();
   const m = String(d.getMonth() + 1).padStart(2, "0");
   const day = String(d.getDate()).padStart(2, "0");
   return `${y}-${m}-${day}`;
}
function todayISO(): ISODateString {
   return new Date().toISOString().slice(0, 10) as ISODateString;
}
function addDaysISO(baseISO: ISODateString, days: number): ISODateString {
   const d = new Date(`${baseISO}T00:00:00`);
   d.setDate(d.getDate() + days);
   return d.toISOString().slice(0, 10) as ISODateString;
}

// ======= Tipos (ajustá slugs si es necesario) =======
const TYPE_OPTIONS: Array<{ value: string; label: string }> = [
   { value: "parejas_estandar", label: "Parejas Estándar" },
   { value: "parejas_suit", label: "Parejas Suite" },
   { value: "familiar_estandar", label: "Familiar Estándar" },
   { value: "familiar_suit", label: "Familiar Suite" },
   { value: "cuadruple_estandar", label: "Cuádruple Estándar" },
   { value: "cuadruple_suit", label: "Cuádruple Suite" },
];

// ======= page =======
export default function Reservas() {
   const [loading, setLoading] = useState(true);
   const [reservas, setReservas] = useState<ReservaDomain[]>([]);

   // filtros UI
   const [q, setQ] = useState("");
   const [estado, setEstado] = useState<ReservaEstadoDB | "">("");
   const [tiposSeleccionados, setTiposSeleccionados] = useState<string[]>([]);

   // ⏱️ Rango por defecto: hoy → +30 días
   const defaultFrom = todayISO();
   const defaultTo = addDaysISO(defaultFrom, 30);
   const [from, setFrom] = useState<ISODateString>(defaultFrom);
   const [to, setTo] = useState<ISODateString>(defaultTo);

   // Modales / selección
   const [showCreate, setShowCreate] = useState(false);
   const [showDetail, setShowDetail] = useState(false);
   const [selectedId, setSelectedId] = useState<number | null>(null);

   useEffect(() => {
      (async () => {
         setLoading(true);
         const all = await fetchReservasAll();
         setReservas(all);
         setLoading(false);
      })();
   }, []);

   // Normalizar rango si el usuario invierte fechas
   useEffect(() => {
      if (from && to && from > to) {
         const next = addDaysISO(from, 1);
         setTo(next);
      }
   }, [from, to]);

   // ===== Filtro principal =====
   const filtered = useMemo(() => {
      // límites de filtro (incluyentes)
      const fStart = from ? new Date(`${from}T00:00:00`) : null;
      const fEnd = to ? new Date(`${to}T23:59:59.999`) : null;

      return reservas.filter((r) => {
         // búsqueda: cliente / nro / tipo
         const fullName = `${r.cliente.nombre ?? ""} ${
            r.cliente.apellido ?? ""
         }`
            .trim()
            .toLowerCase();
         const matchesQ =
            !q ||
            fullName.includes(q.toLowerCase()) ||
            String(r.habitacion.numero).includes(q) ||
            (r.habitacion.tipo ?? "").toLowerCase().includes(q.toLowerCase());

         // estado
         const matchesEstado = !estado || r.estado === estado;

         // tipos (si no hay ninguno seleccionado, no filtramos por tipo)
         const tipoSlug = (r.habitacion.tipo ?? "").toLowerCase();
         const matchesTipo =
            tiposSeleccionados.length === 0 ||
            tiposSeleccionados.some((t) => t.toLowerCase() === tipoSlug);

         // 🗓️ lógica de FECHAS: mostramos reservas que SE SOLAPAN con [from, to]
         const start = r.rango.desde;
         const end = r.rango.hasta;

         const overlaps =
            (!fStart || end >= fStart) && (!fEnd || start <= fEnd);

         return matchesQ && matchesEstado && matchesTipo && overlaps;
      });
   }, [reservas, q, estado, tiposSeleccionados, from, to]);

   // KPIs según lo filtrado
   const counts = useMemo(() => contarPorEstado(filtered), [filtered]);

   // Adaptar a la tabla
   const rowsForTable = useMemo(
      () =>
         filtered.map((r) => ({
            id: r.id,
            cliente:
               `${r.cliente.nombre ?? ""} ${r.cliente.apellido ?? ""}`.trim() ||
               "—",
            fechaInicio: toISODateOnly(r.rango.desde),
            fechaFin: toISODateOnly(r.rango.hasta),
            habitacionNumero: r.habitacion.numero,
            tipoHabitacion: r.habitacion.tipo ?? "—",
            status: RESERVA_LABEL[r.estado] as
               | "Aprobada"
               | "Rechazada"
               | "Cancelada",
         })),
      [filtered]
   );

   // ===== UI helpers =====
   const toggleTipo = (value: string) => {
      setTiposSeleccionados((prev) =>
         prev.includes(value)
            ? prev.filter((x) => x !== value)
            : [...prev, value]
      );
   };
   const clearTipos = () => setTiposSeleccionados([]);
   const setRango30Dias = () => {
      const f = todayISO();
      setFrom(f);
      setTo(addDaysISO(f, 30));
   };

   return (
      <div className="flex flex-col gap-6">
         {/* KPIs */}
         <motion.div
            variants={listVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
         >
            <motion.div variants={itemVariants}>
               <KpiCard
                  label="Aprobadas"
                  value={counts.aprobada}
                  variant="aprobada"
               />
            </motion.div>
            <motion.div variants={itemVariants}>
               <KpiCard
                  label="Rechazadas"
                  value={counts.rechazada}
                  variant="rechazada"
               />
            </motion.div>
            <motion.div variants={itemVariants}>
               <KpiCard
                  label="Canceladas"
                  value={counts.cancelada}
                  variant="cancelada"
               />
            </motion.div>
            <motion.div variants={itemVariants}>
               <KpiCard
                  label="Total"
                  value={filtered.length}
                  variant="disponibles"
               />
            </motion.div>
         </motion.div>

         {/* Filtros */}
         <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-3 rounded-[var(--radius-xl2)] bg-bg2/60 p-3 border border-white/10"
         >
            {/* Línea 1: búsqueda + fechas + estado + crear */}
            <div className="flex flex-wrap items-center gap-3">
               <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar cliente / habitación / tipo"
                  className="rounded-[var(--radius-xl2)] bg-bg2 px-3 py-2 text-sm text-text placeholder-white/50 border border-white/10 focus:outline-none focus:ring-2 focus:ring-button/40"
               />

               <div className="flex items-center gap-2">
                  <input
                     type="date"
                     value={from}
                     onChange={(e) => setFrom(e.target.value as ISODateString)}
                     className="rounded-[var(--radius-xl2)] bg-bg2 px-3 py-2 text-sm text-text border border-white/10 focus:outline-none focus:ring-2 focus:ring-button/40"
                  />
                  <span className="text-white/50 text-sm">–</span>
                  <input
                     type="date"
                     value={to}
                     onChange={(e) => setTo(e.target.value as ISODateString)}
                     className="rounded-[var(--radius-xl2)] bg-bg2 px-3 py-2 text-sm text-text border border-white/10 focus:outline-none focus:ring-2 focus:ring-button/40"
                  />
                  <button
                     className="rounded-[var(--radius-xl2)] bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10 border border-white/10"
                     onClick={setRango30Dias}
                     title="Rango rápido: Hoy → +30 días"
                  >
                     30 días
                  </button>
               </div>

               <select
                  value={estado}
                  onChange={(e) =>
                     setEstado(e.target.value as ReservaEstadoDB | "")
                  }
                  className="rounded-[var(--radius-xl2)] bg-bg2 px-3 py-2 text-sm text-text border border-white/10 focus:outline-none focus:ring-2 focus:ring-button/40"
               >
                  <option value="">Estado</option>
                  <option value="aprobada">Aprobada</option>
                  <option value="rechazada">Rechazada</option>
                  <option value="cancelada">Cancelada</option>
               </select>

               <button
                  className="ml-auto rounded-[var(--radius-xl2)] bg-button px-4 py-2 text-white font-medium hover:bg-button/85 transition-shadow shadow-sm"
                  onClick={() => setShowCreate(true)}
               >
                  + Crear Reserva
               </button>
            </div>

            {/* Línea 2: Toggle list de Tipos */}
            <div className="flex flex-wrap items-center gap-2">
               <span className="text-white/60 text-xs mr-1">Tipos:</span>
               <AnimatePresence initial={false}>
                  {TYPE_OPTIONS.map((t) => {
                     const active = tiposSeleccionados.includes(t.value);
                     return (
                        <motion.button
                           key={t.value}
                           type="button"
                           onClick={() => toggleTipo(t.value)}
                           className={[
                              "px-3 py-1.5 text-xs rounded-full border transition",
                              active
                                 ? "bg-button text-white border-button/80"
                                 : "bg-white/5 text-white/80 border-white/10 hover:bg-white/10",
                           ].join(" ")}
                           initial={{ opacity: 0, y: 6 }}
                           animate={{ opacity: 1, y: 0 }}
                           exit={{ opacity: 0, y: -6 }}
                        >
                           {t.label}
                        </motion.button>
                     );
                  })}
               </AnimatePresence>

               {tiposSeleccionados.length > 0 && (
                  <button
                     onClick={clearTipos}
                     className="ml-1 text-xs text-white/60 hover:text-white underline-offset-2 hover:underline"
                     title="Limpiar selección de tipos"
                  >
                     Limpiar
                  </button>
               )}
            </div>
         </motion.div>

         {/* Tabla */}
         <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="card overflow-hidden"
         >
            <div className="px-4 py-3 bg-bg/30">
               <h2 className="text-white font-medium">Reservas</h2>
            </div>

            <div className="px-4 pb-4">
               <ReservasTable
                  rows={rowsForTable}
                  loading={loading}
                  onRowClick={(id) => {
                     setSelectedId(id);
                     setShowDetail(true);
                  }}
               />
            </div>
         </motion.div>

         {/* Modales */}
         <CreateReservaModal
            open={showCreate}
            onClose={() => setShowCreate(false)}
            onCreated={async () => {
               setLoading(true);
               const all = await fetchReservasAll();
               setReservas(all);
               setLoading(false);
               setShowCreate(false);
            }}
         />

         <ReservaDetailsModal
            open={showDetail}
            reservaId={selectedId}
            onClose={() => setShowDetail(false)}
            onChanged={async () => {
               setLoading(true);
               const all = await fetchReservasAll();
               setReservas(all);
               setLoading(false);
            }}
         />
      </div>
   );
}
