import { useState } from 'react'
import { roleOptions } from '../../data/mockData'

function UserRow({ user, currentUser, updateUser, deleteUser }) {
  const [feedback, setFeedback] = useState('')

  const toggleActive = () => {
    updateUser(user.id, { active: !user.active })
    setFeedback('Estado actualizado.')
  }

  const changeRole = (role) => {
    updateUser(user.id, { role })
    setFeedback('Rol actualizado.')
  }

  const toggleModeration = () => {
    const permissions = {
      ...(user.permissions ?? {}),
      canModeratePosts: !(user.permissions?.canModeratePosts ?? false),
    }
    updateUser(user.id, { permissions })
    setFeedback('Permisos actualizados.')
  }

  const remove = () => {
    const result = deleteUser(user.id)
    setFeedback(result.message)
  }

  const cannotEdit = user.isPrincipal || user.id === currentUser.id

  return (
    <article className="rounded-2xl border border-amber-900/10 bg-amber-50/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-amber-950">{user.name}</p>
          <p className="text-sm text-amber-900/80">{user.email}</p>
          <p className="text-xs text-amber-900/70">Estado: {user.active ? 'Activo' : 'Inactivo'}</p>
        </div>
        {user.isPrincipal ? (
          <span className="rounded-full bg-amber-900 px-3 py-1 text-xs font-semibold text-amber-50">
            Principal
          </span>
        ) : null}
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-3">
        <label className="grid gap-1 text-xs uppercase tracking-wide text-amber-900">
          Rol
          <select
            disabled={cannotEdit}
            value={user.role}
            onChange={(event) => changeRole(event.target.value)}
            className="rounded-xl border border-amber-900/20 bg-white px-2 py-1.5 text-sm disabled:opacity-50"
          >
            {roleOptions.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          disabled={cannotEdit}
          onClick={toggleActive}
          className="rounded-xl border border-amber-900/20 bg-white px-3 py-2 text-sm font-medium text-amber-900 disabled:opacity-50"
        >
          {user.active ? 'Desactivar' : 'Activar'}
        </button>

        <button
          type="button"
          disabled={cannotEdit}
          onClick={toggleModeration}
          className="rounded-xl border border-amber-900/20 bg-white px-3 py-2 text-sm font-medium text-amber-900 disabled:opacity-50"
        >
          Moderar publicaciones: {user.permissions?.canModeratePosts ? 'Sí' : 'No'}
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          disabled={cannotEdit}
          onClick={remove}
          className="rounded-xl bg-red-700 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          Eliminar cuenta
        </button>

        {feedback ? <p className="text-xs text-amber-900/75">{feedback}</p> : null}
      </div>
    </article>
  )
}

export default function AdminPanel({
  currentUser,
  users,
  showcases,
  auditLog,
  updateUser,
  deleteUser,
  updateShowcase,
  createAdminByPrincipal,
}) {
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '' })
  const [feedback, setFeedback] = useState('')

  const createAdmin = (event) => {
    event.preventDefault()
    const result = createAdminByPrincipal(newAdmin)
    setFeedback(result.message)
    if (result.ok) {
      setNewAdmin({ name: '', email: '', password: '' })
    }
  }

  return (
    <section className="grid gap-4">
      <article className="rounded-3xl border border-amber-900/10 bg-white p-5 md:p-6">
        <h2 className="font-serif text-2xl text-amber-950">Panel de administración</h2>
        <p className="text-sm text-amber-900/80">
          Gestiona usuarios, permisos por rol y publicaciones del sistema.
        </p>
      </article>

      {currentUser.isPrincipal ? (
        <article className="rounded-3xl border border-amber-900/10 bg-white p-5 md:p-6">
          <h3 className="text-lg font-semibold text-amber-950">Crear administradores</h3>
          <p className="mb-3 text-sm text-amber-900/80">
            Solo el administrador principal puede registrar nuevos administradores.
          </p>
          <form className="grid gap-3 md:grid-cols-3" onSubmit={createAdmin}>
            <input
              required
              type="text"
              value={newAdmin.name}
              onChange={(event) =>
                setNewAdmin((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="Nombre"
              className="rounded-xl border border-amber-900/20 px-3 py-2"
            />
            <input
              required
              type="email"
              value={newAdmin.email}
              onChange={(event) =>
                setNewAdmin((prev) => ({ ...prev, email: event.target.value }))
              }
              placeholder="correo@dominio.com"
              className="rounded-xl border border-amber-900/20 px-3 py-2"
            />
            <input
              required
              type="password"
              minLength={6}
              value={newAdmin.password}
              onChange={(event) =>
                setNewAdmin((prev) => ({ ...prev, password: event.target.value }))
              }
              placeholder="Contraseña"
              className="rounded-xl border border-amber-900/20 px-3 py-2"
            />
            <button
              type="submit"
              className="rounded-xl bg-amber-900 px-4 py-2 font-semibold text-amber-50 md:col-span-3"
            >
              Crear administrador
            </button>
          </form>
          {feedback ? (
            <p className="mt-3 rounded-xl bg-amber-100 px-3 py-2 text-sm text-amber-900">
              {feedback}
            </p>
          ) : null}
        </article>
      ) : null}

      <article className="rounded-3xl border border-amber-900/10 bg-white p-5 md:p-6">
        <h3 className="mb-3 text-lg font-semibold text-amber-950">Usuarios y permisos</h3>
        <div className="grid gap-3">
          {users.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              currentUser={currentUser}
              updateUser={updateUser}
              deleteUser={deleteUser}
            />
          ))}
        </div>
      </article>

      <article className="rounded-3xl border border-amber-900/10 bg-white p-5 md:p-6">
        <h3 className="mb-3 text-lg font-semibold text-amber-950">Publicaciones de escaparate</h3>
        <div className="grid gap-3">
          {showcases.map((showcase) => (
            <div
              key={showcase.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-900/10 bg-amber-50/60 p-3"
            >
              <div>
                <p className="font-medium text-amber-950">{showcase.businessName}</p>
                <p className="text-sm text-amber-900/80">
                  Estado: {showcase.published ? 'Publicado' : 'Oculto'}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateShowcase(showcase.id, { published: !showcase.published })
                }
                className="rounded-xl border border-amber-900/20 bg-white px-3 py-1.5 text-sm font-medium text-amber-900"
              >
                {showcase.published ? 'Ocultar' : 'Publicar'}
              </button>
            </div>
          ))}
        </div>
      </article>

      <article className="rounded-3xl border border-amber-900/10 bg-white p-5 md:p-6">
        <h3 className="mb-3 text-lg font-semibold text-amber-950">Historial del sistema</h3>
        <ul className="grid max-h-64 gap-2 overflow-auto rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          {auditLog.map((entry, index) => (
            <li key={`${entry}-${index}`} className="border-b border-amber-900/10 pb-2 last:border-b-0">
              {entry}
            </li>
          ))}
        </ul>
      </article>
    </section>
  )
}
