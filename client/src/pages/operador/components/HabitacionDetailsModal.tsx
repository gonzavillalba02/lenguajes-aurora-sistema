// src/pages/operador/components/HabitacionDetailsModal.tsx
import { useEffect, useMemo, useState, useCallback } from "react";
import type { HabitacionDomain } from "../../../types/types";
import {
   bloquearHabitacion,
   desbloquearHabitacion,
   desactivarHabitacion,
   reactivarHabitacion,
} from "../../../services/habitacion.service";
import ConfirmDialog from "../../../components/ConfirmDialog";

type Props = {
   open: boolean;
   room: HabitacionDomain | null;
   onClose: () => void;
   onChanged?: () => void;
};

export default function HabitacionDetailsModal({
   open,
   room,
   onClose,
   onChanged,
}: Props) {
   const [confirm, setConfirm] = useState<null | {
      title: string;
      message: string;
      action: () => Promise<any>;
   }>(null);
   const [loading, setLoading] = useState(false);
   const [errorMsg, setErrorMsg] = useState<string | null>(null);

   useEffect(() => {
      if (!open) return;
      const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
   }, [open, onClose]);

   const estado = useMemo(() => {
      if (!room) return { label: "", color: "" };
      if (!room.activa)
         return { label: "Cerrada", color: "bg-habitacion-cerrada" };
      return room.disponible
         ? { label: "Libre", color: "bg-habitacion-libre" }
         : { label: "Ocupada", color: "bg-habitacion-ocupada" };
   }, [room]);

   const run = useCallback(async () => {
      if (!confirm) return;
      try {
         setLoading(true);
         setErrorMsg(null);
         await confirm.action();
         setConfirm(null);
         onChanged?.();
      } catch (e: any) {
         setErrorMsg(e?.response?.data?.message || "Ocurrió un error.");
      } finally {
         setLoading(false);
      }
   }, [confirm, onChanged]);

   if (!open || !room) return null;

   return (
      <div
         className="fixed inset-0 z-[90] grid place-items-center bg-black/50 p-4"
         onMouseDown={onClose}
      >
         <div
            className="w-full max-w-xl rounded-2xl bg-bg p-5 shadow-lg"
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="habitacion-title"
         >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 mb-4">
               <h2 id="habitacion-title" className="text-xl font-bold">
                  Habitación {room.numero || room.nombre}
               </h2>
               <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold text-white/90 ${estado.color}`}
               >
                  {estado.label}
               </span>
            </div>

            {/* Datos base */}
            <div className="grid grid-cols-2 gap-y-2 text-sm">
               <div className="text-white/70">Tipo</div>
               <div className="text-right">{room.tipo ?? "-"}</div>

               <div className="text-white/70">Descripción</div>
               <div className="text-right">------</div>
            </div>

            {/* Observaciones (placeholder visual) */}
            <div className="mt-5">
               <label className="text-sm text-white/70">Observaciones</label>
               <div className="mt-2 h-28 rounded-xl bg-white/[.08] border border-white/10" />
            </div>

            {/* Error */}
            {errorMsg && (
               <div className="mt-4 rounded-xl border border-red-500/50 bg-red-500/10 p-3 text-sm">
                  {errorMsg}
               </div>
            )}

            {/* Acciones */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
               <div className="flex gap-2">
                  {room.activa && room.disponible && (
                     <button
                        className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15"
                        disabled={loading}
                        onClick={() =>
                           setConfirm({
                              title: "Marcar como ocupada",
                              message:
                                 "¿Confirmás marcar esta habitación como ocupada? Esto la volverá no disponible.",
                              action: () => bloquearHabitacion(room.id),
                           })
                        }
                     >
                        Marcar ocupada
                     </button>
                  )}
                  {room.activa && !room.disponible && (
                     <button
                        className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15"
                        disabled={loading}
                        onClick={() =>
                           setConfirm({
                              title: "Liberar habitación",
                              message:
                                 "¿Confirmás liberar esta habitación? Pasará a estar disponible.",
                              action: () => desbloquearHabitacion(room.id),
                           })
                        }
                     >
                        Liberar
                     </button>
                  )}
               </div>

               <div className="flex gap-2">
                  {room.activa ? (
                     <button
                        className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-600/85 disabled:opacity-60"
                        disabled={loading}
                        onClick={() =>
                           setConfirm({
                              title: "Cerrar habitación",
                              message:
                                 "¿Seguro querés cerrar esta habitación? No podrá ser utilizada hasta reabrirla.",
                              action: () => desactivarHabitacion(room.id),
                           })
                        }
                     >
                        Cerrar habitación
                     </button>
                  ) : (
                     <button
                        className="px-4 py-2 rounded-lg bg-button text-white hover:bg-button/85 disabled:opacity-60"
                        disabled={loading}
                        onClick={() =>
                           setConfirm({
                              title: "Abrir habitación",
                              message:
                                 "¿Querés reabrir esta habitación? Volverá a estar operativa.",
                              action: () => reactivarHabitacion(room.id),
                           })
                        }
                     >
                        Abrir habitación
                     </button>
                  )}

                  <button
                     className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15"
                     onClick={onClose}
                  >
                     Cerrar
                  </button>
               </div>
            </div>
         </div>

         <ConfirmDialog
            open={!!confirm}
            title={confirm?.title ?? "Confirmar"}
            message={confirm?.message ?? ""}
            loading={loading}
            onConfirm={run}
            onClose={() => (loading ? null : setConfirm(null))}
            confirmText="Confirmar"
            cancelText="Cancelar"
         />
      </div>
   );
}
