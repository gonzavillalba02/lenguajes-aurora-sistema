// src/pages/operador/components/ReservaDetailsModal.tsx
import { useEffect, useState } from "react";
import { StatusBadge } from "../../../components/StatusBadge";
import ConfirmDialog from "../../../components/ConfirmDialog";
import Toast from "../../../components/Toast";

import AnimacionDetails from "../../../components/AnimacionDetails"; // <-- ajustá la ruta si es otra

import {
   fetchReservaById,
   pasarAPendientePago,
   aprobarReserva,
   rechazarReserva,
   cancelarReserva,
} from "../../../services/reservas.service";
import { desbloquearHabitacion } from "../../../services/habitacion.service";
import type { ReservaDomain } from "../../../types/reserva.types";

export default function ReservaDetailsModal({
   open,
   reservaId,
   onClose,
   onChanged,
}: {
   open: boolean;
   reservaId: number | null;
   onClose: () => void;
   onChanged?: () => void;
}) {
   const [data, setData] = useState<ReservaDomain | null>(null);
   const [loading, setLoading] = useState(false);
   const [toast, setToast] = useState<{
      open: boolean;
      type: "success" | "error";
      message: string;
   }>({
      open: false,
      type: "success",
      message: "",
   });

   const [confirm, setConfirm] = useState<{
      action: null | "pendiente_pago" | "aprobar" | "rechazar" | "cancelar";
      open: boolean;
   }>({
      action: null,
      open: false,
   });

   useEffect(() => {
      if (!open || !reservaId) return;
      setLoading(true);
      fetchReservaById(reservaId)
         .then(setData)
         .catch((e) =>
            setToast({
               open: true,
               type: "error",
               message: e?.message || "Error cargando reserva.",
            })
         )
         .finally(() => setLoading(false));
   }, [open, reservaId]);

   const estadoLabel = (e: ReservaDomain["estado"]) =>
      e === "pendiente_verificacion"
         ? "Pendiente"
         : e === "pendiente_pago"
         ? "Pendiente de pago"
         : e === "aprobada"
         ? "Aprobada"
         : e === "rechazada"
         ? "Rechazada"
         : "Cancelada";

   const act = async () => {
      if (!data || !confirm.action) return;
      setLoading(true);
      try {
         if (confirm.action === "pendiente_pago") {
            await pasarAPendientePago(data.id);
            setToast({
               open: true,
               type: "success",
               message: "Reserva marcada como pendiente de pago.",
            });
         }
         if (confirm.action === "aprobar") {
            await aprobarReserva(data.id);
            setToast({
               open: true,
               type: "success",
               message: "Reserva aprobada.",
            });
         }
         if (confirm.action === "rechazar") {
            await rechazarReserva(data.id);
            await desbloquearHabitacion(data.habitacion.id);
            setToast({
               open: true,
               type: "success",
               message: "Reserva rechazada y habitación liberada.",
            });
         }
         if (confirm.action === "cancelar") {
            await cancelarReserva(data.id);
            await desbloquearHabitacion(data.habitacion.id);
            setToast({
               open: true,
               type: "success",
               message: "Reserva cancelada y habitación liberada.",
            });
         }
         onChanged?.();
         onClose(); // el cierre visual lo maneja AnimacionDetails con fade-out
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
         const msg =
            err?.response?.data?.message ||
            err?.message ||
            "No se pudo completar la acción.";
         setToast({ open: true, type: "error", message: msg });
      } finally {
         setLoading(false);
         setConfirm({ action: null, open: false });
      }
   };

   // Header right: badge de estado
   const headerRight = data ? (
      <StatusBadge tipo="reserva" value={estadoLabel(data.estado)} />
   ) : null;

   // Footer: acciones + cerrar
   const footer = (
      <div className="mt-6 flex justify-between">
         {data && (
            <div className="flex gap-2">
               <button
                  className="px-3 py-2 rounded bg-estado-pendientePago hover:bg-amber-400  text-white"
                  disabled={loading}
                  onClick={() =>
                     setConfirm({ action: "pendiente_pago", open: true })
                  }
               >
                  Pendiente de pago
               </button>
               <button
                  className="px-3 py-2 rounded bg-estado-aprobada hover:bg-green-600 disabled:opacity-50 text-white"
                  disabled={loading}
                  onClick={() => setConfirm({ action: "aprobar", open: true })}
               >
                  Aprobar
               </button>
               <button
                  className="px-3 py-2 rounded bg-estado-rechazada hover:bg-red-700 disabled:opacity-50 text-white"
                  disabled={loading}
                  onClick={() => setConfirm({ action: "rechazar", open: true })}
               >
                  Rechazar
               </button>
               <button
                  className="px-3 py-2 rounded bg-estado-cancelada hover:bg-gray-700 text-white"
                  disabled={loading}
                  onClick={() => setConfirm({ action: "cancelar", open: true })}
               >
                  Cancelar
               </button>
            </div>
         )}
      </div>
   );

   return (
      <>
         <AnimacionDetails
            open={open}
            onClose={onClose}
            title="Reserva"
            headerRight={headerRight}
            footer={footer}
            maxWidth="3xl"
            blur
            escToClose
            closeOnBackdrop
            showCloseButton
            durationMs={180}
         >
            {loading ? (
               <div className="mt-6 h-24 animate-pulse rounded bg-white/5" />
            ) : data ? (
               <div className="grid md:grid-cols-2 gap-4 mt-2 text-white">
                  <Info
                     label="Cliente"
                     value={`${data.cliente.apellido}, ${data.cliente.nombre}`}
                  />
                  <Info
                     label="Fecha de reserva"
                     value={`${fmt(data.rango.desde)} - ${fmt(
                        data.rango.hasta
                     )}`}
                  />
                  <Info
                     label="Habitación"
                     value={`${data.habitacion.numero}`}
                  />
                  <Info label="Tipo" value={data.habitacion.tipo} />
                  <Info
                     label="Creada por"
                     value={data.meta?.creadaPor ?? "—"}
                  />
                  <Info
                     label="Aprobada por"
                     value={data.meta?.aprobadaPor ?? "—"}
                  />
                  <div className="md:col-span-2">
                     <div className="text-sm text-white/60 mb-1">
                        Observaciones
                     </div>
                     <div className="rounded-lg bg-white/5 p-3 min-h-20 text-white">
                        {data.meta?.observaciones ?? "—"}
                     </div>
                  </div>
               </div>
            ) : (
               <div className="mt-6 text-white/70">
                  No se encontró la reserva.
               </div>
            )}
         </AnimacionDetails>

         <ConfirmDialog
            open={confirm.open}
            title="Confirmar acción"
            message="¿Estás seguro de realizar esta acción sobre la reserva?"
            loading={loading}
            onConfirm={act}
            onClose={() => setConfirm({ action: null, open: false })}
         />

         <Toast
            open={toast.open}
            type={toast.type}
            message={toast.message}
            onClose={() => setToast((t) => ({ ...t, open: false }))}
         />
      </>
   );
}

function Info({ label, value }: { label: string; value: string | number }) {
   return (
      <div>
         <div className="text-sm text-white/60">{label}</div>
         <div className="font-medium">{value}</div>
      </div>
   );
}

function fmt(d: Date) {
   return d.toLocaleDateString();
}
