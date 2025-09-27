import { Request, Response } from "express";
import { pool } from "../config/database";

// Crear persona
export const crearPersona = async (req: Request, res: Response) => {
  const { nombre, apellido, ubicacion, email, telefono } = req.body;

  if (!nombre || !apellido || !email) {
    return res.status(400).json({ message: "Faltan datos obligatorios (nombre, apellido, email)" });
  }

  try {
    const [result]: any = await pool.query(
      "INSERT INTO persona (nombre, apellido, ubicacion, email, telefono) VALUES (?, ?, ?, ?, ?)",
      [nombre, apellido, ubicacion || null, email, telefono || null]
    );

    res.status(201).json({ 
      message: "Persona creada correctamente",
      personaId: result.insertId
    });
  } catch (error: any) {
    console.error(error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "El email ya está registrado" });
    }
    res.status(500).json({ message: "Error creando persona" });
  }
};

// Obtener todas las personas
export const getPersonas = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query(
      "SELECT id, nombre, apellido, email, telefono, ubicacion FROM persona ORDER BY id DESC"
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo personas" });
  }
};

// Obtener persona por ID
export const getPersonaById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const [rows]: any = await pool.query(
      "SELECT id, nombre, apellido, email, telefono, ubicacion FROM persona WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Persona no encontrada" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo persona" });
  }
};