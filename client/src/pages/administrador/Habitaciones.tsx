import { useEffect, useMemo, useState } from "react";
import type { HabitacionDomain } from "../../types/habitacion.types";
import type { ReservaDomain } from "../../types/reserva.types";
import { fetchHabitaciones } from "../../services/habitacion.service";
import RoomsKpis from "../administrador/components/KpiCard";
import RoomCard from "../administrador/components/RoomCard";
import { HabitacionDetailsModal } from "../administrador/components/HabitacionDetailsModal";
import { EditHabitacionModal } from "../administrador/components/EditHabitacionModal";
import { toHabStatus, type HabStatus } from "../../utils/rooms.utils";
import Toast from "../../components/Toast";
import CreateHabitacionModal from "../administrador/components/CreateHabitacion";
import { fetchReservasAll } from "../../services/reservas.service";
import { isRoomOccupiedInRange } from "../../lib/dateRange";

function todayISO(): string {
   const d = new Date();
   const y = d.getFullYear();
   const m = String(d.getMonth() + 1).padStart(2, "0");
   const day = String(d.getDate()).padStart(2, "0");
   return `${y}-${m}-${day}`;
}

// Estado “en vivo” local (no toca utils globales)
function toHabStatusLiveLocal(
   activa: boolean,
   disponible: boolean,
   ocupadaHoy: boolean
): HabStatus {
   if (!activa && !disponible) return "Eliminada";
   if (!activa && disponible) return "Cerrada";
   if (activa && !disponible) return "Cerrada";
   if (activa && disponible && ocupadaHoy) return "Ocupada";
   return "Libre";
}

export default function HabitacionesAdm() {
   const [items, setItems] = useState<HabitacionDomain[]>([]);
   const [reservas, setReservas] = useState<ReservaDomain[]>([]);
   const [loading, setLoading] = useState(true);
   const [filter, setFilter] = useState<
      "all" | "Libre" | "Ocupada" | "Cerrada" | "Eliminada"
   >("all");
   const [showDeleted, setShowDeleted] = useState(false);
   const [selected, setSelected] = useState<HabitacionDomain | null>(null);
   const [editOpen, setEditOpen] = useState(false);
   const [editData, setEditData] = useState<HabitacionDomain | null>(null);

   // Toast
   const [createOpen, setCreateOpen] = useState(false);
   const [toastOpen, setToastOpen] = useState(false);
   const [toastMsg, setToastMsg] = useState("");

   async function load() {
      setLoading(true);
      try {
         const [rooms, allRes] = await Promise.all([
            fetchHabitaciones({ scope: "admin" }),
            fetchReservasAll(),
         ]);
         setItems(rooms);
         setReservas(allRes);
      } finally {
         setLoading(false);
      }
   }

   useEffect(() => {
      load();
   }, []);

   // Estado “en vivo” por habitación
   const liveStatusById = useMemo(() => {
      const hoy = todayISO();
      // “Ocupada” solo con reservas APROBADAS
      const aprobadas = reservas.filter((r) => r.estado === "aprobada");
      const m = new Map<number, HabStatus>();
      for (const h of items) {
         const ocupadaHoy = isRoomOccupiedInRange(h.id, aprobadas, hoy, hoy);
         m.set(h.id, toHabStatusLiveLocal(h.activa, h.disponible, ocupadaHoy));
      }
      return m;
   }, [items, reservas]);

   // Filtrado con estado en vivo
   const byFilter = useMemo(() => {
      let arr = items;
      if (filter !== "all") {
         arr = arr.filter(
            (h) =>
               (liveStatusById.get(h.id) ??
                  toHabStatus(h.activa, h.disponible)) === filter
         );
      }
      if (!showDeleted) {
         arr = arr.filter(
            (h) =>
               (liveStatusById.get(h.id) ??
                  toHabStatus(h.activa, h.disponible)) !== "Eliminada"
         );
      }
      return arr;
   }, [items, filter, showDeleted, liveStatusById]);

   // Orden: Libre → Ocupada → Cerrada → Eliminada

   const visible = useMemo(
      () =>
         [...byFilter].sort((a, b) => {
            const na = a.numero ?? 0;
            const nb = b.numero ?? 0;
            if (na && nb) return na - nb;
            if (na) return -1;
            if (nb) return 1;
            return String(a.nombre).localeCompare(String(b.nombre), "es", {
               numeric: true,
            });
         }),
      [byFilter]
   );
   return (
      <div className="p-4 md:p-6 flex flex-col gap-6 h-[calc(100vh-80px)] overflow-hidden">
         <RoomsKpis items={items} activeFilter={filter} onFilter={setFilter} />

         <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="text-white/70 text-sm">
               {visible.length} resultados
            </div>

            <div className="flex items-center gap-3">
               <label className="inline-flex items-center gap-2 text-white/80 text-sm select-none">
                  <input
                     type="checkbox"
                     className="accent-[var(--color-button,#BC9C23)] scale-110"
                     checked={showDeleted}
                     onChange={(e) => setShowDeleted(e.target.checked)}
                  />
                  Mostrar eliminadas
               </label>

               <button
                  className="px-4 py-2 rounded-xl bg-button text-white hover:opacity-90"
                  onClick={() => setCreateOpen(true)}
               >
                  + Crear habitación
               </button>
            </div>
         </div>

         {/* Lista scrolleable */}
         <div className="flex-1 min-h-0 overflow-y-auto pr-1 overscroll-contain">
            {loading ? (
               <div className="text-white/60">Cargando habitaciones…</div>
            ) : (
               <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {visible.map((h) => (
                     <RoomCard
                        key={h.id}
                        item={h}
                        onOpen={setSelected}
                        statusOverride={liveStatusById.get(h.id)} // badge acorde a “hoy”
                     />
                  ))}
               </div>
            )}
         </div>

         <HabitacionDetailsModal
            open={Boolean(selected)}
            data={selected}
            onClose={() => setSelected(null)}
            onEdit={(h) => {
               setSelected(null);
               setEditData(h);
               setEditOpen(true);
            }}
            onRefresh={async () => {
               await load();
               setToastMsg("Habitaciones actualizadas.");
               setToastOpen(true);
            }}
         />

         <EditHabitacionModal
            open={editOpen && !!editData}
            data={editData}
            onClose={() => {
               setEditOpen(false);
               setEditData(null);
            }}
            onSaved={async () => {
               setEditOpen(false);
               setEditData(null);
               await load();
               setToastMsg("Habitación actualizada correctamente.");
               setToastOpen(true);
            }}
         />

         <CreateHabitacionModal
            open={createOpen}
            onClose={() => setCreateOpen(false)}
            onSaved={async () => {
               setCreateOpen(false);
               await load();
               setToastMsg("Habitación creada correctamente.");
               setToastOpen(true);
            }}
         />

         <Toast
            open={toastOpen}
            type="success"
            title="Éxito"
            message={toastMsg}
            onClose={() => setToastOpen(false)}
         />
      </div>
   );
}
