// Toast.tsx
import { useEffect, useState, useCallback } from "react";
import {
   CheckCircle2,
   XCircle,
   AlertTriangle,
   Info,
   X as CloseIcon,
} from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

export default function Toast({
   open,
   type = "info",
   message,
   onClose,
   title,
}: {
   open: boolean;
   type?: ToastType;
   message: string;
   onClose: () => void;
   /** opcional: si no se pasa, se usa uno por defecto según el tipo */
   title?: string;
}) {
   const [show, setShow] = useState(false);

   const close = useCallback(() => {
      setShow(false);
      setTimeout(onClose, 160); // esperar animación
   }, [onClose]);

   // Bloquear scroll + manejar ESC
   useEffect(() => {
      if (!open) return;
      setShow(true);

      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
      window.addEventListener("keydown", onKey);

      return () => {
         document.body.style.overflow = prev;
         window.removeEventListener("keydown", onKey);
      };
   }, [open, close]);

   if (!open) return null;

   const theme: Record<
      ToastType,
      {
         bg: string;
         ring: string;
         tint: string;
         defaultTitle: string;
         Icon: React.ComponentType<{
            size?: number;
            strokeWidth?: number;
            className?: string;
         }>;
      }
   > = {
      success: {
         bg: "bg-emerald-600/95",
         ring: "ring-emerald-400/40",
         tint: "text-emerald-200",
         defaultTitle: "Éxito",
         Icon: CheckCircle2,
      },
      error: {
         bg: "bg-red-600/95",
         ring: "ring-red-400/40",
         tint: "text-red-200",
         defaultTitle: "Error",
         Icon: XCircle,
      },
      warning: {
         bg: "bg-amber-600/95",
         ring: "ring-amber-400/40",
         tint: "text-amber-100",
         defaultTitle: "Atención",
         Icon: AlertTriangle,
      },
      info: {
         bg: "bg-slate-800/95",
         ring: "ring-slate-400/40",
         tint: "text-slate-200",
         defaultTitle: "Info",
         Icon: Info,
      },
   };

   const { bg, ring, tint, defaultTitle, Icon } = theme[type];

   return (
      <div
         className={`fixed inset-0 z-[200] grid place-items-center bg-black/40 backdrop-blur-sm transition-opacity duration-150 ${
            show ? "opacity-100" : "opacity-0"
         }`}
         role="dialog"
         aria-modal="true"
         aria-labelledby="toast-title"
         aria-describedby="toast-desc"
         // No cerramos por click en backdrop (operador usa ❌ o ESC)
         onMouseDown={(e) => e.stopPropagation()}
      >
         <div
            className={`w-full max-w-sm rounded-2xl px-5 py-4 text-white shadow-2xl ring-1 relative overflow-hidden ${bg} ${ring}
        transition-all duration-150 ease-out
        ${
           show
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 translate-y-2 scale-[0.98]"
        }
      `}
         >
            <div className="flex items-start gap-3">
               <Icon
                  size={22}
                  strokeWidth={2.25}
                  className={`${tint} mt-0.5 shrink-0`}
               />
               <div className="flex-1">
                  <div
                     id="toast-title"
                     className="text-sm font-semibold tracking-wide text-white/90"
                  >
                     {title ?? defaultTitle}
                  </div>
                  <div
                     id="toast-desc"
                     className="mt-1 text-[0.95rem] leading-snug text-white/95"
                  >
                     {message}
                  </div>
               </div>

               <button
                  aria-label="Cerrar"
                  className="ml-1 shrink-0 rounded-md p-1.5 hover:bg-white/10 active:scale-95 transition"
                  onClick={close}
               >
                  <CloseIcon
                     size={18}
                     strokeWidth={2.25}
                     className="text-white/90"
                  />
               </button>
            </div>
         </div>
      </div>
   );
}
