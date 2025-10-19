// src/pages/operador/components/ConsultaDetailsModal.tsx
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { ConsultaDetailVM } from "../../../types/consulta.types";

type Props = {
   open: boolean;
   onClose: () => void;
   consultaId?: number | null;
   load: (id: number) => Promise<ConsultaDetailVM>;
   onSend: (id: number, respuesta: string) => Promise<void>;
};

export default function ConsultaDetailsModal({
   open,
   onClose,
   consultaId,
   load,
   onSend,
}: Props) {
   const [loading, setLoading] = useState(false);
   const [sending, setSending] = useState(false);
   const [data, setData] = useState<ConsultaDetailVM | null>(null);
   const [respuesta, setRespuesta] = useState("");

   useEffect(() => {
      if (!open || !consultaId) return;
      (async () => {
         setLoading(true);
         try {
            const d = await load(consultaId);
            setData(d);
            setRespuesta(d.respuesta ?? "");
         } finally {
            setLoading(false);
         }
      })();
   }, [open, consultaId, load]);

   if (!open) return null;

   const isPendiente = data?.estadoLabel === "Pendiente";

   async function handleSend() {
      if (!data) return;
      if (!respuesta.trim()) return alert("Escribí una respuesta.");
      setSending(true);
      try {
         await onSend(data.id, respuesta.trim());
         onClose(); // cerramos y la lista se actualizará desde el padre
      } catch (e) {
         alert("No se pudo enviar la respuesta.");
      } finally {
         setSending(false);
      }
   }

   return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-3">
         <div className="w-full max-w-xl rounded-[var(--radius-xl2)] bg-bg2 border border-white/10 ring-1 ring-inset ring-white/10 shadow-[var(--shadow-card)]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
               <div className="flex items-center gap-3">
                  <h3 className="text-white text-lg font-semibold">Consulta</h3>
                  {data && (
                     <span
                        className={`text-xs px-2 py-1 rounded-full ${
                           isPendiente
                              ? "bg-estado-pendienteReserva text-white"
                              : "bg-estado-aprobada text-white"
                        }`}
                     >
                        {data.estadoLabel}
                     </span>
                  )}
               </div>
               <button
                  onClick={onClose}
                  className="p-1 rounded hover:bg-white/10 text-white/70"
               >
                  <X size={18} />
               </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4">
               {loading || !data ? (
                  <div className="h-40 animate-pulse rounded-lg bg-white/5" />
               ) : (
                  <div className="space-y-3 text-sm">
                     <div className="flex flex-wrap gap-x-6 gap-y-1 text-white/80">
                        <p>
                           <span className="text-white/60">Cliente:</span>{" "}
                           {data.clienteNombre}
                        </p>
                        <p>
                           <span className="text-white/60">Email:</span>{" "}
                           {data.clienteEmail}
                        </p>
                     </div>

                     <p className="text-white/80">
                        <span className="text-white/60">Asunto:</span>{" "}
                        {data.asunto}
                     </p>

                     <div>
                        <p className="text-white/60 mb-1">Mensaje Cliente:</p>
                        <div className="text-white/80 text-[13px] leading-relaxed bg-white/5 rounded-md p-3 ring-1 ring-inset ring-white/10">
                           “{data.mensajeCliente}”
                        </div>
                     </div>

                     {isPendiente ? (
                        <>
                           <div>
                              <p className="text-white/60 mb-1">Respuesta:</p>
                              <textarea
                                 value={respuesta}
                                 onChange={(e) => setRespuesta(e.target.value)}
                                 className="w-full h-28 resize-none rounded-md bg-white/5 px-3 py-2 text-white/90 outline-none ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-primary/60"
                                 placeholder="Escribí tu respuesta para enviar por email…"
                              />
                           </div>
                           <div className="pt-2 flex justify-end">
                              <button
                                 onClick={handleSend}
                                 disabled={sending}
                                 className="h-9 px-4 rounded-lg bg-primary text-black font-semibold disabled:opacity-60"
                              >
                                 {sending ? "Enviando…" : "Enviar Respuesta"}
                              </button>
                           </div>
                        </>
                     ) : (
                        <>
                           <div>
                              <p className="text-white/60 mb-1">
                                 Respuesta enviada:
                              </p>
                              <div className="text-white/80 text-[13px] leading-relaxed bg-white/5 rounded-md p-3 ring-1 ring-inset ring-white/10">
                                 “{data.respuesta || "-"}”
                              </div>
                           </div>
                           {data.operadorNombre && (
                              <p className="text-right text-xs text-white/50 pt-2">
                                 Respondida por:{" "}
                                 <span className="text-white/70">
                                    {data.operadorNombre}
                                 </span>
                              </p>
                           )}
                        </>
                     )}
                  </div>
               )}
            </div>
         </div>
      </div>
   );
}
