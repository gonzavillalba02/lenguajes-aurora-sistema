import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const verifyToken = (rolesPermitidos: number[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) return res.status(403).json({ message: "Token requerido" });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey") as any;
      (req as any).user = decoded;

      // Si hay restricción de roles
      if (rolesPermitidos.length && !rolesPermitidos.includes(decoded.rol)) {
        return res.status(403).json({ message: "No autorizado" });
      }

      next();
    } catch (error) {
      return res.status(401).json({ message: "Token inválido o expirado" });
    }
  };
};