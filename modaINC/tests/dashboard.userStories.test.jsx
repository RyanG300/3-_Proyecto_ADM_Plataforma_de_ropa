import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import DashboardPage from '../src/pages/DashboardPage'

const baseProps = {
  users: [],
  showcases: [
    {
      id: 's-ana',
      manufacturerId: 'u-fab-ana',
      businessName: 'Ana Costuras',
      specialty: 'Pruebas',
      description: 'Escaparate de prueba',
      services: [],
      gallery: [],
      published: true,
      designs: [],
    },
  ],
  catalog: [],
  auditLog: [],
  updateUser: vi.fn(),
  deleteUser: vi.fn(() => ({ ok: true, message: 'ok' })),
  updateShowcase: vi.fn(),
  createAdminByPrincipal: vi.fn(() => ({ ok: true, message: 'ok' })),
}

describe('HU-02: acceso según rol en dashboard', () => {
  it('muestra aviso cuando no hay sesión activa', () => {
    render(<DashboardPage {...baseProps} currentUser={null} />)

    expect(screen.getByText(/Debes iniciar sesión/i)).toBeInTheDocument()
  })

  it('renderiza panel de administrador, fabricante y cliente según rol', () => {
    const { rerender } = render(
      <DashboardPage
        {...baseProps}
        currentUser={{ id: 'u-admin-root', role: 'admin', isPrincipal: true }}
      />,
    )
    expect(screen.getByText('Panel de administración')).toBeInTheDocument()

    rerender(
      <DashboardPage
        {...baseProps}
        currentUser={{ id: 'u-fab-ana', role: 'fabricante', isPrincipal: false }}
      />,
    )
    expect(screen.getByText('Mi escaparate')).toBeInTheDocument()

    rerender(
      <DashboardPage
        {...baseProps}
        currentUser={{ id: 'u-cli-lucia', role: 'cliente', name: 'Lucía', isPrincipal: false }}
      />,
    )
    expect(screen.getByText('Panel de cliente')).toBeInTheDocument()
  })
})
