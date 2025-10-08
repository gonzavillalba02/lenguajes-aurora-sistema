import { Router } from "express";
import {
   crearHabitacion,
   getHabitaciones,
   getHabitacionById,
   desactivarHabitacion,
   reactivarHabitacion,
   bloquearHabitacion,
   desbloquearHabitacion,
   actualizarHabitacion,
   actualizarObservacionesHabitacion,
} from "../controllers/habitacion.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", verifyToken([1, 2]), crearHabitacion);
router.get("/", verifyToken([1, 2]), getHabitaciones);
router.get("/:id", verifyToken([1, 2]), getHabitacionById);

// Desactivar / Reactivar
router.patch("/:id/desactivar", verifyToken([1, 2]), desactivarHabitacion);
router.patch("/:id/reactivar", verifyToken([1, 2]), reactivarHabitacion);

// Bloquear / Desbloquear
router.patch("/:id/bloquear", verifyToken([1, 2]), bloquearHabitacion);
router.patch("/:id/desbloquear", verifyToken([1, 2]), desbloquearHabitacion);

// Actualizar
router.put("/:id", verifyToken([1, 2]), actualizarHabitacion);
router.patch("/:id/observaciones", actualizarObservacionesHabitacion);
export default router;
