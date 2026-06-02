import AuthCard from '../components/auth/AuthCard'

export default function LoginPage({ onLogin, onRegister }) {
  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_0.95fr]">
      <article className="rounded-3xl border border-amber-900/10 bg-white/85 p-6 md:p-8">
        <p className="mb-2 text-xs font-semibold tracking-[0.2em] text-amber-900/70">ACCESO</p>
        <h1 className="font-serif text-3xl text-amber-950 md:text-4xl">Inicia sesión o crea tu cuenta</h1>
        <p className="mt-3 text-sm text-amber-900/80 md:text-base">
          Desde esta vista puedes acceder como cliente, fabricante o administrador. Si solo deseas
          explorar fabricantes y catálogo, puedes volver al inicio sin iniciar sesión.
        </p>
      </article>

      <AuthCard onLogin={onLogin} onRegister={onRegister} />
    </section>
  )
}
