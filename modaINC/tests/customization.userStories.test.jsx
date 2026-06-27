import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AppProvider, useAppContext } from '../src/context/AppContext'
import CustomizerDemo from '../src/components/customization/CustomizerDemo'

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

const catalog = [
  {
    id: 'd-ana-1',
    name: 'Vestido Aurora',
    type: 'Vestido',
    basePrice: 120,
    manufacturerId: 'u-fab-ana',
    manufacturerName: 'Ana Costuras',
    modificationSessions: ['General'],
    modifications: [
      { id: 'm1', name: 'Tejido Satén Premium', extraCost: 25, section: 'General' },
      { id: 'm2', name: 'Estilo Sirena', extraCost: 18, section: 'General' },
    ],
  },
]

describe('HU-09: personalización de prendas', () => {
  it('muestra únicamente las opciones habilitadas por el fabricante y resume la selección', async () => {
    const user = userEvent.setup()
    const onCreateOrder = vi.fn(() => ({ ok: true, message: 'Pedido generado correctamente.' }))

    render(
      <CustomizerDemo
        catalog={catalog}
        currentUser={{ id: 'u-cli-lucia', measures: { pecho: 90 } }}
        onCreateOrder={onCreateOrder}
      />,
    )

    // Solo aparecen las modificaciones del diseño seleccionado.
    expect(screen.getByLabelText('Tejido Satén Premium')).toBeInTheDocument()
    expect(screen.getByLabelText('Estilo Sirena')).toBeInTheDocument()

    // Al elegir una opción se refleja en el resumen y el precio estimado.
    await user.click(screen.getByLabelText('Tejido Satén Premium'))
    expect(screen.getByText(/Precio estimado: \$145\.00/)).toBeInTheDocument()

    // Genera el pedido con las personalizaciones elegidas.
    await user.click(screen.getByRole('button', { name: 'Generar pedido' }))
    expect(onCreateOrder).toHaveBeenCalledTimes(1)
    const payload = onCreateOrder.mock.calls[0][0]
    expect(payload.design.id).toBe('d-ana-1')
    expect(payload.selectedModifications.map((item) => item.id)).toEqual(['m1'])
  })

  it('createOrder registra las personalizaciones y vincula las medidas guardadas (HU-08)', () => {
    renderProvider()

    act(() => {
      contextSnapshot.updateMeasures('u-cli-lucia', { pecho: 91, cintura: 72 })
    })

    let result
    act(() => {
      result = contextSnapshot.createOrder({
        clientId: 'u-cli-lucia',
        design: catalog[0],
        selectedModifications: [catalog[0].modifications[0]],
      })
    })

    expect(result.ok).toBe(true)
    expect(result.order.modifications).toHaveLength(1)
    expect(result.order.total).toBe(145)
    expect(result.order.measures.pecho).toBe(91)
    expect(contextSnapshot.orders.some((order) => order.id === result.order.id)).toBe(true)
  })
})
