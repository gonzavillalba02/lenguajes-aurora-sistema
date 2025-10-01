import { createBrowserRouter } from "react-router-dom";
import RootLayout from "../layouts/RootLayout";
import LoginPage from "../pages/login/Login";
import OperatorLayout from "../layouts/OperadorLayout";
import AdminLayout from "../layouts/AdminLayout";
import OperatorHome from "../pages/operador/Dashboard";
import Reservas from "../pages/operador/Reservas";
import HabitacionesOp from "../pages/operador/Habitaciones";
import Consultas from "../pages/operador/Consultas";
import HabitacionesAdm from "../pages/administrador/Habitaciones";
import OperadoresAdm from "../pages/administrador/Operadores";
import EstadisticasAdm from "../pages/administrador/Estadisticas";
import { ProtectedRoute } from "../routes/protected";
import NotFound from "../pages/login/NotFound";
import Forbidden from "../pages/login/Forbidden";

export const router = createBrowserRouter([
   {
      path: "/",
      element: <RootLayout />,
      children: [
         { index: true, element: <LoginPage /> },
         { path: "login", element: <LoginPage /> },
         {
            path: "operador",
            element: (
               <ProtectedRoute role="operador">
                  <OperatorLayout />
               </ProtectedRoute>
            ),
            children: [
               { index: true, element: <OperatorHome /> },
               { path: "reservas", element: <Reservas /> },
               { path: "habitaciones", element: <HabitacionesOp /> },
               { path: "consultas", element: <Consultas /> },
            ],
         },
         {
            path: "administrador",
            element: (
               <ProtectedRoute role="admin">
                  <AdminLayout />
               </ProtectedRoute>
            ),
            children: [
               { index: true, element: <HabitacionesAdm /> },
               { path: "operadores", element: <OperadoresAdm /> },
               { path: "estadisticas", element: <EstadisticasAdm /> },
            ],
         },
         { path: "403", element: <Forbidden /> },
         { path: "*", element: <NotFound /> },
      ],
   },
]);
