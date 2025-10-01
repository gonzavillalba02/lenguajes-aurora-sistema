export default function Input(
   props: React.InputHTMLAttributes<HTMLInputElement>
) {
   return (
      <input
         className="w-full rounded-lg bg-bg2 border border-white/10 px-3 py-2 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-button"
         {...props}
      />
   );
}
