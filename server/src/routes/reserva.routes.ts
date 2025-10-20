import { Router } from "express";
import { crearReservaPublica, 
        crearReservaOperador, 
        getReservas, 
        getReservaById, 
        pasarAPendientePago,
        aprobarReserva,
        rechazarReserva, 
        cancelarReserva,
        getDisponibilidadPorTipo,
        crearReservaDesdeLanding } from "../controllers/reserva.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();

// Pública (sin login)
router.post("/publica", crearReservaPublica);
router.post("/reservar-landing", crearReservaDesdeLanding)

// Operador/Admin (con login)
router.post("/", verifyToken([1, 2]), crearReservaOperador);
router.get("/", verifyToken([1, 2]), getReservas);
router.get("/:id", verifyToken([1, 2]), getReservaById);
router.patch("/:id/pendiente-pago", verifyToken([1, 2]), pasarAPendientePago);
router.patch("/:id/aprobar", verifyToken([1, 2]), aprobarReserva);
router.patch("/:id/rechazar", verifyToken([1, 2]), rechazarReserva);
router.patch("/:id/cancelar", verifyToken([1, 2]), cancelarReserva);

router.get("/disponibilidad/:tipoId", getDisponibilidadPorTipo);

export default router;
