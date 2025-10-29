import { useEffect, useRef, useState } from "react";
import AnimacionDetails from "../../../components/AnimacionDetails";
import { TIPOS_HABITACION } from "../../../utils/rooms.utils";
import { crearHabitacion } from "../../../services/habitacion.service";

export type CreateHabitacionModalProps = {
   open: boolean;
   onClose: () => void;
   onSaved: () => Promise<void> | void; // recargar lista + toast desde el padre
};

export default function CreateHabitacionModal({
   open,
   onClose,
   onSaved,
}: CreateHabitacionModalProps) {
   const [nombre, setNombre] = useState("");
   const [tipoId, setTipoId] = useState<number>(0);
   const [observaciones, setObservaciones] = useState<string>("");
   const [saving, setSaving] = useState(false);
   const inputRef = useRef<HTMLInputElement>(null);

   // limpiar al abrir
   useEffect(() => {
      if (open) {
         setNombre("");
         setTipoId(0);
         setObservaciones("");
         // foco inicial
         setTimeout(() => inputRef.current?.focus(), 50);
      }
   }, [open]);

   if (!open) return null;

   async function onSubmit(e: React.FormEvent) {
      e.preventDefault();
      if (!nombre.trim() || !tipoId) return;

      try {
         setSaving(true);
         await crearHabitacion({
            nombre: nombre.trim(), // ej: "Habitación 101" o "H101"
            tipo_id: tipoId,
            observaciones: observaciones?.trim() || null,
         });
         await onSaved();
      } finally {
         setSaving(false);
      }
   }

   const footer = (
      <div className="flex items-center justify-end gap-2">
         <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-50"
         >
            Cancelar
         </button>
         <button
            type="submit"
            form="create-room-form"
            disabled={saving || !nombre.trim() || !tipoId}
            className="px-4 py-2 rounded-xl bg-button text-white hover:opacity-90 disabled:opacity-50"
         >
            {saving ? "Creando…" : "Crear habitación"}
         </button>
      </div>
   );

   return (
      <AnimacionDetails
         open={open}
         onClose={onClose}
         title="Crear nueva habitación"
         maxWidth="xl"
         showCloseButton
      >
         <form id="create-room-form" onSubmit={onSubmit} className="text-white">
            <label className="block text-sm text-white/70">Nombre</label>
            <input
               ref={inputRef}
               value={nombre}
               onChange={(e) => setNombre(e.target.value)}
               placeholder='Ej: "Habitación 101" o "H101"'
               className="w-full mt-1 rounded-xl bg-white/10 px-3 py-2 outline-none focus:ring-2 ring-button"
            />

            <label className="block text-sm text-white/70 mt-4">
               Tipo de habitación
            </label>
            <select
               value={tipoId}
               onChange={(e) => setTipoId(Number(e.target.value))}
               className="w-full mt-1 rounded-xl bg-white/10 px-3 py-2 outline-none focus:ring-2 ring-button"
            >
               <option value={0} disabled>
                  Seleccionar tipo…
               </option>
               {TIPOS_HABITACION.map((t) => (
                  <option key={t.id} value={t.id}>
                     {t.label}
                  </option>
               ))}
            </select>

            <label className="block text-sm text-white/70 mt-4">
               Observaciones (opcional)
            </label>
            <textarea
               value={observaciones}
               onChange={(e) => setObservaciones(e.target.value)}
               className="w-full mt-1 rounded-xl bg-white/10 px-3 py-2 outline-none focus:ring-2 ring-button min-h-24"
            />

            <div className="mt-6 border-t border-white/10 pt-4">{footer}</div>
         </form>
      </AnimacionDetails>
   );
}
