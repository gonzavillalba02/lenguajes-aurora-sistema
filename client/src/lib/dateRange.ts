// src/lib/dateRange.ts
import type { ISODateString } from "../types/core";
import type { ReservaDomain } from "../types/reserva.types";

/** Convierte "YYYY-MM-DD" a Date 00:00 o 23:59:59.999 (local) */
export function toDateRange(dateISO: ISODateString, endOfDay = false) {
   return new Date(`${dateISO}T${endOfDay ? "23:59:59.999" : "00:00:00"}`);
}

/** Solape estándar de intervalos semiabiertos: [a1,a2) con [b1,b2) */
export function overlap(a1: Date, a2: Date, b1: Date, b2: Date) {
   return a1 < b2 && b1 < a2;
}

/**
 * Algunas APIs devuelven "YYYY-MM-DD". Aseguramos Date válidas.
 * Tomamos 'hasta' como EXCLUSIVA a las 00:00 del día siguiente (convención hotelera).
 */
export function normalizeReservaDates(r: ReservaDomain): ReservaDomain {
   const d =
      r.rango.desde instanceof Date
         ? r.rango.desde
         : new Date(`${String(r.rango.desde).slice(0, 10)}T00:00:00`);
   // 'hasta' exclusiva: 00:00 del día 'hasta'
   const h =
      r.rango.hasta instanceof Date
         ? r.rango.hasta
         : new Date(`${String(r.rango.hasta).slice(0, 10)}T00:00:00`);
   return {
      ...r,
      rango: { desde: d, hasta: h },
   };
}

/** ¿Hab está ocupada en [fromISO,toISO]?  toISO es inclusive UI → lo volvemos [from, endOfDay] */
export function isRoomOccupiedInRange(
   habId: number,
   reservas: ReservaDomain[],
   fromISO: ISODateString,
   toISO: ISODateString
) {
   const d1 = toDateRange(fromISO, false);
   const d2 = toDateRange(toISO, true); // fin de día en UI → rango [d1, d2]

   // Para comparar con reservas [desde, hasta) exclusivas, convertimos d2 a exclusiva (+1ms)
   const d2Exclusive = new Date(d2.getTime() + 1); // equivalente a (d2,exclusive)

   return reservas
      .filter((r) => r.habitacion.id === habId)
      .map(normalizeReservaDates)
      .some((r) => overlap(r.rango.desde, r.rango.hasta, d1, d2Exclusive));
}

/** Reservas de una habitación que se solapan con el rango de la UI */
export function reservasSolapadasDeHab(
   habId: number,
   reservas: ReservaDomain[],
   fromISO: ISODateString,
   toISO: ISODateString
) {
   const d1 = toDateRange(fromISO, false);
   const d2 = toDateRange(toISO, true);
   const d2Exclusive = new Date(d2.getTime() + 1);

   return reservas
      .filter((r) => r.habitacion.id === habId)
      .map(normalizeReservaDates)
      .filter((r) => overlap(r.rango.desde, r.rango.hasta, d1, d2Exclusive))
      .sort((a, b) => a.rango.desde.getTime() - b.rango.desde.getTime());
}
