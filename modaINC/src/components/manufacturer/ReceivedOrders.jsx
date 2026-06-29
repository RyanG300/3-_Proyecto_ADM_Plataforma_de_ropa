const STATUS_LABELS = {
  recibido: 'Solicitud creada',
  pendiente_cotizacion: 'Pendiente de cotización',
  cotizacion_enviada: 'Cotización enviada',
  cotizacion_aprobada: 'Cotización aprobada',
  pendiente_pago: 'Pendiente de pago',
  pagado: 'Pagado',
  pedido_confirmado: 'Pedido confirmado',
  en_preparacion: 'En preparación',
  en_confeccion: 'En confección',
  en_revision: 'En revisión',
  listo_para_entrega: 'Listo para entrega',
  enviado: 'Enviado',
  entregado: 'Entregado',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
}

// Muestra al fabricante los pedidos que sus clientes generaron, con las
// personalizaciones elegidas (HU-09) y las medidas vinculadas (HU-08).
export default function ReceivedOrders({ orders = [], onNavigateToOrder, onGoToHistory }) {
  return (
    <article className="rounded-3xl border border-amber-900/10 bg-white p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-amber-900/5 pb-3">
        <div>
          <h3 className="text-lg font-semibold text-amber-950">Pedidos recibidos</h3>
          <p className="text-sm text-amber-900/75">
            Personalizaciones y medidas que cada cliente vinculó a su pedido.
          </p>
        </div>
        <button
          type="button"
          onClick={onGoToHistory}
          className="rounded-xl border border-amber-900/20 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 transition hover:bg-amber-50"
        >
          Ver historial completo
        </button>
      </div>

      {orders.length ? (
        <div className="mt-4 grid gap-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl border border-amber-900/10 bg-amber-50/50 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-amber-950">{order.designName}</h4>
                  <p className="text-sm text-amber-900/75">
                    Cliente: {order.clientName} · {order.createdAt}
                  </p>
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                  {STATUS_LABELS[order.status] ?? order.status}
                </span>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/65">
                    Personalizaciones elegidas
                  </p>
                  {order.modifications?.length ? (
                    <ul className="mt-1 grid gap-1 text-sm text-amber-900/85">
                      {order.modifications.map((item) => (
                        <li key={item.id} className="flex justify-between gap-2">
                          <span>{item.name}</span>
                          <span>+${item.extraCost}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-sm text-amber-900/70">Sin personalizaciones.</p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/65">
                    Medidas del cliente (cm)
                  </p>
                  {order.measures && Object.keys(order.measures).length ? (
                    <ul className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 text-sm text-amber-900/85">
                      {Object.entries(order.measures).map(([key, value]) => (
                        <li key={key} className="flex justify-between gap-2 capitalize">
                          <span>{key}</span>
                          <span>{value}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-sm text-amber-900/70">Sin medidas vinculadas.</p>
                  )}
                </div>
              </div>

              <div className="mt-3 flex justify-between items-center border-t border-amber-900/5 pt-3">
                <p className="text-sm font-semibold text-amber-950">
                  Total: ${order.total.toFixed(2)}
                </p>
                <button
                  type="button"
                  onClick={() => onNavigateToOrder?.(order.id)}
                  className="rounded-xl bg-amber-900 px-3 py-1.5 text-xs font-semibold text-amber-50 transition hover:bg-amber-800"
                >
                  Gestionar seguimiento y envío
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-xl bg-amber-100 px-4 py-3 text-sm text-amber-900">
          Aún no has recibido pedidos de clientes.
        </p>
      )}
    </article>
  )
}
