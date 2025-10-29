export type Operador = {
   id: number;
   dni: number;
   nombre: string;
   email: string;
   activo: 0 | 1 | boolean;
};

export type CreateOperadorDTO = {
   dni: number | string;
   nombre: string;
   email: string;
   password: string;
};
