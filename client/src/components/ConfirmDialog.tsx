// src/components/ConfirmDialog.tsx
type ConfirmProps = {
   open: boolean;
   title?: string;
   message: string;
   confirmText?: string;
   cancelText?: string;
   loading?: boolean;
   onConfirm: () => void;
   onClose: () => void;
};

export default function ConfirmDialog({
   open,
   title = "Confirmar",
   message,
   confirmText = "Confirmar",
   cancelText = "Cancelar",
   loading = false,
   onConfirm,
   onClose,
}: ConfirmProps) {
   if (!open) return null;

   const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter" && !loading) onConfirm();
   };

   return (
      <div
         className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-4 "
         onMouseDown={onClose}
         onKeyDown={onKey}
      >
         <div
            className="w-full max-w-md rounded-2xl bg-bg p-4 shadow-lg"
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-desc"
         >
            <h3
               id="confirm-title"
               className="text-lg font-semibold mb-2 text-white text-center"
            >
               {title}
            </h3>
            <p id="confirm-desc" className="text-white/80 mb-4">
               {message}
            </p>
            <div className="flex justify-end gap-2">
               <button
                  className="px-3 py-2 rounded text-white bg-white/10 hover:bg-white/15"
                  onClick={onClose}
                  disabled={loading}
               >
                  {cancelText}
               </button>
               <button
                  className="px-3 py-2 rounded bg-button text-white hover:bg-button/85 disabled:opacity-60"
                  disabled={loading}
                  onClick={onConfirm}
               >
                  {loading ? "Procesando..." : confirmText}
               </button>
            </div>
         </div>
      </div>
   );
}
