import { useMemo, useState } from 'react'
import { useAppContext } from '../context/AppContext'
import ManufacturerRatings from '../components/sprint5/ManufacturerRatings'

export default function ShowcasePage({
  showcase,
  currentUser,
  onBack,
  onGoLogin,
  onCustomizeDesign,
}) {
  let ratings = []
  try {
    const context = useAppContext()
    ratings = context.ratings ?? []
  } catch {
    // Fallback for tests running ShowcasePage standalone
  }
  const [selectedDesignId, setSelectedDesignId] = useState(null)

  const selectedDesign = useMemo(() => {
    if (!showcase || !selectedDesignId) return null
    return showcase.designs.find((design) => design.id === selectedDesignId) ?? null
  }, [showcase, selectedDesignId])

  const groupedSelectedModifications = useMemo(() => {
    if (!selectedDesign) return []

    const sessions = selectedDesign.modificationSessions ?? ['General']
    return sessions.map((sessionName) => ({
      sessionName,
      items: (selectedDesign.modifications ?? []).filter(
        (item) => (item.section || 'General') === sessionName,
      ),
    }))
  }, [selectedDesign])

  if (!showcase) {
    return (
      <section className="rounded-3xl border border-amber-900/10 bg-white p-6 text-amber-900">
        <p className="font-semibold">No se encontró el escaparate solicitado.</p>
        <button
          type="button"
          onClick={onBack}
          className="mt-4 rounded-xl bg-amber-900 px-4 py-2 text-sm font-semibold text-amber-50"
        >
          Volver al inicio
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
        Volver
      </button>

      <article className="rounded-3xl border border-amber-900/10 bg-white/90 p-6 md:p-8">
        <h1 className="font-serif text-3xl text-amber-950 md:text-4xl">{showcase.businessName}</h1>
        <p className="mt-2 text-sm font-semibold text-amber-900/90">{showcase.specialty}</p>
        <p className="mt-3 text-sm text-amber-900/80 md:text-base">{showcase.description}</p>

        <div className="mt-5 flex flex-wrap gap-2">
          {showcase.services.map((service) => (
            <span
              key={service}
              className="rounded-full border border-amber-900/20 bg-amber-50 px-3 py-1 text-xs text-amber-900"
            >
              {service}
            </span>
          ))}
          {!showcase.services.length ? (
            <span className="rounded-full border border-amber-900/20 bg-amber-50 px-3 py-1 text-xs text-amber-900">
              Sin servicios publicados
            </span>
          ) : null}
        </div>
      </article>

      <article className="rounded-3xl border border-amber-900/10 bg-white/90 p-6 md:p-8">
        <h2 className="font-serif text-2xl text-amber-950">Galería</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {showcase.gallery.map((image, index) => (
            <img
              key={`${showcase.id}-full-${index}`}
              src={image}
              alt={`${showcase.businessName} imagen ${index + 1}`}
              className="h-52 w-full rounded-xl object-cover"
            />
          ))}
          {!showcase.gallery.length ? (
            <p className="sm:col-span-2 lg:col-span-3 text-sm text-amber-900/80">
              Este escaparate aún no tiene imágenes cargadas.
            </p>
          ) : null}
        </div>
      </article>

      <article className="rounded-3xl border border-amber-900/10 bg-white/90 p-6 md:p-8">
        <h2 className="font-serif text-2xl text-amber-950">Diseños disponibles</h2>
        <p className="mt-2 text-sm text-amber-900/75">
          Haz click en la preview de cada prefabricado para abrir su pestaña de imagen y opciones.
        </p>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.95fr]">
          <div className="grid content-start gap-3 md:grid-cols-2">
          {showcase.designs.map((design) => (
            <article
              key={design.id}
              className="rounded-2xl border border-amber-900/10 bg-amber-50/50 p-4 text-left"
            >
              <div className="overflow-hidden rounded-xl border border-amber-900/15 bg-white">
                {design.image ? (
                  <img src={design.image} alt={design.name} className="h-40 w-full object-cover" />
                ) : (
                  <div className="grid h-40 place-items-center text-xs text-amber-900/70">
                    Sin imagen
                  </div>
                )}
              </div>
              <p className="mt-3 text-xs uppercase tracking-wide text-amber-900/75">{design.type}</p>
              <h3 className="mt-1 font-semibold text-amber-950">{design.name}</h3>
              <p className="mt-1 text-sm font-semibold text-amber-900">Desde ${design.basePrice}</p>
              <button
                type="button"
                onClick={() => setSelectedDesignId(design.id)}
                className="mt-3 rounded-xl border border-amber-900/20 bg-white px-3 py-1.5 text-sm font-semibold text-amber-900 transition hover:border-amber-900/35 hover:bg-amber-100"
              >
                Ver detalle
              </button>
            </article>
          ))}

            {!showcase.designs.length ? (
              <p className="text-sm text-amber-900/80">Este fabricante aún no ha agregado diseños.</p>
            ) : null}
          </div>

          <aside className="rounded-2xl border border-amber-900/10 bg-white p-4">
            {selectedDesign ? (
              <div className="grid gap-3">
                <h3 className="font-semibold text-amber-950">Pestaña de imagen: {selectedDesign.name}</h3>
                <div className="overflow-hidden rounded-xl border border-amber-900/15 bg-amber-50/40">
                  {selectedDesign.image ? (
                    <img
                      src={selectedDesign.image}
                      alt={selectedDesign.name}
                      className="h-64 w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-64 place-items-center text-sm text-amber-900/70">
                      Este diseño no tiene imagen.
                    </div>
                  )}
                </div>
                <p className="text-sm text-amber-900/80">Precio base: ${selectedDesign.basePrice}</p>

                {currentUser?.role === 'cliente' ? (
                  <button
                    type="button"
                    onClick={() =>
                      onCustomizeDesign?.({
                        showcaseId: showcase.id,
                        designId: selectedDesign.id,
                      })
                    }
                    className="rounded-xl bg-amber-900 px-4 py-2 text-sm font-semibold text-amber-50 transition hover:bg-amber-800"
                  >
                    Personalizar este diseño
                  </button>
                ) : !currentUser ? (
                  <button
                    type="button"
                    onClick={onGoLogin}
                    className="rounded-xl bg-amber-900 px-4 py-2 text-sm font-semibold text-amber-50 transition hover:bg-amber-800"
                  >
                    Iniciar sesión como cliente
                  </button>
                ) : (
                  <p className="rounded-xl bg-amber-100 px-3 py-2 text-xs text-amber-900/85">
                    Solo las cuentas de cliente pueden personalizar y generar pedidos.
                  </p>
                )}

                <div className="grid gap-2">
                  <p className="text-sm font-semibold text-amber-950">Modificaciones ofrecidas</p>
                  {groupedSelectedModifications.map((group) => (
                    <div key={`${selectedDesign.id}-${group.sessionName}`} className="rounded-xl border border-amber-900/10 bg-amber-50/40 p-3">
                      <p className="text-sm font-semibold text-amber-950">Sesión: {group.sessionName}</p>
                      <div className="mt-2 grid gap-2">
                        {group.items.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-xl border border-amber-900/10 bg-white p-3"
                          >
                            <p className="text-sm font-semibold text-amber-950">{item.name}</p>
                            <p className="text-xs text-amber-900/75">Costo adicional: ${item.extraCost}</p>
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="mt-2 h-24 w-full rounded-lg object-cover"
                              />
                            ) : null}
                          </div>
                        ))}
                        {!group.items.length ? (
                          <p className="text-sm text-amber-900/75">Sin modificaciones en esta sesión.</p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid h-full min-h-56 place-items-center text-center text-sm text-amber-900/75">
                Selecciona un prefabricado para ver su imagen y detalles.
              </div>
            )}
          </aside>
        </div>
      </article>

      <article className="rounded-3xl border border-amber-900/10 bg-white/90 p-6 md:p-8">
        <ManufacturerRatings manufacturerId={showcase.manufacturerId} ratings={ratings} />
      </article>
    </section>
  )
}
