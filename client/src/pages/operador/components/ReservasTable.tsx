import { StatusBadge } from "../../../components/StatusBadge";
import { Eye } from "lucide-react";
type Row = {
   id: number;
   cliente: string;
   fechaInicio: string;
   fechaFin: string;
   habitacionNumero: number;
   tipoHabitacion: string;
   status:
      | "Pendiente"
      | "Pendiente de pago"
      | "Aprobada"
      | "Rechazada"
      | "Cancelada";
};

export default function ReservasTable({
   rows,
   loading,
   onRowClick,
   showViewIcon = true,
}: {
   rows: Row[];
   loading: boolean;
   onRowClick?: (id: number) => void;
   showViewIcon?: boolean;
}) {
   return (
      <div className="overflow-auto rounded-xl border border-white/10">
         <table className="min-w-full text-sm">
            <thead className="bg-bg/40">
               <tr className="text-white/60">
                  <th className="px-3 py-2 text-left font-medium">Cliente</th>
                  <th className="px-3 py-2 text-left font-medium">
                     Fecha de Reserva
                  </th>
                  <th className="px-3 py-2 text-left font-medium">
                     Habitación
                  </th>
                  <th className="px-3 py-2 text-left font-medium">Tipo</th>
                  <th className="px-3 py-2 text-left font-medium">Estado</th>
                  {showViewIcon && <th className="w-10" />}
               </tr>
            </thead>
            <tbody>
               {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                     <tr key={i} className="border-t border-white/10">
                        <td className="px-3 py-2" colSpan={6}>
                           <div className="h-5 w-full animate-pulse rounded bg-white/5" />
                        </td>
                     </tr>
                  ))
               ) : rows.length ? (
                  rows.map((r) => (
                     <tr
                        key={r.id}
                        className={`border-t border-white/10 transition-colors ${
                           onRowClick ? "cursor-pointer hover:bg-white/5" : ""
                        }`}
                        onClick={() => onRowClick?.(r.id)}
                     >
                        <td className="px-3 py-2">{r.cliente || "—"}</td>
                        <td className="px-3 py-2">
                           <span>{formatRange(r.fechaInicio, r.fechaFin)}</span>
                        </td>
                        <td className="px-3 py-2 font-semibold">
                           {r.habitacionNumero}
                        </td>
                        {/* ⬇️ aquí la conversión solo para la celda */}
                        <td
                           className="px-3 py-2 whitespace-nowrap"
                           title={humanizeTipo(r.tipoHabitacion)}
                        >
                           {humanizeTipo(r.tipoHabitacion)}
                        </td>
                        <td className="px-3 py-2">
                           <StatusBadge tipo="reserva" value={r.status} />
                        </td>
                        {showViewIcon && (
                           <td
                              className="px-2"
                              onClick={(e) => {
                                 e.stopPropagation();
                                 onRowClick?.(r.id);
                              }}
                              title="Ver detalle"
                           >
                              <button className="p-1 rounded hover:bg-white/10">
                                 <Eye size={16} />
                              </button>
                           </td>
                        )}
                     </tr>
                  ))
               ) : (
                  <tr className="border-t border-white/10">
                     <td
                        className="px-3 py-2 text-center text-white/60"
                        colSpan={6}
                     >
                        No hay reservas pendientes
                     </td>
                  </tr>
               )}
            </tbody>
         </table>
      </div>
   );
}

function formatRange(fromISO: string, toISO: string) {
   const from = new Date(fromISO);
   const to = new Date(toISO);
   const f = (d: Date) =>
      d.toLocaleDateString(undefined, {
         day: "2-digit",
         month: "2-digit",
         year: "2-digit",
      });
   return `${f(from)} - ${f(to)}`;
}
/* ==== helper local: slug -> label legible ==== */
function humanizeTipo(v?: string | null) {
   if (!v) return "—";
   // si viene en formato slug: parejas_estandar -> Parejas Estándar
   if (v.includes("_")) {
      const label = v
         .split("_")
         .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
         .join(" ");
      // corrección común: suit -> Suite
      return label.replace(/\bSuit\b/gi, "Suite");
   }
   // si ya viene legible, solo corregimos "suit" -> "Suite"
   return v.replace(/\bSuit\b/gi, "Suite");
}
