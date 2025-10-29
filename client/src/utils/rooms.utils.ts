export type HabStatus = "Libre" | "Ocupada" | "Cerrada" | "Eliminada";
export function toHabStatus(activa: boolean, disponible: boolean): HabStatus {
   if (activa && disponible) return "Libre";
   if (!activa && !disponible) return "Cerrada";
   if (!activa && disponible) return "Cerrada";
   return "Eliminada"; // !activa && !disponible
}
export function toHabStatusLive(
   activa: boolean,
   disponible: boolean,
   ocupadaHoy: boolean
): HabStatus {
   // eliminada siempre gana
   if (!activa && !disponible) return "Eliminada";
   // cerrada por operador
   if (activa && !disponible) return "Cerrada";
   if (!activa && disponible) return "Cerrada";
   // solo si está activa & disponible evaluamos reservas
   if (activa && disponible && ocupadaHoy) return "Ocupada";
   return "Libre";
}
export function statusToVariant(status: HabStatus) {
   switch (status) {
      case "Libre":
         return "libres" as const;
      case "Ocupada":
         return "ocupadas" as const;
      case "Cerrada":
         return "cerradas" as const;
      case "Eliminada":
         return "eliminadas" as const;
   }
}
export type TipoHabitacion = {
   id: number;
   slug: string; // p.ej. "parejas_estandar"
   label: string; // p.ej. "Parejas Estándar"
   capacidad: number;
   precio_noche: number;
   descripcion: string;
};

function toTitleLabel(slug: string) {
   return slug
      .replace(/_/g, " ")
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
}

const RAW: Array<Omit<TipoHabitacion, "label">> = [
   {
      id: 1,
      slug: "parejas_estandar",
      capacidad: 2,
      precio_noche: 100,
      descripcion: "Habitación estándar para dos personas",
   },
   {
      id: 2,
      slug: "parejas_suit",
      capacidad: 2,
      precio_noche: 200,
      descripcion: "Suite para dos personas con mayor confort",
   },
   {
      id: 3,
      slug: "cuadruple_estandar",
      capacidad: 4,
      precio_noche: 200,
      descripcion: "Habitación estándar para cuatro personas",
   },
   {
      id: 4,
      slug: "cuadruple_suit",
      capacidad: 4,
      precio_noche: 300,
      descripcion: "Suite para cuatro personas con mayor espacio y comodidades",
   },
   {
      id: 5,
      slug: "familiar_estandar",
      capacidad: 6,
      precio_noche: 300,
      descripcion:
         "Habitación estándar para familias de hasta seis integrantes",
   },
   {
      id: 6,
      slug: "familiar_suit",
      capacidad: 6,
      precio_noche: 400,
      descripcion: "Suite familiar con espacio y confort para seis integrantes",
   },
];

export const TIPOS_HABITACION: TipoHabitacion[] = RAW.map((t) => ({
   ...t,
   label: toTitleLabel(t.slug).replace("Suit", "Suite"), // pequeño fix visual
}));

export const findTipoById = (id: number) =>
   TIPOS_HABITACION.find((t) => t.id === id) || null;

export const findTipoBySlug = (slug: string) =>
   TIPOS_HABITACION.find((t) => t.slug === slug) || null;
