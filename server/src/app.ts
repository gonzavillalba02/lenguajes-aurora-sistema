import express from "express";
import dotenv from "dotenv";
import { pool } from "./config/database";

dotenv.config();

const app = express();
app.use(express.json());

// Ruta de prueba: chequea conexión a DB
app.get("/ping", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT NOW() AS now");
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error conectando a la DB" });
  }
});

export default app;
