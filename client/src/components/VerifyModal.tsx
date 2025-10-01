import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type State = "idle" | "waiting" | "ok" | "error";

export default function VerifyModal({
   state,
   onClose,
}: {
   state: State;
   onClose: () => void;
}) {
   const open = state !== "idle";

   useEffect(() => {
      if (state === "ok") {
         const t = setTimeout(onClose, 800);
         return () => clearTimeout(t);
      }
   }, [state, onClose]);

   return (
      <AnimatePresence>
         {open && (
            <motion.div
               className="fixed inset-0 z-50 backdrop-blur-sm bg-black/40 grid place-items-center"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
            >
               <motion.div
                  initial={{ scale: 0.96, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.96, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  className="card w-full max-w-sm text-center py-8"
               >
                  {state === "waiting" && (
                     <div className="space-y-2">
                        <div className="mx-auto size-8 rounded-full border-2 border-button/40 border-t-button animate-spin" />
                        <p className="text-sm">Esperando verificación…</p>
                     </div>
                  )}
                  {state === "ok" && (
                     <div className="space-y-2">
                        <div className="mx-auto size-8 rounded-full grid place-items-center bg-aprobada/15 text-aprobada">
                           ✓
                        </div>
                        <p className="text-sm">Acceso confirmado</p>
                     </div>
                  )}
                  {state === "error" && (
                     <div className="space-y-2">
                        <div className="mx-auto size-8 rounded-full grid place-items-center bg-rechazada/15 text-rechazada">
                           !
                        </div>
                        <p className="text-sm">
                           Acceso denegado, volver a intentar
                        </p>
                        <button
                           onClick={onClose}
                           className="text-xs underline opacity-80 hover:opacity-100"
                        >
                           Cerrar
                        </button>
                     </div>
                  )}
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>
   );
}
