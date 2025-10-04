import { useEffect, useMemo, useState } from "react";
import KpiCard from "../operador/components/KpiCard";
import ReservasTable from "./components/ReservasTable";
import {
   fetchReservasAll,
   contarPorEstado,
} from "../../services/reservas.service";
import type {
   ReservaDomain,
   ReservaEstadoDB,
   ReservaEstadoLabel,
} from "../../types/types"; // ajustá el path

// ======= helpers =======
function estadoDbToLabel(e: ReservaEstadoDB): ReservaEstadoLabel {
   switch (e) {
      case "pendiente_verificacion":
         return "Pendiente";
      case "pendiente_pago":
         return "Pendiente de pago";
      case "aprobada":
         return "Aprobada";
      case "rechazada":
         return "Rechazada";
      case "cancelada":
         return "Cancelada";
   }
}

function toISODateOnly(d: Date) {
   const y = d.getFullYear();
   const m = String(d.getMonth() + 1).padStart(2, "0");
   const day = String(d.getDate()).padStart(2, "0");
   return `${y}-${m}-${day}`;
}

// ======= page =======
export default function Reservas() {
   const [loading, setLoading] = useState(true);
   const [reservas, setReservas] = useState<ReservaDomain[]>([]);

   // filtros UI
   const [q, setQ] = useState("");
   const [estado, setEstado] = useState<ReservaEstadoDB | "">("");
   const [tipo, setTipo] = useState<string>("");
   const [from, setFrom] = useState<string>(""); // yyyy-mm-dd
   const [to, setTo] = useState<string>(""); // yyyy-mm-dd

   useEffect(() => {
      (async () => {
         setLoading(true);
         const all = await fetchReservasAll();
         setReservas(all);
         setLoading(false);
      })();
   }, []);

   const counts = useMemo(() => contarPorEstado(reservas), [reservas]);

   const filtered = useMemo(() => {
      return reservas.filter((r) => {
         // search por cliente o número de habitación
         const fullName = `${r.cliente.nombre ?? ""} ${
            r.cliente.apellido ?? ""
         }`.toLowerCase();
         const matchesQ =
            !q ||
            fullName.includes(q.toLowerCase()) ||
            String(r.habitacion.numero).includes(q);

         const matchesEstado = !estado || r.estado === estado;

         const matchesTipo =
            !tipo ||
            (r.habitacion.tipo ?? "")
               .toLowerCase()
               .includes(tipo.toLowerCase());

         // rango de fechas: intersección simple (start>=from && end<=to) si ambos están
         const start = r.rango.desde;
         const end = r.rango.hasta;
         const fromOk = !from || start >= new Date(`${from}T00:00:00`);
         const toOk = !to || end <= new Date(`${to}T23:59:59.999`);

         return matchesQ && matchesEstado && matchesTipo && fromOk && toOk;
      });
   }, [reservas, q, estado, tipo, from, to]);

   // adaptar a la tabla que me pasaste (espera fechaInicio/fechaFin y status "label")
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
            status: estadoDbToLabel(r.estado),
         })),
      [filtered]
   );

   return (
      <div className="flex flex-col gap-6">
         {/* KPIs */}
         <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard
               label="Pendiente de Verificación"
               value={counts.pendiente_verificacion}
               variant="pendienteReserva"
            />
            <KpiCard
               label="Pendiente de Pago"
               value={counts.pendiente_pago}
               variant="pendientePago"
            />
            <KpiCard
               label="Aceptada"
               value={counts.aprobada}
               variant="aprobada"
            />
            <KpiCard
               label="Rechazadas"
               value={counts.rechazada}
               variant="rechazada"
            />
            <KpiCard
               label="Canceladas"
               value={counts.cancelada}
               variant="cancelada"
            />
            <KpiCard
               label="Total"
               value={reservas.length}
               variant="disponibles"
            />
         </div>

         {/* Filtros */}
         <div className="flex flex-wrap items-center gap-3">
            <input
               value={q}
               onChange={(e) => setQ(e.target.value)}
               placeholder="Buscar"
               className="rounded-[var(--radius-xl2)] bg-bg2 px-3 py-2 text-sm text-text placeholder-white/50 border border-white/10 focus:outline-none focus:ring-2 focus:ring-button/40"
            />

            <div className="flex items-center gap-2">
               <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="rounded-[var(--radius-xl2)] bg-bg2 px-3 py-2 text-sm text-text border border-white/10 focus:outline-none focus:ring-2 focus:ring-button/40"
               />
               <span className="text-white/50 text-sm">–</span>
               <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="rounded-[var(--radius-xl2)] bg-bg2 px-3 py-2 text-sm text-text border border-white/10 focus:outline-none focus:ring-2 focus:ring-button/40"
               />
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

            <input
               value={tipo}
               onChange={(e) => setTipo(e.target.value)}
               placeholder="Tipo de Habitación"
               className="rounded-[var(--radius-xl2)] bg-bg2 px-3 py-2 text-sm text-text placeholder-white/50 border border-white/10 focus:outline-none focus:ring-2 focus:ring-button/40"
               title="Ej: parejas_suite, familiar_suite…"
            />

            <button
               className="ml-auto rounded-[var(--radius-xl2)] bg-button px-4 py-2 text-white font-medium hover:bg-button/85 transition-shadow shadow-sm"
               onClick={() => {
                  // TODO: abrir modal de creación
               }}
            >
               + Crear Reserva
            </button>
         </div>

         {/* Tabla */}
         <ReservasTable rows={rowsForTable} loading={loading} />
      </div>
   );
}
