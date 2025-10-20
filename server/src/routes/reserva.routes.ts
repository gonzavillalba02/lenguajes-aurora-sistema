// src/routes/reservas.routes.ts
import { Router } from "express";
import {
   crearReservaOperador,
   getReservas,
   getReservaById,
   aprobarReserva,
   rechazarReserva,
   cancelarReserva,
   getDisponibilidadPorTipo,
   crearReservaDesdeLanding,
} from "../controllers/reserva.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();

/**
 * Rutas públicas (sin login)
 * - Crear reserva desde la landing (aprobada)
 * - Consultar disponibilidad por tipo
 */
router.post("/reservar-landing", crearReservaDesdeLanding);
router.get("/disponibilidad/:tipoId", getDisponibilidadPorTipo);

/**
 * Rutas protegidas (operador/admin)
 */
router.post("/", verifyToken([1, 2]), crearReservaOperador);
router.get("/", verifyToken([1, 2]), getReservas);
router.patch("/:id/aprobar", verifyToken([1, 2]), aprobarReserva);
router.patch("/:id/rechazar", verifyToken([1, 2]), rechazarReserva);
router.patch("/:id/cancelar", verifyToken([1, 2]), cancelarReserva);
router.get("/:id", verifyToken([1, 2]), getReservaById);

export default router;
