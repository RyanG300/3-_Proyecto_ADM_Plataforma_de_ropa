import AdminPanel from '../components/admin/AdminPanel'
import ClientePanel from '../components/customer/ClientePanel'
import FabricantePanel from '../components/manufacturer/FabricantePanel'

export default function DashboardPage({
  currentUser,
  users,
  showcases,
  catalog,
  orders,
  messages,
  auditLog,
  updateUser,
  deleteUser,
  updateShowcase,
  updateMeasures,
  updatePreferences,
  createOrder,
  sendOrderMessage,
  createAdminByPrincipal,
  onNavigateToOrder,
  onGoToHistory,
}) {
  if (!currentUser) {
    return (
      <section className="rounded-2xl border border-amber-900/10 bg-white p-6 text-amber-900">
        Debes iniciar sesión para ingresar al panel.
      </section>
    )
  }

  if (currentUser.role === 'admin') {
    return (
      <AdminPanel
        currentUser={currentUser}
        users={users}
        showcases={showcases}
        auditLog={auditLog}
        updateUser={updateUser}
        deleteUser={deleteUser}
        updateShowcase={updateShowcase}
        createAdminByPrincipal={createAdminByPrincipal}
      />
    )
  }

  if (currentUser.role === 'fabricante') {
    return (
      <FabricantePanel
        currentUser={currentUser}
        users={users}
        showcases={showcases}
        orders={orders}
        messages={messages}
        sendOrderMessage={sendOrderMessage}
        updateShowcase={updateShowcase}
        onNavigateToOrder={onNavigateToOrder}
        onGoToHistory={onGoToHistory}
      />
    )
  }

  return (
    <ClientePanel
      currentUser={currentUser}
      users={users}
      catalog={catalog}
      orders={orders}
      messages={messages}
      updateMeasures={updateMeasures}
      updatePreferences={updatePreferences}
      createOrder={createOrder}
      sendOrderMessage={sendOrderMessage}
      onNavigateToOrder={onNavigateToOrder}
      onGoToHistory={onGoToHistory}
    />
  )
}
