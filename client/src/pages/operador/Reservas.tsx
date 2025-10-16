// src/pages/admin/Reservas.tsx
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import KpiCard from "../operador/components/KpiCard";
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

// ⬇️ (Opcional) Variantes de animación si tenés un archivo dedicado
// Si tenés tu archivo AnimacionDetails, descomentá la siguiente línea
// import { listVariants, itemVariants, fadeInUp } from "../../lib/AnimacionDetails";

// Fallbacks por si no existe AnimacionDetails
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
function tomorrowISO(): ISODateString {
   return new Date(Date.now() + 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10) as ISODateString;
}

// ======= Tipos (ajustá los slugs a tu BD) =======
const TYPE_OPTIONS: Array<{ value: string; label: string }> = [
   { value: "parejas_estandar", label: "Parejas Estándar" },
   { value: "parejas_suite", label: "Parejas Suite" },
   { value: "familiar_estandar", label: "Familiar Estándar" },
   { value: "familiar_suite", label: "Familiar Suite" },
   { value: "cuadruple_estandar", label: "Triple" },
   { value: "cuadruple_suit", label: "Cuadruple Suit" },
];

// ======= page =======
export default function Reservas() {
   const [loading, setLoading] = useState(true);
   const [reservas, setReservas] = useState<ReservaDomain[]>([]);

   // filtros UI
   const [q, setQ] = useState("");
   const [estado, setEstado] = useState<ReservaEstadoDB | "">("");
   // Toggle list multi-selección de tipos
   const [tiposSeleccionados, setTiposSeleccionados] = useState<string[]>([]);

   // Rango por defecto: hoy–mañana (se adapta)
   const [from, setFrom] = useState<ISODateString>(todayISO());
   const [to, setTo] = useState<ISODateString>(tomorrowISO());

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
         // si se invierte, empujamos "to" al día siguiente de "from"
         const d = new Date(from);
         const next = new Date(d.getTime() + 24 * 60 * 60 * 1000);
         setTo(next.toISOString().slice(0, 10) as ISODateString);
      }
   }, [from, to]);

   // ===== Filtro principal =====
   const filtered = useMemo(() => {
      return reservas.filter((r) => {
         // búsqueda (cliente o número de habitación o tipo)
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

         // rango de fechas (intersección simple dentro de [from, to])
         const start = r.rango.desde; // Date
         const end = r.rango.hasta; // Date
         const fromOk = !from || start >= new Date(`${from}T00:00:00`);
         const toOk = !to || end <= new Date(`${to}T23:59:59.999`);

         return matchesQ && matchesEstado && matchesTipo && fromOk && toOk;
      });
   }, [reservas, q, estado, tiposSeleccionados, from, to]);

   // KPIs deben actualizarse según lo filtrado
   const counts = useMemo(() => contarPorEstado(filtered), [filtered]);

   // Adaptar a la tabla (espera fechaInicio/fechaFin y status como label)
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
               | "Pendiente"
               | "Pendiente de pago"
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

   const setHoyManiana = () => {
      setFrom(todayISO());
      setTo(tomorrowISO());
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
                  label="Pendiente de Verificación"
                  value={counts.pendiente_verificacion}
                  variant="pendienteReserva"
               />
            </motion.div>
            <motion.div variants={itemVariants}>
               <KpiCard
                  label="Pendiente de Pago"
                  value={counts.pendiente_pago}
                  variant="pendientePago"
               />
            </motion.div>
            <motion.div variants={itemVariants}>
               <KpiCard
                  label="Aceptada"
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
                     onClick={setHoyManiana}
                     title="Rango rápido: Hoy–Mañana"
                  >
                     Hoy–Mañana
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
                  <option value="pendiente_verificacion">
                     Pendiente de Verificación
                  </option>
                  <option value="pendiente_pago">Pendiente de Pago</option>
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
            <div className="px-4 py-3  bg-bg/30">
               <h2 className="text-white font-medium">Reservas</h2>
            </div>

            <div className="px-4 pb-4">
               <ReservasTable
                  rows={rowsForTable}
                  loading={loading}
                  // 👇 al click, abrimos detalle
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
            // Cuando se crea, recargamos y mantenemos filtros → KPIs/tabla se adaptan
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
               // Si desde el detalle cambió estado/fechas, reflejar en KPIs y tabla
               setLoading(true);
               const all = await fetchReservasAll();
               setReservas(all);
               setLoading(false);
            }}
         />
      </div>
   );
}
