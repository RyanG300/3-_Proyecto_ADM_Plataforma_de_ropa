import { act, render } from '@testing-library/react'
import { AppProvider, useAppContext } from '../src/context/AppContext'
import { describe, expect, it } from 'vitest'

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

describe('Historias de usuario en AppContext', () => {
  it('HU-01: registra usuario con rol y bloquea correos duplicados', () => {
    renderProvider()

    let registerResult
    act(() => {
      registerResult = contextSnapshot.register({
        name: 'Nuevo Fabricante',
        email: 'nuevo@modainc.com',
        password: '123456',
        role: 'fabricante',
      })
    })

    expect(registerResult.ok).toBe(true)
    expect(registerResult.user.role).toBe('fabricante')
    expect(registerResult.message).toContain('rol fabricante')
    expect(contextSnapshot.users.some((user) => user.email === 'nuevo@modainc.com')).toBe(true)
    expect(
      contextSnapshot.showcases.some(
        (showcase) => showcase.manufacturerId === registerResult.user.id,
      ),
    ).toBe(true)

    let duplicateResult
    act(() => {
      duplicateResult = contextSnapshot.register({
        name: 'Duplicado',
        email: 'nuevo@modainc.com',
        password: '123456',
        role: 'cliente',
      })
    })

    expect(duplicateResult.ok).toBe(true)
    expect(duplicateResult.message).toContain('ya está registrado')
  })

  it('HU-02: autentica por credenciales, restringe inactivos y permite cerrar sesión', () => {
    renderProvider()

    let loginResult
    act(() => {
      loginResult = contextSnapshot.login({ email: 'admin', password: 'admin123' })
    })

    expect(loginResult.ok).toBe(true)
    expect(contextSnapshot.currentUser?.role).toBe('admin')

    act(() => {
      contextSnapshot.updateUser('u-cli-lucia', { active: false })
    })

    let inactiveResult
    act(() => {
      inactiveResult = contextSnapshot.login({
        email: 'lucia@modainc.com',
        password: '123456',
      })
    })

    expect(inactiveResult.ok).toBe(false)
    expect(inactiveResult.message).toContain('desactivada')

    act(() => {
      contextSnapshot.logout()
    })

    expect(contextSnapshot.currentUser).toBe(null)
  })

  it('HU-03: administra usuarios, permisos/publicaciones y registra auditoría', () => {
    renderProvider()

    act(() => {
      contextSnapshot.login({ email: 'admin', password: 'admin123' })
    })

    let principalDelete
    act(() => {
      principalDelete = contextSnapshot.deleteUser('u-admin-root')
    })

    expect(principalDelete.ok).toBe(false)

    act(() => {
      contextSnapshot.updateUser('u-fab-ana', {
        role: 'admin',
        permissions: { canModeratePosts: true },
      })
    })

    const updatedUser = contextSnapshot.users.find((user) => user.id === 'u-fab-ana')
    expect(updatedUser?.role).toBe('admin')
    expect(updatedUser?.permissions?.canModeratePosts).toBe(true)

    act(() => {
      contextSnapshot.updateShowcase('s-ana', { published: false })
    })

    expect(
      contextSnapshot.showcases.find((showcase) => showcase.id === 's-ana')?.published,
    ).toBe(false)

    let deleteResult
    act(() => {
      deleteResult = contextSnapshot.deleteUser('u-cli-lucia')
    })

    expect(deleteResult.ok).toBe(true)
    expect(contextSnapshot.users.some((user) => user.id === 'u-cli-lucia')).toBe(false)
    expect(contextSnapshot.auditLog.some((entry) => entry.includes('Usuario eliminado'))).toBe(true)
  })

  it('HU-04: actualiza escaparate del fabricante y refleja cambios en catálogo público', () => {
    renderProvider()

    const newDesign = {
      id: 'd-test-1',
      name: 'Disfraz Solar',
      type: 'Disfraz',
      basePrice: 250,
      image: 'https://example.com/disfraz.jpg',
      modificationSessions: ['General'],
      modifications: [],
    }

    act(() => {
      contextSnapshot.updateShowcase('s-ana', {
        description: 'Escaparate actualizado en tiempo real',
        gallery: ['https://example.com/uno.jpg'],
        designs: [newDesign],
      })
    })

    const catalogItem = contextSnapshot.catalog.find((item) => item.id === 'd-test-1')
    expect(catalogItem).toBeTruthy()
    expect(catalogItem?.manufacturerName).toBe('Ana Costuras')
    expect(catalogItem?.description).toContain('tiempo real')
  })
})
