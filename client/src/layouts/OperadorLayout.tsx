import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function OperatorLayout() {
   return (
      <div className="min-h-screen">
         <Sidebar
            items={[
               { to: "/operador", label: "Inicio" },
               { to: "/operador/reservas", label: "Reservas" },
               { to: "/operador/habitaciones", label: "Habitaciones" },
               { to: "/operador/consultas", label: "Consultas" },
            ]}
         />
         <main className="pl-16 hover:pl-64 transition-all">
            <Topbar title="Panel Operador" />
            <div className="max-w-7xl mx-auto p-4">
               <Outlet />
            </div>
         </main>
      </div>
   );
}
