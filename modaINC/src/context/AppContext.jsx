import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { initialShowcases, initialUsers } from '../data/mockData'

const AppContext = createContext(null)
const STORAGE_KEY = 'modainc-prototype-state-v1'

function inferSectionFromName(name) {
  if (typeof name !== 'string') return 'General'
  const separatorIndex = name.indexOf(':')
  if (separatorIndex <= 0) return 'General'

  const inferred = name.slice(0, separatorIndex).trim()
  return inferred || 'General'
}

function normalizeModification(modification) {
  return {
    id: modification.id ?? `m-${Math.random().toString(36).slice(2, 9)}`,
    name: modification.name ?? 'Modificación sin nombre',
    image: modification.image ?? '',
    extraCost: Number(modification.extraCost) || 0,
    section: modification.section ?? inferSectionFromName(modification.name),
  }
}

function normalizeDesign(design) {
  const fallbackModifications = [
    ...(design.fabricOptions ?? []).map((item, index) => ({
      id: `legacy-fabric-${design.id}-${index}`,
      name: `Tejido: ${item}`,
      image: '',
      extraCost: 0,
    })),
    ...(design.styleOptions ?? []).map((item, index) => ({
      id: `legacy-style-${design.id}-${index}`,
      name: `Estilo: ${item}`,
      image: '',
      extraCost: 0,
    })),
  ]

  const sourceModifications =
    Array.isArray(design.modifications) && design.modifications.length
      ? design.modifications
      : fallbackModifications

  const normalizedModifications = sourceModifications.map(normalizeModification)
  const sectionSet = new Set(
    Array.isArray(design.modificationSessions) ? design.modificationSessions : [],
  )

  normalizedModifications.forEach((modification) => {
    sectionSet.add(modification.section || 'General')
  })

  if (!sectionSet.size) {
    sectionSet.add('General')
  }

  return {
    id: design.id ?? `d-${Math.random().toString(36).slice(2, 9)}`,
    name: design.name ?? 'Diseño sin nombre',
    type: design.type ?? 'Prenda',
    basePrice: Number(design.basePrice) || 0,
    image: design.image ?? '',
    modificationSessions: [...sectionSet],
    modifications: normalizedModifications,
  }
}

function normalizeShowcase(showcase) {
  return {
    ...showcase,
    designs: Array.isArray(showcase.designs)
      ? showcase.designs.map(normalizeDesign)
      : [],
  }
}

function normalizeShowcases(showcases) {
  if (!Array.isArray(showcases)) return []
  return showcases.map(normalizeShowcase)
}

function nowStamp() {
  return new Date().toLocaleString('es-CR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function loadPersistedState() {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null

    return {
      users: Array.isArray(parsed.users) ? parsed.users : null,
      showcases: Array.isArray(parsed.showcases) ? parsed.showcases : null,
      auditLog: Array.isArray(parsed.auditLog) ? parsed.auditLog : null,
      sessionUserId:
        typeof parsed.sessionUserId === 'string' || parsed.sessionUserId === null
          ? parsed.sessionUserId
          : null,
    }
  } catch {
    return null
  }
}

export function AppProvider({ children }) {
  const persisted = loadPersistedState()

  const [users, setUsers] = useState(persisted?.users ?? initialUsers)
  const [showcases, setShowcases] = useState(
    normalizeShowcases(persisted?.showcases ?? initialShowcases),
  )
  const [sessionUserId, setSessionUserId] = useState(persisted?.sessionUserId ?? null)
  const [auditLog, setAuditLog] = useState(
    persisted?.auditLog ?? [`[${nowStamp()}] Sistema iniciado con datos de prototipo`],
  )

  const currentUser = users.find((user) => user.id === sessionUserId) ?? null

  useEffect(() => {
    if (!sessionUserId) return
    const exists = users.some((user) => user.id === sessionUserId)
    if (!exists) {
      setSessionUserId(null)
    }
  }, [sessionUserId, users])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const stateToPersist = {
      users,
      showcases,
      auditLog,
      sessionUserId,
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToPersist))
  }, [users, showcases, auditLog, sessionUserId])

  const catalog = useMemo(() => {
    return showcases
      .filter((showcase) => showcase.published)
      .flatMap((showcase) =>
        showcase.designs.map((design) => ({
          ...design,
          showcaseId: showcase.id,
          manufacturerId: showcase.manufacturerId,
          manufacturerName: showcase.businessName,
          image: design.image || showcase.gallery[0] || '',
          description: showcase.description,
        })),
      )
  }, [showcases])

  const manufacturers = useMemo(() => {
    return showcases
      .filter((showcase) => showcase.published)
      .map((showcase) => ({
        ...showcase,
        owner: users.find((user) => user.id === showcase.manufacturerId) ?? null,
      }))
  }, [showcases, users])

  const appendLog = (entry) => {
    setAuditLog((prev) => [`[${nowStamp()}] ${entry}`, ...prev])
  }

  const login = ({ email, password }) => {
    const normalizedEmail = email.trim().toLowerCase()
    const user = users.find(
      (item) =>
        item.email.toLowerCase() === normalizedEmail && item.password === password,
    )

    if (!user) {
      return { ok: false, message: 'Credenciales inválidas.' }
    }

    if (!user.active) {
      return {
        ok: false,
        message: 'Tu cuenta está desactivada. Contacta a un administrador.',
      }
    }

    setSessionUserId(user.id)
    return {
      ok: true,
      message: `Sesión iniciada como ${user.name} (${user.role}).`,
      user,
    }
  }

  const logout = () => {
    if (currentUser) {
      appendLog(`Sesión cerrada por ${currentUser.email}`)
    }
    setSessionUserId(null)
  }

  const register = ({ name, email, password, role }) => {
    const normalizedEmail = email.trim().toLowerCase()
    const alreadyExists = users.some(
      (item) => item.email.toLowerCase() === normalizedEmail,
    )

    if (alreadyExists) {
      return {
        ok: false,
        message: 'El correo ya está registrado. Usa uno diferente.',
      }
    }

    const newUser = {
      id: `u-${Math.random().toString(36).slice(2, 9)}`,
      name: name.trim(),
      email: normalizedEmail,
      password,
      role,
      active: true,
      isPrincipal: false,
    }

    setUsers((prev) => [...prev, newUser])

    if (role === 'fabricante') {
      const showcase = {
        id: `s-${newUser.id}`,
        manufacturerId: newUser.id,
        businessName: newUser.name,
        specialty: 'Nuevo fabricante en proceso de completar perfil',
        description: 'Agrega tus servicios y muestras para atraer clientes.',
        services: [],
        gallery: [],
        published: true,
        designs: [],
      }
      setShowcases((prev) => [...prev, normalizeShowcase(showcase)])
    }

    appendLog(`Nuevo usuario registrado: ${newUser.email} (rol ${role})`)

    return {
      ok: true,
      message: `Cuenta creada exitosamente con rol ${role}.`,
      user: newUser,
    }
  }

  const createAdminByPrincipal = ({ name, email, password }) => {
    if (!currentUser || !currentUser.isPrincipal) {
      return {
        ok: false,
        message: 'Solo el administrador principal puede crear administradores.',
      }
    }

    return register({ name, email, password, role: 'admin' })
  }

  const updateUser = (userId, updates) => {
    setUsers((prev) =>
      prev.map((user) => (user.id === userId ? { ...user, ...updates } : user)),
    )

    const touchedUser = users.find((user) => user.id === userId)
    if (touchedUser) {
      appendLog(`Usuario actualizado: ${touchedUser.email}`)
    }
  }

  const deleteUser = (userId) => {
    const target = users.find((user) => user.id === userId)
    if (!target || target.isPrincipal) {
      return { ok: false, message: 'No se puede eliminar al admin principal.' }
    }

    setUsers((prev) => prev.filter((user) => user.id !== userId))
    setShowcases((prev) => prev.filter((showcase) => showcase.manufacturerId !== userId))

    if (sessionUserId === userId) {
      setSessionUserId(null)
    }

    appendLog(`Usuario eliminado: ${target.email}`)
    return { ok: true, message: 'Usuario eliminado correctamente.' }
  }

  const updateShowcase = (showcaseId, updates) => {
    setShowcases((prev) =>
      prev.map((showcase) =>
        showcase.id === showcaseId
          ? normalizeShowcase({ ...showcase, ...updates })
          : showcase,
      ),
    )

    const touchedShowcase = showcases.find((showcase) => showcase.id === showcaseId)
    if (touchedShowcase) {
      appendLog(`Escaparate actualizado: ${touchedShowcase.businessName}`)
    }
  }

  const value = {
    users,
    showcases,
    manufacturers,
    catalog,
    auditLog,
    currentUser,
    login,
    logout,
    register,
    updateUser,
    deleteUser,
    updateShowcase,
    createAdminByPrincipal,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext debe usarse dentro de AppProvider')
  }
  return context
}
