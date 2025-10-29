import { Link } from "react-router-dom";
export default function NotFound() {
   return (
      <div className="min-h-screen grid place-items-center">
         <div className="text-center">
            <h1 className="text-5xl font-black">404</h1>
            <p className="text-white/70 mb-4">Página no encontrada.</p>
            <Link className="underline" to="/">
               Ir al inicio
            </Link>
         </div>
      </div>
   );
}
