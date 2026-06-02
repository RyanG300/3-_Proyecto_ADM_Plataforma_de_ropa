export default function ManufacturersSection({ manufacturers, onOpenShowcase }) {
  return (
    <section className="rounded-3xl border border-amber-900/10 bg-white/85 p-5 md:p-6">
      <h2 className="font-serif text-2xl text-amber-950">Escaparates de fabricantes</h2>
      <p className="mb-4 text-sm text-amber-900/80">
        Vista previa de cada fabricante. Haz click para ver el escaparate completo.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        {manufacturers.map((showcase) => (
          <article
            key={showcase.id}
            className="grid gap-3 rounded-2xl border border-amber-900/10 bg-amber-50/50 p-4"
          >
            <div>
              <h3 className="font-semibold text-amber-950">{showcase.businessName}</h3>
              <p className="text-sm text-amber-900/80">{showcase.specialty}</p>
            </div>
            <p className="line-clamp-2 text-sm text-amber-900/80">{showcase.description}</p>
            <div className="flex flex-wrap gap-2">
              {showcase.services.slice(0, 3).map((service) => (
                <span
                  key={service}
                  className="rounded-full border border-amber-900/20 bg-white px-3 py-1 text-xs text-amber-900"
                >
                  {service}
                </span>
              ))}
              {!showcase.services.length ? (
                <span className="rounded-full border border-amber-900/20 bg-white px-3 py-1 text-xs text-amber-900">
                  Sin servicios registrados
                </span>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-2">
              {showcase.gallery.slice(0, 1).map((image, index) => (
                <img
                  key={`${showcase.id}-img-${index}`}
                  src={image}
                  alt={`${showcase.businessName} muestra ${index + 1}`}
                  className="h-40 w-full rounded-xl object-cover"
                />
              ))}
              {!showcase.gallery.length ? (
                <div className="rounded-xl border border-dashed border-amber-900/30 px-3 py-8 text-center text-sm text-amber-900/75">
                  Este fabricante aún no sube muestras.
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => onOpenShowcase(showcase.id)}
              className="justify-self-start rounded-xl bg-amber-900 px-4 py-2 text-sm font-semibold text-amber-50 transition hover:bg-amber-800"
            >
              Ver escaparate completo
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}
