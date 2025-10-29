import express, { Application } from "express";
import dotenv from "dotenv";
import cors from "cors";
// Importar rutas
import testRoutes from "./routes/test.routes";
import authRoutes from "./routes/auth.routes";
import usuarioRoutes from "./routes/usuario.routes";
import habitacionRoutes from "./routes/habitacion.routes";
import personaRoutes from "./routes/persona.routes";
import consultaRoutes from "./routes/consulta.routes";
import reservaRoutes from "./routes/reserva.routes";

dotenv.config();
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:5173";

export class App {
   private app: Application;

   constructor(private port?: number | string) {
      this.app = express();
      this.settings();
      this.middlewares();
      this.routes();
   }

   private settings() {
      this.app.set("port", this.port || process.env.PORT || 4000);
   }

   private middlewares() {
      // Habilitar CORS para el front de Vite
      this.app.use(
         cors({
            origin: CORS_ORIGIN,
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            allowedHeaders: ["Content-Type", "Authorization"],
            credentials: false, // poné true solo si usás cookies/sesiones
         })
      );
      this.app.use(express.json());
   }

   private routes() {
      this.app.use("/api/test", testRoutes);
      this.app.use("/api/auth", authRoutes);
      this.app.use("/api/usuarios", usuarioRoutes);
      this.app.use("/api/habitaciones", habitacionRoutes);
      this.app.use("/api/personas", personaRoutes);
      this.app.use("/api/consultas", consultaRoutes);
      this.app.use("/api/reservas", reservaRoutes);
   }

   public getApp(): Application {
      return this.app;
   }
}
