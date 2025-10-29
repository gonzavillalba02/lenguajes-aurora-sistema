import { Request, Response } from "express";
import { pool } from "../config/database";

/** Helper: asegura persona por email (crea si no existe, actualiza si existe) */
async function ensurePersona({
  nombre, apellido, email, ubicacion, telefono,
}: { nombre: string; apellido: string; email: string; ubicacion?: string | null; telefono?: string | null; }): Promise<number> {
  const [rows]: any = await pool.query("SELECT id FROM persona WHERE email = ? LIMIT 1", [email]);
  
  if (rows.length) {
    // Si existe, actualizar los datos
    const personaId = rows[0].id;
    await pool.query(
      "UPDATE persona SET nombre = ?, apellido = ?, ubicacion = ?, telefono = ? WHERE id = ?",
      [nombre, apellido, ubicacion || null, telefono || null, personaId]
    );
    return personaId;
  }

  // Si no existe, crear nueva persona
  const [ins]: any = await pool.query(
    "INSERT INTO persona (nombre, apellido, ubicacion, email, telefono) VALUES (?, ?, ?, ?, ?)",
    [nombre, apellido, ubicacion || null, email, telefono || null]
  );
  return ins.insertId;
}

// Crear una consulta desde la landing
export const crearConsulta = async (req: Request, res: Response) => {
  const { nombre, apellido, ubicacion, email, telefono, texto } = req.body;

  if (!nombre || !apellido || !email || !texto) {
    return res.status(400).json({ message: "Faltan datos obligatorios (nombre, apellido, email, texto)" });
  }

  try {
    // 1. Crear/obtener persona por email (con actualización automática)
    const personaId = await ensurePersona({ 
      nombre, 
      apellido, 
      email, 
      ubicacion: ubicacion || null, 
      telefono: telefono || null 
    });

    // 2. Obtener id del estado 'pendiente'
    const [estado]: any = await pool.query("SELECT id FROM estado_consulta WHERE nombre = 'pendiente' LIMIT 1");
    if (estado.length === 0) {
      return res.status(500).json({ message: "No se encontró el estado 'pendiente' en la tabla estado_consulta" });
    }
    const estadoId = estado[0].id;

    // 3. Crear consulta
    const [consultaResult]: any = await pool.query(
      "INSERT INTO consulta (texto, persona_id, estado_id) VALUES (?, ?, ?)",
      [texto, personaId, estadoId]
    );

    res.status(201).json({
      message: "Consulta creada correctamente",
      consultaId: consultaResult.insertId,
      personaId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creando consulta" });
  }
};


// Responder consulta (marcar como resuelta)
export const responderConsulta = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Extraer info del usuario desde el token
    const usuario = (req as any).user; // viene del middleware verifyToken
    const userId = usuario.id;

    // 1. Verificar que la consulta exista y no esté resuelta ya
    const [rows]: any = await pool.query(
      "SELECT id, estado_id FROM consulta WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Consulta no encontrada" });
    }

    // 2. Obtener el id del estado 'resuelta'
    const [estado]: any = await pool.query(
      "SELECT id FROM estado_consulta WHERE nombre = 'resuelta' LIMIT 1"
    );
    if (estado.length === 0) {
      return res.status(500).json({ message: "No se encontró el estado 'resuelta'" });
    }
    const estadoId = estado[0].id;

    // 3. Actualizar consulta
    await pool.query(
      "UPDATE consulta SET estado_id = ?, resuelta_por = ? WHERE id = ?",
      [estadoId, userId, id]
    );

    // 4. Respuesta (lugar para enviar el mail)
    res.json({ message: "Consulta marcada como resuelta correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error respondiendo consulta" });
  }
};

// Obtener todas las consultas
export const getConsultas = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query(
      `SELECT c.id, c.texto, c.estado_id, e.nombre AS estado,
              c.persona_id, p.nombre AS persona_nombre, p.apellido AS persona_apellido, p.email AS persona_email,
              c.resuelta_por, u.nombre AS usuario_nombre
       FROM consulta c
       INNER JOIN estado_consulta e ON c.estado_id = e.id
       INNER JOIN persona p ON c.persona_id = p.id
       LEFT JOIN usuario u ON c.resuelta_por = u.id
       ORDER BY c.id DESC`
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo consultas" });
  }
};
