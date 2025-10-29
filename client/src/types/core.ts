import type { ReactNode } from "react";

/** ===== Base & util ===== */
export type ID = number | string;
export type ISODateString = string; // "2025-10-10T03:00:00.000Z" | "2025-10-10"
export type MoneyString = string; // "100.00"
export type Booleanish = boolean | 0 | 1;

/** Persona básica compartida */
export type Persona = {
   nombre: string;
   apellido: string;
   email?: string;
};

/** Rango de fechas normalizado */
export type RangoFecha = {
   desde: Date;
   hasta: Date;
};

/** Nav genérico */
export type NavItem = {
   to: string;
   label: string;
   icon?: ReactNode;
};

/** Helpers de “enum” string con labels derivadas */
export type ValueOf<T> = T[keyof T];
