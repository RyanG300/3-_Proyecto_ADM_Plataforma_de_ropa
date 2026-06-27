import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AppProvider, useAppContext } from '../src/context/AppContext'
import FabricantePanel from '../src/components/manufacturer/FabricantePanel'
import { filterManufacturers, suggestManufacturers } from '../src/lib/manufacturerQueries'

let contextSnapshot

function ContextProbe() {
  contextSnapshot = useAppContext()
  return null
}

function renderProvider() {
  render(
    <AppProvider>
      <ContextProbe />
    </AppProvider>,
  )
}

describe('HU-04: el fabricante puede declarar ubicación y estilos en su escaparate', () => {
  it('FabricantePanel permite elegir la ubicación y marcar los estilos que confecciona', async () => {
    const user = userEvent.setup()
    const updateShowcase = vi.fn()
    const showcase = {
      id: 's-ana',
      manufacturerId: 'u-fab-ana',
      businessName: 'Ana Costuras',
      specialty: 'Vestidos',
      description: 'Demo',
      location: '',
      styles: [],
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

    await user.selectOptions(screen.getByLabelText('Ubicación del escaparate'), 'San José')
    expect(updateShowcase).toHaveBeenCalledWith('s-ana', { location: 'San José' })

    await user.click(screen.getByLabelText('Elegante'))
    expect(updateShowcase).toHaveBeenCalledWith('s-ana', { styles: ['Elegante'] })
  })

  it('un escaparate nuevo (recién registrado) nace con location y styles definidos', () => {
    renderProvider()

    act(() => {
      contextSnapshot.register({
        name: 'Nuevo Fabricante',
        email: 'nuevo-fabricante@modainc.com',
        password: '123456',
        role: 'fabricante',
      })
    })

    const showcase = contextSnapshot.showcases.find(
      (item) => item.businessName === 'Nuevo Fabricante',
    )

    expect(showcase.location).toBe('')
    expect(showcase.styles).toEqual([])
  })

  it('la ubicación y los estilos que declara el fabricante alimentan el filtro y las sugerencias del cliente', () => {
    renderProvider()

    act(() => {
      contextSnapshot.register({
        name: 'Disfraces del Valle',
        email: 'disfraces-valle@modainc.com',
        password: '123456',
        role: 'fabricante',
      })
    })

    const showcase = contextSnapshot.showcases.find(
      (item) => item.businessName === 'Disfraces del Valle',
    )

    act(() => {
      contextSnapshot.updateShowcase(showcase.id, {
        location: 'Heredia',
        styles: ['Fantasía'],
      })
    })

    const updatedManufacturer = contextSnapshot.manufacturers.find(
      (item) => item.id === showcase.id,
    )

    // HU-06: ahora se puede encontrar por la ubicación que declaró.
    const found = filterManufacturers(contextSnapshot.manufacturers, {
      location: 'Heredia',
    })
    expect(found.some((item) => item.id === showcase.id)).toBe(true)

    // HU-07: ahora puede ser sugerido a un cliente que prefiere ese estilo.
    const suggestions = suggestManufacturers(contextSnapshot.manufacturers, {
      styles: ['Fantasía'],
    })
    expect(suggestions.some((entry) => entry.manufacturer.id === updatedManufacturer.id)).toBe(
      true,
    )
  })
})
