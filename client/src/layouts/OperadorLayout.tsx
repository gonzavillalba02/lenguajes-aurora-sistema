import { Outlet } from "react-router-dom";
import Sidebar from "../components/SideBar";
import Topbar from "../components/TopBar";
import { Home, CalendarDays, BedDouble, MessageSquare } from "lucide-react";
import type { JSX } from "react";

// Generamos el array de items de navegación para el operador junto a los iconos de lucide
const operadorNavItems: Array<{
   to: string;
   label: string;
   icon?: JSX.Element;
}> = [
   { to: "/operador", label: "Inicio", icon: <Home className="size-4" /> },
   {
      to: "/operador/reservas",
      label: "Reservas",
      icon: <CalendarDays className="size-4" />,
   },
   {
      to: "/operador/habitaciones",
      label: "Habitaciones",
      icon: <BedDouble className="size-4" />,
   },
   {
      to: "/operador/consultas",
      label: "Consultas",
      icon: <MessageSquare className="size-4" />,
   },
];

export default function OperadorLayout() {
   return (
      <div className="min-h-screen ">
         <Sidebar items={operadorNavItems} />
         <main className="pl-16">
            <Topbar title="Panel Operador" rol="Operador" />
            <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
               <Outlet />
            </div>
         </main>
      </div>
   );
}
