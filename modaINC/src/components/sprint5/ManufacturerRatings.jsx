import { useState, useMemo } from 'react'
import RatingStars from './RatingStars'

export default function ManufacturerRatings({ manufacturerId, ratings = [] }) {
  const [selectedScore, setSelectedScore] = useState('all')
  const [lightboxImage, setLightboxImage] = useState('')

  const ownRatings = useMemo(() => {
    return ratings.filter((r) => r.manufacturerId === manufacturerId)
  }, [ratings, manufacturerId])

  const stats = useMemo(() => {
    const totalCount = ownRatings.length
    if (totalCount === 0) {
      return {
        average: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        percent: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      }
    }

    const sum = ownRatings.reduce((acc, r) => acc + r.generalRating, 0)
    const average = Number((sum / totalCount).toFixed(1))

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    ownRatings.forEach((r) => {
      const score = Math.round(r.generalRating)
      if (distribution[score] !== undefined) {
        distribution[score] += 1
      }
    })

    const percent = {}
    Object.keys(distribution).forEach((key) => {
      percent[key] = Math.round((distribution[key] / totalCount) * 100)
    })

    return {
      average,
      distribution,
      percent,
    }
  }, [ownRatings])

  const filteredRatings = useMemo(() => {
    if (selectedScore === 'all') return ownRatings
    const targetScore = Number(selectedScore)
    return ownRatings.filter((r) => Math.round(r.generalRating) === targetScore)
  }, [ownRatings, selectedScore])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between border-b border-amber-900/10 pb-4">
        <h2 className="font-serif text-2xl font-bold text-amber-950">Calificaciones de Clientes</h2>
        <span className="text-xs font-semibold text-amber-900/65 uppercase tracking-wide">
          {ownRatings.length} {ownRatings.length === 1 ? 'valoración' : 'valoraciones'}
        </span>
      </div>

      {!ownRatings.length ? (
        <div className="py-8 text-center text-amber-900/60 italic">
          Este fabricante aún no tiene calificaciones.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-[250px_1fr]">
          {/* Summary Panel (Left) */}
          <div className="rounded-3xl border border-amber-900/10 bg-amber-50/20 p-5 space-y-4 h-fit">
            <div className="text-center">
              <p className="font-serif text-4xl font-extrabold text-amber-950">{stats.average}</p>
              <div className="mt-1.5 flex justify-center">
                <RatingStars rating={Math.round(stats.average)} size="h-5 w-5" />
              </div>
              <p className="mt-1 text-xs text-amber-900/60">Promedio general</p>
            </div>

            {/* Histogram bars */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((score) => {
                const pct = stats.percent[score] ?? 0
                const count = stats.distribution[score] ?? 0
                return (
                  <button
                    key={score}
                    type="button"
                    onClick={() => setSelectedScore(selectedScore === String(score) ? 'all' : String(score))}
                    className={`w-full flex items-center gap-2 text-xs font-medium text-amber-900 transition hover:opacity-85 ${selectedScore === String(score) ? 'ring-2 ring-amber-700/30 rounded-lg p-1 bg-amber-50' : 'p-1'}`}
                  >
                    <span className="w-3 text-right">{score}</span>
                    <span className="text-amber-500">★</span>
                    <div className="flex-1 h-2 rounded bg-amber-100/50 overflow-hidden">
                      <div className="h-full bg-amber-600 rounded" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-8 text-right text-amber-900/60">{pct}%</span>
                  </button>
                )
              })}
            </div>

            {/* Reset Filter Button */}
            {selectedScore !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedScore('all')}
                className="w-full text-center text-xs font-semibold text-amber-900 underline hover:text-amber-950"
              >
                Mostrar todas las reseñas
              </button>
            )}
          </div>

          {/* Reviews List (Right) */}
          <div className="space-y-4">
            {/* Filter tags summary */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-amber-900/70">
              <span className="font-semibold text-amber-950">Filtrar:</span>
              {['all', '5', '4', '3', '2', '1'].map((score) => {
                const isSelected = selectedScore === score
                const label = score === 'all' ? 'Todas' : `${score} ★`
                return (
                  <button
                    key={score}
                    type="button"
                    onClick={() => setSelectedScore(score)}
                    className={`rounded-full px-3 py-1 font-semibold transition border ${isSelected ? 'bg-amber-900 border-amber-900 text-amber-50' : 'bg-white border-amber-900/20 text-amber-900 hover:bg-amber-50'}`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>

            {/* List */}
            <div className="space-y-4 divide-y divide-amber-900/10">
              {filteredRatings.length ? (
                filteredRatings.map((r, idx) => (
                  <div key={r.id} className={`pt-4 ${idx === 0 ? 'pt-0 border-transparent' : 'border-amber-900/10'}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-950 text-sm">Cliente Verificado</span>
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a.75.75 0 00-.708-.523H4.5a2 2 0 00-2 2v1.077a.75.75 0 00.317.616l4.475 3.197H2.5a.75.75 0 000 1.5h6.293a.75.75 0 00.53-.22l4.5-4.5a.75.75 0 000-1.06l-4.5-4.5a.75.75 0 00-1.06 0l-.824.824a.75.75 0 101.06 1.06L9.5 7.197h2.09l-4.475-3.197A.75.75 0 006.267 3.455zM17.5 10a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z" />
                          </svg>
                          Pedido verificado
                        </span>
                      </div>
                      <span className="text-2xs text-amber-900/50 font-medium">{r.createdAt}</span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 items-center">
                      <RatingStars rating={r.generalRating} size="h-3.5 w-3.5" />
                      <div className="flex flex-wrap gap-2 text-[10px] text-amber-900/60 font-semibold uppercase tracking-wider">
                        {r.productQuality && <span>Calidad: {r.productQuality}★</span>}
                        {r.communication && <span>Trato: {r.communication}★</span>}
                        {r.deliveryTime && <span>Tiempo: {r.deliveryTime}★</span>}
                      </div>
                    </div>

                    {r.comment && (
                      <p className="mt-2 text-sm text-amber-900/90 leading-relaxed font-serif">
                        "{r.comment}"
                      </p>
                    )}

                    {r.images && r.images.length > 0 && (
                      <div className="mt-3 flex gap-2">
                        {r.images.map((imgSrc, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setLightboxImage(imgSrc)}
                            className="overflow-hidden rounded-lg border border-amber-900/10 transition hover:opacity-90"
                          >
                            <img
                              src={imgSrc}
                              alt="Foto de la prenda"
                              className="h-16 w-16 object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-amber-900/60 italic bg-amber-50/10 rounded-2xl border border-dashed border-amber-900/10">
                  No hay reseñas para la puntuación seleccionada.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/85 p-4">
          <div className="relative max-w-2xl bg-white p-2 rounded-2xl">
            <button
              type="button"
              onClick={() => setLightboxImage('')}
              className="absolute -right-3 -top-3 rounded-full bg-red-600 text-white p-1.5 shadow-lg border border-white hover:bg-red-700"
              aria-label="Cerrar vista grande"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img src={lightboxImage} alt="Foto ampliada" className="max-h-[80vh] rounded-xl object-contain max-w-full" />
          </div>
        </div>
      )}
    </div>
  )
}
