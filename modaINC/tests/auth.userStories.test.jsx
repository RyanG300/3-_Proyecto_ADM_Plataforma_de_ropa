import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import AuthCard from '../src/components/auth/AuthCard'

describe('HU-01: registro desde UI de autenticación', () => {
  it('muestra confirmación simulada y envía el rol seleccionado al registrar', async () => {
    const user = userEvent.setup()
    const onLogin = vi.fn()
    const onRegister = vi.fn(() => ({
      ok: true,
      message: 'Cuenta creada exitosamente con rol fabricante.',
    }))

    render(<AuthCard onLogin={onLogin} onRegister={onRegister} />)

    await user.click(screen.getByRole('button', { name: 'Registrarse' }))

    await user.type(screen.getByLabelText('Nombre completo'), 'Fábrica Demo')
    await user.type(screen.getByLabelText('Correo'), 'fabrica@modainc.com')
    await user.type(screen.getByLabelText('Contraseña'), '123456')
    await user.selectOptions(screen.getByLabelText('Rol'), 'fabricante')

    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(onRegister).toHaveBeenCalledWith({
      name: 'Fábrica Demo',
      email: 'fabrica@modainc.com',
      password: '123456',
      role: 'fabricante',
    })

    expect(screen.getByText(/confirmación \(simulada\)/i)).toBeInTheDocument()
    expect(screen.getByText(/rol fabricante/i)).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Administrador' })).not.toBeInTheDocument()
  })
})
