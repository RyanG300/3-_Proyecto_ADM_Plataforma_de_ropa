import { useEffect, useMemo, useState } from 'react'
import { measureFields } from '../data/mockData'

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

function buildInitialMeasures(measures = {}) {
  return measureFields.reduce((accumulator, field) => {
    const value = measures?.[field.key]
    accumulator[field.key] = value === undefined || value === null ? '' : String(value)
    return accumulator
  }, {})
}

export default function CustomizationPage({
  currentUser,
  target,
  onBack,
  onGoLogin,
  onSaveMeasures,
  onProceedToCheckout,
}) {
  const selected = target?.design ?? null
  const [selectedIds, setSelectedIds] = useState([])
  const [measureDraft, setMeasureDraft] = useState(() =>
    buildInitialMeasures(currentUser?.measures),
  )
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    setSelectedIds([])
    setFeedback(null)
  }, [selected?.id])

  useEffect(() => {
    setMeasureDraft(buildInitialMeasures(currentUser?.measures))
  }, [currentUser?.id, currentUser?.measures])

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

  const setMeasure = (key, value) => {
    setMeasureDraft((prev) => ({ ...prev, [key]: value }))
    setFeedback(null)
  }

  const handleContinueToCheckout = () => {
    if (!currentUser || currentUser.role !== 'cliente') {
      setFeedback({
        type: 'error',
        message: 'Debes iniciar sesión como cliente para continuar con el pedido.',
      })
      return
    }

    const entries = measureFields.map((field) => [field.key, measureDraft[field.key]])
    const missing = entries.some(([, value]) => String(value).trim() === '')
    if (missing) {
      setFeedback({
        type: 'error',
        message: 'Completa todas las medidas antes de continuar.',
      })
      return
    }

    const invalid = entries.some(([, value]) => {
      const number = Number(value)
      return Number.isNaN(number) || number <= 0
    })
    if (invalid) {
      setFeedback({
        type: 'error',
        message: 'Las medidas deben ser números mayores que cero.',
      })
      return
    }

    const measures = Object.fromEntries(
      entries.map(([key, value]) => [key, Number(value)]),
    )

    const saveResult = onSaveMeasures?.(measures)
    if (saveResult && saveResult.ok === false) {
      setFeedback({ type: 'error', message: saveResult.message })
      return
    }

    onProceedToCheckout?.({
      design: selected,
      selectedModifications,
      measures,
      total: estimatedPrice,
    })
  }

  if (!selected) {
    return (
      <section className="rounded-3xl border border-amber-900/10 bg-white p-6 text-amber-900">
        <p className="font-semibold">No hay un diseño seleccionado para personalizar.</p>
        <button
          type="button"
          onClick={onBack}
          className="mt-4 rounded-xl border border-amber-900/20 bg-white px-4 py-2 text-sm font-semibold text-amber-900"
        >
          Volver al escaparate
        </button>
      </section>
    )
  }

  return (
    <section className="grid gap-4">
      <button
        type="button"
        onClick={onBack}
        className="justify-self-start rounded-xl border border-amber-900/20 bg-white px-4 py-2 text-sm font-semibold text-amber-900"
      >
        Volver al escaparate
      </button>

      <article className="rounded-3xl border border-amber-900/10 bg-white/90 p-5 md:p-6">
        <h2 className="font-serif text-2xl text-amber-950">Personalizar prenda</h2>
        <p className="text-sm text-amber-900/80">
          {selected.name} - {selected.manufacturerName || target?.showcaseName || 'Fabricante'}
        </p>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <div className="grid gap-3">
            <div className="rounded-2xl border border-amber-900/10 bg-amber-50/40 p-4">
              <p className="text-sm font-semibold text-amber-950">Diseño seleccionado</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-[170px_1fr]">
                <div className="overflow-hidden rounded-xl border border-amber-900/15 bg-white">
                  {selected.image ? (
                    <img
                      src={selected.image}
                      alt={selected.name}
                      className="h-36 w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-36 place-items-center text-xs text-amber-900/70">
                      Sin imagen
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-amber-900/75">{selected.type}</p>
                  <p className="mt-1 font-semibold text-amber-950">{selected.name}</p>
                  <p className="mt-1 text-sm font-semibold text-amber-900">
                    Precio base: ${selected.basePrice}
                  </p>
                </div>
              </div>
            </div>

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
            <p>Diseño: {selected.name}</p>
            <p>Fabricante: {selected.manufacturerName || target?.showcaseName || 'N/A'}</p>
            <p>Precio base: ${selected.basePrice}</p>

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

            <div>
              <p className="font-semibold text-amber-950">Medidas para este pedido (cm)</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {measureFields.map((field) => (
                  <label key={field.key} className="grid gap-1 text-xs text-amber-900">
                    {field.label}
                    <input
                      type="number"
                      min={1}
                      max={300}
                      value={measureDraft[field.key]}
                      onChange={(event) => setMeasure(field.key, event.target.value)}
                      aria-label={field.label}
                      className="rounded-lg border border-amber-900/20 bg-white px-2.5 py-1.5 text-sm outline-none transition focus:border-amber-700"
                    />
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-amber-900/75">
                Se autocompletan con tus medidas guardadas y puedes ajustarlas antes de continuar.
              </p>
            </div>

            <p className="text-base font-semibold text-amber-950">
              Precio estimado: ${estimatedPrice.toFixed(2)}
            </p>

            {currentUser?.role === 'cliente' ? (
              <button
                type="button"
                onClick={handleContinueToCheckout}
                className="rounded-xl bg-amber-900 px-4 py-2 text-sm font-semibold text-amber-50 transition hover:bg-amber-800"
              >
                Continuar con entrega y pago
              </button>
            ) : (
              <button
                type="button"
                onClick={onGoLogin}
                className="rounded-xl bg-amber-900 px-4 py-2 text-sm font-semibold text-amber-50 transition hover:bg-amber-800"
              >
                Iniciar sesión como cliente
              </button>
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
      </article>
    </section>
  )
}
