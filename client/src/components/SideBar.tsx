import { NavLink } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import { LogOut, Home } from "lucide-react";
import type { NavItem } from "../types/core";

export default function Sidebar({ items }: { items: NavItem[] }) {
   const { clear } = useAuthStore();

   // Sidebar con “hover-reveal” usando una CSS var para ancho
   return (
      <aside
         className="
        group/side fixed inset-y-0 left-0 z-40
        w-[var(--w,4rem)] hover:[--w:16rem]
        bg-nav/95 backdrop-blur
        transition-[width] duration-300 ease-out
      "
      >
         <div className="h-full flex flex-col">
            {/* Branding */}
            <div className="flex items-center gap-3 px-3 py-4">
               <img
                  src="/img/logo-aurora.png"
                  alt="Aurora"
                  className="size-7 rounded"
               />
               <span className="text-white/90 font-semibold opacity-0 group-hover/side:opacity-100 transition-opacity">
                  Aurora
               </span>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-2 py-3 space-y-1">
               {items.map((it) => (
                  <NavLink
                     key={it.to}
                     to={it.to}
                     className={({ isActive }) =>
                        `
                group flex items-center gap-3 rounded-lg
                px-3 py-2 text-sm
                ${
                   isActive
                      ? "bg-white/10 text-white"
                      : "text-white/80 hover:bg-white/5"
                }
                transition-colors
              `
                     }
                     title={it.label}
                  >
                     <span className="shrink-0">
                        {it.icon ?? <Home className="size-4" />}
                     </span>
                     <span className="truncate opacity-0 group-hover/side:opacity-100 transition-opacity">
                        {it.label}
                     </span>
                  </NavLink>
               ))}
            </nav>

            {/* Logout */}
            <button
               onClick={clear}
               className="
            mx-2 mb-3 flex items-center gap-3 px-3 py-2 rounded-lg
            text-white/80 hover:bg-white/5 hover:text-white
            transition-colors
          "
               title="Cerrar sesión"
            >
               <LogOut className="size-4" />
               <span className="opacity-0 group-hover/side:opacity-100 transition-opacity">
                  Cerrar sesión
               </span>
            </button>
         </div>
      </aside>
   );
}
