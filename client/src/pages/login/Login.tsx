import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import VerifyModal from "../../components/VerifyModal";
import { login } from "../../services/auth";
import { useAuthStore } from "../../store/auth";

export default function LoginPage() {
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   const [verifying, setVerifying] = useState<
      "idle" | "waiting" | "ok" | "error"
   >("idle");

   const setAuth = useAuthStore((s) => s.setAuth);
   const navigate = useNavigate();

   const onSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setVerifying("waiting");
      try {
         const { token } = await login({ email, password }); // backend devuelve { token }
         // guardo token + hidrato user desde el propio JWT
         setAuth(token, null);

         // leo el rol ya normalizado desde la store; si no, decodifico
         const st = useAuthStore.getState();
         const role = st.user?.role ?? decodeJWT(token).role;

         if (!role) {
            setVerifying("error");
            setTimeout(() => setVerifying("idle"), 1100);
            return;
         }

         setVerifying("ok");
         setTimeout(() => {
            navigate(role === "admin" ? "/administrador" : "/operador", {
               replace: true,
            });
         }, 600);
      } catch {
         setVerifying("error");
         setTimeout(() => setVerifying("idle"), 1100);
      }
   };

   return (
      <div className="min-h-screen bg-slate-900 text-slate-100">
         {/* Topbar */}
         <header className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur border-b border-white/10">
            <div className="mx-auto max-w-7xl px-4 h-14 flex items-center gap-3">
               <div className="size-7 grid place-items-center">
                  <img
                     src="/img/logo-aurora.png"
                     alt="Logo"
                     className="w-5 h-5"
                  />
               </div>
               <span className="font-medium">Hotel Aurora</span>
            </div>
         </header>

         <main>
            <div className="mx-auto max-w-7xl px-4">
               {/* mismo alto para ambas columnas */}
               <section className="min-h-[calc(100vh-3.5rem)] flex items-center py-6 md:py-10">
                  <div className="grid md:grid-cols-2 w-full overflow-hidden rounded-2xl ring-1 ring-white/5 bg-slate-800/10">
                     {/* IZQUIERDA: fondo claro ocupando TODO */}
                     <div className="bg-slate-200 text-slate-900 p-6 md:p-10 flex">
                        <motion.div
                           initial={{ y: 8, opacity: 0 }}
                           animate={{ y: 0, opacity: 1 }}
                           transition={{ duration: 0.35, ease: "easeOut" }}
                           className="w-full max-w-lg mx-auto"
                        >
                           <div className="flex flex-col items-center mb-6">
                              <img
                                 src="/img/operador.png"
                                 alt="Operador"
                                 className="w-12 h-12 opacity-90"
                              />
                              <h1 className="text-2xl font-semibold mt-3">
                                 Iniciar Sesión
                              </h1>
                           </div>

                           <form onSubmit={onSubmit} className="space-y-4">
                              <div>
                                 <label className="text-sm text-slate-600">
                                    Correo electrónico
                                 </label>
                                 <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="tu@correo.com"
                                    className="mt-1 w-full rounded-md bg-white text-slate-900 placeholder-black/40 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 px-3 py-2"
                                 />
                              </div>

                              <div>
                                 <label className="text-sm text-slate-600">
                                    Contraseña
                                 </label>
                                 <input
                                    type="password"
                                    value={password}
                                    onChange={(e) =>
                                       setPassword(e.target.value)
                                    }
                                    required
                                    placeholder="••••••••"
                                    className="mt-1 w-full rounded-md bg-white text-slate-900 placeholder-black/40 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 px-3 py-2"
                                 />
                              </div>

                              <button
                                 type="submit"
                                 disabled={verifying === "waiting"}
                                 className="w-full rounded-md px-4 py-2 font-medium bg-blue-600 text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                 {verifying === "waiting"
                                    ? "Ingresando..."
                                    : "Iniciar sesión"}
                              </button>
                           </form>

                           <p className="text-xs mt-4 text-slate-600/90">
                              Accedé con tu usuario de operador o admin. Los
                              accesos están validados contra tu backend.
                           </p>
                        </motion.div>
                     </div>

                     {/* DERECHA: imagen llenando la columna */}
                     <div className="relative">
                        <motion.img
                           initial={{ scale: 1.02, opacity: 0 }}
                           animate={{ scale: 1, opacity: 1 }}
                           transition={{
                              duration: 0.5,
                              ease: "easeOut",
                              delay: 0.1,
                           }}
                           src="/img/login-hero.png"
                           alt="Hotel"
                           className="w-full h-[360px] md:h-full object-cover"
                        />
                        <div className="pointer-events-none absolute inset-0 ring-1 ring-black/10"></div>
                     </div>
                  </div>
               </section>
            </div>
         </main>

         <VerifyModal state={verifying} onClose={() => setVerifying("idle")} />
      </div>
   );
}
