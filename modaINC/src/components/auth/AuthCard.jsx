import { useState } from 'react'
import { roleOptions } from '../../data/mockData'

const registerRoles = roleOptions.filter((role) => role.value !== 'admin')

export default function AuthCard({ onLogin, onRegister }) {
  const [mode, setMode] = useState('login')
  const [message, setMessage] = useState('')

  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'cliente',
  })

  const submitLogin = (event) => {
    event.preventDefault()
    const result = onLogin(loginData)
    setMessage(result.message)
  }

  const submitRegister = (event) => {
    event.preventDefault()
    const result = onRegister(registerData)
    setMessage(
      result.ok
        ? `${result.message} Revisa tu correo para la confirmación (simulada).`
        : result.message,
    )
    if (result.ok) {
      setRegisterData({ name: '', email: '', password: '', role: 'cliente' })
    }
  }

  return (
    <section className="rounded-2xl border border-amber-900/15 bg-white/90 p-5 shadow-lg shadow-amber-950/5 md:p-6">
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setMode('login')}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
            mode === 'login'
              ? 'bg-amber-900 text-amber-50'
              : 'border border-amber-900/20 text-amber-900 hover:bg-amber-100'
          }`}
        >
          Iniciar sesión
        </button>
        <button
          type="button"
          onClick={() => setMode('register')}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
            mode === 'register'
              ? 'bg-amber-900 text-amber-50'
              : 'border border-amber-900/20 text-amber-900 hover:bg-amber-100'
          }`}
        >
          Registrarse
        </button>
      </div>

      {mode === 'login' ? (
        <form className="grid gap-3" onSubmit={submitLogin}>
          <label className="grid gap-1 text-sm text-amber-900">
            Correo
            <input
              required
              type="text"
              value={loginData.email}
              onChange={(event) =>
                setLoginData((prev) => ({ ...prev, email: event.target.value }))
              }
              className="rounded-xl border border-amber-900/20 bg-white px-3 py-2 outline-none ring-0 transition focus:border-amber-700"
              placeholder="admin o correo@ejemplo.com"
            />
          </label>
          <label className="grid gap-1 text-sm text-amber-900">
            Contraseña
            <input
              required
              type="password"
              value={loginData.password}
              onChange={(event) =>
                setLoginData((prev) => ({ ...prev, password: event.target.value }))
              }
              className="rounded-xl border border-amber-900/20 bg-white px-3 py-2 outline-none ring-0 transition focus:border-amber-700"
              placeholder="Tu contraseña"
            />
          </label>
          <button
            type="submit"
            className="mt-1 rounded-xl bg-amber-900 px-4 py-2 font-semibold text-amber-50 transition hover:bg-amber-800"
          >
            Entrar
          </button>
          <p className="text-xs text-amber-900/75">
            Demo admin principal: usuario admin y contraseña admin123.
          </p>
        </form>
      ) : (
        <form className="grid gap-3" onSubmit={submitRegister}>
          <label className="grid gap-1 text-sm text-amber-900">
            Nombre completo
            <input
              required
              type="text"
              value={registerData.name}
              onChange={(event) =>
                setRegisterData((prev) => ({ ...prev, name: event.target.value }))
              }
              className="rounded-xl border border-amber-900/20 bg-white px-3 py-2 outline-none ring-0 transition focus:border-amber-700"
            />
          </label>

          <label className="grid gap-1 text-sm text-amber-900">
            Correo
            <input
              required
              type="email"
              value={registerData.email}
              onChange={(event) =>
                setRegisterData((prev) => ({ ...prev, email: event.target.value }))
              }
              className="rounded-xl border border-amber-900/20 bg-white px-3 py-2 outline-none ring-0 transition focus:border-amber-700"
            />
          </label>

          <label className="grid gap-1 text-sm text-amber-900">
            Contraseña
            <input
              required
              type="password"
              minLength={6}
              value={registerData.password}
              onChange={(event) =>
                setRegisterData((prev) => ({ ...prev, password: event.target.value }))
              }
              className="rounded-xl border border-amber-900/20 bg-white px-3 py-2 outline-none ring-0 transition focus:border-amber-700"
            />
          </label>

          <label className="grid gap-1 text-sm text-amber-900">
            Rol
            <select
              value={registerData.role}
              onChange={(event) =>
                setRegisterData((prev) => ({ ...prev, role: event.target.value }))
              }
              className="rounded-xl border border-amber-900/20 bg-white px-3 py-2 outline-none ring-0 transition focus:border-amber-700"
            >
              {registerRoles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            className="rounded-xl bg-amber-900 px-4 py-2 font-semibold text-amber-50 transition hover:bg-amber-800"
          >
            Crear cuenta
          </button>
          <p className="text-xs text-amber-900/75">
            El rol seleccionado define las funciones disponibles al iniciar sesión.
          </p>
        </form>
      )}

      {message ? (
        <p className="mt-3 rounded-xl bg-amber-100 px-3 py-2 text-sm text-amber-900">
          {message}
        </p>
      ) : null}
    </section>
  )
}
