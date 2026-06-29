import { useState, useMemo } from 'react'
import { useAppContext } from '../../context/AppContext'

const NOTIFICATION_TYPE_LABELS = {
  nuevo_pedido: 'Pedido',
  nuevo_mensaje: 'Mensaje',
  cambio_estado: 'Estado',
  pedido_listo: 'Listo',
  pedido_enviado: 'Enviado',
  pedido_entregado: 'Entregado',
  calificacion_solicitada: 'Calificación',
  calificacion_recibida: 'Calificación',
  cotizacion_recibida: 'Cotización',
  cotizacion_aprobada: 'Cotización',
  cotizacion_rechazada: 'Cotización',
  pago_confirmado: 'Pago',
  pago_fallido: 'Pago',
  actualizacion_entrega: 'Entrega',
}

const CATEGORY_MAP = {
  all: 'Todas',
  unread: 'No leídas',
  orders: 'Pedidos',
  messages: 'Mensajes',
  payments: 'Pagos',
  deliveries: 'Entregas',
}

export default function NotificationsPage({ onBack, onNavigateToOrder }) {
  const {
    notifications,
    currentUser,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
  } = useAppContext()

  const [activeCategory, setActiveCategory] = useState('all')

  const myNotifications = useMemo(() => {
    if (!currentUser) return []
    return notifications.filter((n) => n.userId === currentUser.id)
  }, [notifications, currentUser])

  const filteredNotifications = useMemo(() => {
    switch (activeCategory) {
      case 'unread':
        return myNotifications.filter((n) => !n.isRead)
      case 'orders':
        return myNotifications.filter((n) => ['nuevo_pedido', 'cambio_estado', 'pedido_listo'].includes(n.type))
      case 'messages':
        return myNotifications.filter((n) => n.type === 'nuevo_mensaje')
      case 'payments':
        return myNotifications.filter((n) => ['pago_confirmado', 'pago_fallido'].includes(n.type))
      case 'deliveries':
        return myNotifications.filter((n) => ['pedido_enviado', 'pedido_entregado', 'actualizacion_entrega'].includes(n.type))
      default:
        return myNotifications
    }
  }, [myNotifications, activeCategory])

  const unreadCount = useMemo(() => {
    return myNotifications.filter((n) => !n.isRead).length
  }, [myNotifications])

  const handleNotificationClick = (n) => {
    markNotificationAsRead(n.id)
    if (n.relatedEntityId) {
      onNavigateToOrder(n.relatedEntityId)
    }
  }

  const handleMarkAllRead = () => {
    if (currentUser) {
      markAllNotificationsAsRead(currentUser.id)
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'nuevo_pedido':
        return (
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </span>
        )
      case 'nuevo_mensaje':
        return (
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </span>
        )
      case 'cambio_estado':
      case 'pedido_listo':
        return (
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </span>
        )
      case 'pago_confirmado':
        return (
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
        )
      case 'pedido_enviado':
      case 'actualizacion_entrega':
        return (
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a1 1 0 00.707-.293l2.414-2.414a1 1 0 01.707-.293H20" />
            </svg>
          </span>
        )
      default:
        return (
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </span>
        )
    }
  }

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-amber-900/10 bg-white p-5 md:p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl border border-amber-900/20 bg-amber-50/50 p-2 text-amber-900 transition hover:bg-amber-100"
            aria-label="Volver"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="font-serif text-xl font-bold text-amber-950 md:text-2xl">
              Centro de Notificaciones
            </h1>
            <p className="text-xs text-amber-900/70 md:text-sm">
              Tienes {unreadCount} notificaciones sin leer
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="rounded-xl border border-amber-900/20 bg-white px-4 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-50"
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      {/* Main Layout */}
      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        
        {/* Categories Sidebar */}
        <aside className="h-fit rounded-3xl border border-amber-900/10 bg-white p-4 space-y-1 shadow-sm">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-amber-900/40">Filtros</p>
          {Object.entries(CATEGORY_MAP).map(([key, label]) => {
            const isActive = activeCategory === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveCategory(key)}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition flex justify-between items-center ${isActive ? 'bg-amber-900 text-amber-50' : 'text-amber-900/80 hover:bg-amber-50'}`}
              >
                <span>{label}</span>
                {key === 'unread' && unreadCount > 0 && (
                  <span className={`rounded-full px-2 py-0.5 text-2xs font-bold ${isActive ? 'bg-amber-50 text-amber-950' : 'bg-red-500 text-white'}`}>
                    {unreadCount}
                  </span>
                )}
              </button>
            )
          })}
        </aside>

        {/* Notifications List */}
        <section className="rounded-3xl border border-amber-900/10 bg-white p-5 md:p-6 shadow-sm">
          {filteredNotifications.length ? (
            <div className="divide-y divide-amber-900/10 space-y-3 pt-1">
              {filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`group relative flex gap-4 p-4 rounded-2xl border transition cursor-pointer ${!n.isRead ? 'border-amber-900/20 bg-amber-50/20 shadow-2xs' : 'border-transparent bg-white hover:bg-amber-50/10'}`}
                >
                  {/* Unread indicator dot */}
                  {!n.isRead && (
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 flex h-2 w-2 rounded-full bg-amber-600" />
                  )}
                  
                  {/* Icon */}
                  <div className="pl-2">
                    {getNotificationIcon(n.type)}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                      <h4 className={`text-sm font-semibold text-amber-950 truncate ${!n.isRead ? 'font-bold' : ''}`}>
                        {n.title}
                      </h4>
                      <span className="text-2xs text-amber-900/40 shrink-0 font-medium">
                        {n.createdAt}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-amber-900/75 leading-relaxed">
                      {n.message}
                    </p>
                    
                    {n.relatedEntityId && (
                      <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-900 hover:underline">
                        Ver recurso relacionado
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    )}
                  </div>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteNotification(n.id)
                    }}
                    className="self-center p-1.5 rounded-lg text-amber-900/30 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition"
                    title="Eliminar notificación"
                  >
                    <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-amber-900/50">
              <svg className="mx-auto h-12 w-12 text-amber-950/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <h3 className="mt-4 font-serif text-base font-semibold text-amber-950">Sin notificaciones</h3>
              <p className="mt-1 text-xs">No se encontraron notificaciones en esta categoría.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
