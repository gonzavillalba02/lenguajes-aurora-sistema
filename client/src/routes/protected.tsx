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

   // 1) Esperar la hidratación del store (evita rebotes)
   if (!_hydrated) return null; // o un loader minimal

   // 2) Sin token => a login
   if (!token) return <Navigate to="/login" replace />;

   // 3) Si hay token pero no user (pudo no setearse aún) no redirijas en caliente

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
