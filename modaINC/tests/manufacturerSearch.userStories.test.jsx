import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ManufacturersSection from '../src/components/manufacturer/ManufacturersSection'
import { filterManufacturers } from '../src/lib/manufacturerQueries'

const manufacturers = [
  {
    id: 's-ana',
    businessName: 'Ana Costuras',
    specialty: 'Vestidos de gala y disfraces',
    location: 'San José',
    styles: ['Elegante', 'Fantasía'],
    services: ['Vestidos de gala', 'Ajustes express'],
    gallery: ['https://example.com/ana.jpg'],
    designs: [{ id: 'd1', type: 'Vestido' }, { id: 'd2', type: 'Disfraz' }],
  },
  {
    id: 's-carlos',
    businessName: 'Carlos Atelier',
    specialty: 'Trajes formales',
    location: 'Cartago',
    styles: ['Formal', 'Clásico'],
    services: ['Trajes a medida', 'Camisas premium'],
    gallery: ['https://example.com/carlos.jpg'],
    designs: [{ id: 'd3', type: 'Traje' }],
  },
]

describe('HU-06: búsqueda y filtrado de fabricantes', () => {
  it('filterManufacturers combina varios filtros simultáneamente', () => {
    expect(filterManufacturers(manufacturers, { garmentType: 'Traje' })).toHaveLength(1)
    expect(filterManufacturers(manufacturers, { location: 'San José' })).toHaveLength(1)

    // Combinación de tipo de prenda + estilo + ubicación.
    const combined = filterManufacturers(manufacturers, {
      garmentType: 'Vestido',
      style: 'Elegante',
      location: 'San José',
    })
    expect(combined).toHaveLength(1)
    expect(combined[0].businessName).toBe('Ana Costuras')

    // Combinación incompatible no devuelve resultados.
    expect(
      filterManufacturers(manufacturers, { garmentType: 'Traje', location: 'San José' }),
    ).toHaveLength(0)

    // La búsqueda libre es insensible a mayúsculas y acentos.
    expect(filterManufacturers(manufacturers, { query: 'TRAJE' })).toHaveLength(1)
  })

  it('actualiza los resultados en tiempo real al cambiar los filtros desde la UI', async () => {
    const user = userEvent.setup()
    const onOpenShowcase = vi.fn()
    render(
      <ManufacturersSection manufacturers={manufacturers} onOpenShowcase={onOpenShowcase} />,
    )

    expect(screen.getByText('Ana Costuras')).toBeInTheDocument()
    expect(screen.getByText('Carlos Atelier')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Tipo de prenda'), 'Traje')

    expect(screen.queryByText('Ana Costuras')).not.toBeInTheDocument()
    expect(screen.getByText('Carlos Atelier')).toBeInTheDocument()

    // Permite abrir el escaparate del fabricante encontrado.
    await user.click(screen.getByRole('button', { name: 'Ver escaparate completo' }))
    expect(onOpenShowcase).toHaveBeenCalledWith('s-carlos')
  })

  it('permite aplicar y limpiar varios filtros desde la interfaz', async () => {
    const user = userEvent.setup()
    render(<ManufacturersSection manufacturers={manufacturers} onOpenShowcase={vi.fn()} />)

    await user.selectOptions(screen.getByLabelText('Estilo'), 'Elegante')
    await user.selectOptions(screen.getByLabelText('Ubicación'), 'San José')
    expect(screen.getByText('Ana Costuras')).toBeInTheDocument()
    expect(screen.queryByText('Carlos Atelier')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    expect(screen.getByText('Ana Costuras')).toBeInTheDocument()
    expect(screen.getByText('Carlos Atelier')).toBeInTheDocument()
  })
})
