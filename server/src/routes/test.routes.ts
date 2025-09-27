import { Router } from "express";
import { ping } from "../controllers/test.controller";

const router = Router();

router.get("/ping", ping);

export default router;
