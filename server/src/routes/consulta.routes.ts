import { Router } from "express";
import { crearConsulta, responderConsulta, getConsultas } from "../controllers/consulta.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();

// Público, sin login
router.post("/", crearConsulta);
router.patch("/:id/responder", verifyToken([1, 2]), responderConsulta);
router.get("/", verifyToken([1, 2]), getConsultas);

export default router;
