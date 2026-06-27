// Lógica reutilizable y testeable para el Sprint 3.
// HU-06: búsqueda y filtrado de fabricantes.
// HU-07: sugerencias personalizadas según las preferencias del cliente.

function normalizeText(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

// Lista de tipos de prenda que ofrece un fabricante, derivada de sus diseños.
export function garmentTypesOf(manufacturer) {
  const types = (manufacturer.designs ?? []).map((design) => design.type)
  return [...new Set(types.filter(Boolean))]
}

// HU-06: aplica uno o más filtros simultáneamente. Cada filtro vacío se ignora,
// de modo que se pueden combinar libremente y los resultados se recalculan en
// tiempo real desde el componente.
export function filterManufacturers(manufacturers, filters = {}) {
  const query = normalizeText(filters.query)
  const garmentType = normalizeText(filters.garmentType)
  const style = normalizeText(filters.style)
  const location = normalizeText(filters.location)
  const capability = normalizeText(filters.capability)

  return manufacturers.filter((manufacturer) => {
    const types = garmentTypesOf(manufacturer).map(normalizeText)
    const styles = (manufacturer.styles ?? []).map(normalizeText)
    const services = (manufacturer.services ?? []).map(normalizeText)

    if (garmentType && !types.some((type) => type.includes(garmentType))) {
      return false
    }

    if (style && !styles.some((item) => item.includes(style))) {
      return false
    }

    if (location && !normalizeText(manufacturer.location).includes(location)) {
      return false
    }

    if (capability && !services.some((service) => service.includes(capability))) {
      return false
    }

    if (query) {
      const haystack = [
        manufacturer.businessName,
        manufacturer.specialty,
        manufacturer.description,
        manufacturer.location,
        ...(manufacturer.styles ?? []),
        ...(manufacturer.services ?? []),
        ...garmentTypesOf(manufacturer),
      ]
        .map(normalizeText)
        .join(' ')

      if (!haystack.includes(query)) {
        return false
      }
    }

    return true
  })
}

// HU-07: calcula un puntaje de afinidad entre un fabricante y las preferencias
// del cliente (tipos de prenda y estilos preferidos).
export function scoreManufacturer(manufacturer, preferences = {}) {
  const preferredTypes = (preferences.garmentTypes ?? []).map(normalizeText)
  const preferredStyles = (preferences.styles ?? []).map(normalizeText)

  const types = garmentTypesOf(manufacturer).map(normalizeText)
  const styles = (manufacturer.styles ?? []).map(normalizeText)

  let score = 0
  const reasons = []

  preferredTypes.forEach((preferred) => {
    if (types.some((type) => type.includes(preferred) || preferred.includes(type))) {
      score += 2
      reasons.push(`Confecciona ${preferred}`)
    }
  })

  preferredStyles.forEach((preferred) => {
    if (styles.some((style) => style.includes(preferred) || preferred.includes(style))) {
      score += 1
      reasons.push(`Estilo ${preferred}`)
    }
  })

  return { score, reasons }
}

// HU-07: devuelve los fabricantes sugeridos ordenados por afinidad. Si el
// cliente no tiene preferencias, no se fuerza ninguna sugerencia.
export function suggestManufacturers(manufacturers, preferences = {}, limit = 3) {
  const hasPreferences =
    (preferences.garmentTypes ?? []).length > 0 ||
    (preferences.styles ?? []).length > 0

  if (!hasPreferences) return []

  return manufacturers
    .map((manufacturer) => ({
      manufacturer,
      ...scoreManufacturer(manufacturer, preferences),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}
