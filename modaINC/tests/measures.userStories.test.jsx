import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AppProvider, useAppContext } from '../src/context/AppContext'
import MeasuresCard from '../src/components/customer/MeasuresCard'

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

describe('HU-08: registro de medidas corporales', () => {
  it('el contexto guarda y actualiza las medidas asociadas al perfil del cliente', () => {
    renderProvider()

    let result
    act(() => {
      result = contextSnapshot.updateMeasures('u-cli-lucia', {
        pecho: 88,
        cintura: 70,
        cadera: 94,
      })
    })

    expect(result.ok).toBe(true)
    const lucia = contextSnapshot.users.find((user) => user.id === 'u-cli-lucia')
    expect(lucia.measures.pecho).toBe(88)
    expect(lucia.measures.cintura).toBe(70)
    expect(
      contextSnapshot.auditLog.some((entry) => entry.includes('Medidas corporales actualizadas')),
    ).toBe(true)
  })

  it('valida que todos los campos obligatorios estén completos antes de guardar', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn(() => ({ ok: true }))
    render(<MeasuresCard currentUser={{ id: 'u-cli-lucia', measures: {} }} onSave={onSave} />)

    // Con campos vacíos, no debe enviarse y muestra error.
    await user.click(screen.getByRole('button', { name: 'Guardar medidas' }))
    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByText(/Completa todas las medidas/i)).toBeInTheDocument()
  })

  it('guarda cuando todas las medidas son válidas', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn(() => ({ ok: true }))
    render(
      <MeasuresCard
        currentUser={{
          id: 'u-cli-lucia',
          measures: { pecho: 90, cintura: 74, cadera: 96, largo: 110, hombros: 40, manga: 60 },
        }}
        onSave={onSave}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Guardar medidas' }))
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave.mock.calls[0][0]).toMatchObject({ pecho: 90, cintura: 74 })
    expect(screen.getByText(/Medidas guardadas/i)).toBeInTheDocument()
  })
})
