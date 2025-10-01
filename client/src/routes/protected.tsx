import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/auth";

export const ProtectedRoute = ({
   role,
   children,
}: {
   role: "operador" | "admin";
   children?: React.ReactNode;
}) => {
   const { token, user, clear, _hydrated } = useAuthStore();
   const [checking, setChecking] = useState(false);

   // 1) Esperar la hidratación del store (evita rebotes)
   if (!_hydrated) return null; // o un loader minimal

   // 2) Sin token => a login
   if (!token) return <Navigate to="/login" replace />;

   // 3) Si hay token pero no user (pudo no setearse aún) no redirijas en caliente
   useEffect(() => {
      if (token && !user && !checking) {
         // En este setup user se resuelve en setAuth(decodeJWT)
         // Si quisieras pedir /auth/me este sería el lugar.
         setChecking(true);
         // Pequeño delay para permitir que setAuth del login hidrate
         const t = setTimeout(() => setChecking(false), 10);
         return () => clearTimeout(t);
      }
   }, [token, user, checking]);

   if (!user) {
      clear?.();
      return <Navigate to="/login" replace />;
   }

   // 4) Check de rol ya normalizado
   if (role && user.role !== role) {
      return <Navigate to="/403" replace />;
   }

   return <>{children ?? <Outlet />}</>;
};
