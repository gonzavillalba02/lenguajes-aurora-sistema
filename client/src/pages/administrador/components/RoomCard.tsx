import type { HabitacionDomain } from "../../../types/habitacion.types";
import { toHabStatus, type HabStatus } from "../../../utils/rooms.utils";
import { StatusBadge } from "../../../components/StatusBadge";

export default function RoomCard({
   item,
   onOpen,
   statusOverride,
}: {
   item: HabitacionDomain;
   onOpen: (h: HabitacionDomain) => void;
   /** Estado visual en vivo; si no viene, usamos (activa/disponible) */
   statusOverride?: HabStatus;
}) {
   const status = statusOverride ?? toHabStatus(item.activa, item.disponible);

   return (
      <button
         onClick={() => onOpen(item)}
         className="group text-left rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors p-4 focus:outline-none focus:ring-2 focus:ring-white/20"
      >
         <div className="flex items-center justify-between gap-3">
            <div className="text-white text-base font-medium">
               Habitación {item.numero || item.nombre}
            </div>
            <StatusBadge tipo="habitacion" value={status} />
         </div>
         {/* Minimalista: sin tipo/capacidad/precio/descr como pediste */}
      </button>
   );
}
