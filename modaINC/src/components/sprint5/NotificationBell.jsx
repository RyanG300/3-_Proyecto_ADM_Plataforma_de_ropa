import { useState, useMemo } from 'react'
import { useAppContext } from '../../context/AppContext'
import NotificationDropdown from './NotificationDropdown'

export default function NotificationBell({ onGoToNotifications, onNavigateToOrder }) {
  const { notifications, currentUser } = useAppContext()
  const [isOpen, setIsOpen] = useState(false)

  const unreadCount = useMemo(() => {
    if (!currentUser) return 0
    return notifications.filter((n) => n.userId === currentUser.id && !n.isRead).length
  }, [notifications, currentUser])

  if (!currentUser) return null

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative rounded-full border border-amber-900/20 bg-white p-2 text-amber-900 transition hover:bg-amber-50"
        aria-label="Abrir centro de notificaciones"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount}
          </span>
        )}
      </button>

      <NotificationDropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onGoToNotifications={onGoToNotifications}
        onNavigateToOrder={onNavigateToOrder}
      />
    </div>
  )
}
