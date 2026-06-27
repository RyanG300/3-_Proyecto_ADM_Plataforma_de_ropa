import MeasuresCard from './MeasuresCard'
import PreferencesCard from './PreferencesCard'

const sampleMessages = [
  {
    id: 'msg-1',
    author: 'Cliente (tú)',
    text: 'Hola, ¿podemos usar tejido elástico confort en azul marino?',
    time: '09:10',
  },
  {
    id: 'msg-2',
    author: 'Fabricante: Carlos Atelier',
    text: 'Sí, está disponible. Te envié la propuesta actualizada con el costo adicional.',
    time: '09:22',
  },
]

const STATUS_LABELS = {
  recibido: 'Recibido',
  en_confeccion: 'En confección',
  listo: 'Listo',
  enviado: 'Enviado',
  entregado: 'Entregado',
}

export default function ClientePanel({
  currentUser,
  orders = [],
  updateMeasures,
  updatePreferences,
}) {
  const myOrders = orders.filter((order) => order.clientId === currentUser?.id)

  const handleSaveMeasures = (measures) => updateMeasures?.(currentUser.id, measures)

  const handleSavePreferences = (preferences) =>
    updatePreferences?.(currentUser.id, preferences)

  return (
    <section className="grid gap-4">
      <article className="rounded-3xl border border-amber-900/10 bg-white p-5 md:p-6">
        <h2 className="font-serif text-2xl text-amber-950">Panel de cliente</h2>
        <p className="text-sm text-amber-900/80">
          Registra tus medidas, define tus preferencias y da seguimiento a tus pedidos.
        </p>
      </article>

      {/* HU-08 */}
      <MeasuresCard currentUser={currentUser} onSave={handleSaveMeasures} />

      {/* HU-07 */}
      <PreferencesCard currentUser={currentUser} onSave={handleSavePreferences} />

      {/* Pedidos generados */}
      <article className="rounded-3xl border border-amber-900/10 bg-white p-5 md:p-6">
        <h3 className="font-semibold text-amber-950">Mis pedidos</h3>
        <p className="text-sm text-amber-900/75">
          Pedidos generados con sus personalizaciones y medidas vinculadas.
        </p>

        {myOrders.length ? (
          <div className="mt-4 grid gap-3">
            {myOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl border border-amber-900/10 bg-amber-50/50 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-amber-950">{order.designName}</h4>
                    <p className="text-sm text-amber-900/75">
                      Fabricante: {order.manufacturerName || 'N/A'} · {order.createdAt}
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/65">
                      Personalizaciones
                    </p>
                    {order.modifications.length ? (
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
                      Medidas vinculadas (cm)
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
            Aún no has generado pedidos. Personaliza una prenda y genera tu primer pedido.
          </p>
        )}
      </article>

      {/* Conversación (demo del sprint anterior) */}
      <article className="rounded-3xl border border-amber-900/10 bg-white p-5 md:p-6">
        <h3 className="font-semibold text-amber-950">Conversación con fabricante</h3>
        <p className="text-sm text-amber-900/75">Canal de mensajes del pedido (simulado).</p>

        <div className="mt-4 grid gap-3 rounded-2xl bg-amber-50/50 p-4">
          {sampleMessages.map((message) => (
            <div key={message.id} className="rounded-xl border border-amber-900/10 bg-white p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-amber-950">{message.author}</p>
                <span className="text-xs text-amber-900/65">{message.time}</span>
              </div>
              <p className="mt-1 text-sm text-amber-900/85">{message.text}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  )
}
