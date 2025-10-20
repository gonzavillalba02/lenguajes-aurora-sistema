import type { Operador } from "../../../types/operador.types";

export default function OperatorsKpis({
   items,
   activeFilter,
   onFilter,
}: {
   items: Operador[];
   activeFilter: "all" | "activos" | "inactivos";
   onFilter: (f: "all" | "activos" | "inactivos") => void;
}) {
   const k = items.reduce(
      (a, i) => ({
         total: a.total + 1,
         activos: a.activos + (i.activo ? 1 : 0),
         inactivos: a.inactivos + (i.activo ? 0 : 1),
      }),
      { total: 0, activos: 0, inactivos: 0 }
   );

   const Tile = ({
      color,
      label,
      value,
      active,
      onClick,
   }: {
      color: "blue" | "amber" | "green" | "red" | "zinc";
      label: string;
      value: number;
      active?: boolean;
      onClick?: () => void;
   }) => (
      <button
         onClick={onClick}
         className={`rounded-3xl px-6 py-5 text-left w-full shadow border
        ${active ? "ring-2 ring-amber-400" : ""}
        bg-[#121826]/70 border-white/10 hover:bg-white/[0.06] transition`}
      >
         <div className="flex items-center gap-2 text-xs text-white/70">
            <span
               className={`size-2 rounded-full ${
                  color === "blue"
                     ? "bg-blue-400"
                     : color === "amber"
                     ? "bg-amber-400"
                     : color === "green"
                     ? "bg-emerald-400"
                     : color === "red"
                     ? "bg-rose-400"
                     : "bg-zinc-300"
               }`}
            />
            {label.toUpperCase()}
         </div>
         <div className="mt-2 text-3xl font-bold text-white">{value}</div>
      </button>
   );

   return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
         <Tile
            color="blue"
            label="Pendiente de verificación"
            value={0}
            active={activeFilter === "all"}
            onClick={() => onFilter("all")}
         />
         <Tile
            color="amber"
            label="Pendiente de activación"
            value={k.inactivos}
            active={activeFilter === "inactivos"}
            onClick={() => onFilter("inactivos")}
         />
         <Tile
            color="green"
            label="Activos"
            value={k.activos}
            active={activeFilter === "activos"}
            onClick={() => onFilter("activos")}
         />
         <Tile color="red" label="Inactivos" value={k.inactivos} />
         <Tile color="zinc" label="Total" value={k.total} />
      </div>
   );
}
