// src/pages/admin/Habitaciones.tsx
import { useEffect, useMemo, useState } from "react";
import KpiCard from "../operador/components/KpiCard";
import RoomsGrid from "./components/RoomsGrid";
import type { HabStatus, HabitacionDomain } from "../../types/types";
import { fetchHabitaciones } from "../../services/habitacion.service";
import HabitacionDetailsModal from "../operador/components/HabitacionDetailsModal";
type RoomVM = { id: number; numero: number; status: HabStatus; tipo?: string };

// ---- helpers ----
function toStatusVM(h: HabitacionDomain): HabStatus {
   if (!h.activa) return "Cerrada";
   return h.disponible ? "Libre" : "Ocupada";
}

export default function Habitaciones() {
   const [loading, setLoading] = useState(true);
   const [habitaciones, setHabitaciones] = useState<HabitacionDomain[]>([]);

   // filtros
   const [q, setQ] = useState("");
   const [estado, setEstado] = useState<HabStatus | "">("");
   const [tipo, setTipo] = useState<string>("");
   const [from, setFrom] = useState<string>(""); // yyyy-mm-dd (placeholder futuro)
   const [to, setTo] = useState<string>("");
   useEffect(() => {
      (async () => {
         setLoading(true);
         const data = await fetchHabitaciones(); // Promise<HabitacionDomain[]>
         setHabitaciones(Array.isArray(data) ? data : []);
         setLoading(false);
      })();
   }, []);

   // VM + KPIs
   const roomsVM: RoomVM[] = useMemo(
      () =>
         habitaciones.map((h) => ({
            id: h.id,
            numero: h.numero,
            status: toStatusVM(h),
            tipo: h.tipo,
         })),
      [habitaciones]
   );

   const kpis = useMemo(() => {
      const base = { libres: 0, ocupadas: 0, cerradas: 0 };
      for (const r of roomsVM) {
         if (r.status === "Libre") base.libres++;
         else if (r.status === "Ocupada") base.ocupadas++;
         else base.cerradas++;
      }
      return { ...base, total: roomsVM.length };
   }, [roomsVM]);

   // filtros UI
   const tiposDisponibles = useMemo(
      () =>
         Array.from(
            new Set(habitaciones.map((h) => h.tipo).filter(Boolean))
         ).sort(),
      [habitaciones]
   );

   const filtered = useMemo(() => {
      return roomsVM.filter((r) => {
         const matchesQ = !q || String(r.numero).includes(q);
         const matchesEstado = !estado || r.status === estado;
         const matchesTipo =
            !tipo || (r.tipo ?? "").toLowerCase() === tipo.toLowerCase();

         // Nota: from/to son placeholders para disponibilidad por fechas.
         // Hoy se filtra por estado actual. Cuando conectemos disponibilidad por fecha,
         // acá cruzamos con reservas.

         return matchesQ && matchesEstado && matchesTipo;
      });
   }, [roomsVM, q, estado, tipo /*, from, to*/]);
   const [showRoomModal, setShowRoomModal] = useState(false);
   const [selectedRoom, setSelectedRoom] = useState<HabitacionDomain | null>(
      null
   );

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
            <KpiCard
               label="Total"
               value={kpis.libres + kpis.ocupadas + kpis.cerradas}
               variant="total"
            />
         </div>

         {/* Filtros */}
         <div className="rounded-[var(--radius-xl2)] bg-bg2/60 border border-white/10 p-4 flex flex-wrap items-center gap-3">
            <input
               value={q}
               onChange={(e) => setQ(e.target.value)}
               placeholder="Buscar"
               className="rounded-[var(--radius-xl2)] bg-bg2 px-3 py-2 text-sm text-text placeholder-white/50 border border-white/10 focus:outline-none focus:ring-2 focus:ring-button/40"
            />

            <select
               value={tipo}
               onChange={(e) => setTipo(e.target.value)}
               className="rounded-[var(--radius-xl2)] bg-bg2 px-3 py-2 text-sm text-text border border-white/10 focus:outline-none focus:ring-2 focus:ring-button/40"
            >
               <option value="">Tipo de Habitación</option>
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
               <option value="">Estado</option>
               <option value="Libre">Libre</option>
               <option value="Ocupada">Ocupada</option>
               <option value="Cerrada">Cerrada</option>
            </select>

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
         <HabitacionDetailsModal
            open={showRoomModal}
            room={selectedRoom}
            onClose={() => setShowRoomModal(false)}
            onChanged={async () => {
               setLoading(true);
               const data = await fetchHabitaciones();
               setHabitaciones(Array.isArray(data) ? data : []);
               setLoading(false);
            }}
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
