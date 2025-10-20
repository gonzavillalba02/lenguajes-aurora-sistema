import { useEffect, useMemo, useState } from "react";
import {
   fetchOperadores,
   desactivarOperador,
   reactivarOperador,
   crearOperador,
} from "../../services/operador.service";
import type { Operador, CreateOperadorDTO } from "../../types/operador.types";
import OperatorFormModal from "../administrador/components/OperatorFormModal";
import Toast from "../../components/Toast";
import ConfirmDialog from "../../components/ConfirmDialog";
export default function OperadoresPage() {
   const [items, setItems] = useState<Operador[]>([]);
   const [loading, setLoading] = useState(false);
   const [saving, setSaving] = useState(false);
   const [query, setQuery] = useState("");
   const [showInactivos, setShowInactivos] = useState(false);
   const [openNew, setOpenNew] = useState(false);

   // Confirmación activar/desactivar
   const [confirmOpen, setConfirmOpen] = useState(false);
   const [confirmLoading, setConfirmLoading] = useState(false);
   const [targetOp, setTargetOp] = useState<Operador | null>(null);
   const [nextActive, setNextActive] = useState<boolean>(true);

   // Toast
   const [toastOpen, setToastOpen] = useState(false);
   const [toastType, setToastType] = useState<
      "success" | "error" | "info" | "warning"
   >("success");
   const [toastMsg, setToastMsg] = useState("");

   const showToast = (type: typeof toastType, message: string) => {
      setToastType(type);
      setToastMsg(message);
      setToastOpen(true);
   };

   const load = async () => {
      setLoading(true);
      try {
         setItems(await fetchOperadores());
      } finally {
         setLoading(false);
      }
   };
   useEffect(() => {
      load();
   }, []);

   const onSubmitNew = async (dto: CreateOperadorDTO) => {
      setSaving(true);
      try {
         await crearOperador(dto);
         setOpenNew(false);
         await load();
         showToast("success", "Operador creado con éxito.");
      } catch (e: any) {
         showToast(
            "error",
            e?.response?.data?.message ?? "No se pudo crear el operador."
         );
      } finally {
         setSaving(false);
      }
   };

   // Abre confirmación sin cambiar el checkbox aún (UI controlada)
   const requestToggle = (op: Operador) => {
      setTargetOp(op);
      setNextActive(!op.activo);
      setConfirmOpen(true);
   };

   const doToggle = async () => {
      if (!targetOp) return;
      setConfirmLoading(true);
      try {
         if (nextActive) {
            await reactivarOperador(targetOp.id);
         } else {
            await desactivarOperador(targetOp.id);
         }
         // Actualizar en memoria
         setItems((prev) =>
            prev.map((i) =>
               i.id === targetOp.id ? { ...i, activo: nextActive } : i
            )
         );
         showToast("success", "Operación realizada con éxito.");
         setConfirmOpen(false);
      } catch (e: any) {
         showToast(
            "error",
            e?.response?.data?.message ?? "No se pudo completar la operación."
         );
      } finally {
         setConfirmLoading(false);
      }
   };

   const data = useMemo(() => {
      let rows = items;
      if (!showInactivos) rows = rows.filter((r) => !!r.activo);
      if (query.trim()) {
         const q = query.toLowerCase();
         rows = rows.filter(
            (r) =>
               r.nombre.toLowerCase().includes(q) ||
               r.email.toLowerCase().includes(q) ||
               String(r.dni).includes(q)
         );
      }
      return rows;
   }, [items, showInactivos, query]);

   return (
      <div className="p-4 md:p-6 space-y-4">
         {/* Header */}
         <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-white">Operadores</h1>
            <button
               onClick={() => setOpenNew(true)}
               className="rounded-full bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 shadow"
            >
               + Crear Operador
            </button>
         </div>

         {/* Search + toggle inactivos */}
         <div className="rounded-3xl bg-[#0f1724]/70 border border-white/10 p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="flex items-center gap-3 rounded-full bg-[#1B2431] border border-white/10 px-4 py-2 w-full md:w-[28rem]">
               <svg viewBox="0 0 24 24" className="size-4 text-white/60">
                  <path
                     fill="currentColor"
                     d="M21 20.3 16.7 16A7.5 7.5 0 1 0 16 16.7L20.3 21zM4 10.5a6.5 6.5 0 1 1 13 0a6.5 6.5 0 0 1-13 0"
                  />
               </svg>
               <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar nombre / email / DNI"
                  className="bg-transparent outline-none text-white/90 placeholder:text-white/50 w-full"
               />
            </div>

            <label className="inline-flex items-center gap-3 text-white/80">
               <input
                  type="checkbox"
                  checked={showInactivos}
                  onChange={(e) => setShowInactivos(e.target.checked)}
                  className="size-4 rounded border-white/20 bg-transparent"
               />
               Mostrar inactivos
            </label>
         </div>

         {/* Tabla (filas parejas) */}
         <div className="rounded-2xl bg-[#121826] p-4 shadow border border-white/10">
            <div className="overflow-auto">
               <table className="min-w-full text-sm table-fixed">
                  {/* Columnas fijas para que todo quede alineado */}
                  <colgroup>
                     <col className="w-[90px]" />
                     <col className="w-[36%]" />
                     <col className="w-[18%]" />
                     <col className="w-[46%]" />
                  </colgroup>

                  <thead className="text-white/70">
                     <tr className="[&>th]:px-4 [&>th]:py-3">
                        <th className="text-center">Activo</th>
                        <th className="text-left">Nombre y Apellido</th>
                        <th className="text-center">DNI</th>
                        <th className="text-left">Email</th>
                     </tr>
                  </thead>

                  <tbody
                     className="
      text-white/90
      [&>tr>td]:px-4 [&>tr>td]:py-3
      [&>tr]:h-12 [&>tr]:align-middle
      /* Alineación por columna */
      [&>tr>td:nth-child(1)]:text-center
      [&>tr>td:nth-child(3)]:text-center
      /* Números del DNI bien alineados */
      [&>tr>td:nth-child(3)]:font-mono
      [&>tr>td:nth-child(3)]:tabular-nums
    "
                  >
                     {loading && (
                        <tr>
                           <td
                              colSpan={4}
                              className="px-3 py-6 text-center text-white/50"
                           >
                              Cargando…
                           </td>
                        </tr>
                     )}

                     {!loading && data.length === 0 && (
                        <tr>
                           <td
                              colSpan={4}
                              className="px-3 py-6 text-center text-white/50"
                           >
                              Sin resultados
                           </td>
                        </tr>
                     )}

                     {data.map((op, idx) => (
                        <tr
                           key={op.id}
                           className={`${
                              idx % 2 === 0 ? "bg-[#1C2E3F]" : "bg-[#213245]"
                           }`}
                        >
                           <td>
                              <input
                                 type="checkbox"
                                 checked={!!op.activo}
                                 onChange={() => requestToggle(op)}
                                 title={op.activo ? "Desactivar" : "Reactivar"}
                                 className="size-4 accent-emerald-500"
                              />
                           </td>
                           <td className="truncate">{op.nombre}</td>
                           <td>{op.dni}</td>
                           <td className="truncate">{op.email}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>

         {/* Modal crear */}
         <OperatorFormModal
            open={openNew}
            onClose={() => setOpenNew(false)}
            onSubmit={onSubmitNew}
            submitting={saving}
         />

         {/* Confirmación activar/desactivar */}
         <ConfirmDialog
            open={confirmOpen}
            title="Confirmar acción"
            message={
               nextActive
                  ? `¿Deseás reactivar al operador “${targetOp?.nombre}”?`
                  : `¿Deseás desactivar al operador “${targetOp?.nombre}”?`
            }
            confirmText={nextActive ? "Reactivar" : "Desactivar"}
            cancelText="Cancelar"
            loading={confirmLoading}
            onConfirm={doToggle}
            onClose={() => setConfirmOpen(false)}
         />

         {/* Toast (tu componente) */}
         <Toast
            open={toastOpen}
            type={toastType}
            title={toastType === "success" ? "Éxito" : undefined}
            message={toastMsg}
            onClose={() => setToastOpen(false)}
         />
      </div>
   );
}
