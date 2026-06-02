import { useMemo, useState } from 'react'

export default function CatalogSection({ catalog }) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return catalog

    return catalog.filter((item) => {
      return (
        item.name.toLowerCase().includes(term) ||
        item.type.toLowerCase().includes(term) ||
        item.manufacturerName.toLowerCase().includes(term)
      )
    })
  }, [catalog, search])

  return (
    <section className="rounded-3xl border border-amber-900/10 bg-white/85 p-5 md:p-6">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-serif text-2xl text-amber-950">Catálogo público</h2>
          <p className="text-sm text-amber-900/80">
            Visible sin iniciar sesión. Puedes buscar prendas y fabricantes.
          </p>
        </div>

        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por prenda, tipo o fabricante"
          className="w-full rounded-xl border border-amber-900/20 bg-white px-3 py-2 text-sm outline-none transition focus:border-amber-700 md:max-w-xs"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => (
          <article key={item.id} className="overflow-hidden rounded-2xl border border-amber-900/10 bg-amber-50/50">
            <img src={item.image} alt={item.name} className="h-40 w-full object-cover" />
            <div className="grid gap-2 p-4">
              <p className="text-xs uppercase tracking-wide text-amber-900/70">{item.type}</p>
              <h3 className="font-semibold text-amber-950">{item.name}</h3>
              <p className="line-clamp-2 text-sm text-amber-900/75">{item.description}</p>
              <p className="text-sm text-amber-900/85">
                Fabricante: <span className="font-semibold">{item.manufacturerName}</span>
              </p>
              <p className="text-sm font-semibold text-amber-950">Desde ${item.basePrice}</p>
            </div>
          </article>
        ))}
      </div>

      {!filtered.length ? (
        <p className="mt-4 rounded-xl bg-amber-100 px-4 py-3 text-sm text-amber-900">
          No hay coincidencias para esta búsqueda.
        </p>
      ) : null}
    </section>
  )
}
