import { useEffect } from "react";

export default function Toast({
   open,
   type = "info",
   message,
   onClose,
   autoHideMs = 3000,
}: {
   open: boolean;
   type?: "success" | "error" | "info" | "warning";
   message: string;
   onClose: () => void;
   autoHideMs?: number;
}) {
   useEffect(() => {
      if (!open) return;
      const t = setTimeout(onClose, autoHideMs);
      return () => clearTimeout(t);
   }, [open, autoHideMs, onClose]);

   if (!open) return null;

   const bg =
      type === "success"
         ? "bg-green-600/90"
         : type === "error"
         ? "bg-red-600/90"
         : type === "warning"
         ? "bg-yellow-600/90"
         : "bg-slate-700/90";

   return (
      <div className="fixed bottom-4 right-4 z-[200]">
         <div
            className={`min-w-64 max-w-sm rounded-lg ${bg} text-white px-4 py-3 shadow-lg`}
         >
            {message}
         </div>
      </div>
   );
}
