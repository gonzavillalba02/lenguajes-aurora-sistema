export default function Button({
   children,
   ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
   return (
      <button
         className="inline-flex items-center justify-center rounded-lg bg-button px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
         {...props}
      >
         {children}
      </button>
   );
}
