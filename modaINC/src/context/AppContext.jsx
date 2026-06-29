import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { initialShowcases, initialUsers } from '../data/mockData'
import { garmentTypesOf, suggestManufacturers } from '../lib/manufacturerQueries'

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
    location: showcase.location ?? '',
    styles: Array.isArray(showcase.styles) ? showcase.styles : [],
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

const defaultMockOrder = {
  id: 'o-mock-1',
  clientId: 'u-cli-lucia',
  clientName: 'Lucía Méndez',
  designId: 'd-ana-1',
  designName: 'Vestido Aurora',
  manufacturerId: 'u-fab-ana',
  manufacturerName: 'Ana Costuras',
  basePrice: 120,
  modifications: [{ id: 'm-ana-1', name: 'Tejido Satén Premium', extraCost: 25 }],
  total: 145,
  measures: { pecho: 90, cintura: 74, cadera: 96, largo: 110 },
  status: 'pagado',
  createdAt: '28/06/2026, 10:00',
}

const defaultStatusHistory = [
  {
    id: 'osh-mock-1',
    orderId: 'o-mock-1',
    status: 'recibido',
    description: 'Solicitud de confección recibida',
    createdAt: '28/06/2026, 10:00',
    updatedBy: 'Lucía Méndez'
  },
  {
    id: 'osh-mock-2',
    orderId: 'o-mock-1',
    status: 'pendiente_pago',
    description: 'Pendiente de pago por parte del cliente',
    createdAt: '28/06/2026, 10:02',
    updatedBy: 'Sistema'
  },
  {
    id: 'osh-mock-3',
    orderId: 'o-mock-1',
    status: 'pagado',
    description: 'Pago confirmado por un monto de $145.00',
    createdAt: '28/06/2026, 10:05',
    updatedBy: 'Sistema'
  }
]

const defaultDeliveries = [
  {
    id: 'del-mock-1',
    orderId: 'o-mock-1',
    method: 'envio',
    company: '',
    trackingNumber: '',
    status: 'pendiente_coordinacion',
    estimatedShippingDate: '',
    estimatedDeliveryDate: '',
    address: 'Frente al parque central, portón rojo, San José',
    contactName: 'Lucía Méndez',
    contactPhone: '8888-8888',
    notes: '',
    cost: 0,
  }
]

const defaultTransactions = [
  {
    id: 't-mock-1',
    orderId: 'o-mock-1',
    type: 'pago',
    amount: 145,
    currency: 'USD',
    paymentMethod: 'tarjeta',
    status: 'confirmado',
    reference: '1234',
    createdAt: '28/06/2026, 10:05'
  }
]

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
      orders: Array.isArray(parsed.orders) ? parsed.orders : null,
      messages: Array.isArray(parsed.messages) ? parsed.messages : null,
      sessionUserId:
        typeof parsed.sessionUserId === 'string' || parsed.sessionUserId === null
          ? parsed.sessionUserId
          : null,
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
      orderStatusHistory: Array.isArray(parsed.orderStatusHistory) ? parsed.orderStatusHistory : [],
      deliveries: Array.isArray(parsed.deliveries) ? parsed.deliveries : [],
      ratings: Array.isArray(parsed.ratings) ? parsed.ratings : [],
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
    }
  } catch {
    return null
  }
}

function mergeById(existing = [], incoming = []) {
  const map = new Map()

  existing.forEach((item) => {
    if (item && typeof item === 'object' && typeof item.id === 'string') {
      map.set(item.id, item)
    }
  })

  incoming.forEach((item) => {
    if (item && typeof item === 'object' && typeof item.id === 'string') {
      map.set(item.id, item)
    }
  })

  return [...map.values()]
}

export function AppProvider({ children }) {
  const persisted = loadPersistedState()
  const isTest = typeof process !== 'undefined' && (process.env.NODE_ENV === 'test' || process.env.VITEST)

  const [users, setUsers] = useState(persisted?.users ?? initialUsers)
  const [showcases, setShowcases] = useState(
    normalizeShowcases(persisted?.showcases ?? initialShowcases),
  )
  const [sessionUserId, setSessionUserId] = useState(persisted?.sessionUserId ?? null)
  const [orders, setOrders] = useState(() => {
    if (persisted?.orders && persisted.orders.length > 0) return persisted.orders
    return isTest ? [] : [defaultMockOrder]
  })
  const [messages, setMessages] = useState(persisted?.messages ?? [])
  const [auditLog, setAuditLog] = useState(
    persisted?.auditLog ?? [`[${nowStamp()}] Sistema iniciado con datos de prototipo`],
  )

  const [notifications, setNotifications] = useState(persisted?.notifications ?? [])
  const [orderStatusHistory, setOrderStatusHistory] = useState(() => {
    if (persisted?.orderStatusHistory && persisted.orderStatusHistory.length > 0) return persisted.orderStatusHistory
    return isTest ? [] : defaultStatusHistory
  })
  const [deliveries, setDeliveries] = useState(() => {
    if (persisted?.deliveries && persisted.deliveries.length > 0) return persisted.deliveries
    return isTest ? [] : defaultDeliveries
  })
  const [ratings, setRatings] = useState(persisted?.ratings ?? [])
  const [transactions, setTransactions] = useState(() => {
    if (persisted?.transactions && persisted.transactions.length > 0) return persisted.transactions
    return isTest ? [] : defaultTransactions
  })

  const seedMockOrderForTesting = () => {
    setOrders([defaultMockOrder])
    setOrderStatusHistory(defaultStatusHistory)
    setDeliveries(defaultDeliveries)
    setTransactions(defaultTransactions)
  }

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

    let mergedOrders = orders
    let mergedMessages = messages
    let mergedNotifications = notifications
    let mergedOrderStatusHistory = orderStatusHistory
    let mergedDeliveries = deliveries
    let mergedRatings = ratings
    let mergedTransactions = transactions

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') {
          mergedOrders = mergeById(
            Array.isArray(parsed.orders) ? parsed.orders : [],
            orders,
          )
          mergedMessages = mergeById(
            Array.isArray(parsed.messages) ? parsed.messages : [],
            messages,
          )
          mergedNotifications = mergeById(
            Array.isArray(parsed.notifications) ? parsed.notifications : [],
            notifications
          )
          mergedOrderStatusHistory = mergeById(
            Array.isArray(parsed.orderStatusHistory) ? parsed.orderStatusHistory : [],
            orderStatusHistory
          )
          mergedDeliveries = mergeById(
            Array.isArray(parsed.deliveries) ? parsed.deliveries : [],
            deliveries
          )
          mergedRatings = mergeById(
            Array.isArray(parsed.ratings) ? parsed.ratings : [],
            ratings
          )
          mergedTransactions = mergeById(
            Array.isArray(parsed.transactions) ? parsed.transactions : [],
            transactions
          )
        }
      }
    } catch {
      mergedOrders = orders
      mergedMessages = messages
      mergedNotifications = notifications
      mergedOrderStatusHistory = orderStatusHistory
      mergedDeliveries = deliveries
      mergedRatings = ratings
      mergedTransactions = transactions
    }

    const stateToPersist = {
      users,
      showcases,
      auditLog,
      orders: mergedOrders,
      messages: mergedMessages,
      sessionUserId,
      notifications: mergedNotifications,
      orderStatusHistory: mergedOrderStatusHistory,
      deliveries: mergedDeliveries,
      ratings: mergedRatings,
      transactions: mergedTransactions,
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToPersist))
    } catch {
      // Keep app functional when storage quota is exhausted.
    }
  }, [users, showcases, auditLog, orders, messages, sessionUserId, notifications, orderStatusHistory, deliveries, ratings, transactions])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const syncFromStorage = (event) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return

      try {
        const parsed = JSON.parse(event.newValue)
        if (!parsed || typeof parsed !== 'object') return

        if (Array.isArray(parsed.users)) {
          setUsers(parsed.users)
        }
        if (Array.isArray(parsed.showcases)) {
          setShowcases(normalizeShowcases(parsed.showcases))
        }
        if (Array.isArray(parsed.orders)) {
          setOrders(parsed.orders)
        }
        if (Array.isArray(parsed.messages)) {
          setMessages(parsed.messages)
        }
        if (Array.isArray(parsed.auditLog)) {
          setAuditLog(parsed.auditLog)
        }
        if (
          typeof parsed.sessionUserId === 'string' ||
          parsed.sessionUserId === null
        ) {
          setSessionUserId(parsed.sessionUserId)
        }
        if (Array.isArray(parsed.notifications)) {
          setNotifications(parsed.notifications)
        }
        if (Array.isArray(parsed.orderStatusHistory)) {
          setOrderStatusHistory(parsed.orderStatusHistory)
        }
        if (Array.isArray(parsed.deliveries)) {
          setDeliveries(parsed.deliveries)
        }
        if (Array.isArray(parsed.ratings)) {
          setRatings(parsed.ratings)
        }
        if (Array.isArray(parsed.transactions)) {
          setTransactions(parsed.transactions)
        }
      } catch {
        // Ignore malformed storage updates from other tabs.
      }
    }

    window.addEventListener('storage', syncFromStorage)
    return () => window.removeEventListener('storage', syncFromStorage)
  }, [])

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
        garmentTypes: garmentTypesOf(showcase),
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

  // HU-08: registrar y actualizar medidas corporales en el perfil del cliente.
  const updateMeasures = (userId, measures) => {
    const target = users.find((user) => user.id === userId)
    if (!target) {
      return { ok: false, message: 'No se encontró el usuario.' }
    }

    const sanitized = Object.fromEntries(
      Object.entries(measures ?? {}).map(([key, value]) => [key, Number(value) || 0]),
    )

    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId
          ? { ...user, measures: { ...(user.measures ?? {}), ...sanitized } }
          : user,
      ),
    )

    appendLog(`Medidas corporales actualizadas: ${target.email}`)
    return { ok: true, message: 'Medidas guardadas correctamente.' }
  }

  // HU-07: actualizar las preferencias del cliente que alimentan las sugerencias.
  const updatePreferences = (userId, preferences) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId
          ? {
              ...user,
              preferences: {
                garmentTypes: preferences.garmentTypes ?? [],
                styles: preferences.styles ?? [],
              },
            }
          : user,
      ),
    )
    return { ok: true, message: 'Preferencias actualizadas.' }
  }

  const addNotification = ({
    userId,
    type,
    title,
    message,
    relatedEntityId = '',
    relatedEntityType = '',
  }) => {
    const newNotification = {
      id: `n-${Math.random().toString(36).slice(2, 9)}`,
      userId,
      type,
      title,
      message,
      relatedEntityId,
      relatedEntityType,
      isRead: false,
      createdAt: nowStamp(),
    }
    setNotifications((prev) => [newNotification, ...prev])
  }

  const markNotificationAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
  }

  const markAllNotificationsAsRead = (userId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.userId === userId ? { ...n, isRead: true } : n))
    )
  }

  const deleteNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const updateOrderStatus = (orderId, nextStatus, observation = '', updatedBy = 'Fabricante') => {
    const targetOrder = orders.find((o) => o.id === orderId)
    if (!targetOrder) {
      return { ok: false, message: 'Pedido no encontrado.' }
    }

    const orderDesignName = targetOrder.designName
    const orderClientId = targetOrder.clientId
    const orderClientName = targetOrder.clientName
    const orderManufacturerId = targetOrder.manufacturerId
    const orderTotal = targetOrder.total

    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order
        return { ...order, status: nextStatus }
      })
    )

    // Add status history entry
    const newHistory = {
      id: `osh-${Math.random().toString(36).slice(2, 9)}`,
      orderId,
      status: nextStatus,
      description: observation || `Estado actualizado a "${nextStatus}"`,
      createdAt: nowStamp(),
      updatedBy,
    }
    setOrderStatusHistory((prev) => [...prev, newHistory])

    // Generate notifications
    if (orderClientId) {
      if (updatedBy !== orderClientName) {
        // Notify client
        addNotification({
          userId: orderClientId,
          type: 'cambio_estado',
          title: 'Actualización de tu pedido',
          message: `El estado de tu pedido "${orderDesignName}" cambió a "${nextStatus}". ${observation ? `Observación: "${observation}"` : ''}`,
          relatedEntityId: orderId,
          relatedEntityType: 'order',
        })
      } else {
        // Notify manufacturer
        if (orderManufacturerId) {
          addNotification({
            userId: orderManufacturerId,
            type: 'cambio_estado',
            title: 'Actualización de pedido',
            message: `El cliente actualizó el pedido "${orderDesignName}" a "${nextStatus}".`,
            relatedEntityId: orderId,
            relatedEntityType: 'order',
          })
        }
      }

      // Trigger specific notification events
      if (nextStatus === 'listo_para_entrega') {
        addNotification({
          userId: orderClientId,
          type: 'pedido_listo',
          title: '¡Tu prenda está lista!',
          message: `El fabricante ha marcado tu pedido "${orderDesignName}" como listo para entrega. Coordina el envío o retiro.`,
          relatedEntityId: orderId,
          relatedEntityType: 'order',
        })
      } else if (nextStatus === 'enviado') {
        addNotification({
          userId: orderClientId,
          type: 'pedido_enviado',
          title: 'Tu pedido ha sido enviado',
          message: `El pedido "${orderDesignName}" está en camino. Consulta los detalles de entrega.`,
          relatedEntityId: orderId,
          relatedEntityType: 'order',
        })
      } else if (nextStatus === 'entregado') {
        addNotification({
          userId: orderClientId,
          type: 'pedido_entregado',
          title: 'Pedido entregado',
          message: `El pedido "${orderDesignName}" ha sido marcado como entregado. Por favor, califica al fabricante.`,
          relatedEntityId: orderId,
          relatedEntityType: 'order',
        })
        if (orderManufacturerId) {
          addNotification({
            userId: orderManufacturerId,
            type: 'pedido_entregado',
            title: 'Recepción confirmada',
            message: `El cliente ha confirmado la recepción del pedido "${orderDesignName}".`,
            relatedEntityId: orderId,
            relatedEntityType: 'order',
          })
        }
      }
    }

    appendLog(`Estado del pedido ${orderId} actualizado a ${nextStatus}`)
    return { ok: true, message: 'Estado actualizado correctamente.' }
  }

  const registerDelivery = (orderId, deliveryData) => {
    const existing = deliveries.find(d => d.orderId === orderId)
    const newDelivery = {
      id: existing?.id ?? `del-${Math.random().toString(36).slice(2, 9)}`,
      orderId,
      method: deliveryData.method ?? 'envio',
      company: deliveryData.company ?? '',
      trackingNumber: deliveryData.trackingNumber ?? '',
      status: deliveryData.status ?? 'pendiente_coordinacion',
      estimatedShippingDate: deliveryData.estimatedShippingDate ?? '',
      estimatedDeliveryDate: deliveryData.estimatedDeliveryDate ?? '',
      address: deliveryData.address ?? '',
      contactName: deliveryData.contactName ?? '',
      contactPhone: deliveryData.contactPhone ?? '',
      notes: deliveryData.notes ?? '',
      cost: Number(deliveryData.cost) || 0,
      updatedAt: nowStamp(),
    }

    setDeliveries((prev) => {
      const filtered = prev.filter(d => d.orderId !== orderId)
      return [...filtered, newDelivery]
    })

    const order = orders.find(o => o.id === orderId)
    if (order) {
      if (Number(deliveryData.cost) > 0 && (!existing || Number(existing.cost) !== Number(deliveryData.cost))) {
        const transId = `t-${Math.random().toString(36).slice(2, 9)}`
        const newTrans = {
          id: transId,
          orderId,
          type: 'costo_entrega',
          amount: Number(deliveryData.cost),
          currency: 'USD',
          paymentMethod: order.paymentInfo?.method ?? 'tarjeta',
          status: 'confirmado',
          reference: 'Envío',
          createdAt: nowStamp(),
        }
        setTransactions((prev) => [...prev, newTrans])
      }

      addNotification({
        userId: order.clientId,
        type: 'actualizacion_entrega',
        title: 'Actualización de entrega',
        message: `El fabricante ha registrado la entrega (${deliveryData.method === 'envio' ? 'Envío a domicilio' : 'Retiro en tienda'}) para tu pedido "${order.designName}". Estado: ${deliveryData.status}.`,
        relatedEntityId: orderId,
        relatedEntityType: 'order',
      })

      if (deliveryData.status === 'enviado' && order.status !== 'enviado') {
        updateOrderStatus(orderId, 'enviado', 'Pedido enviado por el fabricante', 'Fabricante')
      } else if (deliveryData.status === 'listo_retiro' && order.status !== 'listo_para_entrega') {
        updateOrderStatus(orderId, 'listo_para_entrega', 'Pedido listo para retiro', 'Fabricante')
      } else if (deliveryData.status === 'entregado' && order.status !== 'entregado') {
        updateOrderStatus(orderId, 'entregado', 'Pedido entregado al cliente', 'Fabricante')
      }
    }

    appendLog(`Datos de entrega registrados para pedido ${orderId}`)
    return { ok: true, message: 'Datos de entrega guardados.' }
  }

  const submitRating = (ratingData) => {
    const newRating = {
      id: `r-${Math.random().toString(36).slice(2, 9)}`,
      orderId: ratingData.orderId,
      clientId: ratingData.clientId,
      manufacturerId: ratingData.manufacturerId,
      generalRating: Number(ratingData.generalRating) || 5,
      productQuality: Number(ratingData.productQuality) || 5,
      communication: Number(ratingData.communication) || 5,
      deliveryTime: Number(ratingData.deliveryTime) || 5,
      valueForMoney: Number(ratingData.valueForMoney) || 5,
      comment: ratingData.comment ?? '',
      metExpectations: !!ratingData.metExpectations,
      correctMeasures: !!ratingData.correctMeasures,
      recommend: !!ratingData.recommend,
      onTime: !!ratingData.onTime,
      images: Array.isArray(ratingData.images) ? ratingData.images : [],
      createdAt: nowStamp(),
    }

    setRatings((prev) => [...prev, newRating])

    updateOrderStatus(ratingData.orderId, 'finalizado', 'Pedido calificado y finalizado por el cliente', 'Cliente')

    addNotification({
      userId: ratingData.manufacturerId,
      type: 'calificacion_recibida',
      title: '¡Nueva calificación recibida!',
      message: `Un cliente ha calificado tu trabajo con ${ratingData.generalRating} estrellas. Comentario: "${ratingData.comment}"`,
      relatedEntityId: ratingData.orderId,
      relatedEntityType: 'order',
    })

    appendLog(`Calificación enviada para el pedido ${ratingData.orderId}`)
    return { ok: true, message: 'Calificación publicada correctamente.' }
  }

  const addTransaction = ({
    orderId,
    type,
    amount,
    paymentMethod = 'tarjeta',
    status = 'confirmado',
    reference = '',
  }) => {
    const newTrans = {
      id: `t-${Math.random().toString(36).slice(2, 9)}`,
      orderId,
      type,
      amount: Number(amount) || 0,
      currency: 'USD',
      paymentMethod,
      status,
      reference,
      createdAt: nowStamp(),
    }
    setTransactions((prev) => [...prev, newTrans])
  }

  // HU-09 + HU-08: generar un pedido que registra las personalizaciones elegidas
  // y vincula automáticamente las medidas guardadas del cliente.
  const createOrder = ({
    clientId,
    design,
    selectedModifications,
    linkMeasures = true,
    measures = null,
    deliveryInfo = null,
    paymentInfo = null,
  }) => {
    const client = users.find((user) => user.id === clientId)
    if (!client) {
      return { ok: false, message: 'Cliente no válido para generar el pedido.' }
    }
    if (!design) {
      return { ok: false, message: 'Selecciona un diseño antes de generar el pedido.' }
    }

    const modifications = selectedModifications ?? []
    const extrasTotal = modifications.reduce(
      (total, item) => total + (Number(item.extraCost) || 0),
      0,
    )

    const explicitMeasures =
      measures && typeof measures === 'object'
        ? Object.fromEntries(
            Object.entries(measures).map(([key, value]) => [key, Number(value) || 0]),
          )
        : null

    const orderId = `o-${Math.random().toString(36).slice(2, 9)}`
    const isPaid = !!paymentInfo
    const initialStatus = isPaid ? 'pagado' : 'recibido'

    const order = {
      id: orderId,
      clientId,
      clientName: client.name,
      designId: design.id,
      designName: design.name,
      manufacturerId: design.manufacturerId ?? null,
      manufacturerName: design.manufacturerName ?? '',
      basePrice: Number(design.basePrice) || 0,
      modifications: modifications.map((item) => ({
        id: item.id,
        name: item.name,
        extraCost: Number(item.extraCost) || 0,
      })),
      total: (Number(design.basePrice) || 0) + extrasTotal,
      measures: explicitMeasures ?? (linkMeasures ? { ...(client.measures ?? {}) } : null),
      deliveryInfo,
      paymentInfo,
      status: initialStatus,
      createdAt: nowStamp(),
    }

    setOrders((prev) => [order, ...prev])
    appendLog(
      `Pedido generado por ${client.email}: ${design.name} (${modifications.length} personalizaciones)`,
    )

    // Sprint 5 additions
    const initialHistory = [
      {
        id: `osh-${Math.random().toString(36).slice(2, 9)}`,
        orderId,
        status: 'recibido',
        description: 'Solicitud de confección creada por el cliente',
        createdAt: nowStamp(),
        updatedBy: client.name
      }
    ]
    if (isPaid) {
      initialHistory.push({
        id: `osh-${Math.random().toString(36).slice(2, 9)}`,
        orderId,
        status: 'pendiente_pago',
        description: 'Pendiente de confirmación de pago',
        createdAt: nowStamp(),
        updatedBy: 'Sistema'
      })
      initialHistory.push({
        id: `osh-${Math.random().toString(36).slice(2, 9)}`,
        orderId,
        status: 'pagado',
        description: `Pago confirmado por un monto de $${order.total.toFixed(2)} (Ref Card: ${paymentInfo?.cardNumberMasked || 'N/A'})`,
        createdAt: nowStamp(),
        updatedBy: 'Sistema'
      })
    }
    setOrderStatusHistory((prev) => [...prev, ...initialHistory])

    const newDelivery = {
      id: `del-${Math.random().toString(36).slice(2, 9)}`,
      orderId,
      method: deliveryInfo ? 'envio' : 'retiro',
      company: '',
      trackingNumber: '',
      status: 'pendiente_coordinacion',
      estimatedShippingDate: '',
      estimatedDeliveryDate: '',
      address: deliveryInfo?.reference || '',
      contactName: deliveryInfo?.recipientName || client.name,
      contactPhone: deliveryInfo?.phone || '',
      notes: '',
      cost: 0,
    }
    setDeliveries((prev) => [...prev, newDelivery])

    if (isPaid) {
      const lastDigits = paymentInfo?.cardNumber ? paymentInfo.cardNumber.replace(/\D/g, '').slice(-4) : '1234'
      const newTransaction = {
        id: `t-${Math.random().toString(36).slice(2, 9)}`,
        orderId,
        type: 'pago',
        amount: order.total,
        currency: 'USD',
        paymentMethod: paymentInfo?.method || 'tarjeta',
        status: 'confirmado',
        reference: lastDigits,
        createdAt: nowStamp()
      }
      setTransactions((prev) => [...prev, newTransaction])
    }

    if (order.manufacturerId) {
      addNotification({
        userId: order.manufacturerId,
        type: 'nuevo_pedido',
        title: '¡Nuevo pedido recibido!',
        message: `El cliente ${client.name} ha solicitado tu diseño "${design.name}" por un total de $${order.total.toFixed(2)}.`,
        relatedEntityId: orderId,
        relatedEntityType: 'order',
      })
    }

    return { ok: true, message: 'Pedido generado correctamente.', order }
  }

  const sendOrderMessage = ({
    orderId,
    senderId,
    type = 'text',
    text = '',
    mediaDataUrl = '',
    mediaMime = '',
    mediaName = '',
  }) => {
    const order = orders.find((item) => item.id === orderId)
    if (!order) {
      return { ok: false, message: 'El pedido seleccionado ya no existe.' }
    }

    const sender = users.find((user) => user.id === senderId)
    if (!sender) {
      return { ok: false, message: 'No se pudo validar tu sesión para enviar mensajes.' }
    }

    const isParticipant = senderId === order.clientId || senderId === order.manufacturerId
    if (!isParticipant) {
      return {
        ok: false,
        message: 'Solo el cliente y el fabricante del pedido pueden enviar mensajes.',
      }
    }

    const cleanedText = text.trim()
    const hasMedia = typeof mediaDataUrl === 'string' && mediaDataUrl.length > 0
    if (!cleanedText && !hasMedia) {
      return { ok: false, message: 'Debes escribir un mensaje o adjuntar un archivo.' }
    }

    const normalizedType = type === 'image' || type === 'audio' ? type : 'text'
    const message = {
      id: `msg-${Math.random().toString(36).slice(2, 9)}`,
      orderId,
      senderId,
      senderName: sender.name,
      senderRole: sender.role,
      type: normalizedType,
      text: cleanedText,
      mediaDataUrl: hasMedia ? mediaDataUrl : '',
      mediaMime,
      mediaName,
      createdAt: nowStamp(),
      sentAt: Date.now(),
    }

    setMessages((prev) => [...prev, message])
    appendLog(`Mensaje enviado en pedido ${order.id} por ${sender.email}`)

    // Sprint 5: Notify the other party
    const recipientId = senderId === order.clientId ? order.manufacturerId : order.clientId
    if (recipientId) {
      addNotification({
        userId: recipientId,
        type: 'nuevo_mensaje',
        title: `Nuevo mensaje de ${sender.name}`,
        message: cleanedText || 'Te ha enviado un archivo adjunto.',
        relatedEntityId: orderId,
        relatedEntityType: 'chat',
      })
    }

    return { ok: true, message: 'Mensaje enviado.', chatMessage: message }
  }

  // HU-07: sugerencias para el cliente con sesión activa.
  const suggestedManufacturers = useMemo(() => {
    if (!currentUser || currentUser.role !== 'cliente') return []
    return suggestManufacturers(manufacturers, currentUser.preferences ?? {})
  }, [currentUser, manufacturers])

  const value = {
    users,
    showcases,
    manufacturers,
    catalog,
    orders,
    messages,
    auditLog,
    currentUser,
    suggestedManufacturers,
    login,
    logout,
    register,
    updateUser,
    deleteUser,
    updateShowcase,
    updateMeasures,
    updatePreferences,
    createOrder,
    sendOrderMessage,
    createAdminByPrincipal,
    notifications,
    orderStatusHistory,
    deliveries,
    ratings,
    transactions,
    addNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    updateOrderStatus,
    registerDelivery,
    submitRating,
    addTransaction,
    seedMockOrderForTesting,
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
