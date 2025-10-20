import { Request, Response } from "express";
import { pool } from "../config/database";

/** Helper: trae id de estado por nombre */
async function getEstadoId(nombre: string): Promise<number> {
   const [rows]: any = await pool.query(
      "SELECT id FROM estado_reserva WHERE nombre = ? LIMIT 1",
      [nombre]
   );
   if (!rows.length) throw new Error(`Estado '${nombre}' no encontrado`);
   return rows[0].id;
}

/** Helper: asegura persona por email (crea si no existe) */
async function ensurePersona({
   nombre,
   apellido,
   email,
   ubicacion,
   telefono,
}: {
   nombre: string;
   apellido: string;
   email: string;
   ubicacion?: string | null;
   telefono?: string | null;
}): Promise<number> {
   const [rows]: any = await pool.query(
      "SELECT id FROM persona WHERE email = ? LIMIT 1",
      [email]
   );
   if (rows.length) return rows[0].id;

   const [ins]: any = await pool.query(
      "INSERT INTO persona (nombre, apellido, ubicacion, email, telefono) VALUES (?, ?, ?, ?, ?)",
      [nombre, apellido, ubicacion || null, email, telefono || null]
   );
   return ins.insertId;
}

/** Helper: valida (inicio <= fin) */
function fechasValidas(inicio: string, fin: string): boolean {
   return new Date(inicio) <= new Date(fin);
}

/** Helper: verifica solapamiento para una habitación y rango de fechas */
async function haySolapamiento(
   habitacionId: number,
   fechaInicio: string,
   fechaFin: string
): Promise<boolean> {
   // Consideramos ocupadas las reservas aprobadas y también las pendientes/pago (bloquean calendario del operador)
   const estadosBloqueantes = [
      "pendiente_verificacion",
      "pendiente_pago",
      "aprobada",
   ];
   const [estadoRows]: any = await pool.query(
      `SELECT id FROM estado_reserva WHERE nombre IN (?, ?, ?)`,
      estadosBloqueantes
   );
   const ids = estadoRows.map((r: any) => r.id);
   if (!ids.length) return false;

   const [rows]: any = await pool.query(
      `SELECT 1
     FROM reserva
     WHERE habitacion_id = ?
       AND estado_id IN (?,?,?)
       AND (fecha_inicio <= ? AND fecha_fin >= ?)  -- overlap: [ini_exist, fin_exist] ∩ [ini_nueva, fin_nueva] ≠ ∅
     LIMIT 1`,
      [habitacionId, ids[0], ids[1], ids[2], fechaFin, fechaInicio]
   );
   return rows.length > 0;
}

/** POST /api/reservas/publica  (sin auth) */
export const crearReservaPublica = async (req: Request, res: Response) => {
   try {
      const {
         // persona
         nombre,
         apellido,
         email,
         ubicacion,
         telefono,
         // reserva
         habitacion_id,
         fecha_inicio,
         fecha_fin,
         observaciones,
      } = req.body;

      if (
         !nombre ||
         !apellido ||
         !email ||
         !habitacion_id ||
         !fecha_inicio ||
         !fecha_fin
      ) {
         return res
            .status(400)
            .json({
               message:
                  "Faltan datos obligatorios (nombre, apellido, email, habitacion_id, fecha_inicio, fecha_fin)",
            });
      }
      if (!fechasValidas(fecha_inicio, fecha_fin)) {
         return res
            .status(400)
            .json({
               message: "Rango de fechas inválido (fecha_inicio > fecha_fin)",
            });
      }

      // persona: crear/usar por email
      const personaId = await ensurePersona({
         nombre,
         apellido,
         email,
         ubicacion,
         telefono,
      });

      // estado = pendiente_verificacion
      const estadoId = await getEstadoId("pendiente_verificacion");

      // (IMPORTANTE) Público: NO se chequea solapamiento

      const [ins]: any = await pool.query(
         `INSERT INTO reserva 
        (persona_id, habitacion_id, fecha_inicio, fecha_fin, estado_id, observaciones, creada_por, aprobada_por)
       VALUES (?, ?, ?, ?, ?, ?, NULL, NULL)`,
         [
            personaId,
            habitacion_id,
            fecha_inicio,
            fecha_fin,
            estadoId,
            observaciones || null,
         ]
      );

      res.status(201).json({
         message: "Reserva creada (pendiente de verificación)",
         reservaId: ins.insertId,
         personaId,
      });
   } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: "Error creando reserva pública" });
   }
};

/** POST /api/reservas  (operador/admin) */
export const crearReservaOperador = async (req: Request, res: Response) => {
   try {
      const authUser = (req as any).user; // viene del verifyToken
      const usuarioId: number = authUser.id;

      const {
         // puede venir persona_id directo o datos para crear/usar persona
         persona_id,
         nombre,
         apellido,
         email,
         ubicacion,
         telefono,
         // reserva
         habitacion_id,
         fecha_inicio,
         fecha_fin,
         observaciones,
      } = req.body;

      if (!habitacion_id || !fecha_inicio || !fecha_fin) {
         return res
            .status(400)
            .json({
               message:
                  "Faltan datos obligatorios (habitacion_id, fecha_inicio, fecha_fin)",
            });
      }
      if (!fechasValidas(fecha_inicio, fecha_fin)) {
         return res
            .status(400)
            .json({
               message: "Rango de fechas inválido (fecha_inicio > fecha_fin)",
            });
      }

      // resolver persona
      let personaId: number | null = null;

      if (persona_id) {
         personaId = Number(persona_id);
         const [chk]: any = await pool.query(
            "SELECT id FROM persona WHERE id = ? LIMIT 1",
            [personaId]
         );
         if (!chk.length)
            return res.status(400).json({ message: "persona_id no existe" });
      } else {
         // si no mandan persona_id, exigimos datos mínimos para crear/usar por email
         if (!nombre || !apellido || !email) {
            return res
               .status(400)
               .json({
                  message:
                     "Faltan datos de persona (nombre, apellido, email) o persona_id",
               });
         }
         personaId = await ensurePersona({
            nombre,
            apellido,
            email,
            ubicacion,
            telefono,
         });
      }

      // estado = aprobada (creada por operador)
      const estadoId = await getEstadoId("aprobada");

      // Chequeo de solapamiento
      const solapa = await haySolapamiento(
         Number(habitacion_id),
         fecha_inicio,
         fecha_fin
      );
      if (solapa) {
         return res
            .status(409)
            .json({
               message:
                  "Solapamiento de fechas para la habitación seleccionada",
            });
      }

      const [ins]: any = await pool.query(
         `INSERT INTO reserva
        (persona_id, habitacion_id, fecha_inicio, fecha_fin, estado_id, observaciones, creada_por, aprobada_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
         [
            personaId,
            habitacion_id,
            fecha_inicio,
            fecha_fin,
            estadoId,
            observaciones || null,
            usuarioId,
            usuarioId,
         ]
      );

      res.status(201).json({
         message: "Reserva creada y aprobada",
         reservaId: ins.insertId,
         personaId,
      });
   } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: "Error creando reserva por operador" });
   }
};

// Obtener todas las reservas
export const getReservas = async (req: Request, res: Response) => {
   try {
      const [rows]: any = await pool.query(
         `SELECT r.id, r.fecha_inicio, r.fecha_fin, r.observaciones, r.fecha_creacion,
              e.nombre AS estado,
              p.id AS persona_id, p.nombre AS persona_nombre, p.apellido AS persona_apellido, p.email AS persona_email,
              h.id AS habitacion_id, h.nombre AS habitacion_nombre,
              t.nombre AS tipo_habitacion,
              u1.nombre AS creada_por_nombre,
              u2.nombre AS aprobada_por_nombre
       FROM reserva r
       INNER JOIN estado_reserva e ON r.estado_id = e.id
       INNER JOIN persona p ON r.persona_id = p.id
       INNER JOIN habitacion h ON r.habitacion_id = h.id
       INNER JOIN tipo_habitacion t ON h.tipo_id = t.id
       LEFT JOIN usuario u1 ON r.creada_por = u1.id
       LEFT JOIN usuario u2 ON r.aprobada_por = u2.id
       ORDER BY r.fecha_creacion DESC`
      );

      res.json(rows);
   } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error obteniendo reservas" });
   }
};

// Obtener una reserva por ID
export const getReservaById = async (req: Request, res: Response) => {
   const { id } = req.params;

   try {
      const [rows]: any = await pool.query(
         `SELECT r.id, r.fecha_inicio, r.fecha_fin, r.observaciones, r.fecha_creacion,
              e.nombre AS estado,
              p.id AS persona_id, p.nombre AS persona_nombre, p.apellido AS persona_apellido, p.email AS persona_email,
              h.id AS habitacion_id, h.nombre AS habitacion_nombre,
              t.nombre AS tipo_habitacion,
              u1.nombre AS creada_por_nombre,
              u2.nombre AS aprobada_por_nombre
       FROM reserva r
       INNER JOIN estado_reserva e ON r.estado_id = e.id
       INNER JOIN persona p ON r.persona_id = p.id
       INNER JOIN habitacion h ON r.habitacion_id = h.id
       INNER JOIN tipo_habitacion t ON h.tipo_id = t.id
       LEFT JOIN usuario u1 ON r.creada_por = u1.id
       LEFT JOIN usuario u2 ON r.aprobada_por = u2.id
       WHERE r.id = ?`,
         [id]
      );

      if (rows.length === 0) {
         return res.status(404).json({ message: "Reserva no encontrada" });
      }

      res.json(rows[0]);
   } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error obteniendo reserva" });
   }
};

// Pasar reserva de 'pendiente_verificacion' a 'pendiente_pago'
export const pasarAPendientePago = async (req: Request, res: Response) => {
   const { id } = req.params;

   try {
      // Traer ids de los estados involucrados
      const [estados]: any = await pool.query(
         "SELECT id, nombre FROM estado_reserva WHERE nombre IN ('pendiente_verificacion', 'pendiente_pago')"
      );

      const pendienteVerif = estados.find(
         (e: any) => e.nombre === "pendiente_verificacion"
      );
      const pendientePago = estados.find(
         (e: any) => e.nombre === "pendiente_pago"
      );

      if (!pendienteVerif || !pendientePago) {
         return res
            .status(500)
            .json({ message: "No se encontraron los estados requeridos" });
      }

      // Verificar estado actual de la reserva
      const [reserva]: any = await pool.query(
         "SELECT estado_id FROM reserva WHERE id = ?",
         [id]
      );

      if (!reserva.length) {
         return res.status(404).json({ message: "Reserva no encontrada" });
      }

      if (reserva[0].estado_id !== pendienteVerif.id) {
         return res.status(400).json({
            message:
               "Solo se puede pasar a 'pendiente_pago' si la reserva está en 'pendiente_verificacion'",
         });
      }

      // Actualizar estado
      await pool.query("UPDATE reserva SET estado_id = ? WHERE id = ?", [
         pendientePago.id,
         id,
      ]);

      res.json({ message: "Reserva actualizada a pendiente de pago" });
   } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error cambiando estado de la reserva" });
   }
};

// PATCH /api/reservas/:id/aprobar
export const aprobarReserva = async (req: Request, res: Response) => {
   const { id } = req.params;
   const user = (req as any).user; // viene del verifyToken
   const aprobadorId: number = user.id;

   try {
      // Traer ids de estados relevantes
      const [estados]: any = await pool.query(
         "SELECT id, nombre FROM estado_reserva WHERE nombre IN ('aprobada','rechazada','cancelada')"
      );
      const EST = Object.fromEntries(estados.map((e: any) => [e.nombre, e.id]));

      if (!EST.aprobada || !EST.rechazada || !EST.cancelada) {
         return res
            .status(500)
            .json({ message: "Estados requeridos no configurados" });
      }

      // Traer datos de la reserva
      const [rows]: any = await pool.query(
         "SELECT id, habitacion_id, fecha_inicio, fecha_fin, estado_id FROM reserva WHERE id = ? LIMIT 1",
         [id]
      );
      if (!rows.length)
         return res.status(404).json({ message: "Reserva no encontrada" });

      const r = rows[0];

      // Validaciones de estado
      if (r.estado_id === EST.aprobada)
         return res
            .status(400)
            .json({ message: "La reserva ya está aprobada" });
      if (r.estado_id === EST.rechazada || r.estado_id === EST.cancelada)
         return res
            .status(400)
            .json({
               message: "No se puede aprobar una reserva rechazada o cancelada",
            });

      // Chequear solapamiento SOLO contra reservas APROBADAS en la misma habitación
      const [overlap]: any = await pool.query(
         `SELECT 1
       FROM reserva
       WHERE habitacion_id = ?
         AND estado_id = ?
         AND id <> ?
         AND (fecha_inicio <= ? AND fecha_fin >= ?)
       LIMIT 1`,
         [r.habitacion_id, EST.aprobada, r.id, r.fecha_fin, r.fecha_inicio]
      );
      if (overlap.length)
         return res
            .status(409)
            .json({
               message:
                  "Hay una reserva aprobada que solapa en fechas para esta habitación",
            });

      // Aprobar: cambiar estado y registrar aprobada_por
      await pool.query(
         "UPDATE reserva SET estado_id = ?, aprobada_por = ? WHERE id = ?",
         [EST.aprobada, aprobadorId, r.id]
      );

      res.json({ message: "Reserva aprobada correctamente" });
   } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error aprobando la reserva" });
   }
};

// PATCH /api/reservas/:id/rechazar
export const rechazarReserva = async (req: Request, res: Response) => {
   const { id } = req.params;
   const user = (req as any).user;

   try {
      // Traer ids de estados
      const [estados]: any = await pool.query(
         "SELECT id, nombre FROM estado_reserva WHERE nombre IN ('rechazada','aprobada','cancelada')"
      );
      const EST = Object.fromEntries(estados.map((e: any) => [e.nombre, e.id]));

      if (!EST.rechazada)
         return res
            .status(500)
            .json({ message: "Estado 'rechazada' no configurado" });

      // Buscar reserva
      const [rows]: any = await pool.query(
         "SELECT estado_id FROM reserva WHERE id = ?",
         [id]
      );
      if (!rows.length)
         return res.status(404).json({ message: "Reserva no encontrada" });

      const estadoActual = rows[0].estado_id;
      if (estadoActual === EST.rechazada) {
         return res
            .status(400)
            .json({ message: "La reserva ya está rechazada" });
      }
      if (estadoActual === EST.aprobada) {
         return res
            .status(400)
            .json({ message: "No se puede rechazar una reserva ya aprobada" });
      }
      if (estadoActual === EST.cancelada) {
         return res
            .status(400)
            .json({ message: "No se puede rechazar una reserva cancelada" });
      }

      // Actualizar a rechazada
      await pool.query("UPDATE reserva SET estado_id = ? WHERE id = ?", [
         EST.rechazada,
         id,
      ]);

      res.json({ message: "Reserva rechazada correctamente" });
   } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error rechazando la reserva" });
   }
};

// PATCH /api/reservas/:id/cancelar
export const cancelarReserva = async (req: Request, res: Response) => {
   const { id } = req.params;
   const user = (req as any).user;
   const usuarioId: number = user.id;

   try {
      // Traer ids de estados
      const [estados]: any = await pool.query(
         "SELECT id, nombre FROM estado_reserva WHERE nombre IN ('cancelada','rechazada')"
      );
      const EST = Object.fromEntries(estados.map((e: any) => [e.nombre, e.id]));

      if (!EST.cancelada)
         return res
            .status(500)
            .json({ message: "Estado 'cancelada' no configurado" });

      // Buscar reserva
      const [rows]: any = await pool.query(
         "SELECT estado_id FROM reserva WHERE id = ?",
         [id]
      );
      if (!rows.length)
         return res.status(404).json({ message: "Reserva no encontrada" });

      const estadoActual = rows[0].estado_id;
      if (estadoActual === EST.cancelada) {
         return res
            .status(400)
            .json({ message: "La reserva ya está cancelada" });
      }
      if (estadoActual === EST.rechazada) {
         return res
            .status(400)
            .json({ message: "No se puede cancelar una reserva rechazada" });
      }

      // Actualizar a cancelada + registrar usuario
      await pool.query(
         "UPDATE reserva SET estado_id = ?, aprobada_por = ? WHERE id = ?",
         [EST.cancelada, usuarioId, id]
      );

      res.json({ message: "Reserva cancelada correctamente" });
   } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error cancelando la reserva" });
   }
};

export const getDisponibilidadPorTipo = async (req: Request, res: Response) => {
  const { tipoId } = req.params;

  try {
    // Verificar que se pase un id válido
    if (!tipoId || isNaN(Number(tipoId))) {
      return res.status(400).json({ message: "ID de tipo de habitación inválido" });
    }

    // Consultar las reservas aprobadas de habitaciones de ese tipo
    const [rows]: any = await pool.query(
      `
      SELECT 
        t.id AS tipo_id,
        t.nombre AS nombre_tipo,
        r.fecha_inicio,
        r.fecha_fin
      FROM reserva r
      INNER JOIN habitacion h ON r.habitacion_id = h.id
      INNER JOIN tipo_habitacion t ON h.tipo_id = t.id
      WHERE t.id = ?
        AND r.estado_id = 3
        AND h.activa = TRUE
      ORDER BY r.fecha_inicio ASC;
      `,
      [tipoId]
    );

    // Si no hay reservas, devolver estructura vacía
    if (rows.length === 0) {
      const [tipo]: any = await pool.query(
        `SELECT id AS tipo_id, nombre AS nombre_tipo FROM tipo_habitacion WHERE id = ?`,
        [tipoId]
      );

      return res.json({
        tipo_id: tipo[0]?.tipo_id || Number(tipoId),
        nombre_tipo: tipo[0]?.nombre_tipo || null,
        reservas: [],
      });
    }

    // Estructurar el payload
    const { tipo_id, nombre_tipo } = rows[0];
    const reservas = rows.map((r: any) => ({
      fecha_inicio: r.fecha_inicio,
      fecha_fin: r.fecha_fin,
    }));

    res.json({
      tipo_id,
      nombre_tipo,
      reservas,
    });
  } catch (error) {
    console.error("Error obteniendo disponibilidad:", error);
    res.status(500).json({ message: "Error obteniendo disponibilidad" });
  }
};

/** POST /api/reservas/desde-landing - Crear reserva desde la landing (incluye datos de pago) */
export const crearReservaDesdeLanding = async (req: Request, res: Response) => {
  try {
    const {
      // datos de persona
      nombre,
      apellido, 
      email,
      telefono,
      ubicacion,
      // datos de reserva
      tipo_habitacion_id,
      fecha_inicio,
      fecha_fin,
      observaciones,
      // datos de pago (solo para logging/validación)
      cardName,
      cardNumber,
      cvc,
      expiry
    } = req.body;

    // Validaciones básicas
    if (!nombre || !apellido || !email || !tipo_habitacion_id || !fecha_inicio || !fecha_fin) {
      return res.status(400).json({ 
        success: false,
        message: "Faltan datos obligatorios: nombre, apellido, email, tipo_habitacion_id, fecha_inicio, fecha_fin" 
      });
    }

    // Validar formato de fechas y que fecha_inicio <= fecha_fin
    const fechaInicioDate = new Date(fecha_inicio);
    const fechaFinDate = new Date(fecha_fin);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (isNaN(fechaInicioDate.getTime()) || isNaN(fechaFinDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Formato de fecha inválido. Use formato YYYY-MM-DD"
      });
    }

    if (fechaInicioDate >= fechaFinDate) {
      return res.status(400).json({
        success: false,
        message: "Las fechas seleccionadas no son válidas. La fecha de fin debe ser posterior a la fecha de inicio."
      });
    }

    if (fechaInicioDate < hoy) {
      return res.status(400).json({
        success: false,
        message: "No se pueden hacer reservas para fechas pasadas. Por favor revise las fechas seleccionadas."
      });
    }

    // Verificar que el tipo de habitación existe
    const [tipoRows]: any = await pool.query(
      "SELECT id, nombre FROM tipo_habitacion WHERE id = ?",
      [tipo_habitacion_id]
    );

    if (!tipoRows.length) {
      return res.status(400).json({
        success: false,
        message: "El tipo de habitación seleccionado no existe"
      });
    }

    // Buscar habitaciones disponibles de ese tipo para las fechas solicitadas
    const [habitacionesDisponibles]: any = await pool.query(
      `SELECT h.id, h.nombre 
       FROM habitacion h
       WHERE h.tipo_id = ? 
         AND h.disponible = TRUE 
         AND h.activa = TRUE
         AND h.id NOT IN (
           SELECT DISTINCT r.habitacion_id 
           FROM reserva r 
           INNER JOIN estado_reserva e ON r.estado_id = e.id
           WHERE e.nombre IN ('pendiente_verificacion', 'pendiente_pago', 'aprobada')
             AND (
               (r.fecha_inicio <= ? AND r.fecha_fin > ?) OR
               (r.fecha_inicio < ? AND r.fecha_fin >= ?) OR
               (r.fecha_inicio >= ? AND r.fecha_fin <= ?)
             )
         )
       ORDER BY h.id ASC
       LIMIT 1`,
      [
        tipo_habitacion_id,
        fecha_inicio, fecha_inicio,  // casos de solapamiento
        fecha_fin, fecha_fin,
        fecha_inicio, fecha_fin
      ]
    );

    if (!habitacionesDisponibles.length) {
      return res.status(409).json({
        success: false,
        message: `No hay habitaciones disponibles del tipo ${tipoRows[0].nombre} para las fechas seleccionadas. Por favor revise las fechas o seleccione otro tipo de habitación.`
      });
    }

    // Asignar la primera habitación disponible
    const habitacionSeleccionada = habitacionesDisponibles[0];

    // Crear/obtener persona por email
    const personaId = await ensurePersona({ 
      nombre, 
      apellido, 
      email, 
      ubicacion: ubicacion || null, 
      telefono: telefono || null 
    });

    // Obtener ID del estado "aprobada"
    const estadoId = await getEstadoId("aprobada");

    // Log de datos de pago (sin guardar datos sensibles en DB)
    console.log(`Reserva con pago - Cliente: ${cardName}, Tarjeta: ${cardNumber?.slice(-4)}`);

    // Crear la reserva
    const [insertResult]: any = await pool.query(
      `INSERT INTO reserva 
        (persona_id, habitacion_id, fecha_inicio, fecha_fin, estado_id, observaciones, creada_por, aprobada_por)
       VALUES (?, ?, ?, ?, ?, ?, NULL, NULL)`,
      [
        personaId, 
        habitacionSeleccionada.id, 
        fecha_inicio, 
        fecha_fin, 
        estadoId, 
        observaciones || null
      ]
    );

    res.status(201).json({
      success: true,
      message: "Reserva creada exitosamente. Recibirá un email de confirmación una vez que sea verificada por nuestro equipo.",
      data: {
        reservaId: insertResult.insertId,
        personaId,
        habitacion: {
          id: habitacionSeleccionada.id,
          nombre: habitacionSeleccionada.nombre,
          tipo: tipoRows[0].nombre
        },
        fechas: {
          inicio: fecha_inicio,
          fin: fecha_fin
        },
        estado: "aprobada"
      }
    });

  } catch (error: any) {
    console.error('Error creando reserva desde landing:', error);
    
    // Manejar errores específicos
    if (error.message?.includes('no encontrado')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: "Error interno del servidor. Por favor intente nuevamente o contacte con soporte."
    });
  }
};