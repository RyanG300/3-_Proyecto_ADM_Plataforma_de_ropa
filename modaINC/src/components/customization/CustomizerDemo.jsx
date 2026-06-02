import { useMemo, useState } from 'react'

const initialMeasures = {
  pecho: 90,
  cintura: 76,
  cadera: 95,
  altura: 170,
}

export default function CustomizerDemo({ catalog }) {
  const [designId, setDesignId] = useState(catalog[0]?.id ?? '')
  const [fabric, setFabric] = useState('')
  const [style, setStyle] = useState('')
  const [buttons, setButtons] = useState(4)
  const [measures, setMeasures] = useState(initialMeasures)

  const selected = useMemo(() => {
    return catalog.find((item) => item.id === designId) ?? null
  }, [catalog, designId])

  const availableFabrics = selected?.fabricOptions ?? []
  const availableStyles = selected?.styleOptions ?? []

  const estimatedPrice = useMemo(() => {
    if (!selected) return 0
    const buttonsCost = Number(buttons) * 1.5
    return (selected.basePrice + buttonsCost).toFixed(2)
  }, [selected, buttons])

  return (
    <section className="rounded-3xl border border-amber-900/10 bg-white/85 p-5 md:p-6">
      <h2 className="font-serif text-2xl text-amber-950">Personalización rápida</h2>
      <p className="mb-4 text-sm text-amber-900/80">
        Simulación de configurador desde diseños prefabricados para telas, botones, estilo y medidas.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="grid gap-3">
          <label className="grid gap-1 text-sm text-amber-900">
            Diseño base
            <select
              value={designId}
              onChange={(event) => setDesignId(event.target.value)}
              className="rounded-xl border border-amber-900/20 bg-white px-3 py-2"
            >
              {catalog.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} - {item.manufacturerName}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm text-amber-900">
            Tipo de tela
            <select
              value={fabric}
              onChange={(event) => setFabric(event.target.value)}
              className="rounded-xl border border-amber-900/20 bg-white px-3 py-2"
            >
              <option value="">Selecciona una tela</option>
              {availableFabrics.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm text-amber-900">
            Estilo
            <select
              value={style}
              onChange={(event) => setStyle(event.target.value)}
              className="rounded-xl border border-amber-900/20 bg-white px-3 py-2"
            >
              <option value="">Selecciona un estilo</option>
              {availableStyles.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm text-amber-900">
            Cantidad de botones
            <input
              type="number"
              min={0}
              max={12}
              value={buttons}
              onChange={(event) => setButtons(event.target.value)}
              className="rounded-xl border border-amber-900/20 bg-white px-3 py-2"
            />
          </label>
        </div>

        <div className="grid gap-3">
          <p className="text-sm font-semibold text-amber-950">Medidas del cliente (cm)</p>
          {Object.entries(measures).map(([key, value]) => (
            <label key={key} className="grid gap-1 text-sm capitalize text-amber-900">
              {key}
              <input
                type="number"
                min={40}
                max={230}
                value={value}
                onChange={(event) =>
                  setMeasures((prev) => ({ ...prev, [key]: Number(event.target.value) }))
                }
                className="rounded-xl border border-amber-900/20 bg-white px-3 py-2"
              />
            </label>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-amber-100 p-4 text-sm text-amber-900">
        <p className="font-semibold text-amber-950">Resumen de configuración</p>
        <p>Diseño: {selected?.name ?? 'N/A'}</p>
        <p>Tela: {fabric || 'Pendiente'}</p>
        <p>Estilo: {style || 'Pendiente'}</p>
        <p>Precio estimado: ${estimatedPrice}</p>
      </div>
    </section>
  )
}
