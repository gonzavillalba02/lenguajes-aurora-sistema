// src/pages/operador/components/ConsultaDetailsModal.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import AnimacionDetails from "../../../components/AnimacionDetails";
import type { ConsultaDetailVM } from "../../../types/consulta.types";
import emailjs from "@emailjs/browser";

type Props = {
   open: boolean;
   onClose: () => void;
   consultaId?: number | null;
   load: (id: number) => Promise<ConsultaDetailVM>;
   onSend: (id: number, respuesta: string) => Promise<void>;
   /** Email del operador para Reply-To (opcional pero recomendado) */
   replyTo?: string;
};

const MAX_FILES = 5;

export default function ConsultaDetailsModal({
   open,
   onClose,
   consultaId,
   load,
   onSend,
   replyTo = "",
}: Props) {
   const [loading, setLoading] = useState(false);
   const [sending, setSending] = useState(false);
   const [data, setData] = useState<ConsultaDetailVM | null>(null);
   const [respuesta, setRespuesta] = useState("");

   // EmailJS
   const formRef = useRef<HTMLFormElement>(null);
   const filesInputRef = useRef<HTMLInputElement>(null);

   // Adjuntos (UI)
   const [files, setFiles] = useState<File[]>([]);
   const totalSizeMB = useMemo(
      () => files.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024),
      [files]
   );

   useEffect(() => {
      if (!open || !consultaId) return;
      (async () => {
         setLoading(true);
         try {
            const d = await load(consultaId);
            setData(d);
            setRespuesta(d.respuesta ?? "");
            setFiles([]);
            // Sincronizar valores iniciales al form oculto
            syncHidden({
               to_email: d.clienteEmail ?? "",
               subject: "Aurora Hotel - Consulta Respondida",
               reply_to: replyTo,
               name: d.clienteNombre ?? "",
               message: d.respuesta ?? "",
            });
         } finally {
            setLoading(false);
         }
      })();
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [open, consultaId]);

   if (!open) return null;

   const isPendiente = data?.estadoLabel === "Pendiente";
   const subject = "Aurora Hotel - Consulta Respondida";
   const toEmail = data?.clienteEmail ?? "";
   const clientName = data?.clienteNombre ?? "";

   // ===== Helpers para sincronizar el <form> =====
   function setInput(name: string, value: string) {
      const el = formRef.current?.querySelector(`[name="${name}"]`) as
         | HTMLInputElement
         | HTMLTextAreaElement
         | null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (el) (el as any).value = value;
   }
   function syncHidden(values: {
      to_email?: string;
      subject?: string;
      reply_to?: string;
      name?: string;
      message?: string;
   }) {
      if (values.to_email !== undefined) setInput("to_email", values.to_email);
      if (values.subject !== undefined) setInput("subject", values.subject);
      if (values.reply_to !== undefined) setInput("reply_to", values.reply_to);
      if (values.name !== undefined) setInput("name", values.name);
      if (values.message !== undefined) setInput("message", values.message);
   }

   // ===== Envío =====
   async function handleSend() {
      if (!data) return;

      const body = respuesta.trim();
      if (!toEmail) return alert("Falta el email del cliente.");
      if (!body) return alert("Escribí una respuesta.");
      if (files.length > MAX_FILES)
         return alert(`Máximo ${MAX_FILES} archivos.`);
      if (totalSizeMB > 18)
         return alert("Adjuntos demasiado pesados (máx ~18MB totales).");

      try {
         setSending(true);

         // refrescar campos en form
         syncHidden({
            to_email: toEmail,
            subject,
            reply_to: replyTo,
            name: clientName,
            message: body,
         });

         // EmailJS sendForm
         const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
         const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
         const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
         if (!formRef.current) throw new Error("Formulario no listo");
         await emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, formRef.current, {
            publicKey: PUBLIC_KEY,
         });

         // Persistir en tu sistema
         await onSend(data.id, body);

         onClose();
      } catch (err) {
         console.error(err);
         alert("No se pudo enviar la respuesta.");
      } finally {
         setSending(false);
      }
   }

   // ===== Header / Footer =====
   const header = (
      <div className="flex items-center gap-3">
         <span className="text-white">Consulta</span>
         {data ? (
            <span
               className={[
                  "px-3 py-1 rounded-full text-sm font-semibold text-white",
                  isPendiente
                     ? "bg-estado-pendienteReserva"
                     : "bg-estado-aprobada",
               ].join(" ")}
            >
               {data.estadoLabel}
            </span>
         ) : null}
      </div>
   );

   const footer = (
      <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
         {data && isPendiente ? (
            <button
               className="rounded-lg bg-button px-4 py-2 text-white hover:bg-button/85 disabled:opacity-60"
               onClick={handleSend}
               disabled={sending}
            >
               {sending ? "Enviando…" : "Enviar Respuesta"}
            </button>
         ) : null}
      </div>
   );

   return (
      <AnimacionDetails
         open={open}
         onClose={onClose}
         title={header}
         maxWidth="xl"
         showCloseButton
         blur
         escToClose
         closeOnBackdrop
         durationMs={180}
      >
         {/* FORM oculto que mapea 1:1 con tu plantilla EmailJS */}
         <form ref={formRef} className="hidden">
            {/* === Campos que usa tu template === */}
            <input name="to_email" defaultValue={toEmail} />
            <input name="subject" defaultValue={subject} />
            <input name="reply_to" defaultValue={replyTo} />
            <input name="name" defaultValue={clientName} />
            <textarea name="message" defaultValue={respuesta} />
            {/* === Adjuntos === */}
            <input
               ref={filesInputRef}
               name="attachments"
               type="file"
               multiple
               accept=".pdf,image/png,image/jpeg"
            />
         </form>

         {/* UI visible */}
         {loading || !data ? (
            <div className="h-40 animate-pulse rounded-lg bg-white/5" />
         ) : (
            <div className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <Field label="Cliente" value={data.clienteNombre} />
                  <Field label="Email" value={data.clienteEmail} />
                  <Field
                     label="Asunto"
                     value={data.asunto}
                     className="md:col-span-2"
                  />
               </div>

               <div>
                  <div className="text-sm text-white/60 mb-1">
                     Mensaje Cliente
                  </div>
                  <div className="text-white/80 text-[13px] leading-relaxed bg-white/5 rounded-md p-3 ring-1 ring-inset ring-white/10">
                     “{data.mensajeCliente}”
                  </div>
               </div>

               {isPendiente ? (
                  <>
                     <div>
                        <div className="text-sm text-white/60 mb-1">
                           Respuesta
                        </div>
                        <textarea
                           value={respuesta}
                           onChange={(e) => {
                              setRespuesta(e.target.value);
                              syncHidden({ message: e.target.value });
                           }}
                           className="w-full h-28 resize-none rounded-md bg-white/[.08] px-3 py-2 text-white/90 outline-none ring-1 ring-inset ring-white/12 focus:ring-2 focus:ring-yellow-500/50 placeholder-white/50"
                           placeholder="Escribí tu respuesta para enviar por email…"
                        />
                     </div>
                  </>
               ) : (
                  <>
                     <div>
                        <div className="text-sm text-white/60 mb-1">
                           Respuesta enviada
                        </div>
                        <div className="text-white/80 text-[13px] leading-relaxed bg-white/5 rounded-md p-3 ring-1 ring-inset ring-white/10">
                           “{data.respuesta || "-"}”
                        </div>
                     </div>
                     {data.operadorNombre && (
                        <p className="text-right text-xs text-white/50 pt-1">
                           Respondida por:{" "}
                           <span className="text-white/70">
                              {data.operadorNombre}
                           </span>
                        </p>
                     )}
                  </>
               )}

               {footer}
            </div>
         )}
      </AnimacionDetails>
   );
}

function Field({
   label,
   value,
   className,
}: {
   label: string;
   value: string | number | null | undefined;
   className?: string;
}) {
   return (
      <div className={className}>
         <div className="text-sm text-white/60">{label}</div>
         <div className="font-medium text-white">{value ?? "—"}</div>
      </div>
   );
}
