import { useMemo } from 'react'
import { useAppContext } from '../../context/AppContext'

export default function NotificationDropdown({ isOpen, onClose, onGoToNotifications, onNavigateToOrder }) {
  const {
    notifications,
    currentUser,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useAppContext()

  const myNotifications = useMemo(() => {
    if (!currentUser) return []
    return notifications.filter((n) => n.userId === currentUser.id)
  }, [notifications, currentUser])

  const recentNotifications = useMemo(() => {
    return myNotifications.slice(0, 5)
  }, [myNotifications])

  const unreadCount = useMemo(() => {
    return myNotifications.filter((n) => !n.isRead).length
  }, [myNotifications])

  if (!isOpen) return null

  const handleItemClick = (n) => {
    markNotificationAsRead(n.id)
    onClose()
    if (n.relatedEntityId) {
      onNavigateToOrder(n.relatedEntityId)
    }
  }

  const handleMarkAllRead = (e) => {
    e.stopPropagation()
    if (currentUser) {
      markAllNotificationsAsRead(currentUser.id)
    }
  }

  return (
    <>
      {/* Backdrop overlay for closing */}
      <div className="fixed inset-0 z-30" onClick={onClose} />

      <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-amber-900/10 bg-white p-2 shadow-lg z-40 animate-fade-in text-left">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-900/5 px-3 py-2">
          <span className="font-serif text-sm font-bold text-amber-950">Notificaciones</span>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="text-[10px] font-bold uppercase tracking-wider text-amber-900 hover:underline"
            >
              Marcar todo leído
            </button>
          )}
        </div>

        {/* List */}
        <div className="max-h-64 overflow-y-auto py-1 divide-y divide-amber-900/5">
          {recentNotifications.length ? (
            recentNotifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleItemClick(n)}
                className={`flex gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition hover:bg-amber-50/50 ${!n.isRead ? 'bg-amber-50/20' : ''}`}
              >
                {/* Dot */}
                {!n.isRead && (
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber-600 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold text-amber-950 truncate ${!n.isRead ? 'font-bold' : ''}`}>
                    {n.title}
                  </p>
                  <p className="mt-0.5 text-3xs text-amber-900/70 truncate">
                    {n.message}
                  </p>
                  <span className="mt-1 block text-[9px] text-amber-900/40">
                    {n.createdAt}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-6 text-center text-xs text-amber-900/50 italic">
              No tienes notificaciones.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-amber-900/5 px-2 py-1.5 text-center">
          <button
            type="button"
            onClick={() => {
              onGoToNotifications()
              onClose()
            }}
            className="w-full text-xs font-bold uppercase tracking-wider text-amber-900 hover:underline"
          >
            Ver todas las notificaciones
          </button>
        </div>
      </div>
    </>
  )
}
