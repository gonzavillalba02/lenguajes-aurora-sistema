import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarPlus, MessageCircle, Plus, RefreshCcw } from "lucide-react";

import Button from "../../components/Button";
import KpiCard from "../../components/KpiCard";

import CreateReservaModal from "./components/CreateReservaModal";
import ReservaDetailsModal from "./components/ReservaDetailsModal";
import HabitacionDetailsModal from "./components/HabitacionDetailsModal";

import { fetchReservasAll } from "../../services/reservas.service";
import {
   fetchHabitaciones,
   fetchTiposHabitacionResumen,
} from "../../services/habitacion.service";
import { ConsultasService } from "../../services/consultas.service";

import type { HabitacionDomain } from "../../types/habitacion.types";
import type { ReservaDomain } from "../../types/reserva.types";
import type { ISODateString } from "../../types/core";

import { isRoomOccupiedInRange } from "../../lib/dateRange";

// =============== Helpers de formato ===============
function fmt(d: Date) {
   return d.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit" });
}
function toISO(d: Date): ISODateString {
   return d.toISOString().slice(0, 10) as ISODateString;
}
const currency = new Intl.NumberFormat("es-AR", {
   style: "currency",
   currency: "ARS",
   maximumFractionDigits: 0,
});

// =============== Donut (sin libs) ===============
function Donut({
   libres,
   ocupadas,
   cerradas,
}: {
   libres: number;
   ocupadas: number;
   cerradas: number;
}) {
   const total = Math.max(libres + ocupadas + cerradas, 1);
   const pL = libres / total;
   const pO = ocupadas / total;
   const pC = cerradas / total;

   // círculo base
   const R = 60;
   const C = 2 * Math.PI * R;
   const seg = (p: number) => Math.max(0.001, p * C); // evita gap 0

   // offsets (SVG dibuja en sentido horario)
   const sL = seg(pL);
   const sO = seg(pO);
   const sC = seg(pC);

   return (
      <div className="flex items-center gap-6">
         <svg width="160" height="160" viewBox="0 0 160 160">
            <g transform="translate(80,80) rotate(-90)">
               {/* fondo */}
               <circle
                  r={R}
                  fill="none"
                  stroke="var(--color-bg2,#1F2633)"
                  strokeWidth="18"
               />
               {/* Libres */}
               <circle
                  r={R}
                  fill="none"
                  stroke="var(--color-hab-libre,#16a34a)"
                  strokeWidth="18"
                  strokeDasharray={`${sL} ${C - sL}`}
                  strokeDashoffset={0}
               />
               {/* Ocupadas */}
               <circle
                  r={R}
                  fill="none"
                  stroke="var(--color-hab-ocupada,#d97706)"
                  strokeWidth="18"
                  strokeDasharray={`${sO} ${C - sO}`}
                  strokeDashoffset={-sL}
               />
               {/* Cerradas */}
               <circle
                  r={R}
                  fill="none"
                  stroke="var(--color-hab-cerrada,#ef4444)"
                  strokeWidth="18"
                  strokeDasharray={`${sC} ${C - sC}`}
                  strokeDashoffset={-(sL + sO)}
               />
            </g>
         </svg>

         <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
               <i className="inline-block size-3 rounded-sm bg-habitacion-libre" />{" "}
               Libres: <span className="font-semibold">{libres}</span>
            </div>
            <div className="flex items-center gap-2">
               <i className="inline-block size-3 rounded-sm bg-habitacion-ocupada" />{" "}
               Ocupadas: <span className="font-semibold">{ocupadas}</span>
            </div>
            <div className="flex items-center gap-2">
               <i className="inline-block size-3 rounded-sm bg-habitacion-cerrada" />{" "}
               Cerradas: <span className="font-semibold">{cerradas}</span>
            </div>
         </div>
      </div>
   );
}

// =============== Listado compacto ===============
function MiniList({
   title,
   items,
   empty,
   onOpenReserva,
}: {
   title: string;
   items: Array<{
      id: number;
      cliente: string;
      hab: number;
      desde?: Date;
      hasta?: Date;
   }>;
   empty: string;
   onOpenReserva: (id: number) => void;
}) {
   return (
      <section className="card">
         <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-bg/30">
            <h3 className="text-white font-medium">{title}</h3>
         </div>
         <div className="p-4">
            {items.length === 0 ? (
               <div className="text-sm text-white/70">{empty}</div>
            ) : (
               <ul className="space-y-2">
                  {items.map((x) => (
                     <li
                        key={x.id}
                        className="flex items-center justify-between rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm"
                     >
                        <div className="truncate">
                           <span className="font-medium text-white">
                              {x.cliente}
                           </span>{" "}
                           <span className="text-white/60">— Hab. {x.hab}</span>
                        </div>
                        <div className="flex items-center gap-3 text-white/70">
                           {x.desde && <span>In: {fmt(x.desde)}</span>}
                           {x.hasta && <span>Out: {fmt(x.hasta)}</span>}
                           <Button
                              variant="ghost"
                              onClick={() => onOpenReserva(x.id)}
                           >
                              Ver
                           </Button>
                        </div>
                     </li>
                  ))}
               </ul>
            )}
         </div>
      </section>
   );
}

// =============== Info rápida de tipos (al lado del donut) ===============
function TiposQuickInfo({
   tipos,
}: {
   tipos: Array<{
      id: number;
      label: string;
      cantidad: number;
      precio_noche: number;
   }>;
}) {
   if (!tipos?.length) {
      return (
         <div className="text-sm text-white/70">Sin información de tipos.</div>
      );
   }

   return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
         {tipos.map((t) => (
            <div
               key={t.id}
               className="rounded-lg bg-white/5 border border-white/10 p-3"
            >
               <div className="text-xs text-white/60">{t.label}</div>
               <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-white font-semibold">{t.cantidad}</span>
                  <span className="text-white/70 text-sm">
                     • {currency.format(t.precio_noche)}
                  </span>
               </div>
            </div>
         ))}
      </div>
   );
}

// ===================== Componente =====================
export default function Dashboard() {
   const [, setLoading] = useState(true);

   const [habs, setHabs] = useState<HabitacionDomain[]>([]);
   const [reservas, setReservas] = useState<ReservaDomain[]>([]);

   const [consultasPendientes, setConsultasPendientes] = useState(0);

   // modales
   const [showCreate, setShowCreate] = useState(false);
   const [showReservaDetail, setShowReservaDetail] = useState(false);
   const [selectedReservaId, setSelectedReservaId] = useState<number | null>(
      null
   );

   const [showRoomModal, setShowRoomModal] = useState(false);
   const [selectedRoom] = useState<HabitacionDomain | null>(null);

   const [tiposResumen, setTiposResumen] = useState<
      Array<{
         id: number;
         label: string;
         cantidad: number;
         precio_noche: number;
      }>
   >([]);

   const hoyISO = toISO(new Date());

   const refresh = useCallback(async () => {
      setLoading(true);
      try {
         const [allReservas, allHabs, consultasGrouped, tipos] =
            await Promise.all([
               fetchReservasAll(),
               fetchHabitaciones(),
               ConsultasService.fetchGrouped(), // { kpi: { pendientes, respondidas }, ... }
               (async () => {
                  try {
                     const res = await fetchTiposHabitacionResumen();
                     return res;
                  } catch {
                     return null; // => fallback abajo
                  }
               })(),
            ]);

         setReservas(allReservas);
         setHabs(allHabs);
         setConsultasPendientes(consultasGrouped?.kpi?.pendientes ?? 0);

         if (tipos && Array.isArray(tipos)) {
            setTiposResumen(
               tipos.map((t) => ({
                  id: t.id,
                  label: t.label,
                  cantidad: t.cantidad,
                  precio_noche: t.precio_noche,
               }))
            );
         } else {
            // Fallback: agrupar por tipo desde habs (solo activas) y tomar un precio de referencia
            const map = new Map<
               string,
               {
                  id: number;
                  label: string;
                  cantidad: number;
                  precio_noche: number;
               }
            >();
            for (const h of allHabs) {
               if (!h.activa || !h.disponible) continue;

               const key = String(h.tipo_id ?? h.tipo);
               const current = map.get(key);
               const precio = h.precioNoche ?? 0;
               if (!current) {
                  map.set(key, {
                     id: Number(h.tipo_id ?? 0),
                     label: h.tipo || `Tipo ${h.tipo_id ?? ""}`,
                     cantidad: 1,
                     precio_noche: precio,
                  });
               } else {
                  current.cantidad += 1;
                  if (!current.precio_noche && precio)
                     current.precio_noche = precio;
               }
            }
            setTiposResumen(
               Array.from(map.values()).sort((a, b) => a.id - b.id)
            );
         }
      } finally {
         setLoading(false);
      }
   }, []);

   useEffect(() => {
      let canceled = false;
      (async () => {
         await refresh();
         if (canceled) return;
      })();
      return () => {
         canceled = true;
      };
   }, [refresh]);
   const isEliminada = (h: Pick<HabitacionDomain, "activa" | "disponible">) =>
      h.activa === false && h.disponible === false;
   // ======= Disponibilidad del momento (HOY) =======
   const availability = useMemo(() => {
      const hoy = hoyISO;

      // Alineamos con HabitacionesOperador: contar SOLO visibles (activa y no eliminada)
      const visibles = habs.filter((h) => h.activa === true && !isEliminada(h));

      // Cerrada = NO disponible (bloqueada por operador)
      const cerradas = visibles.filter((h) => !h.disponible).length;

      // Ocupada hoy = disponible && overlap con hoy
      const ocupadas = visibles.filter((h) => {
         if (!h.disponible) return false;
         return isRoomOccupiedInRange(h.id, reservas, hoy, hoy);
      }).length;

      const libres = Math.max(visibles.length - cerradas - ocupadas, 0);

      return {
         libres,
         ocupadas,
         cerradas,
         total: visibles.length, // también alinea el denominador de “Ocupación real (hoy)”
      };
   }, [habs, reservas, hoyISO]);

   // ======= Check-ins / Check-outs de HOY (solo aprobadas) =======
   const { checkinsHoy, checkoutsHoy } = useMemo(() => {
      const inToday = reservas
         .filter(
            (r) => r.estado === "aprobada" && toISO(r.rango.desde) === hoyISO
         )
         .sort((a, b) => a.habitacion.numero - b.habitacion.numero)
         .map((r) => ({
            id: r.id,
            cliente: `${r.cliente.apellido}, ${r.cliente.nombre}`,
            hab: r.habitacion.numero || r.habitacion.id,
            desde: r.rango.desde,
         }));

      const outToday = reservas
         .filter(
            (r) => r.estado === "aprobada" && toISO(r.rango.hasta) === hoyISO
         )
         .sort((a, b) => a.habitacion.numero - b.habitacion.numero)
         .map((r) => ({
            id: r.id,
            cliente: `${r.cliente.apellido}, ${r.cliente.nombre}`,
            hab: r.habitacion.numero || r.habitacion.id,
            hasta: r.rango.hasta,
         }));

      return { checkinsHoy: inToday, checkoutsHoy: outToday };
   }, [reservas, hoyISO]);

   return (
      <>
         <div className="space-y-6">
            {/* Acciones rápidas */}
            <div className="flex flex-wrap items-center gap-2">
               <Button onClick={() => setShowCreate(true)}>
                  <Plus className="size-4 mr-1" /> Crear Reserva
               </Button>
               <Button
                  variant="ghost"
                  onClick={() =>
                     window.location.assign("/operador/habitaciones")
                  }
               >
                  <CalendarPlus className="size-4 mr-1" /> Ver Habitaciones
               </Button>
               <Button
                  variant="ghost"
                  onClick={() => window.location.assign("/operador/consultas")}
               >
                  <MessageCircle className="size-4 mr-1" /> Ver Consultas
               </Button>
               <div className="grow" />
               <Button variant="ghost" onClick={refresh}>
                  <RefreshCcw className="size-4" />
               </Button>
            </div>

            {/* KPIs de HOY */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
               <KpiCard
                  label="Libres"
                  value={availability.libres}
                  variant="libres"
               />
               <KpiCard
                  label="Ocupadas"
                  value={availability.ocupadas}
                  variant="ocupadas"
               />
               <KpiCard
                  label="Cerradas"
                  value={availability.cerradas}
                  variant="cerradas"
               />
               <KpiCard
                  label="Consultas Pendientes"
                  value={consultasPendientes}
                  variant="consultas"
               />
               <KpiCard
                  label="Check-ins hoy"
                  value={checkinsHoy.length}
                  variant="total"
               />
            </div>

            {/* Distribución actual */}
            <section className="card">
               <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-bg/30">
                  <h2 className="text-white font-medium">
                     Disponibilidad actual
                  </h2>
               </div>
               <div className="p-4 flex flex-col sm:flex-row sm:items-start gap-6">
                  <Donut
                     libres={availability.libres}
                     ocupadas={availability.ocupadas}
                     cerradas={availability.cerradas}
                  />

                  <div className="flex-1 space-y-4">
                     <TiposQuickInfo tipos={tiposResumen} />

                     {/* pie de resumen */}
                     <div className="flex items-center justify-between gap-6 text-sm text-white/70">
                        <p>
                           Total habitaciones:{" "}
                           <span className="text-white font-semibold">
                              {availability.total}
                           </span>
                        </p>
                        <p className="mt-1">
                           Fecha de hoy:{" "}
                           <span className="text-white font-semibold">
                              {fmt(new Date())}
                           </span>
                        </p>
                        <p className="mt-1">
                           Ocupación real (hoy):{" "}
                           <span className="text-white font-semibold">
                              {availability.total
                                 ? Math.round(
                                      (availability.ocupadas /
                                         availability.total) *
                                         100
                                   )
                                 : 0}
                              %
                           </span>
                        </p>
                     </div>
                  </div>
               </div>
            </section>

            {/* Listas clave del día */}
            <div className="grid lg:grid-cols-2 gap-6">
               <MiniList
                  title="Entradas (check-ins) de hoy"
                  items={checkinsHoy}
                  empty="No hay entradas programadas para hoy."
                  onOpenReserva={(id) => {
                     setSelectedReservaId(id);
                     setShowReservaDetail(true);
                  }}
               />
               <MiniList
                  title="Salidas (check-outs) de hoy"
                  items={checkoutsHoy}
                  empty="No hay salidas programadas para hoy."
                  onOpenReserva={(id) => {
                     setSelectedReservaId(id);
                     setShowReservaDetail(true);
                  }}
               />
            </div>
         </div>

         {/* Modales (reutilizamos los existentes) */}
         <CreateReservaModal
            open={showCreate}
            onClose={() => setShowCreate(false)}
            onCreated={refresh}
         />

         <ReservaDetailsModal
            open={showReservaDetail}
            reservaId={selectedReservaId}
            onClose={() => setShowReservaDetail(false)}
            onChanged={refresh}
         />

         <HabitacionDetailsModal
            open={showRoomModal}
            room={selectedRoom}
            onClose={() => setShowRoomModal(false)}
            onChanged={refresh}
            // para este dashboard no pasamos rango ni reservas; el modal ya calcula HOY correctamente
         />
      </>
   );
}
