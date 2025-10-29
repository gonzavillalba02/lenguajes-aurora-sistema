export default function Input(
   props: React.InputHTMLAttributes<HTMLInputElement>
) {
   return (
      <input
         className="
        w-full rounded-xl bg-bg2 text-white
        border border-white/10
        px-3 py-2 text-sm placeholder-white/40
        focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent
        transition
      "
         {...props}
      />
   );
}
