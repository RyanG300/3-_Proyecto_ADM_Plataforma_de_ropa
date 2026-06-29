import { useState } from 'react'
import TopBar from './components/layout/TopBar'
import { AppProvider, useAppContext } from './context/AppContext'
import HomePage from './pages/HomePage'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import ShowcasePage from './pages/ShowcasePage'
import CustomizationPage from './pages/CustomizationPage'
import CheckoutPage from './pages/CheckoutPage'
import OrderDetailPage from './components/sprint5/OrderDetailPage'
import NotificationsPage from './components/sprint5/NotificationsPage'
import HistoryPage from './components/sprint5/HistoryPage'

function AppContent() {
  const [view, setView] = useState('home')
  const [activeShowcaseId, setActiveShowcaseId] = useState(null)
  const [customizationTarget, setCustomizationTarget] = useState(null)
  const [checkoutDraft, setCheckoutDraft] = useState(null)
  const [activeOrderId, setActiveOrderId] = useState(null)

  const {
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
  } = useAppContext()

  const onLogin = (credentials) => {
    const result = login(credentials)
    if (result.ok) {
      setView('dashboard')
    }
    return result
  }

  const openShowcase = (showcaseId) => {
    setActiveShowcaseId(showcaseId)
    setView('showcase')
  }

  const openCustomization = ({ showcaseId, designId }) => {
    const showcase = manufacturers.find((item) => item.id === showcaseId)
    const design = showcase?.designs?.find((item) => item.id === designId)
    if (!showcase || !design) return

    setCustomizationTarget({
      showcaseId,
      showcaseName: showcase.businessName,
      design: {
        ...design,
        manufacturerId: showcase.manufacturerId,
        manufacturerName: showcase.businessName,
      },
    })
    setCheckoutDraft(null)
    setView('customization')
  }

  const openCheckout = ({ design, selectedModifications, measures, total }) => {
    if (!design) return

    setCheckoutDraft({
      design,
      selectedModifications: selectedModifications ?? [],
      measures: measures ?? null,
      total: Number(total) || 0,
    })
    setView('checkout')
  }

  const activeShowcase = manufacturers.find((item) => item.id === activeShowcaseId) ?? null

  return (
    <div className="min-h-screen bg-[#fff8ef] text-amber-950">
      <TopBar
        currentUser={currentUser}
        onGoHome={() => setView('home')}
        onGoLogin={() => setView('login')}
        onGoDashboard={() => setView('dashboard')}
        onLogout={() => {
          logout()
          setCustomizationTarget(null)
          setCheckoutDraft(null)
          setView('home')
        }}
        onGoToNotifications={() => setView('notifications')}
        onNavigateToOrder={(id) => {
          setActiveOrderId(id)
          setView('order-detail')
        }}
        onGoToHistory={() => setView('history')}
      />

      <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-8">
        {view === 'home' ? (
          <HomePage
            catalog={catalog}
            manufacturers={manufacturers}
            currentUser={currentUser}
            suggestedManufacturers={suggestedManufacturers}
            onGoLogin={() => setView('login')}
            onOpenShowcase={openShowcase}
          />
        ) : view === 'login' ? (
          <LoginPage onLogin={onLogin} onRegister={register} />
        ) : view === 'showcase' ? (
          <ShowcasePage
            showcase={activeShowcase}
            currentUser={currentUser}
            onBack={() => setView('home')}
            onGoLogin={() => setView('login')}
            onCustomizeDesign={openCustomization}
          />
        ) : view === 'customization' ? (
          <CustomizationPage
            currentUser={currentUser}
            target={customizationTarget}
            onBack={() => setView('showcase')}
            onGoLogin={() => setView('login')}
            onSaveMeasures={(measures) =>
              currentUser ? updateMeasures(currentUser.id, measures) : null
            }
            onProceedToCheckout={({ design, selectedModifications, measures, total }) =>
              openCheckout({
                design,
                selectedModifications,
                measures,
                total,
              })
            }
          />
        ) : view === 'checkout' ? (
          <CheckoutPage
            currentUser={currentUser}
            draft={checkoutDraft}
            onBackToCustomization={() => setView('customization')}
            onBackToShowcase={() => setView('showcase')}
            onGoLogin={() => setView('login')}
            onConfirmOrder={({ design, selectedModifications, measures, delivery, payment }) =>
              currentUser
                ? createOrder({
                    clientId: currentUser.id,
                    design,
                    selectedModifications,
                    measures,
                    linkMeasures: false,
                    deliveryInfo: delivery,
                    paymentInfo: payment,
                  })
                : { ok: false, message: 'Debes iniciar sesión como cliente.' }
            }
          />
        ) : view === 'order-detail' ? (
          <OrderDetailPage
            orderId={activeOrderId}
            onBack={() => setView('dashboard')}
            onGoToManufacturerProfile={openShowcase}
          />
        ) : view === 'notifications' ? (
          <NotificationsPage
            onBack={() => setView('dashboard')}
            onNavigateToOrder={(id) => {
              setActiveOrderId(id)
              setView('order-detail')
            }}
          />
        ) : view === 'history' ? (
          <HistoryPage
            onBack={() => setView('dashboard')}
            onNavigateToOrder={(id) => {
              setActiveOrderId(id)
              setView('order-detail')
            }}
          />
        ) : (
          <DashboardPage
            currentUser={currentUser}
            users={users}
            showcases={showcases}
            catalog={catalog}
            orders={orders}
            messages={messages}
            auditLog={auditLog}
            updateUser={updateUser}
            deleteUser={deleteUser}
            updateShowcase={updateShowcase}
            updateMeasures={updateMeasures}
            updatePreferences={updatePreferences}
            createOrder={createOrder}
            sendOrderMessage={sendOrderMessage}
            createAdminByPrincipal={createAdminByPrincipal}
            onNavigateToOrder={(id) => {
              setActiveOrderId(id)
              setView('order-detail')
            }}
            onGoToHistory={() => setView('history')}
          />
        )}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
