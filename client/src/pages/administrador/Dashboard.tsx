import { useEffect, useMemo, useState } from "react";
import {
   Bar,
   BarChart,
   CartesianGrid,
   Line,
   LineChart,
   Pie,
   PieChart,
   ResponsiveContainer,
   Tooltip,
   XAxis,
   YAxis,
   Legend,
   Cell,
} from "recharts";
import KpiCard from "../../components/KpiCard";
import { fetchReservasAll } from "../../services/reservas.service";
import {
   fetchHabitaciones,
   fetchTiposHabitacionResumen,
   type TipoHabitacionResumen,
} from "../../services/habitacion.service";
import type { HabitacionDomain } from "../../types/habitacion.types";
import type { ReservaDomain } from "../../types/reserva.types";

const COLORS = [
   "#BC9C23", // dorado
   "#60a5fa", // azul
   "#34d399", // verde
   "#f59e0b", // ámbar
   "#ef4444", // rojo
   "#a78bfa", // violeta
   "#22d3ee", // cian
   "#fb7185", // rosa
];

// (opcional) colores fijos por tipo para que no cambien de orden
const TYPE_COLORS: Record<string, string> = {
   parejas_estandar: "#BC9C23",
   parejas_suit: "#a78bfa",
   cuadruple_estandar: "#60a5fa",
   cuadruple_suit: "#34d399",
   familiar_estandar: "#f59e0b",
   familiar_suit: "#ef4444",
};
/*
  ==============================
  Helpers de fecha y agregados
  ==============================
*/
function formatISO(d: Date) {
   return d.toISOString().slice(0, 10);
}
function startOfMonth(d: Date) {
   return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
   return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function daysInMonth(d: Date) {
   return endOfMonth(d).getDate();
}
function eachDayOfCurrentMonth(): Date[] {
   const now = new Date();
   const days = daysInMonth(now);
   const arr: Date[] = [];
   for (let i = 1; i <= days; i++)
      arr.push(new Date(now.getFullYear(), now.getMonth(), i));
   return arr;
}
// noches entre [desde, hasta) (checkout no cuenta)
function nights(desde: Date, hasta: Date) {
   const MS = 24 * 60 * 60 * 1000;
   return Math.max(0, Math.round((hasta.getTime() - desde.getTime()) / MS));
}

/*
  ==========================================
  Cálculos de negocio (Ocupación/Ingresos)
  ==========================================
*/
function calcPrecioPorTipo(tipos: TipoHabitacionResumen[]) {
   const map = new Map<number, number>();
   for (const t of tipos) map.set(t.id, t.precio_noche);
   return map;
}
function calcTipoIdPorHabitacion(habs: HabitacionDomain[]) {
   const map = new Map<number, number>(); // habId -> tipoId
   for (const h of habs) if (h.tipo_id) map.set(h.id, h.tipo_id);
   return map;
}

function isApproved(r: ReservaDomain) {
   return r.estado === "aprobada";
}
function isCancelled(r: ReservaDomain) {
   return r.estado === "cancelada";
}

// Ocupación diaria del mes actual (porcentaje)
function buildDailyOccupancy(
   reservas: ReservaDomain[],
   habsActivas: HabitacionDomain[]
) {
   const days = eachDayOfCurrentMonth();
   const totalRooms = habsActivas.filter((h) => h.activa).length || 1;

   return days.map((d) => {
      const dayISO = formatISO(d);
      // habitaciones ocupadas ese día: hay reserva aprobada cuyo rango contiene el día
      const ocupadas = new Set<number>();
      for (const r of reservas) {
         if (!isApproved(r)) continue;
         const inDay =
            formatISO(r.rango.desde) <= dayISO &&
            dayISO < formatISO(new Date(r.rango.hasta.getTime()));
         if (inDay) ocupadas.add(r.habitacion.id);
      }
      const pct = Math.round((ocupadas.size / totalRooms) * 100);
      return { day: d.getDate(), ocupacion: pct };
   });
}

// Ingresos por mes (12 meses)
function buildRevenueByMonth(
   reservas: ReservaDomain[],
   habs: HabitacionDomain[],
   tipos: TipoHabitacionResumen[]
) {
   const tipoPorHab = calcTipoIdPorHabitacion(habs);
   const precioPorTipo = calcPrecioPorTipo(tipos);

   // últimos 12 meses desde hoy, index 0 = mes actual
   const now = new Date();
   const buckets = Array.from({ length: 12 }).map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      return {
         key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
         label: d.toLocaleString("es-AR", { month: "short" }),
         aprobada: 0,
         cancelada: 0,
      };
   });

   for (const r of reservas) {
      const start = new Date(r.rango.desde);
      const end = new Date(r.rango.hasta);
      const tmp = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      if (end < tmp) continue;

      const tipoId = tipoPorHab.get(r.habitacion.id);
      const precio = tipoId ? precioPorTipo.get(tipoId) || 0 : 0;

      let cur = new Date(start.getFullYear(), start.getMonth(), 1);
      while (cur <= new Date(end.getFullYear(), end.getMonth(), 1)) {
         const bucketKey = `${cur.getFullYear()}-${String(
            cur.getMonth() + 1
         ).padStart(2, "0")}`;
         const idx = buckets.findIndex((b) => b.key === bucketKey);
         if (idx >= 0) {
            const mStart = new Date(cur.getFullYear(), cur.getMonth(), 1);
            const mEnd = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
            const seg = {
               desde: new Date(Math.max(start.getTime(), mStart.getTime())),
               hasta: new Date(Math.min(end.getTime(), mEnd.getTime())),
            };
            const n = nights(seg.desde, seg.hasta);
            if (isApproved(r)) buckets[idx].aprobada += n * precio;
            if (isCancelled(r)) buckets[idx].cancelada += n * precio;
         }
         cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
      }
   }

   return buckets;
}

// Distribución por tipo de habitación (conteo de reservas aprobadas)
function buildByRoomType(reservas: ReservaDomain[]) {
   const map = new Map<string, number>();
   for (const r of reservas)
      if (isApproved(r))
         map.set(r.habitacion.tipo, (map.get(r.habitacion.tipo) || 0) + 1);
   return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}

// Ubicaciones (provincias/ciudades)
function buildByUbicacion(reservas: ReservaDomain[]) {
   const map = new Map<string, number>();
   for (const r of reservas) {
      const ub = (r.cliente.ubicacion || "Sin dato").trim();
      map.set(ub, (map.get(ub) || 0) + 1);
   }
   return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}

// KPIs
function computeKpis(
   reservas: ReservaDomain[],
   habs: HabitacionDomain[],
   tipos: TipoHabitacionResumen[]
) {
   const aprobadas = reservas.filter(isApproved);
   const canceladas = reservas.filter(isCancelled);
   const total = reservas.length;

   const now = new Date();
   const mStart = startOfMonth(now);
   const mEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

   // Ocupación promedio del mes
   const daily = buildDailyOccupancy(reservas, habs);
   const occAvg = Math.round(
      daily.reduce((s, d) => s + d.ocupacion, 0) / (daily.length || 1)
   );

   // Ingreso del mes actual
   const revMonths = buildRevenueByMonth(reservas, habs, tipos);
   const revThisMonth = revMonths[11]?.aprobada || 0;

   // ADR = revenue / noches vendidas (aprobadas)
   const tipoPorHab = calcTipoIdPorHabitacion(habs);
   const precioPorTipo = calcPrecioPorTipo(tipos);
   let rev = 0,
      nochesVendidas = 0;
   for (const r of aprobadas) {
      const ovlp = {
         desde: new Date(Math.max(r.rango.desde.getTime(), mStart.getTime())),
         hasta: new Date(Math.min(r.rango.hasta.getTime(), mEnd.getTime())),
      };
      const n = nights(ovlp.desde, ovlp.hasta);
      if (n <= 0) continue;
      const tipoId = tipoPorHab.get(r.habitacion.id);
      const precio = tipoId ? precioPorTipo.get(tipoId) || 0 : 0;
      rev += n * precio;
      nochesVendidas += n;
   }
   const adr = nochesVendidas
      ? Math.round((rev / nochesVendidas) * 100) / 100
      : 0;

   // RevPAR
   const rooms = habs.filter((h) => h.activa).length || 1;
   const revpar = Math.round((rev / (rooms * daysInMonth(now))) * 100) / 100;

   // Tasa de cancelación
   const cancelRate = total ? Math.round((canceladas.length / total) * 100) : 0;

   return {
      occAvg,
      revThisMonth,
      aprobadas: aprobadas.length,
      canceladas: canceladas.length,
      cancelRate,
      adr,
      revpar,
   };
}

/*
  ==============================
  Componente principal
  ==============================
*/
export default function DashboardAdmin() {
   const [loading, setLoading] = useState(true);
   const [mounted, setMounted] = useState(false); // evita medición 0 de Recharts

   const [reservas, setReservas] = useState<ReservaDomain[]>([]);
   const [habitaciones, setHabitaciones] = useState<HabitacionDomain[]>([]);
   const [tipos, setTipos] = useState<TipoHabitacionResumen[]>([]);

   useEffect(() => {
      setMounted(true);
      (async () => {
         try {
            const [rs, hs, ts] = await Promise.all([
               fetchReservasAll(),
               fetchHabitaciones({ scope: "admin" }),
               fetchTiposHabitacionResumen(),
            ]);
            setReservas(rs);
            setHabitaciones(hs);
            setTipos(ts);
         } finally {
            setLoading(false);
         }
      })();
   }, []);

   const dailyOcc = useMemo(
      () => buildDailyOccupancy(reservas, habitaciones),
      [reservas, habitaciones]
   );
   const revenueByMonth = useMemo(
      () => buildRevenueByMonth(reservas, habitaciones, tipos),
      [reservas, habitaciones, tipos]
   );
   const byType = useMemo(() => buildByRoomType(reservas), [reservas]);
   const byUbic = useMemo(() => buildByUbicacion(reservas), [reservas]);
   const kpis = useMemo(
      () => computeKpis(reservas, habitaciones, tipos),
      [reservas, habitaciones, tipos]
   );

   if (loading)
      return <div className="p-6 text-white/70">Cargando estadísticas…</div>;

   return (
      <div className="p-6 grid gap-6 min-w-0">
         {/* KPIs */}
         <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-w-0">
            <KpiCard
               label="Ocupación Promedio (mes)"
               value={`${kpis.occAvg}%`}
               variant="aprobada"
            />
            <KpiCard
               label="Ingresos (mes)"
               value={`$ ${kpis.revThisMonth.toLocaleString("es-AR")}`}
               variant="consultas"
            />
            <KpiCard
               label="Reservas Aprobadas"
               value={kpis.aprobadas}
               variant="aprobada"
            />
            <KpiCard
               label="Cancelaciones"
               value={kpis.canceladas}
               variant="cancelada"
            />
            <KpiCard
               label="Tasa de Cancelación"
               value={`${kpis.cancelRate}%`}
               variant="rechazada"
            />
            <KpiCard
               label="ADR (promedio)"
               value={`$ ${kpis.adr}`}
               variant="total"
            />
            <KpiCard
               label="RevPAR (mes)"
               value={`$ ${kpis.revpar}`}
               variant="total"
            />
            <KpiCard
               label="Habitaciones Activas"
               value={habitaciones.filter((h) => h.activa).length}
               variant="disponibles"
            />
         </section>

         {/* Ocupación diaria */}
         <section className="rounded-[var(--radius-xl2)] bg-bg2/80 border border-white/5 p-4 min-w-0 overflow-hidden">
            <h3 className="text-white/90 font-semibold mb-4">
               Ocupación de habitaciones (mes actual)
            </h3>
            <div className="h-64 min-h-[260px] min-w-0">
               {mounted && (
                  <ResponsiveContainer key="occ" width="100%" height="100%">
                     <LineChart data={dailyOcc}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" tick={{ fill: "#9CA3AF" }} />
                        <YAxis
                           unit="%"
                           tick={{ fill: "#9CA3AF" }}
                           domain={[0, 100]}
                        />
                        <Tooltip
                           formatter={(v: number) => `${v}%`}
                           labelFormatter={(l) => `Día ${l}`}
                        />
                        <Line
                           type="monotone"
                           dataKey="ocupacion"
                           stroke="#60a5fa" // azul claro
                           strokeWidth={2}
                           dot={false}
                        />
                     </LineChart>
                  </ResponsiveContainer>
               )}
            </div>
         </section>

         {/* Ingreso por mes */}
         <section className="rounded-[var(--radius-xl2)] bg-bg2/80 border border-white/5 p-4 min-w-0 overflow-hidden">
            <h3 className="text-white/90 font-semibold mb-4">
               Ingresos por mes (últimos 12 meses)
            </h3>
            <div className="h-72 min-h-[280px] min-w-0">
               {mounted && (
                  <ResponsiveContainer key="rev" width="100%" height="100%">
                     <BarChart data={revenueByMonth}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" tick={{ fill: "#9CA3AF" }} />
                        <YAxis
                           tickFormatter={(v) => `$ ${v / 1000}k`}
                           tick={{ fill: "#9CA3AF" }}
                        />
                        <Tooltip
                           formatter={(v: number) =>
                              `$ ${v.toLocaleString("es-AR")}`
                           }
                        />
                        <Legend />
                        <Bar
                           dataKey="aprobada"
                           stackId="a"
                           name="Confirmadas"
                           fill="#BC9C23"
                        />
                        <Bar
                           dataKey="cancelada"
                           stackId="a"
                           name="Canceladas (pérdida)"
                           fill="#ef4444"
                        />
                     </BarChart>
                  </ResponsiveContainer>
               )}
            </div>
         </section>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
            {/* Tipos más reservados */}
            <section className="rounded-[var(--radius-xl2)] bg-bg2/80 border border-white/5 p-4 min-w-0 overflow-hidden">
               <h3 className="text-white/90 font-semibold mb-4">
                  Tipos de habitaciones más reservadas
               </h3>
               <div className="h-72 min-h-[280px] min-w-0">
                  {mounted && (
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                           <Tooltip
                              formatter={(v: number, _n, p: any) => [
                                 `${v}`,
                                 p.payload.name,
                              ]}
                           />
                           <Pie
                              data={byType}
                              dataKey="value"
                              nameKey="name"
                              innerRadius="60%"
                              outerRadius="85%"
                              startAngle={90}
                              endAngle={-270} // sentido horario, arranca arriba
                              padAngle={2} // separa las porciones
                              cornerRadius={4} // bordes redondeados
                              label={({ name, percent }) =>
                                 `${name} ${(percent * 100).toFixed(0)}%`
                              }
                              labelLine={false}
                              stroke="#1F2633"
                              strokeWidth={2}
                           >
                              {byType.map((entry, idx) => (
                                 <Cell
                                    key={`type-${idx}`}
                                    fill={
                                       TYPE_COLORS[entry.name] ??
                                       COLORS[idx % COLORS.length]
                                    }
                                 />
                              ))}
                           </Pie>
                        </PieChart>
                     </ResponsiveContainer>
                  )}
               </div>
            </section>

            {/* Ubicaciones */}
            <section className="rounded-[var(--radius-xl2)] bg-bg2/80 border border-white/5 p-4 min-w-0 overflow-hidden">
               <h3 className="text-white/90 font-semibold mb-4">
                  Ubicaciones de clientes
               </h3>
               <div className="h-72 min-h-[280px] min-w-0">
                  {mounted && (
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                           <Tooltip
                              formatter={(v: number, _n, p: any) => [
                                 `${v}`,
                                 p.payload.name,
                              ]}
                           />
                           <Pie
                              data={byUbic}
                              dataKey="value"
                              nameKey="name"
                              innerRadius="45%"
                              outerRadius="75%"
                              startAngle={90}
                              endAngle={-270}
                              padAngle={2}
                              cornerRadius={4}
                              label={({ name, value }) => `${name} (${value})`}
                              labelLine={false}
                              stroke="#1F2633"
                              strokeWidth={2}
                           >
                              {byUbic.map((_, idx) => (
                                 <Cell
                                    key={`ubic-${idx}`}
                                    fill={COLORS[idx % COLORS.length]}
                                 />
                              ))}
                           </Pie>
                        </PieChart>
                     </ResponsiveContainer>
                  )}
               </div>
            </section>
         </div>
      </div>
   );
}
