const STATUS_LABELS = {
  recibido: 'Recibido',
  en_confeccion: 'En confección',
  listo: 'Listo',
  enviado: 'Enviado',
  entregado: 'Entregado',
}

// Muestra al fabricante los pedidos que sus clientes generaron, con las
// personalizaciones elegidas (HU-09) y las medidas vinculadas (HU-08).
export default function ReceivedOrders({ orders = [] }) {
  return (
    <article className="rounded-3xl border border-amber-900/10 bg-white p-5 md:p-6">
      <h3 className="text-lg font-semibold text-amber-950">Pedidos recibidos</h3>
      <p className="text-sm text-amber-900/75">
        Personalizaciones y medidas que cada cliente vinculó a su pedido.
      </p>

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

              <p className="mt-3 text-right text-sm font-semibold text-amber-950">
                Total: ${order.total.toFixed(2)}
              </p>
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
