// src/components/Button.tsx
import { Loader2 } from "lucide-react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
   loading?: boolean;
   variant?: "primary" | "ghost";
};

export default function Button({
   children,
   loading,
   variant = "primary",
   className,
   ...props
}: ButtonProps) {
   const base =
      "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed";
   const kind =
      variant === "primary"
         ? "bg-button text-white hover:opacity-90 shadow active:scale-[.99]"
         : "bg-white/5 text-white/80 hover:bg-white/10";

   return (
      <button className={`${base} ${kind} ${className ?? ""}`} {...props}>
         {loading && <Loader2 className="size-4 animate-spin" />}
         {children}
      </button>
   );
}
