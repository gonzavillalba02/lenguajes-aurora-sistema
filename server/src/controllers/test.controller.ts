import { Request, Response } from "express";
import { pool } from "../config/database";

export const ping = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query("SELECT NOW() AS now");
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error conectando a la DB" });
  }
};
