// src/pages/operador/Dashboard.tsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { RefreshCcw, Search } from "lucide-react";

import Button from "../../components/Button";
import Input from "../../components/Input";
import KpiCard from "./components/KpiCard";
import ReservasTable from "./components/ReservasTable";
import RoomsGrid from "./components/RoomsGrid";

import CreateReservaModal from "./components/CreateReservaModal";
import ReservaDetailsModal from "./components/ReservaDetailsModal";
import HabitacionDetailsModal from "./components/HabitacionDetailsModal";

import {
   fetchReservasAll,
   fetchReservasPendientes,
   contarPorEstado,
} from "../../services/reservas.service";
import { fetchHabitaciones } from "../../services/habitacion.service";
import { ConsultasService } from "../../services/consultas.service";

import type { ISODateString } from "../../types/core";
import type { HabitacionDomain, HabStatus } from "../../types/habitacion.types";
import type { ReservaDomain } from "../../types/reserva.types";
import { RESERVA_LABEL } from "../../types/reserva.types";
import type { KpiSummary } from "../../types/ui.types";
import { isRoomOccupiedInRange } from "../../lib/dateRange";

// ===================== Componente =====================
export default function Dashboard() {
   const [loading, setLoading] = useState(true);

   // Pendientes para la tabla
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

   // Datos crudos para derivar UI
   const [habsDomain, setHabsDomain] = useState<HabitacionDomain[]>([]);
   const [reservas, setReservas] = useState<ReservaDomain[]>([]);

   // Mapa (rooms para RoomsGrid)
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
      consultasPendientes: 0, // 👈 nuevo campo
   });

   // Búsqueda tabla pendientes
   const [q, setQ] = useState("");

   // Modales
   const [showCreate, setShowCreate] = useState(false);
   const [showDetail, setShowDetail] = useState(false);
   const [selectedId, setSelectedId] = useState<number | null>(null);

   const [showRoomModal, setShowRoomModal] = useState(false);
   const [selectedRoom, setSelectedRoom] = useState<HabitacionDomain | null>(
      null
   );

   // Filtro de fechas para el mapa de habitaciones
   const todayISO = new Date().toISOString().slice(0, 10);
   const tomorrowISO = new Date(Date.now() + 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
   const [mapFrom, setMapFrom] = useState<ISODateString>(todayISO);
   const [mapTo, setMapTo] = useState<ISODateString>(tomorrowISO);

   // Tabla: filtro local por búsqueda
   const filteredRows = useMemo(() => {
      const term = q.trim().toLowerCase();
      if (!term) return rows;
      return rows.filter((x) =>
         `${x.cliente} ${x.tipoHabitacion} ${x.habitacionNumero}`
            .toLowerCase()
            .includes(term)
      );
   }, [rows, q]);

   // Construir Rooms según rango seleccionado y reservas
   const buildRoomsForRange = useCallback(
      (
         habs: HabitacionDomain[],
         rs: ReservaDomain[],
         fromISO: ISODateString,
         toISO: ISODateString
      ) => {
         const next = habs.map((h) => {
            if (!h.activa)
               return {
                  id: h.id,
                  numero: h.numero,
                  status: "Cerrada" as HabStatus,
               };
            const ocupada = isRoomOccupiedInRange(h.id, rs, fromISO, toISO);
            return {
               id: h.id,
               numero: h.numero,
               status: (ocupada ? "Ocupada" : "Libre") as HabStatus,
            };
         });
         setRooms(next);
      },
      []
   );

   const refresh = useCallback(async () => {
      setLoading(true);
      try {
         const [allReservas, pendientes, habs, consultasGrouped] =
            await Promise.all([
               fetchReservasAll(),
               fetchReservasPendientes(6),
               fetchHabitaciones(),
               // 👇 trae { pendientes, respondidas, kpi }
               ConsultasService.fetchGrouped(),
            ]);

         setHabsDomain(habs);
         setReservas(allReservas);

         // KPIs reservas / habitaciones
         const c = contarPorEstado(allReservas);
         const habitacionesDisponibles = habs.filter(
            (h) => h.activa && h.disponible
         ).length;

         const consultasPendientes = consultasGrouped.kpi.pendientes ?? 0;

         setSummary({
            pendientesVerificacion: c.pendiente_verificacion ?? 0,
            pendientesPago: c.pendiente_pago ?? 0,
            aprobadas: c.aprobada ?? 0,
            rechazadas: c.rechazada ?? 0,
            canceladas: c.cancelada ?? 0,
            habitacionesDisponibles,
            consultasPendientes, // 👈 nuevo
         });

         // Tabla (pendientes)
         setRows(
            pendientes.map((r) => ({
               id: r.id,
               cliente: `${r.cliente.apellido}, ${r.cliente.nombre}`,
               fechaInicio: r.rango.desde.toISOString(),
               fechaFin: r.rango.hasta.toISOString(),
               habitacionNumero: r.habitacion.numero || r.habitacion.id,
               tipoHabitacion: r.habitacion.tipo,
               // ✅ Label desde el mapa centralizado
               status: RESERVA_LABEL[r.estado] as
                  | "Pendiente"
                  | "Pendiente de pago"
                  | "Aprobada"
                  | "Rechazada"
                  | "Cancelada",
            }))
         );

         // Rooms en base a rango seleccionado
         buildRoomsForRange(habs, allReservas, mapFrom, mapTo);
      } catch (err) {
         console.error("Error cargando dashboard:", err);
      } finally {
         setLoading(false);
      }
   }, [buildRoomsForRange, mapFrom, mapTo]);

   // Primera carga
   useEffect(() => {
      let cancelled = false;
      (async () => {
         await refresh();
         if (cancelled) return;
      })();
      return () => {
         cancelled = true;
      };
   }, [refresh]);

   // Recalcular mapa cuando cambian fechas o datos crudos (sin llamar al back)
   useEffect(() => {
      if (!habsDomain.length || !reservas.length) return;
      buildRoomsForRange(habsDomain, reservas, mapFrom, mapTo);
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [mapFrom, mapTo, habsDomain, reservas]);

   return (
      <>
         <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               <KpiCard
                  label="Total de Reservas Pendientes"
                  value={
                     summary.pendientesVerificacion + summary.pendientesPago
                  }
                  variant="pendienteReserva"
                  active
               />
               <KpiCard
                  label="Consultas Pendientes"
                  value={summary.consultasPendientes} // 👈 antes era "—"
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
               {/* Reservas pendientes */}
               <section className="card overflow-hidden">
                  <Header title="Reservas Pendientes">
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

                        <Button onClick={() => setShowCreate(true)}>
                           + Crear Reserva
                        </Button>
                     </div>
                  </Header>

                  <div className="px-4 pb-4">
                     <ReservasTable
                        rows={filteredRows}
                        loading={loading}
                        onRowClick={(id) => {
                           setSelectedId(id);
                           setShowDetail(true);
                        }}
                     />
                  </div>
               </section>

               {/* Mapa de habitaciones */}
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
                                 setHabsDomain(habs);
                                 buildRoomsForRange(
                                    habs,
                                    reservas,
                                    mapFrom,
                                    mapTo
                                 );
                              } finally {
                                 setLoading(false);
                              }
                           }}
                        >
                           <RefreshCcw className="size-4" />
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
                        <RoomsGrid
                           rooms={rooms}
                           onSelect={(r) => {
                              const found =
                                 habsDomain.find((h) => h.id === r.id) || null;
                              setSelectedRoom(found);
                              setShowRoomModal(true);
                           }}
                        />
                     )}

                     {/*  Filtro de fechas DEBAJO del grid */}
                     <div className="mt-4 flex flex-col items-center gap-2">
                        <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                           <div className="flex items-center gap-1">
                              <span className="text-white/60">Desde</span>
                              <input
                                 type="date"
                                 className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs"
                                 value={mapFrom}
                                 onChange={(e) =>
                                    setMapFrom(e.target.value as ISODateString)
                                 }
                              />
                           </div>
                           <div className="flex items-center gap-1">
                              <span className="text-white/60">Hasta</span>
                              <input
                                 type="date"
                                 className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs"
                                 value={mapTo}
                                 onChange={(e) =>
                                    setMapTo(e.target.value as ISODateString)
                                 }
                              />
                           </div>
                           <Button
                              variant="ghost"
                              onClick={() => {
                                 const t = new Date();
                                 const n = new Date(
                                    Date.now() + 24 * 60 * 60 * 1000
                                 );
                                 setMapFrom(
                                    t
                                       .toISOString()
                                       .slice(0, 10) as ISODateString
                                 );
                                 setMapTo(
                                    n
                                       .toISOString()
                                       .slice(0, 10) as ISODateString
                                 );
                              }}
                           >
                              Hoy
                           </Button>
                        </div>{" "}
                     </div>
                  </div>
               </section>
            </div>
         </div>

         {/* Modales */}
         <CreateReservaModal
            open={showCreate}
            onClose={() => setShowCreate(false)}
            onCreated={refresh}
         />

         <ReservaDetailsModal
            open={showDetail}
            reservaId={selectedId}
            onClose={() => setShowDetail(false)}
            onChanged={refresh}
         />

         <HabitacionDetailsModal
            open={showRoomModal}
            room={selectedRoom}
            onClose={() => setShowRoomModal(false)}
            onChanged={refresh}
            range={{ from: mapFrom, to: mapTo }}
            reservas={reservas}
         />
      </>
   );
}

// =============== Subcomponentes locales ===============
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
