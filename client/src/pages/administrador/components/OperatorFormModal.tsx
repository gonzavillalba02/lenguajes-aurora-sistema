import { useState } from "react";
import type { CreateOperadorDTO } from "../../../types/operador.types";
import AnimacionDetails from "../../../components/AnimacionDetails";

export default function OperatorFormModal({
   open,
   onClose,
   onSubmit,
   submitting,
}: {
   open: boolean;
   onClose: () => void;
   onSubmit: (dto: CreateOperadorDTO) => Promise<void>;
   submitting?: boolean;
}) {
   const [form, setForm] = useState({
      nombre: "",
      email: "",
      dni: "",
      password: "",
   });
   const disabled =
      submitting || !form.nombre || !form.email || !form.dni || !form.password;

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      await onSubmit({
         nombre: form.nombre.trim(),
         email: form.email.trim(),
         dni: Number(form.dni),
         password: form.password,
      });
      setForm({ nombre: "", email: "", dni: "", password: "" });
   };

   return (
      <AnimacionDetails
         open={open}
         onClose={onClose}
         title={<span className="text-white">Operador</span>}
         maxWidth="lg"
         blur
         escToClose
         closeOnBackdrop
         showCloseButton
         durationMs={180}
         panelClassName="bg-[#1F2633] border border-gray-700"
         overlayClassName="bg-black/50"
         footer={
            <div className="flex justify-end gap-2">
               <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 rounded-xl border border-gray-600 text-gray-200 hover:bg-white/5"
                  disabled={submitting}
               >
                  Cancelar
               </button>
               <button
                  form="operator-form"
                  type="submit"
                  disabled={disabled}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white disabled:opacity-60"
               >
                  {submitting ? "Guardando..." : "Crear"}
               </button>
            </div>
         }
      >
         <form
            id="operator-form"
            onSubmit={handleSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
         >
            {[
               ["Nombre", "nombre", "text"],
               ["DNI", "dni", "text"],
               ["Email", "email", "email"],
               ["Contraseña", "password", "password"],
            ].map(([label, key, type]) => (
               <div
                  key={key}
                  className={`flex flex-col gap-2 ${
                     key === "password" ? "sm:col-span-2" : ""
                  }`}
               >
                  <label className="text-sm text-gray-300">{label}</label>
                  <input
                     type={type}
                     className="rounded-lg bg-[#2D3E4E] px-3 py-2 text-white outline-none border border-gray-600 focus:border-amber-500"
                     value={(form as any)[key!]}
                     onChange={(e) =>
                        setForm((f) => ({ ...f, [key!]: e.target.value }))
                     }
                  />
               </div>
            ))}
         </form>
      </AnimacionDetails>
   );
}
