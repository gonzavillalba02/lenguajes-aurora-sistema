export function StatusBadge({
   tipo,
   value,
}: {
   tipo: "reserva" | "habitacion";
   value: string;
}) {
   const map: Record<string, string> =
      tipo === "reserva"
         ? {
              Aprobada: "bg-estado-aprobada/50 text-white",
              Rechazada: "bg-estado-rechazada/10 text-white",
              Cancelada: "bg-estado-cancelada/20 text-white",
           }
         : {
              Libre: "bg-habitacion-libre/20 text-habitacion-libre",
              Ocupada: "bg-habitacion-ocupada/20 text-habitacion-ocupada",
              Cerrada: "bg-habitacion-cerrada/20 text-habitacion-cerrada",
              Eliminada: "bg-red-500/20 text-red-500",
           };

   return (
      <span
         className={`inline-flex items-center rounded-lg px-2 py-1 text-xs font-semibold ${
            map[value] ?? "bg-white/10 text-white/80"
         }`}
      >
         {value}
      </span>
   );
}
