import { useEffect, useMemo, useState } from "react";
import AnimacionDetails from "../../../components/AnimacionDetails";
import type { HabitacionDomain } from "../../../types/habitacion.types";
import {
   bloquearHabitacion,
   desbloquearHabitacion,
   desactivarHabitacion,
   reactivarHabitacion,
} from "../../../services/habitacion.service";
import type { ReservaDomain } from "../../../types/reserva.types";
import { fetchReservasAll } from "../../../services/reservas.service";
import { isRoomOccupiedInRange } from "../../../lib/dateRange";
import type { HabStatus } from "../../../utils/rooms.utils";
import ConfirmDialog from "../../../components/ConfirmDialog";
import Toast from "../../../components/Toast";
import { StatusBadge } from "../../../components/StatusBadge";

// ===== helpers locales =====
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

function todayISO(): string {
   const d = new Date();
   const y = d.getFullYear();
   const m = String(d.getMonth() + 1).padStart(2, "0");
   const day = String(d.getDate()).padStart(2, "0");
   return `${y}-${m}-${day}`;
}

export type HabitacionDetailsModalProps = {
   open: boolean;
   data?: HabitacionDomain | null;
   onClose: () => void;
   onEdit: (h: HabitacionDomain) => void;
   onRefresh: () => Promise<void> | void;
};

export function HabitacionDetailsModal({
   open,
   data,
   onClose,
   onEdit,
   onRefresh,
}: HabitacionDetailsModalProps) {
   // ---------- HOOKS (no condicionales) ----------
   const [reservas, setReservas] = useState<ReservaDomain[]>([]);
   const [confirm, setConfirm] = useState<{
      open: boolean;
      action: "eliminar" | "reactivar" | null;
      loading: boolean;
   }>({ open: false, action: null, loading: false });

   const [toast, setToast] = useState<{
      open: boolean;
      msg: string;
      type: "success" | "error" | "info" | "warning";
   }>({ open: false, msg: "", type: "success" });

   // accesible de forma segura para hooks/memos/efectos
   const room = data ?? null;

   // Resetear toast al abrir/cambiar de habitación
   useEffect(() => {
      setToast({ open: false, msg: "", type: "success" });
   }, [open, room?.id]);

   // Cargar TODAS las reservas de esta habitación desde hoy (incluye la actual)
   useEffect(() => {
      let mounted = true;
      (async () => {
         if (!open || !room) {
            if (mounted) setReservas([]);
            return;
         }
         const all = await fetchReservasAll();
         if (!mounted) return;

         const hoy = todayISO();
         const hoyStart = new Date(`${hoy}T00:00:00`).getTime();

         const futuras = all
            .filter((r) => r.habitacion.id === room.id)
            .map((r) => {
               // normalizamos fechas a 00:00 (convención hotelera [desde, hasta))
               const d = new Date(
                  `${String(r.rango.desde).slice(0, 10)}T00:00:00`
               );
               const h = new Date(
                  `${String(r.rango.hasta).slice(0, 10)}T00:00:00`
               );
               return { ...r, rango: { desde: d, hasta: h } };
            })
            .filter((r) => r.rango.hasta.getTime() >= hoyStart)
            .sort((a, b) => a.rango.desde.getTime() - b.rango.desde.getTime());

         setReservas(futuras);
      })();
      return () => {
         mounted = false;
      };
   }, [open, room?.id]);

   // ¿Está ocupada HOY? (solo cuenta reservas aprobadas)
   const ocupadaHoy = useMemo(() => {
      if (!open || !room) return false;
      const hoy = todayISO();
      const aprobadas = reservas.filter((r) => r.estado === "aprobada");
      return isRoomOccupiedInRange(room.id, aprobadas, hoy, hoy);
   }, [open, room, reservas]);

   // Estado visual en vivo
   const status: HabStatus = useMemo(() => {
      if (!room) return "Eliminada";
      return toHabStatusLiveLocal(room.activa, room.disponible, ocupadaHoy);
   }, [room, ocupadaHoy]);

   // Toggle eliminar/reactivar con confirm + toasts
   async function doToggleActivo() {
      if (!room) return;
      try {
         if (confirm.action === "eliminar") {
            await desactivarHabitacion(room.id);
            if (room.disponible) await bloquearHabitacion(room.id);
            setToast({
               open: true,
               msg: "Habitación eliminada (oculta del sistema).",
               type: "success",
            });
            setTimeout(() => setToast((t) => ({ ...t, open: false })), 2500);
         } else if (confirm.action === "reactivar") {
            await reactivarHabitacion(room.id);
            if (!room.disponible) await desbloquearHabitacion(room.id);
            setToast({
               open: true,
               msg: "Habitación reactivada correctamente.",
               type: "success",
            });
         }
         onClose();
         await onRefresh();
      } catch {
         setToast({
            open: true,
            msg: "Ocurrió un error al procesar la acción.",
            type: "error",
         });
      } finally {
         setConfirm({ open: false, action: null, loading: false });
      }
   }

   // ---------- EARLY RETURN (después de hooks) ----------
   if (!open || !room) return null;

   const header = (
      <div className="flex items-center justify-between gap-3">
         <span className="text-white text-base md:text-lg font-medium">
            Habitación {room.numero || room.nombre}
         </span>
         <StatusBadge tipo="habitacion" value={status} />
      </div>
   );

   return (
      <>
         <AnimacionDetails
            open={open}
            onClose={onClose}
            title={header}
            maxWidth="xl"
            showCloseButton
         >
            {/* Reservas desde hoy */}
            <div className="mt-3 border-t border-white/10 pt-4">
               <div className="flex items-center justify-between">
                  <h4 className="text-white/90 font-medium">
                     Reservas (desde hoy)
                  </h4>
                  <div className="text-white/60 text-sm">
                     {reservas.length} resultado(s)
                  </div>
               </div>

               {reservas.length === 0 ? (
                  <div className="text-white/60 mt-2">
                     Sin reservas próximas para esta habitación.
                  </div>
               ) : (
                  <ul className="mt-3 grid gap-2">
                     {reservas.map((r) => (
                        <li
                           key={r.id}
                           className="rounded-lg bg-white/5 border border-white/10 px-3 py-2"
                        >
                           <div className="flex items-center justify-between gap-2">
                              <div className="text-white/90 text-sm">
                                 #{r.id} • {r.cliente.apellido},{" "}
                                 {r.cliente.nombre}
                              </div>
                              <StatusBadge
                                 tipo="reserva"
                                 value={
                                    r.estado === "pendiente_verificacion"
                                       ? "Pendiente"
                                       : r.estado === "pendiente_pago"
                                       ? "Pendiente de pago"
                                       : r.estado === "aprobada"
                                       ? "Aprobada"
                                       : r.estado === "rechazada"
                                       ? "Rechazada"
                                       : "Cancelada"
                                 }
                              />
                           </div>
                           <div className="text-white/70 text-xs mt-1">
                              {r.rango.desde.toLocaleDateString()} —{" "}
                              {r.rango.hasta.toLocaleDateString()}
                           </div>
                           {r.meta?.observaciones && (
                              <div className="text-white/60 text-xs mt-1 line-clamp-2">
                                 {r.meta.observaciones}
                              </div>
                           )}
                        </li>
                     ))}
                  </ul>
               )}
            </div>

            <div className="mt-5 border-t border-white/10 pt-4 flex gap-2 justify-between flex-wrap">
               <div className="flex gap-2">
                  <button
                     onClick={() => onEdit(room)}
                     disabled={!room.activa}
                     className={`px-4 py-2 rounded-xl ${
                        room.activa
                           ? "bg-white/10 hover:bg-white/20"
                           : "bg-white/5 text-white/50 cursor-not-allowed"
                     }`}
                  >
                     Editar
                  </button>
               </div>

               {room.activa ? (
                  <button
                     onClick={() =>
                        setConfirm({
                           open: true,
                           action: "eliminar",
                           loading: false,
                        })
                     }
                     className="px-4 py-2 rounded-xl bg-red-600/90 hover:bg-red-600 text-white"
                  >
                     Eliminar (ocultar del sistema)
                  </button>
               ) : (
                  <button
                     onClick={() =>
                        setConfirm({
                           open: true,
                           action: "reactivar",
                           loading: false,
                        })
                     }
                     className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                     Reactivar
                  </button>
               )}
            </div>
         </AnimacionDetails>

         {/* Confirmación */}
         <ConfirmDialog
            open={confirm.open}
            title={
               confirm.action === "eliminar"
                  ? "Eliminar habitación"
                  : "Reactivar habitación"
            }
            message={
               confirm.action === "eliminar"
                  ? "¿Seguro que querés eliminar (ocultar) esta habitación? Podrás reactivarla luego."
                  : "¿Reactivar esta habitación y dejarla disponible nuevamente?"
            }
            confirmText={
               confirm.action === "eliminar" ? "Eliminar" : "Reactivar"
            }
            cancelText="Cancelar"
            loading={confirm.loading}
            onConfirm={() => {
               setConfirm((s) => ({ ...s, loading: true }));
               void doToggleActivo();
            }}
            onClose={() =>
               !confirm.loading &&
               setConfirm({ open: false, action: null, loading: false })
            }
         />

         {/* Toast local */}
         <Toast
            open={toast.open}
            type={toast.type}
            message={toast.msg}
            onClose={() => setToast((t) => ({ ...t, open: false }))}
         />
      </>
   );
}
