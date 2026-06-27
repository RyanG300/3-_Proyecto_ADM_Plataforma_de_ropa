import { useState } from 'react'
import { garmentTypeCatalog, styleCatalog } from '../../data/mockData'

function toggleValue(list, value) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

// HU-07: el cliente elige sus preferencias (tipos de prenda y estilos) para que
// el sistema pueda sugerirle fabricantes relacionados.
export default function PreferencesCard({ currentUser, onSave }) {
  const [garmentTypes, setGarmentTypes] = useState(
    currentUser?.preferences?.garmentTypes ?? [],
  )
  const [styles, setStyles] = useState(currentUser?.preferences?.styles ?? [])
  const [feedback, setFeedback] = useState('')

  const handleSave = () => {
    onSave?.({ garmentTypes, styles })
    setFeedback('Preferencias guardadas. Actualizaremos tus sugerencias.')
  }

  return (
    <article className="rounded-3xl border border-amber-900/10 bg-white p-5 md:p-6">
      <h3 className="font-semibold text-amber-950">Mis preferencias</h3>
      <p className="text-sm text-amber-900/75">
        Marca los tipos de prenda y estilos que más te interesan para recibir
        sugerencias de fabricantes relacionados.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <fieldset>
          <legend className="text-sm font-semibold text-amber-950">Tipos de prenda</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {garmentTypeCatalog.map((type) => (
              <label
                key={type}
                className="flex items-center gap-2 rounded-xl border border-amber-900/15 bg-amber-50/50 px-3 py-1.5 text-sm text-amber-900"
              >
                <input
                  type="checkbox"
                  checked={garmentTypes.includes(type)}
                  onChange={() => {
                    setGarmentTypes((prev) => toggleValue(prev, type))
                    setFeedback('')
                  }}
                  aria-label={type}
                  className="h-4 w-4 accent-amber-800"
                />
                {type}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-semibold text-amber-950">Estilos</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {styleCatalog.map((style) => (
              <label
                key={style}
                className="flex items-center gap-2 rounded-xl border border-amber-900/15 bg-amber-50/50 px-3 py-1.5 text-sm text-amber-900"
              >
                <input
                  type="checkbox"
                  checked={styles.includes(style)}
                  onChange={() => {
                    setStyles((prev) => toggleValue(prev, style))
                    setFeedback('')
                  }}
                  aria-label={style}
                  className="h-4 w-4 accent-amber-800"
                />
                {style}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

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
        Guardar preferencias
      </button>
    </article>
  )
}
