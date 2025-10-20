import Sidebar from "../components/SideBar";
import Topbar from "../components/TopBar";
import { Outlet } from "react-router-dom";
import { Home, BedDouble, User } from "lucide-react";
import type { JSX } from "react";
const administradorItems: Array<{
   to: string;
   label: string;
   icon?: JSX.Element;
}> = [
   { to: "/administrador", label: "Inicio", icon: <Home className="size-4" /> },
   {
      to: "/administrador/habitaciones",
      label: "Habitaciones",
      icon: <BedDouble className="size-4" />,
   },
   {
      to: "/administrador/operadores",
      label: "Operadores",
      icon: <User className="size-4" />,
   },
];
export default function AdminLayout() {
   return (
      <div className="min-h-screen">
         <Sidebar items={administradorItems} />
         <main className="pl-16">
            <Topbar title="Panel Administrador" rol="Admin" />
            <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
               <Outlet />
            </div>
         </main>
      </div>
   );
}
