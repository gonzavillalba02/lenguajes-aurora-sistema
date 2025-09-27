import express, { Application } from "express";
import dotenv from "dotenv";

// Importar rutas
import testRoutes from "./routes/test.routes";
import authRoutes from "./routes/auth.routes";
import usuarioRoutes from "./routes/usuario.routes";
import habitacionRoutes from "./routes/habitacion.routes";
import personaRoutes from "./routes/persona.routes";
import consultaRoutes from "./routes/consulta.routes";
import reservaRoutes from "./routes/reserva.routes";

dotenv.config();

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
    this.app.use(express.json());
  }

  private routes() {
    this.app.use("/api/test", testRoutes);
    this.app.use("/api/auth", authRoutes);
    this.app.use("/api/usuarios", usuarioRoutes)
    this.app.use("/api/habitaciones", habitacionRoutes);
    this.app.use("/api/personas", personaRoutes);
    this.app.use("/api/consultas", consultaRoutes);
    this.app.use("/api/reservas", reservaRoutes);
  }

  public getApp(): Application {
    return this.app;
  }
}
