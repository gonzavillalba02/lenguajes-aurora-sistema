import { Request, Response } from "express";
import { pool } from "../config/database";

// Crear una nueva habitación
export const crearHabitacion = async (req: Request, res: Response) => {
   const {
      nombre,
      tipo_id,
      disponible = true,
      activa = true,
      observaciones = null,
   } = req.body;

   if (!nombre || !tipo_id) {
      return res
         .status(400)
         .json({ message: "Faltan datos obligatorios (nombre, tipo_id)" });
   }

   try {
      await pool.query(
         "INSERT INTO habitacion (nombre, tipo_id, disponible, activa, observaciones) VALUES (?, ?, ?, ?, ?)",
         [nombre, tipo_id, disponible, activa, observaciones]
      );

      res.status(201).json({ message: "Habitación creada correctamente" });
   } catch (error: any) {
      console.error(error);
      if (error.code === "ER_DUP_ENTRY") {
         return res
            .status(400)
            .json({ message: "El nombre de la habitación ya existe" });
      }
      res.status(500).json({ message: "Error creando habitación" });
   }
};

// Obtener todas las habitaciones
export const getHabitaciones = async (req: Request, res: Response) => {
   try {
      const [rows]: any = await pool.query(
         `SELECT h.id, h.nombre, h.disponible, h.activa, h.observaciones,
              t.id AS tipo_id, t.nombre AS tipo_nombre, t.capacidad, t.precio_noche
       FROM habitacion h
       INNER JOIN tipo_habitacion t ON h.tipo_id = t.id
       ORDER BY h.id ASC`
      );

      res.json(rows);
   } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error obteniendo habitaciones" });
   }
};

// Obtener una habitación por ID
export const getHabitacionById = async (req: Request, res: Response) => {
   const { id } = req.params;

   try {
      const [rows]: any = await pool.query(
         `SELECT h.id, h.nombre, h.disponible, h.activa, h.observaciones,
              t.id AS tipo_id, t.nombre AS tipo_nombre, t.capacidad, t.precio_noche
       FROM habitacion h
       INNER JOIN tipo_habitacion t ON h.tipo_id = t.id
       WHERE h.id = ?`,
         [id]
      );

      if (rows.length === 0) {
         return res.status(404).json({ message: "Habitación no encontrada" });
      }

      res.json(rows[0]);
   } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error obteniendo habitación" });
   }
};

// Desactivar habitación
export const desactivarHabitacion = async (req: Request, res: Response) => {
   const { id } = req.params;
   try {
      const [rows]: any = await pool.query(
         "SELECT activa FROM habitacion WHERE id = ?",
         [id]
      );
      if (rows.length === 0)
         return res.status(404).json({ message: "Habitación no encontrada" });

      if (!rows[0].activa)
         return res
            .status(400)
            .json({ message: "La habitación ya está desactivada" });

      await pool.query("UPDATE habitacion SET activa = FALSE WHERE id = ?", [
         id,
      ]);
      res.json({ message: "Habitación desactivada correctamente" });
   } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error desactivando habitación" });
   }
};

// Reactivar habitación
export const reactivarHabitacion = async (req: Request, res: Response) => {
   const { id } = req.params;
   try {
      const [rows]: any = await pool.query(
         "SELECT activa FROM habitacion WHERE id = ?",
         [id]
      );
      if (rows.length === 0)
         return res.status(404).json({ message: "Habitación no encontrada" });

      if (rows[0].activa)
         return res
            .status(400)
            .json({ message: "La habitación ya está activa" });

      await pool.query("UPDATE habitacion SET activa = TRUE WHERE id = ?", [
         id,
      ]);
      res.json({ message: "Habitación reactivada correctamente" });
   } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error reactivando habitación" });
   }
};

// Bloquear habitación (no disponible para reservas)
export const bloquearHabitacion = async (req: Request, res: Response) => {
   const { id } = req.params;
   try {
      const [rows]: any = await pool.query(
         "SELECT disponible FROM habitacion WHERE id = ?",
         [id]
      );
      if (rows.length === 0)
         return res.status(404).json({ message: "Habitación no encontrada" });

      if (!rows[0].disponible)
         return res
            .status(400)
            .json({ message: "La habitación ya está bloqueada" });

      await pool.query(
         "UPDATE habitacion SET disponible = FALSE WHERE id = ?",
         [id]
      );
      res.json({ message: "Habitación bloqueada correctamente" });
   } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error bloqueando habitación" });
   }
};

// Desbloquear habitación
export const desbloquearHabitacion = async (req: Request, res: Response) => {
   const { id } = req.params;
   try {
      const [rows]: any = await pool.query(
         "SELECT disponible FROM habitacion WHERE id = ?",
         [id]
      );
      if (rows.length === 0)
         return res.status(404).json({ message: "Habitación no encontrada" });

      if (rows[0].disponible)
         return res
            .status(400)
            .json({ message: "La habitación ya está disponible" });

      await pool.query("UPDATE habitacion SET disponible = TRUE WHERE id = ?", [
         id,
      ]);
      res.json({ message: "Habitación desbloqueada correctamente" });
   } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error desbloqueando habitación" });
   }
};

// Actualizar datos de una habitación
export const actualizarHabitacion = async (req: Request, res: Response) => {
   const { id } = req.params;
   const { nombre, tipo_id, observaciones } = req.body;

   if (!nombre || !tipo_id) {
      return res
         .status(400)
         .json({ message: "Faltan datos obligatorios (nombre, tipo_id)" });
   }

   try {
      const [rows]: any = await pool.query(
         "SELECT id FROM habitacion WHERE id = ?",
         [id]
      );

      if (rows.length === 0) {
         return res.status(404).json({ message: "Habitación no encontrada" });
      }

      await pool.query(
         "UPDATE habitacion SET nombre = ?, tipo_id = ?, observaciones = ? WHERE id = ?",
         [nombre, tipo_id, observaciones || null, id]
      );

      res.json({ message: "Habitación actualizada correctamente" });
   } catch (error: any) {
      console.error(error);
      if (error.code === "ER_DUP_ENTRY") {
         return res
            .status(400)
            .json({ message: "El nombre de la habitación ya existe" });
      }
      res.status(500).json({ message: "Error actualizando habitación" });
   }
};
