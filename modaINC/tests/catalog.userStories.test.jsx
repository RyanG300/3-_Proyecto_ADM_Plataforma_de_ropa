import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import CatalogSection from '../src/components/catalog/CatalogSection'

const catalog = [
  {
    id: 'd-1',
    name: 'Vestido Aurora',
    type: 'Vestido',
    manufacturerName: 'Ana Costuras',
    description: 'Confección para gala y eventos',
    basePrice: 120,
    image: 'https://example.com/vestido.jpg',
  },
  {
    id: 'd-2',
    name: 'Traje Ejecutivo',
    type: 'Traje',
    manufacturerName: 'Carlos Atelier',
    description: 'Traje para eventos corporativos',
    basePrice: 180,
    image: 'https://example.com/traje.jpg',
  },
]

describe('HU-05: exploración de catálogo público', () => {
  it('permite ver prendas y filtrar por nombre/tipo/fabricante sin sesión', async () => {
    const user = userEvent.setup()
    render(<CatalogSection catalog={catalog} />)

    expect(screen.getByText('Catálogo público')).toBeInTheDocument()
    expect(screen.getByText(/Visible sin iniciar sesión/i)).toBeInTheDocument()
    expect(screen.getByText('Vestido Aurora')).toBeInTheDocument()
    expect(screen.getByText('Traje Ejecutivo')).toBeInTheDocument()

    await user.type(
      screen.getByPlaceholderText('Buscar por prenda, tipo o fabricante'),
      'carlos',
    )

    expect(screen.queryByText('Vestido Aurora')).not.toBeInTheDocument()
    expect(screen.getByText('Traje Ejecutivo')).toBeInTheDocument()
    expect(screen.getByText(/Fabricante:/i)).toBeInTheDocument()
  })
})
