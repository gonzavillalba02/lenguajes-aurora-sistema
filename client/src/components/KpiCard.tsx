type KpiVariant =
   | "pendienteReserva"
   | "pendientePago"
   | "aprobada"
   | "rechazada"
   | "cancelada"
   | "consultas"
   | "disponibles"
   | "libres"
   | "ocupadas"
   | "cerradas"
   | "total"
   | "eliminadas";

type Props = {
   label: string;
   value: number | string;
   variant: KpiVariant;
   active?: boolean;
   className?: string;
};

const VAR: Record<
   KpiVariant,
   { text: string; ring: string; dot: string; hover: string }
> = {
   pendienteReserva: {
      text: "text-estado-pendienteReserva",
      ring: "ring-estado-pendienteReserva/30",
      dot: "bg-estado-pendienteReserva",
      hover: "hover:bg-estado-pendienteReserva hover:text-white",
   },
   pendientePago: {
      text: "text-estado-pendientePago",
      ring: "ring-estado-pendientePago/30",
      dot: "bg-estado-pendientePago",
      hover: "hover:bg-estado-pendientePago hover:text-white",
   },
   aprobada: {
      text: "text-estado-aprobada",
      ring: "ring-estado-aprobada/30",
      dot: "bg-estado-aprobada",
      hover: "hover:bg-estado-aprobada hover:text-white",
   },
   rechazada: {
      text: "text-estado-rechazada",
      ring: "ring-estado-rechazada/30",
      dot: "bg-estado-rechazada",
      hover: "hover:bg-estado-rechazada hover:text-white",
   },
   cancelada: {
      text: "text-estado-cancelada",
      ring: "ring-estado-cancelada/30",
      dot: "bg-estado-cancelada",
      hover: "hover:bg-estado-cancelada hover:text-white",
   },
   consultas: {
      text: "text-button",
      ring: "ring-button/30",
      dot: "bg-button",
      hover: "hover:bg-button hover:text-white",
   },
   disponibles: {
      text: "text-habitacion-libre",
      ring: "ring-habitacion-libre/30",
      dot: "bg-habitacion-libre",
      hover: "hover:bg-habitacion-libre hover:text-white",
   },
   libres: {
      text: "text-habitacion-libre",
      ring: "ring-habitacion-libre/30",
      dot: "bg-habitacion-libre",
      hover: "hover:bg-habitacion-libre hover:text-white",
   },
   ocupadas: {
      text: "text-habitacion-ocupada",
      ring: "ring-habitacion-ocupada/30",
      dot: "bg-habitacion-ocupada",
      hover: "hover:bg-habitacion-ocupada hover:text-white",
   },
   cerradas: {
      text: "text-habitacion-cerrada",
      ring: "ring-habitacion-cerrada/30",
      dot: "bg-habitacion-cerrada",
      hover: "hover:bg-habitacion-cerrada hover:text-white",
   },
   total: {
      text: "text-white/90",
      ring: "ring-white/10",
      dot: "bg-white/30",
      hover: "hover:bg-white/20 hover:text-white",
   },
   eliminadas: {
      text: "text-red-500",
      ring: "ring-red-500/30",
      dot: "bg-red-500",
      hover: "hover:bg-red-500 hover:text-white",
   },
};

export default function KpiCard({
   label,
   value,
   variant,
   active,
   className = "",
}: Props) {
   const s = VAR[variant];

   return (
      <div
         className={[
            "group rounded-[var(--radius-xl2)] bg-bg2/80",
            "border",
            active ? "border-estado-pendienteReserva" : "border-white/5",
            "p-4 ring-1 ring-inset",
            s.ring,
            "transition-all duration-200 cursor-pointer",
            "hover:shadow-[var(--shadow-card)]",
            s.hover,
            "flex flex-col items-center justify-center text-center min-h-28",
            className,
         ].join(" ")}
         role="region"
         tabIndex={0}
      >
         <div className="flex items-center justify-center gap-2">
            <span
               className={[
                  "h-2.5 w-2.5 rounded-full shadow-inner",
                  s.dot,
                  "group-hover:bg-white",
               ].join(" ")}
            />
            <span
               className={[
                  "text-xs tracking-wide uppercase opacity-90",
                  s.text,
                  "group-hover:text-white",
               ].join(" ")}
            >
               {label}
            </span>
         </div>
         <div className="mt-3 text-2xl font-semibold text-text group-hover:text-white">
            {value}
         </div>
      </div>
   );
}
