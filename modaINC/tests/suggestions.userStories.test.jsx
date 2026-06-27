import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AppProvider, useAppContext } from '../src/context/AppContext'
import SuggestedManufacturers from '../src/components/manufacturer/SuggestedManufacturers'
import { suggestManufacturers } from '../src/lib/manufacturerQueries'

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

const manufacturers = [
  {
    id: 's-ana',
    businessName: 'Ana Costuras',
    styles: ['Elegante', 'Fantasía'],
    designs: [{ id: 'd1', type: 'Vestido' }],
  },
  {
    id: 's-carlos',
    businessName: 'Carlos Atelier',
    styles: ['Formal'],
    designs: [{ id: 'd2', type: 'Traje' }],
  },
]

describe('HU-07: sugerencias personalizadas de fabricantes', () => {
  it('suggestManufacturers ordena por afinidad y respeta la ausencia de preferencias', () => {
    const suggestions = suggestManufacturers(manufacturers, {
      garmentTypes: ['Vestido'],
      styles: ['Elegante'],
    })

    expect(suggestions).toHaveLength(1)
    expect(suggestions[0].manufacturer.businessName).toBe('Ana Costuras')
    expect(suggestions[0].score).toBeGreaterThan(0)

    // Sin preferencias no se fuerza ninguna sugerencia.
    expect(suggestManufacturers(manufacturers, {})).toHaveLength(0)
  })

  it('el contexto expone sugerencias para el cliente con sesión activa', () => {
    renderProvider()

    act(() => {
      contextSnapshot.login({ email: 'lucia@modainc.com', password: '123456' })
    })

    // Lucía prefiere Vestido / Elegante -> Ana Costuras debe sugerirse.
    expect(contextSnapshot.suggestedManufacturers.length).toBeGreaterThan(0)
    expect(
      contextSnapshot.suggestedManufacturers[0].manufacturer.businessName,
    ).toBe('Ana Costuras')
  })

  it('el cliente puede ignorar las sugerencias y seguir buscando manualmente', async () => {
    const user = userEvent.setup()
    const suggestions = [
      { manufacturer: manufacturers[0], score: 3, reasons: ['Confecciona vestido'] },
    ]
    render(
      <SuggestedManufacturers suggestions={suggestions} onOpenShowcase={vi.fn()} />,
    )

    expect(screen.getByText('Sugerencias para ti')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Ignorar sugerencias' }))
    expect(screen.queryByText('Sugerencias para ti')).not.toBeInTheDocument()
  })
})
