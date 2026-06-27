import { useMemo, useState } from 'react'
import {
  filterManufacturers,
  garmentTypesOf,
  scoreManufacturer,
} from '../../lib/manufacturerQueries'

const emptyFilters = {
  query: '',
  garmentType: '',
  style: '',
  location: '',
  capability: '',
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b))
}

export default function ManufacturersSection({
  manufacturers,
  currentUser,
  onOpenShowcase,
}) {
  const [filters, setFilters] = useState(emptyFilters)

  // Opciones de filtro derivadas de los propios fabricantes (HU-06).
  const filterOptions = useMemo(() => {
    const garmentTypes = []
    const styles = []
    const locations = []
    const capabilities = []

    manufacturers.forEach((manufacturer) => {
      garmentTypes.push(...garmentTypesOf(manufacturer))
      styles.push(...(manufacturer.styles ?? []))
      capabilities.push(...(manufacturer.services ?? []))
      if (manufacturer.location) locations.push(manufacturer.location)
    })

    return {
      garmentTypes: uniqueSorted(garmentTypes),
      styles: uniqueSorted(styles),
      locations: uniqueSorted(locations),
      capabilities: uniqueSorted(capabilities),
    }
  }, [manufacturers])

  // Resultados recalculados en tiempo real al combinar uno o más filtros.
  const results = useMemo(() => {
    const filtered = filterManufacturers(manufacturers, filters)
    const preferences = currentUser?.preferences ?? {}
    const hasPreferences =
      (preferences.garmentTypes ?? []).length > 0 ||
      (preferences.styles ?? []).length > 0

    if (!hasPreferences) return filtered

    return [...filtered].sort((a, b) => {
      const scoreA = scoreManufacturer(a, preferences).score
      const scoreB = scoreManufacturer(b, preferences).score

      if (scoreA !== scoreB) return scoreB - scoreA

      return a.businessName.localeCompare(b.businessName)
    })
  }, [manufacturers, filters, currentUser])

  const setFilter = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const activeFilters = Object.values(filters).filter((value) => value !== '').length
  const clearFilters = () => setFilters(emptyFilters)

  return (
    <section className="rounded-3xl border border-amber-900/10 bg-white/85 p-5 md:p-6">
      <div className="mb-4 flex flex-col gap-1">
        <h2 className="font-serif text-2xl text-amber-950">Buscar fabricantes</h2>
        <p className="text-sm text-amber-900/80">
          Filtra por tipo de prenda, estilo, ubicación y capacidades. Puedes combinar
          varios filtros a la vez.
        </p>
      </div>

      <div className="mb-4 grid gap-3 rounded-2xl border border-amber-900/10 bg-amber-50/50 p-4 md:grid-cols-2 lg:grid-cols-3">
        <label className="grid gap-1 text-sm text-amber-900 lg:col-span-3">
          Búsqueda libre
          <input
            type="text"
            value={filters.query}
            onChange={(event) => setFilter('query', event.target.value)}
            placeholder="Nombre, especialidad o palabra clave"
            aria-label="Búsqueda libre"
            className="rounded-xl border border-amber-900/20 bg-white px-3 py-2 outline-none transition focus:border-amber-700"
          />
        </label>

        <label className="grid gap-1 text-sm text-amber-900">
          Tipo de prenda
          <select
            value={filters.garmentType}
            onChange={(event) => setFilter('garmentType', event.target.value)}
            aria-label="Tipo de prenda"
            className="rounded-xl border border-amber-900/20 bg-white px-3 py-2"
          >
            <option value="">Todos</option>
            {filterOptions.garmentTypes.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm text-amber-900">
          Estilo
          <select
            value={filters.style}
            onChange={(event) => setFilter('style', event.target.value)}
            aria-label="Estilo"
            className="rounded-xl border border-amber-900/20 bg-white px-3 py-2"
          >
            <option value="">Todos</option>
            {filterOptions.styles.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm text-amber-900">
          Ubicación
          <select
            value={filters.location}
            onChange={(event) => setFilter('location', event.target.value)}
            aria-label="Ubicación"
            className="rounded-xl border border-amber-900/20 bg-white px-3 py-2"
          >
            <option value="">Todas</option>
            {filterOptions.locations.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm text-amber-900">
          Capacidad / servicio
          <select
            value={filters.capability}
            onChange={(event) => setFilter('capability', event.target.value)}
            aria-label="Capacidad o servicio"
            className="rounded-xl border border-amber-900/20 bg-white px-3 py-2"
          >
            <option value="">Todas</option>
            {filterOptions.capabilities.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end">
          <button
            type="button"
            onClick={clearFilters}
            disabled={!activeFilters}
            className="w-full rounded-xl border border-amber-900/20 bg-white px-3 py-2 text-sm font-semibold text-amber-900 transition enabled:hover:bg-amber-100 disabled:opacity-50"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      <p className="mb-3 text-sm text-amber-900/80">
        {results.length} fabricante{results.length === 1 ? '' : 's'} encontrado
        {results.length === 1 ? '' : 's'}
        {activeFilters ? ` · ${activeFilters} filtro${activeFilters === 1 ? '' : 's'} activo${activeFilters === 1 ? '' : 's'}` : ''}
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        {results.map((showcase) => (
          <article
            key={showcase.id}
            className="grid gap-3 rounded-2xl border border-amber-900/10 bg-amber-50/50 p-4"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-amber-950">{showcase.businessName}</h3>
                {showcase.location ? (
                  <span className="rounded-full bg-amber-900/10 px-2 py-0.5 text-xs text-amber-900">
                    {showcase.location}
                  </span>
                ) : null}
              </div>
              <p className="text-sm text-amber-900/80">{showcase.specialty}</p>
            </div>
            <p className="line-clamp-2 text-sm text-amber-900/80">{showcase.description}</p>

            {garmentTypesOf(showcase).length ? (
              <div className="flex flex-wrap gap-2">
                {garmentTypesOf(showcase).map((type) => (
                  <span
                    key={`${showcase.id}-type-${type}`}
                    className="rounded-full border border-amber-700/30 bg-amber-100 px-3 py-1 text-xs text-amber-900"
                  >
                    {type}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {(showcase.styles ?? []).slice(0, 3).map((style) => (
                <span
                  key={`${showcase.id}-style-${style}`}
                  className="rounded-full border border-amber-900/20 bg-white px-3 py-1 text-xs text-amber-900"
                >
                  {style}
                </span>
              ))}
              {(showcase.services ?? []).slice(0, 2).map((service) => (
                <span
                  key={`${showcase.id}-svc-${service}`}
                  className="rounded-full border border-amber-900/20 bg-white px-3 py-1 text-xs text-amber-900"
                >
                  {service}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-2">
              {(showcase.gallery ?? []).slice(0, 1).map((image, index) => (
                <img
                  key={`${showcase.id}-img-${index}`}
                  src={image}
                  alt={`${showcase.businessName} muestra ${index + 1}`}
                  className="h-40 w-full rounded-xl object-cover"
                />
              ))}
              {!(showcase.gallery ?? []).length ? (
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

      {!results.length ? (
        <p className="mt-4 rounded-xl bg-amber-100 px-4 py-3 text-sm text-amber-900">
          Ningún fabricante coincide con los filtros seleccionados.
        </p>
      ) : null}
    </section>
  )
}
