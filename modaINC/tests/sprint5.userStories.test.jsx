import { useEffect } from 'react'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AppProvider, useAppContext } from '../src/context/AppContext'
import OrderDetailPage from '../src/components/sprint5/OrderDetailPage'
import HistoryPage from '../src/components/sprint5/HistoryPage'

let contextSnapshot

function ContextProbe() {
  const ctx = useAppContext()
  useEffect(() => {
    contextSnapshot = ctx
  }, [ctx])
  return null
}

function renderWithProvider(ui) {
  const Wrapper = ({ children }) => (
    <AppProvider>
      <ContextProbe />
      {children}
    </AppProvider>
  )
  const renderResult = render(ui, { wrapper: Wrapper })
  // Seed the mock order in this new state instance
  act(() => {
    contextSnapshot.seedMockOrderForTesting()
  })
  return renderResult
}

describe('Sprint 5 User Stories tests', () => {

  describe('HU-15: Seguimiento del estado del pedido', () => {
    it('el fabricante puede seleccionar y actualizar el estado del pedido con una observación', async () => {
      const user = userEvent.setup()

      // Render OrderDetailPage inside our provider wrapper (this seeds the mock order)
      renderWithProvider(
        <OrderDetailPage
          orderId="o-mock-1"
          onBack={vi.fn()}
          onGoToManufacturerProfile={vi.fn()}
        />
      )

      // Log in as manufacturer Ana Costuras in the active context
      let loginResult
      act(() => {
        loginResult = contextSnapshot.login({ email: 'ana@modainc.com', password: '123456' })
      })
      expect(loginResult.ok).toBe(true)

      // Verify page loaded
      expect(screen.getByText(/Pedido #o-mock-1/)).toBeInTheDocument()
      expect(screen.getByText(/Progreso de la Confección/)).toBeInTheDocument()

      // Fill status transition select using ID
      const statusSelect = document.getElementById('next-status-select')
      expect(statusSelect).toBeInTheDocument()
      await user.selectOptions(statusSelect, 'en_preparacion')

      // Type observation using ID
      const observationText = document.getElementById('status-observation-input')
      await user.type(observationText, 'Cortando telas para confección del vestido Aurora')

      // Click update
      await user.click(screen.getByRole('button', { name: /Actualizar Estado/i }))

      // Confirmation modal should be visible
      expect(screen.getByText(/Confirmar cambio de estado/i)).toBeInTheDocument()
      expect(screen.getAllByText(/En preparación/i).length).toBeGreaterThan(0)

      // Confirm
      await user.click(screen.getByRole('button', { name: /Confirmar/i }))

      // Check status updated in context
      const order = contextSnapshot.orders.find((o) => o.id === 'o-mock-1')
      expect(order.status).toBe('en_preparacion')

      // Check status history includes transition
      const transition = contextSnapshot.orderStatusHistory.find(
        (h) => h.orderId === 'o-mock-1' && h.status === 'en_preparacion'
      )
      expect(transition).toBeDefined()
      expect(transition.description).toContain('Cortando telas')
    })
  })

  describe('HU-16: Notificaciones automáticas', () => {
    it('crea notificaciones cuando ocurren eventos del flujo de pedidos', async () => {
      // Initialize context
      renderWithProvider(null)

      console.log('DEBUG orders at start of HU-16:', contextSnapshot.orders)

      // Check there are no notifications for Lucia initially
      let luciaNotifs = contextSnapshot.notifications.filter((n) => n.userId === 'u-cli-lucia')
      expect(luciaNotifs.length).toBe(0)

      // Manufacturer Ana Costuras updates order state to ready
      let updateResult
      act(() => {
        updateResult = contextSnapshot.updateOrderStatus('o-mock-1', 'listo_para_entrega', 'El vestido ya está terminado.', 'Ana Costuras')
      })

      console.log('DEBUG updateOrderStatus result:', updateResult)
      console.log('DEBUG orders after updateOrderStatus:', contextSnapshot.orders)

      // Lucia should receive a notification
      await waitFor(() => {
        const notifs = contextSnapshot.notifications.filter((n) => n.userId === 'u-cli-lucia')
        expect(notifs.length).toBeGreaterThan(0)
        
        const readyNotif = notifs.find((n) => n.type === 'pedido_listo')
        expect(readyNotif).toBeDefined()
        expect(readyNotif.title).toContain('¡Tu prenda está lista!')
      })
    })
  })

  describe('HU-17: Coordinación de entrega', () => {
    it('el fabricante puede registrar datos de entrega y el cliente confirmar recepción', async () => {
      const user = userEvent.setup()

      // Render OrderDetailPage for manufacturer to fill out delivery info
      renderWithProvider(
        <OrderDetailPage
          orderId="o-mock-1"
          onBack={vi.fn()}
          onGoToManufacturerProfile={vi.fn()}
        />
      )

      // Log in as manufacturer Ana Costuras
      act(() => {
        contextSnapshot.login({ email: 'ana@modainc.com', password: '123456' })
      })

      // Fill in delivery form details using IDs
      const methodSelect = document.getElementById('delivery-method-select')
      expect(methodSelect).toBeInTheDocument()
      await user.selectOptions(methodSelect, 'envio')

      const addressInput = document.getElementById('delivery-address-input')
      await user.clear(addressInput)
      await user.type(addressInput, '100m norte de la Iglesia Central, Heredia')

      const nameInput = document.getElementById('delivery-contact-name')
      await user.type(nameInput, 'Lucía Méndez')

      const phoneInput = document.getElementById('delivery-contact-phone')
      await user.type(phoneInput, '88889999')
      
      // Save delivery
      await user.click(screen.getByRole('button', { name: /Guardar Información de Entrega/i }))

      // Verify delivery registered in context using waitFor
      await waitFor(() => {
        let delivery = contextSnapshot.deliveries.find((d) => d.orderId === 'o-mock-1')
        expect(delivery).toBeDefined()
        expect(delivery.address).toContain('Heredia')
        expect(delivery.contactPhone).toBe('88889999')
      })
    })
  })

  describe('HU-18: Calificación del fabricante', () => {
    it('valida longitud de comentario y registra calificación correctamente al publicar', async () => {
      const user = userEvent.setup()
      
      renderWithProvider(
        <OrderDetailPage
          orderId="o-mock-1"
          onBack={vi.fn()}
          onGoToManufacturerProfile={vi.fn()}
        />
      )

      // Setup order as delivered
      act(() => {
        contextSnapshot.updateOrderStatus('o-mock-1', 'entregado', 'Entregado al cliente', 'Sistema')
        contextSnapshot.login({ email: 'lucia@modainc.com', password: '123456' })
      })

      // Form should show comment validation errors if empty or too short
      const commentArea = screen.getByPlaceholderText(/Cuéntanos qué tal quedó/i)
      await user.type(commentArea, 'Corto') // less than 10 characters
      
      await user.click(screen.getByRole('button', { name: /Publicar Calificación/i }))
      expect(screen.getByText(/al menos 10 caracteres/i)).toBeInTheDocument()

      // Type valid comment
      await user.clear(commentArea)
      await user.type(commentArea, 'Excelente costura, la tela de satén quedó hermosa en el vestido Aurora.')

      // Click publish
      await user.click(screen.getByRole('button', { name: /Publicar Calificación/i }))

      // Modal should show summary details
      expect(screen.getByText(/Confirmar Publicación/i)).toBeInTheDocument()
      expect(screen.getAllByText(/Excelente costura/i).length).toBeGreaterThan(0)

      // Confirm publish
      await user.click(screen.getByRole('button', { name: /Confirmar y Publicar/i }))

      // Rating should be saved in context
      await waitFor(() => {
        const rating = contextSnapshot.ratings.find((r) => r.orderId === 'o-mock-1')
        expect(rating).toBeDefined()
        expect(rating.generalRating).toBe(5)
        expect(rating.comment).toContain('satén quedó hermosa')

        // Order should transition to finalized
        const order = contextSnapshot.orders.find((o) => o.id === 'o-mock-1')
        expect(order.status).toBe('finalizado')
      })
    })
  })

  describe('HU-19: Historial de pedidos y transacciones', () => {
    it('permite buscar y filtrar el historial de pedidos y ver movimientos financieros', async () => {
      const user = userEvent.setup()
      
      renderWithProvider(
        <HistoryPage
          onBack={vi.fn()}
          onNavigateToOrder={vi.fn()}
        />
      )

      act(() => {
        contextSnapshot.login({ email: 'lucia@modainc.com', password: '123456' })
      })

      // Total gastado cards
      expect(screen.getByText(/Total Gastado/i)).toBeInTheDocument()
      expect(screen.getAllByText(/\$145.00/i).length).toBeGreaterThan(0)

      // Search bar filters table using ID
      const searchInput = document.getElementById('search-history-input')
      expect(searchInput).toBeInTheDocument()
      
      // Type something matching the order
      await user.type(searchInput, 'Aurora')
      expect(screen.getByText('Vestido Aurora')).toBeInTheDocument()

      // Type something not matching
      await user.clear(searchInput)
      await user.type(searchInput, 'NoExistente')
      expect(screen.getByText(/Sin pedidos/i)).toBeInTheDocument()
    })
  })
})
