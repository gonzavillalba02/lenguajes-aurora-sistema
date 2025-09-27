import express, { Application } from "express";
import dotenv from "dotenv";

// Importar rutas
import testRoutes from "./routes/test.routes";
import authRoutes from "./routes/auth.routes";

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
  }

  public getApp(): Application {
    return this.app;
  }
}
