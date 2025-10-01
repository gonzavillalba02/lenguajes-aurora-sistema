import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { Outlet } from "react-router-dom";

export default function AdminLayout() {
   return (
      <div className="min-h-screen">
         <Sidebar
            items={[
               { to: "/administrador", label: "Habitaciones" },
               { to: "/administrador/operadores", label: "Operadores" },
               { to: "/administrador/estadisticas", label: "Estadísticas" },
            ]}
         />
         <main className="pl-16 hover:pl-64 transition-all">
            <Topbar title="Panel Administrador" />
            <div className="max-w-7xl mx-auto p-4">
               <Outlet />
            </div>
         </main>
      </div>
   );
}
