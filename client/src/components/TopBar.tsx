import { User } from "lucide-react";

export default function Topbar({ title }: { title: string }) {
   return (
      <header
         className="
        sticky top-0 z-30
        bg-bg/80 backdrop-blur border-b border-white/10
      "
      >
         <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <h1 className="text-white font-semibold">{title}</h1>
            </div>
            <div className="flex items-center gap-2">
               <img
                  src="/img/operador.svg"
                  className="size-8 rounded-full border border-white/10"
                  alt="Operador"
               />
               <span className="hidden sm:block text-white/80 text-sm">
                  Operador
               </span>
               <span className="ml-2 inline-flex items-center gap-2 rounded-lg bg-button/90 text-white text-xs px-3 py-1 shadow">
                  <User className="size-4" /> Sesión activa
               </span>
            </div>
         </div>
      </header>
   );
}
