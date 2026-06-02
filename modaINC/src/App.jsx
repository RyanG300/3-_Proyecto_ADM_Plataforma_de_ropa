import { useState } from 'react'
import TopBar from './components/layout/TopBar'
import { AppProvider, useAppContext } from './context/AppContext'
import HomePage from './pages/HomePage'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import ShowcasePage from './pages/ShowcasePage'

function AppContent() {
  const [view, setView] = useState('home')
  const [activeShowcaseId, setActiveShowcaseId] = useState(null)
  const {
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
          setView('home')
        }}
      />

      <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-8">
        {view === 'home' ? (
          <HomePage
            catalog={catalog}
            manufacturers={manufacturers}
            onGoLogin={() => setView('login')}
            onOpenShowcase={openShowcase}
          />
        ) : view === 'login' ? (
          <LoginPage onLogin={onLogin} onRegister={register} />
        ) : view === 'showcase' ? (
          <ShowcasePage showcase={activeShowcase} onBack={() => setView('home')} />
        ) : (
          <DashboardPage
            currentUser={currentUser}
            users={users}
            showcases={showcases}
            catalog={catalog}
            auditLog={auditLog}
            updateUser={updateUser}
            deleteUser={deleteUser}
            updateShowcase={updateShowcase}
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
