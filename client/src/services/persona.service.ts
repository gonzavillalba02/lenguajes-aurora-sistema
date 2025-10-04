import { api } from "./api";

export type CrearPersonaDTO = {
   nombre: string;
   apellido: string;
   email?: string;
   telefono?: string;
};

export type CrearPersonaResponse = {
   message: string; // "Persona creada correctamente"
   personaId: number; // 13
};

export async function crearPersona(
   payload: CrearPersonaDTO
): Promise<CrearPersonaResponse> {
   const { data } = await api.post<CrearPersonaResponse>("/personas", payload, {
      headers: { "Content-Type": "application/json" },
   });
   return data;
}
