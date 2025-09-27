import { Router } from "express";
import {
  crearOperador,
  eliminarOperador,
  reactivarOperador,
  getOperadores,
  getOperadorById,
} from "../controllers/usuario.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();

// Solo admin (rol_id = 2)
router.post("/operadores", verifyToken([2]), crearOperador);
router.delete("/operadores/:id", verifyToken([2]), eliminarOperador);
router.patch("/operadores/:id/reactivar", verifyToken([2]), reactivarOperador);
router.get("/operadores", verifyToken([2]), getOperadores);
router.get("/operadores/:id", verifyToken([2]), getOperadorById);

export default router;
