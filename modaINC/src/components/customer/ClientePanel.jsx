const processSteps = [
  { id: 1, label: 'Solicitud enviada', done: true },
  { id: 2, label: 'Diseño aprobado', done: true },
  { id: 3, label: 'Confección en taller', done: true },
  { id: 4, label: 'Control de calidad', done: false },
  { id: 5, label: 'Entrega programada', done: false },
]

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
  {
    id: 'msg-3',
    author: 'Cliente (tú)',
    text: 'Perfecto, también quiero botones metálicos discretos.',
    time: '09:30',
  },
]

export default function ClientePanel({ currentUser }) {
  return (
    <section className="grid gap-4">
      <article className="rounded-3xl border border-amber-900/10 bg-white p-5 md:p-6">
        <h2 className="font-serif text-2xl text-amber-950">Panel de cliente</h2>
        <p className="text-sm text-amber-900/80">
          Seguimiento de tu compra, conversación con fabricante y estado de confección.
        </p>
      </article>

      <article className="rounded-3xl border border-amber-900/10 bg-white p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-amber-900/65">Pedido activo</p>
            <h3 className="font-semibold text-amber-950">Traje Ejecutivo 3P</h3>
            <p className="text-sm text-amber-900/75">Cliente: {currentUser?.name ?? 'Sin nombre'}</p>
          </div>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
            Estado general: En confección
          </span>
        </div>

        <ol className="mt-5 grid gap-3 md:grid-cols-5">
          {processSteps.map((step) => (
            <li
              key={step.id}
              className={`rounded-2xl border px-3 py-3 text-sm ${
                step.done
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                  : 'border-amber-900/15 bg-amber-50/60 text-amber-900'
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-wide">Paso {step.id}</p>
              <p className="mt-1">{step.label}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs text-amber-900/70">
          Vista de ejemplo para prototipo: esta sección no ejecuta flujo real de compra.
        </p>
      </article>

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

        <div className="mt-4 rounded-xl border border-dashed border-amber-900/25 px-4 py-3 text-sm text-amber-900/75">
          Campo de escritura de mensaje pendiente para una futura integración de chat real.
        </div>
      </article>
    </section>
  )
}
