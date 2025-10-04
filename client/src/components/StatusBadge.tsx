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
              Pendiente:
                 "bg-estado-pendienteReserva/20 text-estado-pendienteReserva",
              "Pendiente de pago":
                 "bg-estado-pendientePago/20 text-estado-pendientePago",
              Aprobada: "bg-estado-aprobada/20 text-estado-aprobada",
              Rechazada: "bg-estado-rechazada/20 text-estado-rechazada",
              Cancelada: "bg-estado-cancelada/20 text-estado-cancelada",
           }
         : {
              Libre: "bg-habitacion-libre/20 text-habitacion-libre",
              Ocupada: "bg-habitacion-ocupada/20 text-habitacion-ocupada",
              Cerrada: "bg-habitacion-cerrada/20 text-habitacion-cerrada",
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
