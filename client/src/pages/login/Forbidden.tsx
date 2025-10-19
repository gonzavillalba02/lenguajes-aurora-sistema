import { Link } from "react-router-dom";
export default function Forbidden() {
   return (
      <div className="min-h-screen grid place-items-center">
         <div className="text-center">
            <h1 className="text-5xl font-black">403</h1>
            <p className="text-white/70 mb-4">
               No tienes permisos para ver esta página. Volve a iniciar sesión.
            </p>
            <Link className="underline" to="/login">
               Volver al inicio
            </Link>
         </div>
      </div>
   );
}
