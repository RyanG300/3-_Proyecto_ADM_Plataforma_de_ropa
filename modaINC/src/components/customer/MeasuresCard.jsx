import { useState } from 'react'
import { measureFields } from '../../data/mockData'

function buildInitialState(measures = {}) {
  return measureFields.reduce((accumulator, field) => {
    const value = measures?.[field.key]
    accumulator[field.key] = value === undefined || value === null ? '' : String(value)
    return accumulator
  }, {})
}

// HU-08: el cliente registra y actualiza sus medidas corporales en el perfil.
export default function MeasuresCard({ currentUser, onSave }) {
  const [draft, setDraft] = useState(() => buildInitialState(currentUser?.measures))
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')

  const setMeasure = (key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
    setError('')
    setFeedback('')
  }

  const handleSave = () => {
    // Todos los campos son obligatorios y deben ser números válidos > 0
    // antes de poder guardar (validación previa al envío).
    const entries = measureFields.map((field) => [field.key, draft[field.key]])

    const missing = entries.some(([, value]) => String(value).trim() === '')
    if (missing) {
      setError('Completa todas las medidas antes de guardar.')
      return
    }

    const invalid = entries.some(([, value]) => {
      const number = Number(value)
      return Number.isNaN(number) || number <= 0
    })
    if (invalid) {
      setError('Las medidas deben ser números mayores que cero.')
      return
    }

    const measures = Object.fromEntries(
      entries.map(([key, value]) => [key, Number(value)]),
    )

    const result = onSave?.(measures)
    if (result && result.ok === false) {
      setError(result.message ?? 'No se pudieron guardar las medidas.')
      return
    }

    setFeedback('Medidas guardadas. Se vincularán automáticamente a tus pedidos.')
  }

  return (
    <article className="rounded-3xl border border-amber-900/10 bg-white p-5 md:p-6">
      <h3 className="font-semibold text-amber-950">Mis medidas corporales</h3>
      <p className="text-sm text-amber-900/75">
        Regístralas una vez y se usarán automáticamente al generar un pedido. Puedes
        editarlas cuando quieras.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {measureFields.map((field) => (
          <label key={field.key} className="grid gap-1 text-sm text-amber-900">
            {field.label} (cm)
            <input
              type="number"
              min={1}
              max={300}
              value={draft[field.key]}
              onChange={(event) => setMeasure(field.key, event.target.value)}
              aria-label={field.label}
              className="rounded-xl border border-amber-900/20 bg-white px-3 py-2 outline-none transition focus:border-amber-700"
            />
          </label>
        ))}
      </div>

      {error ? (
        <p className="mt-3 rounded-xl bg-red-100 px-4 py-2 text-sm text-red-800">{error}</p>
      ) : null}
      {feedback ? (
        <p className="mt-3 rounded-xl bg-emerald-100 px-4 py-2 text-sm text-emerald-800">
          {feedback}
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleSave}
        className="mt-4 rounded-xl bg-amber-900 px-4 py-2 text-sm font-semibold text-amber-50 transition hover:bg-amber-800"
      >
        Guardar medidas
      </button>
    </article>
  )
}
