// src/pages/admin/Habitaciones.tsx
import { useEffect, useMemo, useState } from "react";
import KpiCard from "../../components/KpiCard";
import RoomsGrid from "./components/RoomsGrid";
import HabitacionDetailsModal from "../operador/components/HabitacionDetailsModal";

import type { ISODateString } from "../../types/core";
import type {
   HabStatus,
   HabitacionDomain,
   RoomVM as RoomVMBase,
} from "../../types/habitacion.types";
import type { ReservaDomain } from "../../types/reserva.types";
import { fetchHabitaciones } from "../../services/habitacion.service";
import { fetchReservasAll } from "../../services/reservas.service";

// ✅ Utilidades unificadas de rango/solape
import { isRoomOccupiedInRange } from "../../lib/dateRange";

// Extiende el VM base solo para agregar el "tipo" opcional en esta vista
type RoomVM = RoomVMBase & { tipo?: string };

export default function Habitaciones() {
   const [loading, setLoading] = useState(true);
   const [habitaciones, setHabitaciones] = useState<HabitacionDomain[]>([]);
   const [reservas, setReservas] = useState<ReservaDomain[]>([]);

   // Filtros superiores (texto/tipo/estado)
   const [q, setQ] = useState("");
   const [estado, setEstado] = useState<HabStatus | "">("");
   const [tipo, setTipo] = useState<string>("");

   // Filtro de fechas (arriba a la derecha)
   const todayISO = new Date().toISOString().slice(0, 10) as ISODateString;
   const tomorrowISO = new Date(Date.now() + 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10) as ISODateString;
   const [from, setFrom] = useState<ISODateString>(todayISO);
   const [to, setTo] = useState<ISODateString>(tomorrowISO);

   // Modal detalle
   const [showRoomModal, setShowRoomModal] = useState(false);
   const [selectedRoom, setSelectedRoom] = useState<HabitacionDomain | null>(
      null
   );

   // Carga inicial
   useEffect(() => {
      (async () => {
         setLoading(true);
         try {
            const [habs, rs] = await Promise.all([
               fetchHabitaciones(),
               fetchReservasAll(),
            ]);
            setHabitaciones(Array.isArray(habs) ? habs : []);
            setReservas(Array.isArray(rs) ? rs : []);
         } finally {
            setLoading(false);
         }
      })();
   }, []);

   // VM por rango: calcula Libre/Ocupada/Cerrada según reservas + fechas (misma regla que modal)
   const roomsByRange: RoomVM[] = useMemo(() => {
      if (!habitaciones.length) return [];
      const hoyISO = new Date().toISOString().slice(0, 10) as ISODateString;

      return habitaciones.map((h) => {
         // CERRADA = no disponible
         if (!h.disponible) {
            return {
               id: h.id,
               numero: h.numero,
               status: "Cerrada" as HabStatus,
               tipo: h.tipo,
            };
         }

         // OCUPADA HOY
         const ocupadaHoy = isRoomOccupiedInRange(
            h.id,
            reservas,
            hoyISO,
            hoyISO
         );

         return {
            id: h.id,
            numero: h.numero,
            status: (ocupadaHoy ? "Ocupada" : "Libre") as HabStatus,
            tipo: h.tipo,
         };
      });
   }, [habitaciones, reservas]);

   // KPIs en base al rango
   const kpis = useMemo(() => {
      const base = { libres: 0, ocupadas: 0, cerradas: 0 };
      for (const r of roomsByRange) {
         if (r.status === "Libre") base.libres++;
         else if (r.status === "Ocupada") base.ocupadas++;
         else base.cerradas++;
      }
      return { ...base, total: roomsByRange.length };
   }, [roomsByRange]);

   // Tipos disponibles para select
   const tiposDisponibles = useMemo(
      () =>
         Array.from(
            new Set(habitaciones.map((h) => h.tipo).filter(Boolean))
         ).sort(),
      [habitaciones]
   );

   // Filtro UI (texto/tipo/estado) sobre el VM por rango
   const filtered: RoomVM[] = useMemo(() => {
      return roomsByRange.filter((r) => {
         const matchesQ = !q || String(r.numero).includes(q);
         const matchesEstado = !estado || r.status === estado;
         const matchesTipo =
            !tipo || (r.tipo ?? "").toLowerCase() === tipo.toLowerCase();
         return matchesQ && matchesEstado && matchesTipo;
      });
   }, [roomsByRange, q, estado, tipo]);

   return (
      <div className="flex flex-col gap-6">
         {/* KPIs */}
         <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiCard label="Libres" value={kpis.libres} variant="libres" />
            <KpiCard
               label="Ocupadas"
               value={kpis.ocupadas}
               variant="ocupadas"
            />
            <KpiCard
               label="Cerradas"
               value={kpis.cerradas}
               variant="cerradas"
            />
            <KpiCard label="Total" value={kpis.total} variant="total" />
         </div>

         {/* Filtros superiores (incluye fechas a la derecha) */}
         <div className="rounded-[var(--radius-xl2)] bg-bg2/60 border border-white/10 p-4 flex flex-wrap items-center gap-3">
            <input
               value={q}
               onChange={(e) => setQ(e.target.value)}
               placeholder="Buscar (número)"
               className="rounded-[var(--radius-xl2)] bg-bg2 px-3 py-2 text-sm text-text placeholder-white/50 border border-white/10 focus:outline-none focus:ring-2 focus:ring-button/40"
            />

            <select
               value={tipo}
               onChange={(e) => setTipo(e.target.value)}
               className="rounded-[var(--radius-xl2)] bg-bg2 px-3 py-2 text-sm text-text border border-white/10 focus:outline-none focus:ring-2 focus:ring-button/40"
            >
               <option value="">Todos los tipos</option>
               {tiposDisponibles.map((t) => (
                  <option key={t} value={t}>
                     {prettyType(t)}
                  </option>
               ))}
            </select>

            <select
               value={estado}
               onChange={(e) => setEstado(e.target.value as HabStatus | "")}
               className="rounded-[var(--radius-xl2)] bg-bg2 px-3 py-2 text-sm text-text border border-white/10 focus:outline-none focus:ring-2 focus:ring-button/40"
            >
               <option value="">Todos los Estados</option>
               <option value="Libre">Libre</option>
               <option value="Ocupada">Ocupada</option>
               <option value="Cerrada">Cerrada</option>
            </select>

            {/* ⬅️ empuja el grupo de fechas hacia la derecha */}
            <div className="grow" />

            {/* Fechas al costado derecho (envuelven bien en móvil) */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
               <div className="flex items-center gap-1">
                  <span className="text-white/60">Desde</span>
                  <input
                     type="date"
                     value={from}
                     onChange={(e) => setFrom(e.target.value as ISODateString)}
                     className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs"
                  />
               </div>
               <div className="flex items-center gap-1">
                  <span className="text-white/60">Hasta</span>
                  <input
                     type="date"
                     value={to}
                     onChange={(e) => setTo(e.target.value as ISODateString)}
                     className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs"
                  />
               </div>
               <button
                  className="rounded px-2 py-1 border border-white/10 bg-white/5 text-xs hover:bg-white/10"
                  onClick={() => {
                     const t = new Date();
                     const n = new Date(Date.now() + 24 * 60 * 60 * 1000);
                     setFrom(t.toISOString().slice(0, 10) as ISODateString);
                     setTo(n.toISOString().slice(0, 10) as ISODateString);
                  }}
               >
                  Hoy
               </button>
            </div>
         </div>

         {/* Grid */}
         <div className="rounded-[var(--radius-xl2)] bg-bg2/60 border border-white/10">
            {loading ? (
               <div className="p-6 grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-10 gap-2">
                  {Array.from({ length: 60 }).map((_, i) => (
                     <div
                        key={i}
                        className="h-9 rounded-lg bg-white/5 animate-pulse"
                     />
                  ))}
               </div>
            ) : (
               <RoomsGrid
                  rooms={filtered}
                  onSelect={(r) => {
                     const found =
                        habitaciones.find((h) => h.id === r.id) || null;
                     setSelectedRoom(found);
                     setShowRoomModal(true);
                  }}
               />
            )}
         </div>

         {/* Modal */}
         <HabitacionDetailsModal
            open={showRoomModal}
            room={selectedRoom}
            onClose={() => setShowRoomModal(false)}
            onChanged={async () => {
               setLoading(true);
               try {
                  const [habs, rs] = await Promise.all([
                     fetchHabitaciones(),
                     fetchReservasAll(),
                  ]);
                  setHabitaciones(Array.isArray(habs) ? habs : []);
                  setReservas(Array.isArray(rs) ? rs : []);
               } finally {
                  setLoading(false);
               }
            }}
            // ✅ Pasamos rango y reservas para que el modal calcule igual que el grid
            range={{ from, to }}
            reservas={reservas}
         />
      </div>
   );
}

function prettyType(t?: string) {
   if (!t) return "";
   return t
      .replace(/_/g, " ")
      .replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));
}
