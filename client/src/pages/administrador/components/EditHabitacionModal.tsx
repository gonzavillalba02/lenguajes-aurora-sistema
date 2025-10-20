import { useEffect, useState } from "react";
import type { HabitacionDomain } from "../../../types/habitacion.types";
import { actualizarHabitacion } from "../../../services/habitacion.service";
import AnimacionDetails from "../../../components/AnimacionDetails";
import { TIPOS_HABITACION } from "../../../utils/rooms.utils";
export type EditHabitacionModalProps = {
   open: boolean;
   data?: HabitacionDomain | null;
   onClose: () => void;
   onSaved: () => Promise<void> | void;
};

export function EditHabitacionModal({
   open,
   data,
   onClose,
   onSaved,
}: EditHabitacionModalProps) {
   const [tipoId, setTipoId] = useState<number>(0);
   const [observaciones, setObservaciones] = useState<string>("");

   useEffect(() => {
      setTipoId(data?.tipo_id ?? 0);
      setObservaciones(data?.observaciones ?? "");
   }, [data]);

   if (!open || !data) return null;

   async function onSubmit(e: React.FormEvent) {
      e.preventDefault();
      await actualizarHabitacion(data.id, {
         tipo_id: tipoId || undefined,
         observaciones: observaciones ?? null,
      });
      await onSaved();
   }

   const footer = (
      <div className="flex items-center justify-end gap-2">
         <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20"
         >
            Cancelar
         </button>
         <button
            type="submit"
            form="edit-room-form"
            className="px-4 py-2 rounded-xl bg-habitacion-libre text-black hover:opacity-90"
         >
            Confirmar
         </button>
      </div>
   );

   return (
      <AnimacionDetails
         open={open}
         onClose={onClose}
         title={`Editar habitación — ${data.numero || data.nombre}`}
         maxWidth="xl"
         showCloseButton
      >
         <form id="edit-room-form" onSubmit={onSubmit} className="text-white">
            {/* Nombre (solo lectura / opcional ocultarlo) */}
            <label className="block text-sm text-white/70">Nombre</label>
            <input
               value={data.nombre}
               disabled
               className="w-full mt-1 rounded-xl bg-white/10 px-3 py-2 outline-none"
            />

            {/* SELECT de tipos */}
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

            {/* Observaciones */}
            <label className="block text-sm text-white/70 mt-4">
               Observaciones
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
