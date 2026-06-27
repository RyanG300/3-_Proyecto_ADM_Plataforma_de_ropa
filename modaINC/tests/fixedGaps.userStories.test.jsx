import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AppProvider, useAppContext } from '../src/context/AppContext'
import PreferencesCard from '../src/components/customer/PreferencesCard'
import FabricantePanel from '../src/components/manufacturer/FabricantePanel'
import ReceivedOrders from '../src/components/manufacturer/ReceivedOrders'

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

describe('HU-07: el cliente puede definir sus propias preferencias desde la UI', () => {
  it('PreferencesCard envía los tipos de prenda y estilos marcados al guardar', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()

    render(<PreferencesCard currentUser={{ id: 'u-x', preferences: {} }} onSave={onSave} />)

    await user.click(screen.getByLabelText('Vestido'))
    await user.click(screen.getByLabelText('Elegante'))
    await user.click(screen.getByRole('button', { name: 'Guardar preferencias' }))

    expect(onSave).toHaveBeenCalledWith({
      garmentTypes: ['Vestido'],
      styles: ['Elegante'],
    })
    expect(screen.getByText(/Preferencias guardadas/i)).toBeInTheDocument()
  })

  it('un cliente sin preferencias previas no recibe sugerencias hasta que las define', () => {
    renderProvider()

    act(() => {
      contextSnapshot.register({
        name: 'Cliente Nuevo',
        email: 'nuevo-cliente@modainc.com',
        password: '123456',
        role: 'cliente',
      })
    })

    act(() => {
      contextSnapshot.login({ email: 'nuevo-cliente@modainc.com', password: '123456' })
    })

    // Sin preferencias, no hay sugerencias forzadas.
    expect(contextSnapshot.suggestedManufacturers).toHaveLength(0)

    const clientId = contextSnapshot.currentUser.id

    act(() => {
      contextSnapshot.updatePreferences(clientId, {
        garmentTypes: ['Vestido'],
        styles: ['Elegante'],
      })
    })

    // El contexto se actualiza con las nuevas preferencias y ahora sí sugiere.
    expect(contextSnapshot.currentUser.preferences.garmentTypes).toEqual(['Vestido'])
    expect(contextSnapshot.suggestedManufacturers.length).toBeGreaterThan(0)
  })
})

describe('HU-08 / HU-09: el fabricante visualiza los pedidos recibidos', () => {
  it('ReceivedOrders muestra personalizaciones y medidas vinculadas de cada pedido', () => {
    const orders = [
      {
        id: 'o-1',
        clientName: 'Lucía Méndez',
        designName: 'Vestido Aurora',
        createdAt: '23/06/26',
        status: 'recibido',
        total: 145,
        modifications: [{ id: 'm1', name: 'Tejido Satén Premium', extraCost: 25 }],
        measures: { pecho: 90, cintura: 74 },
      },
    ]

    render(<ReceivedOrders orders={orders} />)

    expect(screen.getByText('Vestido Aurora')).toBeInTheDocument()
    expect(screen.getByText('Tejido Satén Premium')).toBeInTheDocument()
    expect(screen.getByText('pecho')).toBeInTheDocument()
    expect(screen.getByText('90')).toBeInTheDocument()
  })

  it('FabricantePanel solo muestra los pedidos dirigidos a ese fabricante', () => {
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

    const orders = [
      {
        id: 'o-1',
        manufacturerId: 'u-fab-ana',
        clientName: 'Lucía Méndez',
        designName: 'Vestido Aurora',
        createdAt: '23/06/26',
        status: 'recibido',
        total: 120,
        modifications: [],
        measures: {},
      },
      {
        id: 'o-2',
        manufacturerId: 'u-fab-carlos',
        clientName: 'Otro Cliente',
        designName: 'Traje Ejecutivo',
        createdAt: '23/06/26',
        status: 'recibido',
        total: 180,
        modifications: [],
        measures: {},
      },
    ]

    render(
      <FabricantePanel
        currentUser={{ id: 'u-fab-ana' }}
        showcases={[showcase]}
        orders={orders}
        updateShowcase={vi.fn()}
      />,
    )

    expect(screen.getByText('Vestido Aurora')).toBeInTheDocument()
    expect(screen.queryByText('Traje Ejecutivo')).not.toBeInTheDocument()
  })

  it('createOrder en el contexto queda visible para el fabricante correspondiente', () => {
    renderProvider()

    act(() => {
      contextSnapshot.updateMeasures('u-cli-lucia', { pecho: 90, cintura: 74 })
    })

    let result
    act(() => {
      result = contextSnapshot.createOrder({
        clientId: 'u-cli-lucia',
        design: {
          id: 'd-ana-1',
          name: 'Vestido Aurora',
          basePrice: 120,
          manufacturerId: 'u-fab-ana',
          manufacturerName: 'Ana Costuras',
        },
        selectedModifications: [],
      })
    })

    expect(result.ok).toBe(true)

    const ordersForAna = contextSnapshot.orders.filter(
      (order) => order.manufacturerId === 'u-fab-ana',
    )
    expect(ordersForAna).toHaveLength(1)
    expect(ordersForAna[0].measures.pecho).toBe(90)
  })
})
