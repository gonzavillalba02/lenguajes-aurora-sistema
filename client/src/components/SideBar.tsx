import { NavLink } from "react-router-dom";
import { useAuthStore } from "../store/auth";

export default function Sidebar({
   items,
}: {
   items: { to: string; label: string }[];
}) {
   const { clear } = useAuthStore();
   return (
      <aside className="fixed left-0 top-0 h-full w-16 hover:w-64 transition-all bg-nav/95 backdrop-blur border-r border-white/10 z-40">
         <div className="p-4 text-sm font-semibold">Hotel</div>
         <nav className="flex flex-col gap-1 px-2">
            {items.map((it) => (
               <NavLink
                  key={it.to}
                  to={it.to}
                  className={({ isActive }) =>
                     `px-3 py-2 rounded-lg text-sm ${
                        isActive ? "bg-white/10" : "hover:bg-white/5"
                     }`
                  }
               >
                  {it.label}
               </NavLink>
            ))}
            <button
               onClick={clear}
               className="mt-auto px-3 py-2 text-left rounded-lg hover:bg-white/5"
            >
               Cerrar sesión
            </button>
         </nav>
      </aside>
   );
}
