import { useState } from 'react'

// HU-07: sugerencias de fabricantes según las preferencias del cliente.
// El cliente puede ignorarlas (descartarlas) y seguir buscando manualmente.
export default function SuggestedManufacturers({ suggestions, onOpenShowcase }) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || !suggestions?.length) return null

  return (
    <section className="rounded-3xl border border-amber-700/30 bg-amber-100/70 p-5 md:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl text-amber-950">Sugerencias para ti</h2>
          <p className="text-sm text-amber-900/80">
            Fabricantes recomendados según tus preferencias. Puedes ignorarlas y buscar
            por tu cuenta.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="rounded-xl border border-amber-900/20 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 transition hover:bg-amber-50"
        >
          Ignorar sugerencias
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {suggestions.map(({ manufacturer, reasons }) => (
          <article
            key={manufacturer.id}
            className="grid gap-2 rounded-2xl border border-amber-900/10 bg-white p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-amber-950">{manufacturer.businessName}</h3>
              {manufacturer.location ? (
                <span className="rounded-full bg-amber-900/10 px-2 py-0.5 text-xs text-amber-900">
                  {manufacturer.location}
                </span>
              ) : null}
            </div>
            <p className="text-sm text-amber-900/80">{manufacturer.specialty}</p>

            {reasons?.length ? (
              <div className="flex flex-wrap gap-1.5">
                {[...new Set(reasons)].map((reason) => (
                  <span
                    key={`${manufacturer.id}-${reason}`}
                    className="rounded-full border border-amber-700/30 bg-amber-50 px-2.5 py-0.5 text-xs text-amber-900"
                  >
                    {reason}
                  </span>
                ))}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => onOpenShowcase(manufacturer.id)}
              className="mt-1 justify-self-start rounded-xl bg-amber-900 px-3 py-1.5 text-sm font-semibold text-amber-50 transition hover:bg-amber-800"
            >
              Ver escaparate
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}
