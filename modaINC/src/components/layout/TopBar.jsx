import { useMemo } from 'react'

const roleLabel = {
  admin: 'Administrador',
  fabricante: 'Fabricante',
  cliente: 'Cliente',
}

export default function TopBar({
  currentUser,
  onGoHome,
  onGoLogin,
  onGoDashboard,
  onLogout,
}) {
  const welcomeText = useMemo(() => {
    if (!currentUser) {
      return 'Explora fabricantes y diseños sin iniciar sesión'
    }
    return `Sesión: ${currentUser.name} (${roleLabel[currentUser.role]})`
  }, [currentUser])

  return (
    <header className="sticky top-0 z-20 border-b border-amber-950/15 bg-amber-50/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <button
          type="button"
          onClick={onGoHome}
          className="text-left"
          aria-label="Ir al inicio"
        >
          <p className="font-serif text-2xl tracking-wide text-amber-900">ModaINC</p>
          <p className="text-xs text-amber-800/80 md:text-sm">Ropa y disfraces a la medida</p>
        </button>

        <nav className="flex items-center gap-2 md:gap-3">
          <button
            type="button"
            onClick={onGoHome}
            className="rounded-full border border-amber-900/20 bg-white px-3 py-1.5 text-sm font-medium text-amber-900 transition hover:-translate-y-0.5 hover:bg-amber-100"
          >
            Inicio
          </button>
          {!currentUser && (
            <button
              type="button"
              onClick={onGoLogin}
              className="rounded-full bg-amber-900 px-3 py-1.5 text-sm font-semibold text-amber-50 transition hover:bg-amber-800"
            >
              Iniciar sesión
            </button>
          )}
          {currentUser && (
            <button
              type="button"
              onClick={onGoDashboard}
              className="rounded-full border border-amber-900/20 bg-white px-3 py-1.5 text-sm font-medium text-amber-900 transition hover:-translate-y-0.5 hover:bg-amber-100"
            >
              Mi panel
            </button>
          )}
          {currentUser ? (
            <button
              type="button"
              onClick={onLogout}
              className="rounded-full bg-amber-900 px-3 py-1.5 text-sm font-semibold text-amber-50 transition hover:bg-amber-800"
            >
              Cerrar sesión
            </button>
          ) : null}
        </nav>
      </div>

      <div className="border-t border-amber-950/10 bg-white/80 px-4 py-1 text-center text-xs tracking-wide text-amber-900 md:text-sm">
        {welcomeText}
      </div>
    </header>
  )
}
