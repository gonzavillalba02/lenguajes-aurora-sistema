import { useEffect, useState } from "react";
import Toast from "../../../components/Toast";
import ConfirmDialog from "../../../components/ConfirmDialog";
import {
   crearPersona,
   type CrearPersonaDTO,
} from "../../../services/persona.service";
import { crearReserva } from "../../../services/reservas.service";
import {
   fetchHabitaciones,
   bloquearHabitacion,
} from "../../../services/habitacion.service";
import type {
   HabitacionDomain,
   CrearReservaByIdDTO,
} from "../../../types/types";

export default function CreateReservaModal({
   open,
   onClose,
   onCreated,
}: {
   open: boolean;
   onClose: () => void;
   onCreated?: () => void;
}) {
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
   const showToast = (type: "success" | "error", message: string) =>
      setToast({ open: true, type, message });

   // Confirmación antes de enviar
   const [confirmOpen, setConfirmOpen] = useState(false);

   // ----- Persona -----
   const [persona, setPersona] = useState<CrearPersonaDTO>({
      nombre: "",
      apellido: "",
      email: "",
      telefono: "",
   });

   // ----- Reserva -----
   const [fechaInicio, setFechaInicio] = useState("");
   const [fechaFin, setFechaFin] = useState("");
   const [habitacionNumero, setHabitacionNumero] = useState<string>("");
   const [observaciones, setObservaciones] = useState<string>("");

   // Habitaciones (para mapear número -> id y validar estado)
   const [habitaciones, setHabitaciones] = useState<HabitacionDomain[]>([]);

   useEffect(() => {
      if (!open) return;
      fetchHabitaciones()
         .then(setHabitaciones)
         .catch(() => {});
   }, [open]);

   if (!open) return null;

   // ---- Validación front ----
   const validar = (): {
      ok: boolean;
      hab?: HabitacionDomain;
      msg?: string;
   } => {
      if (!persona.nombre.trim() || !persona.apellido.trim()) {
         return { ok: false, msg: "Completá nombre y apellido." };
      }
      if (!fechaInicio || !fechaFin) {
         return { ok: false, msg: "Elegí las fechas de la reserva." };
      }
      // normalizar a YYYY-MM-DD por las dudas
      const fi = new Date(fechaInicio.slice(0, 10));
      const ff = new Date(fechaFin.slice(0, 10));
      if (ff < fi) {
         return {
            ok: false,
            msg: "La fecha fin no puede ser menor a la de inicio.",
         };
      }
      const numero = Number(habitacionNumero);
      if (!numero) {
         return { ok: false, msg: "Ingresá un número de habitación válido." };
      }
      const hab = habitaciones.find((h) => h.numero === numero);
      if (!hab)
         return {
            ok: false,
            msg: `No se encontró la habitación Nº ${numero}.`,
         };
      if (!hab.activa)
         return {
            ok: false,
            msg: `La habitación Nº ${numero} está cerrada (inactiva).`,
         };
      if (!hab.disponible)
         return {
            ok: false,
            msg: `La habitación Nº ${numero} no está disponible.`,
         };
      return { ok: true, hab };
   };

   const onSubmit = async () => {
      const v = validar();
      if (!v.ok) {
         showToast("error", v.msg!);
         return;
      }
      setConfirmOpen(true);
   };

   const doCreate = async () => {
      const v = validar();
      if (!v.ok || !v.hab) return;
      const hab = v.hab;

      setLoading(true);
      try {
         // 1) Crear persona
         const p = await crearPersona({
            nombre: persona.nombre.trim(),
            apellido: persona.apellido.trim(),
            email: persona.email?.trim() || undefined,
            telefono: persona.telefono?.trim() || undefined,
         });
         const personaId = p.personaId;

         // 2) Crear reserva
         const payload: CrearReservaByIdDTO = {
            persona_id: personaId,
            habitacion_id: hab.id,
            fecha_inicio: fechaInicio.slice(0, 10),
            fecha_fin: fechaFin.slice(0, 10),
            observaciones: observaciones || undefined,
         };
         const r = await crearReserva(payload);

         // 3) Bloquear habitación (disponible = FALSE)
         try {
            await bloquearHabitacion(hab.id);
         } catch (e) {
            // No bloquea el flujo si falla; solo log
            console.warn(
               "No se pudo bloquear la habitación tras crear la reserva",
               e
            );
         }

         showToast("success", r.message || "Reserva creada y aprobada.");
         onCreated?.();
         setTimeout(onClose, 600);
      } catch (err: any) {
         const msg =
            err?.response?.data?.message ||
            err?.message ||
            "No se pudo crear la reserva.";
         showToast("error", msg); // ej: 409 "Solapamiento de fechas..."
      } finally {
         setLoading(false);
         setConfirmOpen(false);
      }
   };

   return (
      <div className="fixed inset-0 z-[90] grid place-items-center bg-black/50 p-4">
         <div className="w-full max-w-3xl rounded-2xl bg-bg p-4 shadow-xl">
            <h3 className="text-xl font-semibold mb-4">Crear Reserva</h3>

            <div className="grid md:grid-cols-2 gap-4">
               {/* Persona */}
               <Input
                  label="Nombre"
                  value={persona.nombre}
                  onChange={(v) => setPersona({ ...persona, nombre: v })}
               />
               <Input
                  label="Apellido"
                  value={persona.apellido}
                  onChange={(v) => setPersona({ ...persona, apellido: v })}
               />
               <Input
                  label="Email"
                  value={persona.email ?? ""}
                  onChange={(v) => setPersona({ ...persona, email: v })}
               />
               <Input
                  label="Teléfono"
                  value={persona.telefono ?? ""}
                  onChange={(v) => setPersona({ ...persona, telefono: v })}
               />

               {/* Reserva */}
               <Input
                  label="Fecha inicio"
                  type="date"
                  value={fechaInicio}
                  onChange={setFechaInicio}
               />
               <Input
                  label="Fecha fin"
                  type="date"
                  value={fechaFin}
                  onChange={setFechaFin}
               />
               <Input
                  label="Habitación (Nº)"
                  type="number"
                  value={habitacionNumero}
                  onChange={setHabitacionNumero}
               />
               <div className="md:col-span-2">
                  <label className="text-sm text-white/70">Observaciones</label>
                  <textarea
                     className="w-full mt-1 rounded-lg bg-white/5 px-3 py-2 outline-none focus:ring-2 ring-button/60"
                     rows={3}
                     value={observaciones}
                     onChange={(e) => setObservaciones(e.target.value)}
                  />
               </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
               <button
                  className="px-3 py-2 rounded bg-white/10 hover:bg-white/15"
                  onClick={onClose}
               >
                  Cancelar
               </button>
               <button
                  className="px-3 py-2 rounded bg-button text-white hover:bg-button/85 disabled:opacity-60"
                  disabled={loading}
                  onClick={onSubmit}
               >
                  {loading ? "Guardando..." : "Guardar cambios"}
               </button>
            </div>
         </div>

         {/* Confirmar creación */}
         <ConfirmDialog
            open={confirmOpen}
            title="Confirmar creación"
            message="Se creará la persona y la reserva, y la habitación quedará no disponible. ¿Deseás continuar?"
            loading={loading}
            onConfirm={doCreate}
            onClose={() => setConfirmOpen(false)}
         />

         {/* Toast */}
         <Toast
            open={toast.open}
            type={toast.type}
            message={toast.message}
            onClose={() => setToast((t) => ({ ...t, open: false }))}
         />
      </div>
   );
}

function Input({
   label,
   type = "text",
   value,
   onChange,
}: {
   label: string;
   type?: string;
   value: string;
   onChange: (v: string) => void;
}) {
   return (
      <div>
         <label className="text-sm text-white/70">{label}</label>
         <input
            type={type}
            className="w-full mt-1 rounded-lg bg-white/5 px-3 py-2 outline-none focus:ring-2 ring-button/60"
            value={value}
            onChange={(e) => onChange(e.target.value)}
         />
      </div>
   );
}
