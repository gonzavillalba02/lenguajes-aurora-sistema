// src/pages/operador/components/HabitacionDetailsModal.tsx
import { useEffect, useMemo, useState, useCallback } from "react";
import type { HabitacionDomain } from "../../../types/habitacion.types";
import type { ISODateString } from "../../../types/core";
import type { ReservaDomain } from "../../../types/reserva.types";

import {
   desactivarHabitacion,
   reactivarHabitacion,
   actualizarObservacionesHabitacion,
} from "../../../services/habitacion.service";

import ConfirmDialog from "../../../components/ConfirmDialog";
import Toast from "../../../components/Toast";

import {
   reservasSolapadasDeHab,
   isRoomOccupiedInRange,
   toDateRange,
} from "../../../lib/dateRange";

function fmt(d: Date) {
   return d.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
   });
}

type ConfirmState = {
   title: string;
   message: string;
   successMsg: string;
   action: () => Promise<unknown>;
} | null;

type Props = {
   open: boolean;
   room: HabitacionDomain | null;
   onClose: () => void;
   onChanged?: () => void;
   range?: { from: ISODateString; to: ISODateString };
   reservas?: ReservaDomain[];
};

export default function HabitacionDetailsModal({
   open,
   room,
   onClose,
   onChanged,
   range,
   reservas,
}: Props) {
   const [confirm, setConfirm] = useState<ConfirmState>(null);
   const [loading, setLoading] = useState(false);
   const [errorMsg, setErrorMsg] = useState<string | null>(null);

   // ====== ANIMACIÓN (open/close) ======
   const [visible, setVisible] = useState(false); // controla la transición
   const ANIM_MS = 180;

   // cuando open cambia a true, mostramos y bloqueamos scroll
   useEffect(() => {
      if (!open) return;
      setVisible(true);

      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
         document.body.style.overflow = prev;
      };
   }, [open]);

   // cerrar con animación y luego onClose real
   const handleClose = useCallback(() => {
      setVisible(false);
      setTimeout(onClose, ANIM_MS);
   }, [onClose]);

   // ESC cierra modal
   useEffect(() => {
      if (!open) return;
      const onKey = (e: KeyboardEvent) => e.key === "Escape" && handleClose();
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
   }, [open, handleClose]);

   // Toast
   const [toast, setToast] = useState<{
      open: boolean;
      type?: "success" | "error" | "info" | "warning";
      message: string;
   }>({ open: false, message: "" });

   // Observaciones (lectura/edición)
   const [isEditingObs, setIsEditingObs] = useState(false);
   const [obsDraft, setObsDraft] = useState<string>("");
   const [savedOk, setSavedOk] = useState<boolean>(false);

   // init observaciones
   useEffect(() => {
      if (open && room) {
         setObsDraft(room.observaciones ?? "");
         setIsEditingObs(false);
         setSavedOk(false);
         setErrorMsg(null);
      }
   }, [open, room]);

   // Rango activo (default hoy→mañana)
   const { fromISO, toISO, dFrom, dTo } = useMemo(() => {
      if (range?.from && range?.to) {
         const a = toDateRange(range.from, false);
         let b = toDateRange(range.to, true);
         if (!(b > a)) b = new Date(a.getTime() + 24 * 60 * 60 * 1000);
         return { fromISO: range.from, toISO: range.to, dFrom: a, dTo: b };
      }
      const a = new Date();
      const aISO = a.toISOString().slice(0, 10) as ISODateString;
      const b = new Date(a.getTime() + 24 * 60 * 60 * 1000);
      const bISO = b.toISOString().slice(0, 10) as ISODateString;
      return {
         fromISO: aISO,
         toISO: bISO,
         dFrom: toDateRange(aISO, false),
         dTo: toDateRange(bISO, true),
      };
   }, [range?.from, range?.to]);

   // Reservas que se solapan con el rango
   const solapadas = useMemo(() => {
      if (!room || !reservas) return [];
      return reservasSolapadasDeHab(room.id, reservas, fromISO, toISO);
   }, [room, reservas, fromISO, toISO]);

   // Estado visual
   const estado = useMemo(() => {
      if (!room) return { label: "", color: "" };
      if (!room.activa)
         return { label: "Cerrada", color: "bg-habitacion-cerrada" };
      const ocupada =
         room && reservas
            ? isRoomOccupiedInRange(room.id, reservas, fromISO, toISO)
            : false;
      return ocupada
         ? { label: "Ocupada", color: "bg-habitacion-ocupada" }
         : { label: "Libre", color: "bg-habitacion-libre" };
   }, [room, reservas, fromISO, toISO]);

   // Descripción tipo
   const descripcionTipo = useMemo(() => {
      if (!room) return "—";
      const d = (room.descripcion || "").trim();
      return d.length ? d : "—";
   }, [room]);

   const capacidad = room?.capacidad ?? "—";
   const precio = room?.precioNoche != null ? `$${room.precioNoche}` : "—";

   // Ejecutar confirmadas
   const runConfirm = useCallback(async () => {
      if (!confirm) return;
      try {
         setLoading(true);
         setErrorMsg(null);
         await confirm.action();
         setConfirm(null);
         onChanged?.();
         setToast({ open: true, type: "success", message: confirm.successMsg });
      } catch (e: any) {
         setErrorMsg(e?.response?.data?.message || "Ocurrió un error.");
      } finally {
         setLoading(false);
      }
   }, [confirm, onChanged]);

   // Guardar observaciones
   const saveObservaciones = useCallback(async () => {
      if (!room) return;
      try {
         setLoading(true);
         setErrorMsg(null);
         setSavedOk(false);
         await actualizarObservacionesHabitacion(
            room.id,
            obsDraft.trim() || null
         );
         setSavedOk(true);
         setIsEditingObs(false);
         onChanged?.();
         setToast({
            open: true,
            type: "success",
            message: "Observaciones guardadas",
         });
      } catch (e: any) {
         setErrorMsg(
            e?.response?.data?.message ||
               "No se pudieron guardar las observaciones."
         );
      } finally {
         setLoading(false);
      }
   }, [room, obsDraft, onChanged]);

   if (!open || !room) return null;

   return (
      <div
         className={`
        fixed inset-0 z-[90] grid place-items-center p-4 
        bg-black/40 backdrop-blur-sm 
        transition-opacity duration-[${ANIM_MS}ms] 
        ${visible ? "opacity-100" : "opacity-0"}
      `}
         onMouseDown={handleClose} // click en backdrop cierra con animación
         role="dialog"
         aria-modal="true"
         aria-labelledby="habitacion-title"
      >
         <div
            className={`
          w-full max-w-xl rounded-2xl bg-bg p-5 shadow-lg ring-1 ring-white/10 relative 
          transition-all duration-[${ANIM_MS}ms] ease-out
          ${
             visible
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 translate-y-2 scale-[0.98]"
          }
        `}
            onMouseDown={(e) => e.stopPropagation()} // evitar cierre por click dentro
         >
            {/* Header */}
            <div className="mb-4 flex items-center justify-between gap-3">
               <h2 id="habitacion-title" className="text-xl font-bold">
                  Habitación {room.numero || room.nombre}
               </h2>
               <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold text-white/90 ${estado.color}`}
               >
                  {estado.label}
               </span>
            </div>

            {/* Info principal */}
            <div className="grid grid-cols-2 gap-y-2 text-sm">
               <div className="text-white/70">Tipo</div>
               <div className="text-right">{room.tipo}</div>

               <div className="text-white/70">Descripción</div>
               <div className="text-right">{descripcionTipo}</div>

               <div className="text-white/70">Características</div>
               <div className="text-right">
                  <div className="flex items-center justify-between gap-4">
                     <span>Capacidad: {capacidad}</span>
                     <span>Precio: {precio}</span>
                  </div>
               </div>
            </div>

            {/* Rango + Reservas */}
            <div className="mt-4 rounded-xl border border-white/10 bg-white/[.04] p-3 text-sm">
               <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-white/70">Rango seleccionado</span>
                  <div className="flex items-center gap-2">
                     <span className="text-white">
                        ({fmt(dFrom)} → {fmt(dTo)})
                     </span>
                  </div>
               </div>

               <div className="mt-3">
                  <div className="mb-1 text-white/70">Reservas</div>
                  {solapadas.length === 0 ? (
                     <div className="text-white/60">
                        No hay reservas en este rango.
                     </div>
                  ) : (
                     <ul className="max-h-52 space-y-2 overflow-y-auto pr-1">
                        {solapadas.map((r) => (
                           <li
                              key={r.id}
                              className="rounded-lg border border-white/10 bg-white/[.06] px-3 py-2"
                           >
                              <div className="flex items-center justify-between">
                                 <div className="text-sm font-medium">
                                    {r.cliente.apellido} {r.cliente.nombre}
                                 </div>
                                 <div className="text-xs text-red-500">
                                    {fmt(r.rango.desde)} → {fmt(r.rango.hasta)}
                                 </div>
                              </div>
                              <div className="mt-0.5 text-xs">
                                 Estado:{" "}
                                 <span className="opacity-90">{r.estado}</span>
                              </div>
                           </li>
                        ))}
                     </ul>
                  )}
               </div>
            </div>

            {/* Observaciones */}
            <div className="mt-5">
               <div className="flex items-center justify-between">
                  <label htmlFor="obs" className="text-sm text-white/70">
                     Observaciones
                  </label>

                  {!isEditingObs ? (
                     <button
                        className="rounded-lg bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15"
                        onClick={() => setIsEditingObs(true)}
                     >
                        Editar
                     </button>
                  ) : null}
               </div>

               {!isEditingObs ? (
                  <div className="mt-2 min-h-16 rounded-xl border border-white/10 bg-white/[.06] px-3 py-3 text-sm">
                     {obsDraft?.trim() ? (
                        <p className="whitespace-pre-wrap">{obsDraft}</p>
                     ) : (
                        <span className="text-white/50">
                           Sin observaciones.
                        </span>
                     )}
                  </div>
               ) : (
                  <div className="mt-2">
                     <textarea
                        id="obs"
                        className="h-28 w-full rounded-xl border border-white/10 bg-white/[.08] px-3 py-2 text-sm outline-none focus:border-yellow-500/60"
                        placeholder="Añadí notas internas, estado, detalles relevantes…"
                        value={obsDraft}
                        onChange={(e) => setObsDraft(e.target.value)}
                        disabled={loading}
                     />
                     <div className="mt-2 flex items-center gap-2">
                        <button
                           className="rounded-lg bg-button px-3 py-2 text-white hover:bg-button/85 disabled:opacity-60"
                           onClick={saveObservaciones}
                           disabled={loading}
                        >
                           Guardar
                        </button>
                        <button
                           className="rounded-lg bg-white/10 px-3 py-2 hover:bg-white/15 disabled:opacity-60"
                           onClick={() => {
                              setIsEditingObs(false);
                              setObsDraft(room?.observaciones ?? "");
                           }}
                           disabled={loading}
                        >
                           Cancelar
                        </button>
                        {savedOk && (
                           <span className="text-sm text-green-400">
                              Guardado ✅
                           </span>
                        )}
                     </div>
                  </div>
               )}
            </div>

            {/* Errores */}
            {errorMsg && (
               <div className="mt-4 rounded-xl border border-red-500/50 bg-red-500/10 p-3 text-sm">
                  {errorMsg}
               </div>
            )}

            {/* Acciones */}
            <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
               {room.activa ? (
                  <button
                     className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-600/85 disabled:opacity-60"
                     disabled={loading}
                     onClick={() =>
                        setConfirm({
                           title: "Cerrar habitación",
                           message:
                              "¿Seguro querés cerrar esta habitación? No podrá ser utilizada hasta reabrirla.",
                           successMsg: "Habitación cerrada",
                           action: () => desactivarHabitacion(room.id),
                        })
                     }
                  >
                     Cerrar habitación
                  </button>
               ) : (
                  <button
                     className="rounded-lg bg-button px-4 py-2 text-white hover:bg-button/85 disabled:opacity-60"
                     disabled={loading}
                     onClick={() =>
                        setConfirm({
                           title: "Abrir habitación",
                           message:
                              "¿Querés reabrir esta habitación? Volverá a estar operativa.",
                           successMsg: "Habitación abierta",
                           action: () => reactivarHabitacion(room.id),
                        })
                     }
                  >
                     Abrir habitación
                  </button>
               )}

               <button
                  className="rounded-lg bg-white/10 px-3 py-2 hover:bg-white/15"
                  onClick={handleClose}
               >
                  Salir
               </button>
            </div>
         </div>

         {/* Confirmación */}
         <ConfirmDialog
            open={!!confirm}
            title={confirm?.title ?? "Confirmar"}
            message={confirm?.message ?? ""}
            loading={loading}
            onConfirm={runConfirm}
            onClose={() => (loading ? null : setConfirm(null))}
            confirmText="Confirmar"
            cancelText="Cancelar"
         />

         {/* Toast */}
         <Toast
            open={toast.open}
            type={toast.type}
            message={toast.message}
            onClose={() =>
               setToast({ open: false, message: "", type: "success" })
            }
         />
      </div>
   );
}
