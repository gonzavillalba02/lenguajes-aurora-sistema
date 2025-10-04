import { useMemo } from "react";
import type { HabStatus } from "../../../types/types";

export type Room = { id: number; numero: number; status: HabStatus };

export default function RoomsGrid({ rooms }: { rooms: Room[] }) {
   const ordered = useMemo(
      () => [...rooms].sort((a, b) => a.numero - b.numero),
      [rooms]
   );

   return (
      <div className="p-2">
         <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-10 gap-2">
            {ordered.map((r) => (
               <button
                  key={r.id}
                  className={`
              relative h-9 rounded-lg text-xs font-semibold
              text-white/90
              transition-transform duration-150
              hover:scale-[1.02] active:scale-[.98]
              focus:outline-none focus:ring-2 focus:ring-button/70
              ${roomBg(r.status)}
            `}
                  title={`Hab. ${r.numero} — ${r.status}`}
               >
                  {r.numero}
               </button>
            ))}
         </div>
      </div>
   );
}

function roomBg(status: HabStatus) {
   switch (status) {
      case "Libre":
         return "bg-habitacion-libre/90";
      case "Ocupada":
         return "bg-habitacion-ocupada/90";
      case "Cerrada":
         return "bg-habitacion-cerrada/90";
   }
}
