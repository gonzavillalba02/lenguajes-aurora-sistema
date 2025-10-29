// src/pages/operador/components/ReservaDetailsModal.tsx
import { useEffect, useState } from "react";
import { StatusBadge } from "../../../components/StatusBadge";
import ConfirmDialog from "../../../components/ConfirmDialog";
import Toast from "../../../components/Toast";
import AnimacionDetails from "../../../components/AnimacionDetails";

import {
   fetchReservaById,
   aprobarReserva,
   rechazarReserva,
   cancelarReserva,
} from "../../../services/reservas.service";
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
      action: null | "aprobar" | "rechazar" | "cancelar";
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
      e === "aprobada"
         ? "Aprobada"
         : e === "rechazada"
         ? "Rechazada"
         : "Cancelada";

   const act = async () => {
      if (!data || !confirm.action) return;
      setLoading(true);
      try {
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
            setToast({
               open: true,
               type: "success",
               message: "Reserva rechazada",
            });
         }
         if (confirm.action === "cancelar") {
            await cancelarReserva(data.id);
            setToast({
               open: true,
               type: "success",
               message: "Reserva cancelada ",
            });
         }
         onChanged?.();
         onClose();
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

   // Footer: acciones
   const footer = (
      <div className="mt-6 flex justify-between">
         {data && (
            <div className="flex gap-2">
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
            title="Detalle de Reserva"
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
                  {/* Cliente */}
                  <Section title="Cliente">
                     <Info
                        label="Nombre"
                        value={
                           `${data.cliente.nombre ?? ""} ${
                              data.cliente.apellido ?? ""
                           }`.trim() || "—"
                        }
                     />
                     <Info label="Email" value={data.cliente.email || "—"} />
                     <Info
                        label="Teléfono"
                        value={data.cliente.telefono || "—"}
                     />
                     <Info
                        label="Ubicación"
                        value={data.cliente.ubicacion || "—"}
                     />
                  </Section>

                  {/* Reserva (sin Origen) */}
                  <Section title="Reserva">
                     <Info
                        label="Fechas"
                        value={`${fmt(data.rango.desde)} - ${fmt(
                           data.rango.hasta
                        )}`}
                     />
                     <Info
                        label="Habitación"
                        value={`${data.habitacion.numero}`}
                     />
                     <Info
                        label="Tipo"
                        value={humanizeTipo(data.habitacion.tipo)}
                     />
                  </Section>

                  {/* Auditoría en modo lineal */}
                  <Section title="Auditoría" className="md:col-span-2">
                     <InlineRow
                        leftLabel="Creada por"
                        leftValue={data.meta?.creadaPor ?? "Reservado online"}
                        rightLabel="Último cambio por"
                        rightValue={data.meta?.modificadaPor ?? "—"}
                     />
                  </Section>

                  {/* Observaciones */}
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

function Section({
   title,
   children,
   className = "",
}: {
   title: string;
   children: React.ReactNode;
   className?: string;
}) {
   return (
      <div
         className={`rounded-lg border border-white/10 p-3 bg-white/5 ${className}`}
      >
         <div className="text-sm text-white/60 mb-2">{title}</div>
         <div className="grid grid-cols-1 gap-2">{children}</div>
      </div>
   );
}

function Info({ label, value }: { label: string; value: string | number }) {
   return (
      <div>
         <div className="text-sm text-white/60">{label}</div>
         <div className="font-medium break-words">{value}</div>
      </div>
   );
}

function InlineRow({
   leftLabel,
   leftValue,
   rightLabel,
   rightValue,
}: {
   leftLabel: string;
   leftValue: string | number;
   rightLabel: string;
   rightValue: string | number;
}) {
   return (
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
         <div className="flex-1">
            <span className="text-sm text-white/60">{leftLabel}: </span>
            <span className="font-medium">{leftValue}</span>
         </div>
         <div className="flex-1 md:text-right">
            <span className="text-sm text-white/60">{rightLabel}: </span>
            <span className="font-medium">{rightValue}</span>
         </div>
      </div>
   );
}

function fmt(d: Date) {
   return d.toLocaleDateString();
}

/* ==== helper local: slug -> label legible ==== */
function humanizeTipo(v?: string | null) {
   if (!v) return "—";
   if (v.includes("_")) {
      const label = v
         .split("_")
         .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
         .join(" ");
      return label.replace(/\bSuit\b/gi, "Suite");
   }
   return v.replace(/\bSuit\b/gi, "Suite");
}
