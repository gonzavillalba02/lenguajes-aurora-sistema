import { Router } from "express";
import { crearPersona, getPersonas, getPersonaById } from "../controllers/persona.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", crearPersona);
router.get("/", verifyToken([1, 2]), getPersonas);
router.get("/:id", verifyToken([1, 2]), getPersonaById);

export default router;
