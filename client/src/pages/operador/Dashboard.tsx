import { StatusBadge } from "../../components/StatusBadge";

export default function OperatorHome() {
   return (
      <section className="grid gap-4">
         <div className="card p-4">Bienvenido Operador </div>
         <div className="card p-4">
            <h3 className="font-semibold mb-2">Estados de muestra</h3>
            <div className="flex gap-2 flex-wrap">
               <StatusBadge tipo="reserva" value="Pendiente" />
               <StatusBadge tipo="reserva" value="Pendiente de pago" />
               <StatusBadge tipo="reserva" value="Aprobada" />
               <StatusBadge tipo="reserva" value="Rechazada" />
               <StatusBadge tipo="reserva" value="Cancelada" />
               <StatusBadge tipo="habitacion" value="Libre" />
               <StatusBadge tipo="habitacion" value="Ocupada" />
               <StatusBadge tipo="habitacion" value="Cerrada" />
            </div>
         </div>
      </section>
   );
}
