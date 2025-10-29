import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

type Size = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";

export type AnimacionDetailsProps = {
   open: boolean;
   onClose: () => void;

   title?: React.ReactNode;
   children: React.ReactNode;
   footer?: React.ReactNode;
   headerRight?: React.ReactNode;

   /** default: "lg" */
   maxWidth?: Size;
   /** default: true */
   blur?: boolean;
   /** default: true */
   escToClose?: boolean;
   /** default: true */
   closeOnBackdrop?: boolean;
   /** default: true */
   showCloseButton?: boolean;

   /** default: 180ms */
   durationMs?: number;

   /** clases extra opcionales */
   overlayClassName?: string;
   panelClassName?: string;

   /** foco inicial (opcional) */
   initialFocusRef?: React.RefObject<HTMLElement> | null;
   /** id accesible opcional (si no, se genera) */
   labelledById?: string;
};

export default function AnimacionDetails({
   open,
   onClose,
   title,
   children,
   footer,
   headerRight,
   maxWidth = "lg",
   blur = true,
   escToClose = true,
   closeOnBackdrop = true,
   showCloseButton = true,
   durationMs = 180,
   overlayClassName = "",
   panelClassName = "",
   initialFocusRef,
   labelledById,
}: AnimacionDetailsProps) {
   const [mounted, setMounted] = useState(false);
   const [visible, setVisible] = useState(false);

   // portal target
   const portalEl = useMemo(() => {
      let el = document.getElementById("modal-root");
      if (!el) {
         el = document.createElement("div");
         el.id = "modal-root";
         document.body.appendChild(el);
      }
      return el;
   }, []);

   // abrir: montar + animar + bloquear scroll
   useEffect(() => {
      if (!open) return;
      setMounted(true);
   }, [open]);

   useEffect(() => {
      if (!mounted) return;
      // animate in
      setVisible(true);
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      // foco inicial
      if (initialFocusRef?.current) {
         setTimeout(() => initialFocusRef.current?.focus(), durationMs);
      }

      return () => {
         document.body.style.overflow = prev;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [mounted]);

   const handleRequestClose = useCallback(() => {
      setVisible(false);
      // esperar fin de animación y recién notificar cierre al padre
      setTimeout(() => {
         onClose();
         setMounted(false);
      }, durationMs);
   }, [durationMs, onClose]);

   // cierre por ESC
   useEffect(() => {
      if (!mounted || !escToClose) return;
      const onKey = (e: KeyboardEvent) => {
         if (e.key === "Escape") handleRequestClose();
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
   }, [mounted, escToClose, handleRequestClose]);

   if (!open && !mounted) return null;

   const maxW = {
      sm: "max-w-sm",
      md: "max-w-md",
      lg: "max-w-lg",
      xl: "max-w-xl",
      "2xl": "max-w-2xl",
      "3xl": "max-w-3xl",
      full: "max-w-[min(96vw,1200px)]",
   }[maxWidth];

   const labelledId = labelledById || "animacion-details-title";

   const overlayBase = `
    fixed inset-0 z-[90] grid place-items-center p-4
    ${blur ? "backdrop-blur-sm" : ""}
    bg-black/40
    transition-opacity duration-[${durationMs}ms]
    ${visible ? "opacity-100" : "opacity-0"}
  `;

   const panelBase = `
    w-full ${maxW} rounded-2xl bg-bg p-4 shadow-lg ring-1 ring-white/10 relative
    transition-all duration-[${durationMs}ms] ease-out
    ${
       visible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-2 scale-[0.98]"
    }
  `;

   return createPortal(
      <div
         className={`${overlayBase} ${overlayClassName}`}
         role="dialog"
         aria-modal="true"
         aria-labelledby={title ? labelledId : undefined}
         onMouseDown={closeOnBackdrop ? handleRequestClose : undefined}
      >
         <div
            className={`${panelBase} ${panelClassName}`}
            onMouseDown={(e) => e.stopPropagation()} // evita cierre por click interno
         >
            {(title || showCloseButton || headerRight) && (
               <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                     {title ? (
                        <h2
                           id={labelledId}
                           className="truncate text-xl font-bold text-white"
                        >
                           {title}
                        </h2>
                     ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                     {headerRight}
                     {showCloseButton && (
                        <button
                           aria-label="Cerrar"
                           onClick={handleRequestClose}
                           className="rounded-lg text-white bg-white/10 px-2 py-1 hover:bg-white/15"
                        >
                           ✕
                        </button>
                     )}
                  </div>
               </div>
            )}

            <div>{children}</div>

            {footer ? <div className="mt-4">{footer}</div> : null}
         </div>
      </div>,
      portalEl
   );
}
