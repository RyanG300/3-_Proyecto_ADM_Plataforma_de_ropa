import { useEffect, useMemo, useState } from 'react'

function groupBySession(design) {
  if (!design) return []
  const sessions = design.modificationSessions?.length
    ? design.modificationSessions
    : ['General']

  return sessions
    .map((sessionName) => ({
      sessionName,
      items: (design.modifications ?? []).filter(
        (item) => (item.section || 'General') === sessionName,
      ),
    }))
    .filter((group) => group.items.length)
}

// HU-09: personalización de prendas usando únicamente las opciones que el
// fabricante habilitó, con resumen en vivo y registro en el pedido.
// HU-08: al generar el pedido se vinculan automáticamente las medidas guardadas.
export default function CustomizerDemo({ catalog, currentUser, onCreateOrder }) {
  const [designId, setDesignId] = useState(catalog[0]?.id ?? '')
  const [selectedIds, setSelectedIds] = useState([])
  const [feedback, setFeedback] = useState(null)

  const selected = useMemo(
    () => catalog.find((item) => item.id === designId) ?? null,
    [catalog, designId],
  )

  // Al cambiar de diseño se reinician las selecciones (cada fabricante habilita
  // sus propias opciones).
  useEffect(() => {
    setSelectedIds([])
    setFeedback(null)
  }, [designId])

  const groups = useMemo(() => groupBySession(selected), [selected])

  const selectedModifications = useMemo(() => {
    if (!selected) return []
    return (selected.modifications ?? []).filter((item) => selectedIds.includes(item.id))
  }, [selected, selectedIds])

  const estimatedPrice = useMemo(() => {
    if (!selected) return 0
    const extras = selectedModifications.reduce(
      (total, item) => total + (Number(item.extraCost) || 0),
      0,
    )
    return (Number(selected.basePrice) || 0) + extras
  }, [selected, selectedModifications])

  const toggleModification = (id) => {
    setFeedback(null)
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    )
  }

  const hasMeasures = Boolean(
    currentUser?.measures && Object.keys(currentUser.measures).length,
  )

  const handleCreateOrder = () => {
    const result = onCreateOrder?.({
      design: selected,
      selectedModifications,
    })

    if (result?.ok) {
      setFeedback({ type: 'ok', message: result.message, order: result.order })
      setSelectedIds([])
    } else if (result) {
      setFeedback({ type: 'error', message: result.message })
    }
  }

  return (
    <section className="rounded-3xl border border-amber-900/10 bg-white/85 p-5 md:p-6">
      <h2 className="font-serif text-2xl text-amber-950">Personalizar prenda</h2>
      <p className="mb-4 text-sm text-amber-900/80">
        Elige un diseño y combina solo las opciones que el fabricante ofrece para esa
        prenda.
      </p>

      {!catalog.length ? (
        <p className="rounded-xl bg-amber-100 px-4 py-3 text-sm text-amber-900">
          Aún no hay diseños publicados para personalizar.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <div className="grid gap-3">
            <label className="grid gap-1 text-sm text-amber-900">
              Diseño base
              <select
                value={designId}
                onChange={(event) => setDesignId(event.target.value)}
                aria-label="Diseño base"
                className="rounded-xl border border-amber-900/20 bg-white px-3 py-2"
              >
                {catalog.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} - {item.manufacturerName}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-3">
              <p className="text-sm font-semibold text-amber-950">
                Opciones habilitadas por el fabricante
              </p>
              {groups.length ? (
                groups.map((group) => (
                  <fieldset
                    key={group.sessionName}
                    className="rounded-2xl border border-amber-900/10 bg-amber-50/40 p-3"
                  >
                    <legend className="px-1 text-sm font-semibold text-amber-950">
                      {group.sessionName}
                    </legend>
                    <div className="mt-2 grid gap-2">
                      {group.items.map((item) => (
                        <label
                          key={item.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-amber-900/10 bg-white px-3 py-2 text-sm text-amber-900"
                        >
                          <span className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(item.id)}
                              onChange={() => toggleModification(item.id)}
                              aria-label={item.name}
                              className="h-4 w-4 accent-amber-800"
                            />
                            {item.name}
                          </span>
                          <span className="font-semibold text-amber-950">
                            +${Number(item.extraCost) || 0}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))
              ) : (
                <p className="rounded-xl bg-amber-100 px-4 py-2 text-sm text-amber-900">
                  Este diseño no tiene opciones de personalización habilitadas.
                </p>
              )}
            </div>
          </div>

          <aside className="grid content-start gap-3 rounded-2xl bg-amber-100 p-4 text-sm text-amber-900">
            <p className="font-semibold text-amber-950">Resumen de tu personalización</p>
            <p>Diseño: {selected?.name ?? 'N/A'}</p>
            <p>Fabricante: {selected?.manufacturerName ?? 'N/A'}</p>
            <p>Precio base: ${selected?.basePrice ?? 0}</p>

            <div>
              <p className="font-semibold text-amber-950">Personalizaciones elegidas</p>
              {selectedModifications.length ? (
                <ul className="mt-1 grid gap-1">
                  {selectedModifications.map((item) => (
                    <li key={item.id} className="flex justify-between gap-2">
                      <span>{item.name}</span>
                      <span>+${Number(item.extraCost) || 0}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-amber-900/75">Ninguna seleccionada todavía.</p>
              )}
            </div>

            <p className="text-base font-semibold text-amber-950">
              Precio estimado: ${estimatedPrice.toFixed(2)}
            </p>

            <div className="rounded-xl border border-amber-900/15 bg-white/70 px-3 py-2 text-xs">
              {hasMeasures
                ? 'Tus medidas guardadas se vincularán automáticamente al pedido.'
                : 'No tienes medidas registradas: el pedido se generará sin medidas vinculadas.'}
            </div>

            {currentUser ? (
              <button
                type="button"
                onClick={handleCreateOrder}
                disabled={!selected}
                className="rounded-xl bg-amber-900 px-4 py-2 text-sm font-semibold text-amber-50 transition enabled:hover:bg-amber-800 disabled:opacity-50"
              >
                Generar pedido
              </button>
            ) : (
              <p className="rounded-xl bg-white/70 px-3 py-2 text-xs text-amber-900/80">
                Inicia sesión como cliente para generar el pedido.
              </p>
            )}

            {feedback ? (
              <p
                className={`rounded-xl px-3 py-2 text-xs ${
                  feedback.type === 'ok'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {feedback.message}
              </p>
            ) : null}
          </aside>
        </div>
      )}
    </section>
  )
}
