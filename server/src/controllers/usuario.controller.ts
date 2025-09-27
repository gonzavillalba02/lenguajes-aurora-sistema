import { Request, Response } from "express";
import { pool } from "../config/database";
import bcrypt from "bcrypt";

// Crear operador
export const crearOperador = async (req: Request, res: Response) => {
  const { dni, nombre, email, password } = req.body;

  if (!dni || !nombre || !email || !password) {
    return res.status(400).json({ message: "Faltan datos obligatorios" });
  }

  try {
    // Hashear password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar operador (rol_id = 1)
    await pool.query(
      "INSERT INTO usuario (dni, nombre, email, password, rol_id, activo) VALUES (?, ?, ?, ?, 1, TRUE)",
      [dni, nombre, email, hashedPassword]
    );

    res.status(201).json({ message: "Operador creado correctamente" });
  } catch (error: any) {
    console.error(error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "DNI o email ya existen" });
    }
    res.status(500).json({ message: "Error creando operador" });
  }
};

// Borrado lógico de operador
export const eliminarOperador = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // 1. Verificar si existe
    const [rows]: any = await pool.query(
      "SELECT activo FROM usuario WHERE id = ? AND rol_id = 1",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Operador no encontrado" });
    }

    const operador = rows[0];

    // 2. Si ya está inactivo
    if (!operador.activo) {
      return res.status(400).json({ message: "El operador ya está inactivo" });
    }

    // 3. Si está activo, lo desactivamos
    await pool.query(
      "UPDATE usuario SET activo = FALSE WHERE id = ? AND rol_id = 1",
      [id]
    );

    res.json({ message: "Operador desactivado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error desactivando operador" });
  }
};


// Reactivar operador
export const reactivarOperador = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // 1. Buscar operador
    const [rows]: any = await pool.query(
      "SELECT activo FROM usuario WHERE id = ? AND rol_id = 1",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Operador no encontrado" });
    }

    const operador = rows[0];

    // 2. Verificar estado actual
    if (operador.activo) {
      return res.status(400).json({ message: "El operador ya está activo" });
    }

    // 3. Reactivar
    await pool.query("UPDATE usuario SET activo = TRUE WHERE id = ? AND rol_id = 1", [id]);

    res.json({ message: "Operador reactivado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error reactivando operador" });
  }
};


// Obtener todos los operadores
export const getOperadores = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query(
      "SELECT id, dni, nombre, email, activo FROM usuario WHERE rol_id = 1"
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo operadores" });
  }
};

// Obtener un operador por ID
export const getOperadorById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const [rows]: any = await pool.query(
      "SELECT id, dni, nombre, email, activo FROM usuario WHERE id = ? AND rol_id = 1",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Operador no encontrado" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo operador" });
  }
};