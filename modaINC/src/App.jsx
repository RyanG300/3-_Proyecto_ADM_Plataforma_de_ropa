import { useState } from 'react'
import TopBar from './components/layout/TopBar'
import { AppProvider, useAppContext } from './context/AppContext'
import HomePage from './pages/HomePage'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import ShowcasePage from './pages/ShowcasePage'
import CustomizationPage from './pages/CustomizationPage'

function AppContent() {
  const [view, setView] = useState('home')
  const [activeShowcaseId, setActiveShowcaseId] = useState(null)
  const [customizationTarget, setCustomizationTarget] = useState(null)
  const {
    users,
    showcases,
    manufacturers,
    catalog,
    orders,
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
    setView('customization')
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
          setView('home')
        }}
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
            onCreateOrder={({ design, selectedModifications, measures }) =>
              currentUser
                ? createOrder({
                    clientId: currentUser.id,
                    design,
                    selectedModifications,
                    measures,
                    linkMeasures: false,
                  })
                : { ok: false, message: 'Debes iniciar sesión como cliente.' }
            }
          />
        ) : (
          <DashboardPage
            currentUser={currentUser}
            users={users}
            showcases={showcases}
            catalog={catalog}
            orders={orders}
            auditLog={auditLog}
            updateUser={updateUser}
            deleteUser={deleteUser}
            updateShowcase={updateShowcase}
            updateMeasures={updateMeasures}
            updatePreferences={updatePreferences}
            createOrder={createOrder}
            createAdminByPrincipal={createAdminByPrincipal}
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
