import { StatusBadge } from "../../../components/StatusBadge";

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
}: {
   rows: Row[];
   loading: boolean;
}) {
   return (
      <div className="overflow-auto rounded-xl border border-white/10">
         <table className="min-w-full text-sm">
            <thead className="bg-bg/40">
               <tr className="text-white/60">
                  <th className="px-3 py-2 text-left font-medium">Cliente</th>
                  <th className="px-3 py-2 text-left font-medium">Fecha</th>
                  <th className="px-3 py-2 text-left font-medium">
                     Habitación
                  </th>
                  <th className="px-3 py-2 text-left font-medium">Tipo</th>
                  <th className="px-3 py-2 text-left font-medium">Estado</th>
               </tr>
            </thead>
            <tbody>
               {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                     <tr key={i} className="border-t border-white/10">
                        <td className="px-3 py-2" colSpan={5}>
                           <div className="h-5 w-full animate-pulse rounded bg-white/5" />
                        </td>
                     </tr>
                  ))
               ) : rows.length ? (
                  rows.map((r) => (
                     <tr
                        key={r.id}
                        className="border-t border-white/10 hover:bg-white/5 transition-colors"
                     >
                        <td className="px-3 py-2">{r.cliente || "—"}</td>
                        <td className="px-3 py-2">
                           <div className="inline-flex items-center gap-2">
                              <span>
                                 {formatRange(r.fechaInicio, r.fechaFin)}
                              </span>
                           </div>
                        </td>
                        <td className="px-3 py-2 font-semibold">
                           {r.habitacionNumero}
                        </td>
                        <td className="px-3 py-2">{r.tipoHabitacion || "—"}</td>
                        <td className="px-3 py-2">
                           <StatusBadge tipo="reserva" value={r.status} />
                        </td>
                     </tr>
                  ))
               ) : (
                  <tr className="border-t border-white/10">
                     <td
                        className="px-3 py-2 text-center text-white/60"
                        colSpan={5}
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
