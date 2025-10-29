import type { HabitacionDomain } from "../../../types/habitacion.types";
import KpiCard from "../../../components/KpiCard";
import { toHabStatus } from "../../../utils/rooms.utils";

export type RoomsKpisProps = {
   items: HabitacionDomain[];
   activeFilter: "all" | "Libre" | "Ocupada" | "Cerrada" | " Eliminada";
   onFilter: (f: RoomsKpisProps["activeFilter"]) => void;
};

export default function RoomsKpis({
   items,
   activeFilter,
   onFilter,
}: RoomsKpisProps) {
   const counts = items.reduce(
      (acc, h) => {
         const s = toHabStatus(h.activa, h.disponible);
         acc.total++;
         if (s === "Libre") acc.libres++;
         else if (s === "Ocupada") acc.ocupadas++;
         else acc.cerradas++;
         return acc;
      },
      { total: 0, libres: 0, ocupadas: 0, cerradas: 0 }
   );

   const tiles: Array<{
      label: string;
      value: number;
      variant: any;
      filter: RoomsKpisProps["activeFilter"];
   }> = [
      {
         label: "Habitaciones Libres",
         value: counts.libres,
         variant: "libres",
         filter: "Libre",
      },
      {
         label: "Habitaciones Ocupadas",
         value: counts.ocupadas,
         variant: "ocupadas",
         filter: "Ocupada",
      },
      {
         label: "Habitaciones cerradas",
         value: counts.cerradas,
         variant: "cerradas",
         filter: "Cerrada",
      },

      { label: "Total", value: counts.total, variant: "total", filter: "all" },
   ];

   return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
         {tiles.map((t) => (
            <button
               key={t.label}
               type="button"
               className="select-none"
               onClick={() => onFilter(t.filter)}
            >
               <KpiCard
                  label={t.label}
                  value={t.value}
                  variant={t.variant}
                  active={activeFilter === t.filter}
               />
            </button>
         ))}
      </div>
   );
}
