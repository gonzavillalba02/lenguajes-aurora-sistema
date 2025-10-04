import { useEffect, useMemo, useState } from "react";
import { RefreshCcw, Search } from "lucide-react";

import Button from "../../components/Button";
import Input from "../../components/Input";
import KpiCard from "./components/KpiCard";
import ReservasTable from "./components/ReservasTable";
import RoomsGrid from "./components/RoomsGrid";

import type { HabStatus, KpiSummary } from "../../types/types";
import {
   fetchReservasAll,
   fetchReservasPendientes,
   contarPorEstado,
} from "../../services/reservas.service";
import { fetchHabitaciones } from "../../services/habitacion.service";

// ========== helpers UI (solo mapping a los componentes actuales) ==========
function estadoLabel(
   e:
      | "pendiente_verificacion"
      | "pendiente_pago"
      | "aprobada"
      | "rechazada"
      | "cancelada"
) {
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

// ========== COMPONENTE ==========
export default function Dashboard() {
   const [loading, setLoading] = useState(true);

   // Tabla reservas pendientes (como la espera tu ReservasTable)
   const [rows, setRows] = useState<
      Array<{
         id: number;
         cliente: string;
         fechaInicio: string; // ISO
         fechaFin: string; // ISO
         habitacionNumero: number;
         tipoHabitacion: string;
         status:
            | "Pendiente"
            | "Pendiente de pago"
            | "Aprobada"
            | "Rechazada"
            | "Cancelada";
      }>
   >([]);

   // Mapa habitaciones
   const [rooms, setRooms] = useState<
      Array<{ id: number; numero: number; status: HabStatus }>
   >([]);

   // KPIs
   const [summary, setSummary] = useState<KpiSummary>({
      pendientesVerificacion: 0,
      pendientesPago: 0,
      aprobadas: 0,
      rechazadas: 0,
      canceladas: 0,
      habitacionesDisponibles: 0,
   });

   const [q, setQ] = useState("");

   useEffect(() => {
      let cancelled = false;
      (async () => {
         setLoading(true);
         try {
            // Traemos todo para KPIs + pendientes para tabla + habitaciones
            const [allReservas, pendientes, habs] = await Promise.all([
               fetchReservasAll(),
               fetchReservasPendientes(6),
               fetchHabitaciones(),
            ]);
            if (cancelled) return;

            // --- KPIs ---
            const c = contarPorEstado(allReservas);
            const habitacionesDisponibles = habs.filter(
               (h) => h.activa && h.disponible
            ).length;
            setSummary({
               pendientesVerificacion: c.pendiente_verificacion ?? 0,
               pendientesPago: c.pendiente_pago ?? 0,
               aprobadas: c.aprobada ?? 0,
               rechazadas: c.rechazada ?? 0,
               canceladas: c.cancelada ?? 0,
               habitacionesDisponibles,
            });

            // --- Tabla (rows) mapeo Domain -> estructura de ReservasTable ---
            setRows(
               pendientes.map((r) => ({
                  id: r.id,
                  cliente: `${r.cliente.apellido}, ${r.cliente.nombre}`,
                  fechaInicio: r.rango.desde.toISOString(),
                  fechaFin: r.rango.hasta.toISOString(),
                  habitacionNumero: r.habitacion.numero || r.habitacion.id,
                  tipoHabitacion: r.habitacion.tipo,
                  status: estadoLabel(r.estado),
               }))
            );

            // --- Rooms (Domain -> RoomsGrid) ---
            setRooms(
               habs.map((h) => ({
                  id: h.id,
                  numero: h.numero,
                  status: !h.activa
                     ? "Cerrada"
                     : h.disponible
                     ? "Libre"
                     : "Ocupada",
               }))
            );
         } catch (err) {
            console.error("Error cargando dashboard:", err);
         } finally {
            if (!cancelled) setLoading(false);
         }
      })();
      return () => {
         cancelled = true;
      };
   }, []);

   // Filtro local para la tabla
   const filtered = useMemo(() => {
      const term = q.trim().toLowerCase();
      if (!term) return rows;
      return rows.filter((x) =>
         `${x.cliente} ${x.tipoHabitacion} ${x.habitacionNumero}`
            .toLowerCase()
            .includes(term)
      );
   }, [rows, q]);

   return (
      <div className="space-y-6">
         {/* KPIs */}
         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard
               label="Total de Reservas Pendientes"
               value={summary.pendientesPago + summary.pendientesPago} // o summary.pendientesVerificacion + summary.pendientesPago
               variant="pendienteReserva"
               active // borde azul como en tu captura
            />
            <KpiCard
               label="Total de Consultas"
               value="—" // listo para conectar cuando traigas el dato
               variant="consultas"
            />
            <KpiCard
               label="Disponibilidad de Habitaciones"
               value={summary.habitacionesDisponibles}
               variant="disponibles"
            />
         </div>

         {/* Paneles */}
         <div className="grid lg:grid-cols-2 gap-6">
            <section className="card overflow-hidden">
               <Header title="Reservas Pendientes ">
                  <div className="flex items-center gap-2">
                     <div className="relative">
                        <Search className="size-4 absolute left-2 top-2.5 text-white/40" />
                        <Input
                           placeholder="Buscar cliente / hab."
                           value={q}
                           onChange={(e) => setQ(e.target.value)}
                           style={{ paddingLeft: "2rem" }}
                        />
                     </div>
                  </div>
               </Header>
               <div className="px-4 pb-4">
                  <ReservasTable rows={filtered} loading={loading} />
               </div>
            </section>

            <section className="card">
               <Header title="Mapa de Habitaciones">
                  <div className="flex items-center gap-3">
                     <Legend />
                     <Button
                        variant="ghost"
                        onClick={async () => {
                           setLoading(true);
                           try {
                              const habs = await fetchHabitaciones();
                              setRooms(
                                 habs.map((h) => ({
                                    id: h.id,
                                    numero: h.numero,
                                    status: !h.activa
                                       ? "Cerrada"
                                       : h.disponible
                                       ? "Libre"
                                       : "Ocupada",
                                 }))
                              );
                           } finally {
                              setLoading(false);
                           }
                        }}
                     >
                        <RefreshCcw className="size-4" /> Actualizar
                     </Button>
                  </div>
               </Header>
               <div className="px-4 pb-5">
                  {loading ? (
                     <div className="grid grid-cols-8 gap-2 p-2">
                        {Array.from({ length: 48 }).map((_, i) => (
                           <div
                              key={i}
                              className="h-8 rounded-lg bg-white/5 animate-pulse"
                           />
                        ))}
                     </div>
                  ) : (
                     <RoomsGrid rooms={rooms} />
                  )}
                  <div className="mt-4 text-center text-xs text-white/50">
                     {new Date().toLocaleDateString()} -{" "}
                     {new Date(
                        Date.now() + 1000 * 60 * 60 * 24 * 25
                     ).toLocaleDateString()}
                  </div>
               </div>
            </section>
         </div>
      </div>
   );
}
//Encabezado de paneles
function Header({
   title,
   children,
}: {
   title: string;
   children?: React.ReactNode;
}) {
   return (
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-bg/30">
         <h2 className="text-white font-medium">{title}</h2>
         <div className="flex items-center gap-2">{children}</div>
      </div>
   );
}
//Puntos de la leyenda
function Legend() {
   return (
      <div className="hidden sm:flex items-center gap-3 text-xs">
         <span className="inline-flex items-center gap-1">
            <i className="inline-block size-3 rounded-sm bg-habitacion-libre" />{" "}
            Libre
         </span>
         <span className="inline-flex items-center gap-1">
            <i className="inline-block size-3 rounded-sm bg-habitacion-ocupada" />{" "}
            Ocupada
         </span>
         <span className="inline-flex items-center gap-1">
            <i className="inline-block size-3 rounded-sm bg-habitacion-cerrada" />{" "}
            Cerrada
         </span>
      </div>
   );
}
