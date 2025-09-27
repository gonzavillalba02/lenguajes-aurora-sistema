import { App } from "./app";

const appInstance = new App();
const app = appInstance.getApp();
const PORT = app.get("port");

app.listen(PORT, () => {
  console.log(`Servidor corriendo correctamente en el puerto ${PORT}`);
});
