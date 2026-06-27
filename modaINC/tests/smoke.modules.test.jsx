import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import AdminPanel from '../src/components/admin/AdminPanel'
import FabricantePanel from '../src/components/manufacturer/FabricantePanel'
import ShowcasePage from '../src/pages/ShowcasePage'
import { filterManufacturers, suggestManufacturers } from '../src/lib/manufacturerQueries'

// Tests breves y directos, uno por módulo/historia de usuario, pensados como
// evidencia de CI/CD: corren automáticamente en cada push a main vía
// .github/workflows/test_and_build.yaml

describe('Smoke tests por módulo (Sprint 1-3)', () => {
  // HU-01 / HU-02: Gestión de usuarios — ya cubierto a fondo en
  // appContext.userStories.test.jsx y auth.userStories.test.jsx.

  // HU-03: Administración de usuarios (módulo admin, vista UI)
  it('HU-03: el panel de administración se renderiza con sus controles principales', () => {
    render(
      <AdminPanel
        currentUser={{ id: 'u-admin-root', role: 'admin', isPrincipal: true }}
        users={[
          { id: 'u-admin-root', name: 'Admin', email: 'admin', role: 'admin', isPrincipal: true, active: true },
        ]}
        showcases={[]}
        auditLog={[]}
        updateUser={vi.fn()}
        deleteUser={vi.fn()}
        updateShowcase={vi.fn()}
        createAdminByPrincipal={vi.fn(() => ({ ok: true, message: 'ok' }))}
      />,
    )

    expect(screen.getByText('Panel de administración')).toBeInTheDocument()
  })

  // HU-04: Gestión del escaparate por el fabricante
  it('HU-04: el fabricante puede agregar un servicio a su escaparate', async () => {
    const user = userEvent.setup()
    const updateShowcase = vi.fn()
    const showcase = {
      id: 's-ana',
      manufacturerId: 'u-fab-ana',
      businessName: 'Ana Costuras',
      specialty: 'Vestidos',
      description: 'Demo',
      services: [],
      gallery: [],
      published: true,
      designs: [],
    }

    render(
      <FabricantePanel
        currentUser={{ id: 'u-fab-ana' }}
        showcases={[showcase]}
        updateShowcase={updateShowcase}
      />,
    )

    const input = screen.getByPlaceholderText('Agregar servicio')
    await user.type(input, 'Disfraces a medida')

    const addButton = input.closest('div').querySelector('button')
    await user.click(addButton)

    expect(updateShowcase).toHaveBeenCalledWith('s-ana', {
      services: ['Disfraces a medida'],
    })
  })

  // HU-05: Exploración del catálogo / escaparate público
  it('HU-05: la página de escaparate muestra los diseños del fabricante', () => {
    const showcase = {
      id: 's-ana',
      businessName: 'Ana Costuras',
      specialty: 'Vestidos de gala',
      description: 'Confección artesanal',
      services: ['Vestidos de gala'],
      gallery: [],
      designs: [
        { id: 'd-1', name: 'Vestido Aurora', type: 'Vestido', basePrice: 120, image: '' },
      ],
    }

    render(<ShowcasePage showcase={showcase} onBack={vi.fn()} />)

    expect(screen.getByText('Ana Costuras')).toBeInTheDocument()
    expect(screen.getByText('Vestido Aurora')).toBeInTheDocument()
  })

  // HU-06: Búsqueda y filtrado de fabricantes (capa de lógica)
  it('HU-06: filterManufacturers devuelve solo los fabricantes que cumplen el filtro', () => {
    const manufacturers = [
      { id: 's-1', businessName: 'Ana Costuras', location: 'San José', styles: [], services: [], designs: [] },
      { id: 's-2', businessName: 'Carlos Atelier', location: 'Cartago', styles: [], services: [], designs: [] },
    ]

    const result = filterManufacturers(manufacturers, { location: 'Cartago' })

    expect(result).toHaveLength(1)
    expect(result[0].businessName).toBe('Carlos Atelier')
  })

  // HU-07: Sugerencias personalizadas (capa de lógica)
  it('HU-07: suggestManufacturers no sugiere nada si el cliente no tiene preferencias', () => {
    const manufacturers = [
      { id: 's-1', businessName: 'Ana Costuras', styles: ['Elegante'], designs: [] },
    ]

    expect(suggestManufacturers(manufacturers, {})).toEqual([])
  })

  // HU-08: Registro de medidas corporales — cubierto a fondo en
  // measures.userStories.test.jsx (formulario + contexto).

  // HU-09: Personalización de prendas — cubierto a fondo en
  // customization.userStories.test.jsx (UI + generación de pedido).
})
