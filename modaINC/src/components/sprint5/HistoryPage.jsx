import { useState, useMemo } from 'react'
import { useAppContext } from '../../context/AppContext'
import { STATUS_LABELS } from './OrderDetailPage'

const PAYMENT_STATUS_LABELS = {
  pagado: 'Pagado',
  pendiente: 'Pendiente',
  fallido: 'Fallido',
}

export default function HistoryPage({ onBack, onNavigateToOrder }) {
  const {
    orders,
    currentUser,
    deliveries,
    ratings,
    transactions,
  } = useAppContext()

  const [activeTab, setActiveTab] = useState('orders')

  // Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState('')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('')
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState('')
  const [ratingFilter, setRatingFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [sortBy, setSortBy] = useState('newest')

  const isClient = currentUser?.role === 'cliente'
  const isManufacturer = currentUser?.role === 'fabricante'

  // User scoped data
  const myOrders = useMemo(() => {
    if (!currentUser) return []
    if (isClient) {
      return orders.filter((o) => o.clientId === currentUser.id)
    }
    if (isManufacturer) {
      return orders.filter((o) => o.manufacturerId === currentUser.id)
    }
    return []
  }, [orders, currentUser, isClient, isManufacturer])

  const myOrderIds = useMemo(() => myOrders.map((o) => o.id), [myOrders])

  const myTransactions = useMemo(() => {
    return transactions.filter((t) => myOrderIds.includes(t.orderId))
  }, [transactions, myOrderIds])

  // Summaries Calculations
  const summaries = useMemo(() => {
    const totalCount = myOrders.length
    const activeCount = myOrders.filter((o) => !['finalizado', 'cancelado', 'entregado'].includes(o.status)).length
    const finalizedCount = myOrders.filter((o) => ['finalizado', 'entregado'].includes(o.status)).length
    
    const financialSum = myOrders
      .filter((o) => o.status !== 'cancelado')
      .reduce((sum, o) => sum + o.total, 0)

    return {
      totalCount,
      activeCount,
      finalizedCount,
      financialSum,
    }
  }, [myOrders])

  // Helper to resolve delivery status
  const getDeliveryStatus = (orderId) => {
    const d = deliveries.find((del) => del.orderId === orderId)
    return d?.status ?? 'pendiente_coordinacion'
  }

  // Helper to check if rated
  const isOrderRated = (orderId) => {
    return ratings.some((r) => r.orderId === orderId)
  }

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    let result = [...myOrders]

    // Text Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.designName.toLowerCase().includes(q) ||
          (isClient && o.manufacturerName?.toLowerCase().includes(q)) ||
          (isManufacturer && o.clientName?.toLowerCase().includes(q))
      )
    }

    // Order Status
    if (orderStatusFilter) {
      result = result.filter((o) => o.status === orderStatusFilter)
    }

    // Payment Status
    if (paymentStatusFilter) {
      result = result.filter((o) => {
        const hasPayment = !!o.paymentInfo
        const status = hasPayment ? 'pagado' : 'pendiente'
        return status === paymentStatusFilter
      })
    }

    // Delivery Status
    if (deliveryStatusFilter) {
      result = result.filter((o) => getDeliveryStatus(o.id) === deliveryStatusFilter)
    }

    // Rating status
    if (ratingFilter) {
      result = result.filter((o) => {
        const rated = isOrderRated(o.id)
        return ratingFilter === 'rated' ? rated : !rated
      })
    }

    // Amount Range
    if (minAmount) {
      result = result.filter((o) => o.total >= Number(minAmount))
    }
    if (maxAmount) {
      result = result.filter((o) => o.total <= Number(maxAmount))
    }

    // Date Range
    if (startDate) {
      result = result.filter((o) => {
        const orderDate = new Date(o.createdAt.split(',')[0].split('/').reverse().join('-'))
        const startLimit = new Date(startDate)
        return orderDate >= startLimit
      })
    }
    if (endDate) {
      result = result.filter((o) => {
        const orderDate = new Date(o.createdAt.split(',')[0].split('/').reverse().join('-'))
        const endLimit = new Date(endDate)
        return orderDate <= endLimit
      })
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt)
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt) - new Date(b.createdAt)
      }
      if (sortBy === 'highest_amount') {
        return b.total - a.total
      }
      if (sortBy === 'lowest_amount') {
        return a.total - b.total
      }
      if (sortBy === 'status') {
        return a.status.localeCompare(b.status)
      }
      return 0
    })

    return result
  }, [myOrders, searchQuery, orderStatusFilter, paymentStatusFilter, deliveryStatusFilter, ratingFilter, minAmount, maxAmount, startDate, endDate, sortBy])

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    let result = [...myTransactions]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          t.orderId.toLowerCase().includes(q) ||
          t.reference.toLowerCase().includes(q)
      )
    }

    // Sort transactions by date (newest first)
    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    return result
  }, [myTransactions, searchQuery])

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
              Historial de Pedidos y Transacciones
            </h1>
            <p className="text-xs text-amber-900/70 md:text-sm">
              Consulta tus transacciones, pagos y avance en la plataforma.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-amber-900/10 bg-white p-4 shadow-sm text-center">
          <p className="text-2xs font-bold uppercase tracking-wider text-amber-900/50">Total Pedidos</p>
          <p className="mt-1 font-serif text-2xl font-bold text-amber-950">{summaries.totalCount}</p>
        </div>
        <div className="rounded-2xl border border-amber-900/10 bg-white p-4 shadow-sm text-center">
          <p className="text-2xs font-bold uppercase tracking-wider text-amber-900/50">Pedidos Activos</p>
          <p className="mt-1 font-serif text-2xl font-bold text-amber-950">{summaries.activeCount}</p>
        </div>
        <div className="rounded-2xl border border-amber-900/10 bg-white p-4 shadow-sm text-center">
          <p className="text-2xs font-bold uppercase tracking-wider text-amber-900/50">Finalizados</p>
          <p className="mt-1 font-serif text-2xl font-bold text-amber-950">{summaries.finalizedCount}</p>
        </div>
        <div className="rounded-2xl border border-amber-900/10 bg-white p-4 shadow-sm text-center bg-amber-50/20">
          <p className="text-2xs font-bold uppercase tracking-wider text-amber-900/50">
            {isClient ? 'Total Gastado' : 'Total Recibido'}
          </p>
          <p className="mt-1 font-serif text-2xl font-bold text-amber-950">${summaries.financialSum.toFixed(2)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-amber-900/10">
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${activeTab === 'orders' ? 'border-amber-900 text-amber-950' : 'border-transparent text-amber-900/60 hover:text-amber-950'}`}
        >
          Historial de Pedidos
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${activeTab === 'transactions' ? 'border-amber-900 text-amber-950' : 'border-transparent text-amber-900/60 hover:text-amber-950'}`}
        >
          Historial de Transacciones
        </button>
      </div>

      {/* Filters Area */}
      <div className="rounded-3xl border border-amber-900/10 bg-white p-5 md:p-6 shadow-sm space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {/* Search bar */}
          <div className="grid gap-1">
            <label htmlFor="search-history-input" className="text-xs font-semibold text-amber-950">Buscar</label>
            <input
              id="search-history-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'orders' ? "N° pedido, prenda, usuario..." : "ID trx, N° pedido, referencia..."}
              className="rounded-xl border border-amber-900/20 px-3 py-2 text-xs outline-none bg-amber-50/10 focus:border-amber-700"
            />
          </div>

          {activeTab === 'orders' && (
            <>
              {/* Order Status Filter */}
              <div className="grid gap-1">
                <label htmlFor="status-filter-select" className="text-xs font-semibold text-amber-950">Estado Pedido</label>
                <select
                  id="status-filter-select"
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="rounded-xl border border-amber-900/20 px-3 py-1.5 text-xs outline-none bg-white focus:border-amber-700"
                >
                  <option value="">Todos los estados</option>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              {/* Payment Status Filter */}
              <div className="grid gap-1">
                <label htmlFor="payment-filter-select" className="text-xs font-semibold text-amber-950">Estado Pago</label>
                <select
                  id="payment-filter-select"
                  value={paymentStatusFilter}
                  onChange={(e) => setPaymentStatusFilter(e.target.value)}
                  className="rounded-xl border border-amber-900/20 px-3 py-1.5 text-xs outline-none bg-white focus:border-amber-700"
                >
                  <option value="">Todos</option>
                  <option value="pagado">Pagado</option>
                  <option value="pendiente">Pendiente</option>
                </select>
              </div>

              {/* Delivery Status Filter */}
              <div className="grid gap-1">
                <label htmlFor="delivery-filter-select" className="text-xs font-semibold text-amber-950">Estado Entrega</label>
                <select
                  id="delivery-filter-select"
                  value={deliveryStatusFilter}
                  onChange={(e) => setDeliveryStatusFilter(e.target.value)}
                  className="rounded-xl border border-amber-900/20 px-3 py-1.5 text-xs outline-none bg-white focus:border-amber-700"
                >
                  <option value="">Todos</option>
                  <option value="pendiente_coordinacion">Pendiente de coordinación</option>
                  <option value="preparando_envio">Preparando envío</option>
                  <option value="listo_retiro">Listo para retirar</option>
                  <option value="enviado">Enviado</option>
                  <option value="entregado">Entregado</option>
                  <option value="fallido">Entrega fallida</option>
                </select>
              </div>

              {/* Rating status Filter */}
              <div className="grid gap-1">
                <label htmlFor="rating-filter-select" className="text-xs font-semibold text-amber-950">Calificación</label>
                <select
                  id="rating-filter-select"
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                  className="rounded-xl border border-amber-900/20 px-3 py-1.5 text-xs outline-none bg-white focus:border-amber-700"
                >
                  <option value="">Todos</option>
                  <option value="rated">Calificado</option>
                  <option value="pending_rating">Pendiente de calificar</option>
                </select>
              </div>

              {/* Sorting Filter */}
              <div className="grid gap-1">
                <label className="text-xs font-semibold text-amber-950">Ordenar por</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-xl border border-amber-900/20 px-3 py-1.5 text-xs outline-none bg-white focus:border-amber-700"
                >
                  <option value="newest">Más reciente</option>
                  <option value="oldest">Más antiguo</option>
                  <option value="highest_amount">Mayor monto</option>
                  <option value="lowest_amount">Menor monto</option>
                  <option value="status">Estado</option>
                </select>
              </div>
            </>
          )}
        </div>

        {activeTab === 'orders' && (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 border-t border-amber-900/5 pt-3">
            {/* Amount range */}
            <div className="grid gap-1">
              <label className="text-xs font-semibold text-amber-950">Monto Mínimo ($)</label>
              <input
                type="number"
                min={0}
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                className="rounded-xl border border-amber-900/20 px-3 py-1.5 text-xs outline-none bg-amber-50/10 focus:border-amber-700"
              />
            </div>
            
            <div className="grid gap-1">
              <label className="text-xs font-semibold text-amber-950">Monto Máximo ($)</label>
              <input
                type="number"
                min={0}
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                className="rounded-xl border border-amber-900/20 px-3 py-1.5 text-xs outline-none bg-amber-50/10 focus:border-amber-700"
              />
            </div>

            {/* Date range */}
            <div className="grid gap-1">
              <label className="text-xs font-semibold text-amber-950">Fecha Inicio</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-xl border border-amber-900/20 px-3 py-1.5 text-xs outline-none bg-amber-50/10 focus:border-amber-700"
              />
            </div>
            
            <div className="grid gap-1">
              <label className="text-xs font-semibold text-amber-950">Fecha Fin</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-xl border border-amber-900/20 px-3 py-1.5 text-xs outline-none bg-amber-50/10 focus:border-amber-700"
              />
            </div>
          </div>
        )}
      </div>

      {/* Grid List or Table of Results */}
      <section className="rounded-3xl border border-amber-900/10 bg-white p-5 md:p-6 shadow-sm overflow-hidden">
        
        {/* Tab 1: Orders History */}
        {activeTab === 'orders' && (
          filteredOrders.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-amber-900/15 text-2xs uppercase tracking-wider text-amber-900/60">
                    <th className="py-3 px-4 font-semibold">N° Pedido</th>
                    <th className="py-3 px-4 font-semibold">{isClient ? 'Fabricante' : 'Cliente'}</th>
                    <th className="py-3 px-4 font-semibold">Prenda</th>
                    <th className="py-3 px-4 font-semibold">Fecha</th>
                    <th className="py-3 px-4 font-semibold">Estado</th>
                    <th className="py-3 px-4 font-semibold text-right">Total</th>
                    <th className="py-3 px-4 font-semibold text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-900/5 text-sm text-amber-900">
                  {filteredOrders.map((o) => {
                    const isRated = isOrderRated(o.id)
                    return (
                      <tr key={o.id} className="hover:bg-amber-50/10 transition">
                        <td className="py-3 px-4 font-mono font-bold text-amber-950">{o.id}</td>
                        <td className="py-3 px-4">
                          {isClient ? o.manufacturerName : o.clientName}
                        </td>
                        <td className="py-3 px-4 font-medium text-amber-950">{o.designName}</td>
                        <td className="py-3 px-4 text-xs text-amber-900/70">{o.createdAt.split(',')[0]}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-2xs font-semibold ${o.status === 'cancelado' ? 'bg-red-100 text-red-700' : o.status === 'finalizado' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-900'}`}>
                            {STATUS_LABELS[o.status] ?? o.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-amber-950">${o.total.toFixed(2)}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => onNavigateToOrder(o.id)}
                            className="rounded-xl border border-amber-900/20 bg-amber-50/30 px-3 py-1.5 text-xs font-semibold text-amber-900 transition hover:bg-amber-100"
                          >
                            Ver seguimiento
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-amber-900/50">
              <h3 className="font-serif text-base font-semibold text-amber-950">Sin pedidos</h3>
              <p className="mt-1 text-xs">No se encontraron pedidos con los filtros aplicados.</p>
            </div>
          )
        )}

        {/* Tab 2: Transactions History */}
        {activeTab === 'transactions' && (
          filteredTransactions.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-amber-900/15 text-2xs uppercase tracking-wider text-amber-900/60">
                    <th className="py-3 px-4 font-semibold">ID Transacción</th>
                    <th className="py-3 px-4 font-semibold">N° Pedido</th>
                    <th className="py-3 px-4 font-semibold">Fecha</th>
                    <th className="py-3 px-4 font-semibold">Tipo</th>
                    <th className="py-3 px-4 font-semibold">Método</th>
                    <th className="py-3 px-4 font-semibold">Referencia</th>
                    <th className="py-3 px-4 font-semibold text-right">Monto</th>
                    <th className="py-3 px-4 font-semibold text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-900/5 text-sm text-amber-900">
                  {filteredTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-amber-50/10 transition">
                      <td className="py-3 px-4 font-mono text-xs text-amber-900/70">{t.id}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-amber-950">
                        <button
                          type="button"
                          onClick={() => onNavigateToOrder(t.orderId)}
                          className="hover:underline"
                        >
                          {t.orderId}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-xs text-amber-900/70">{t.createdAt.split(',')[0]}</td>
                      <td className="py-3 px-4">
                        <span className="capitalize font-semibold text-amber-950">
                          {t.type === 'costo_entrega' ? 'Costo envío' : t.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 capitalize text-xs">{t.paymentMethod}</td>
                      <td className="py-3 px-4 font-mono text-xs text-amber-900/80">*{t.reference}</td>
                      <td className="py-3 px-4 text-right font-bold text-amber-950">${t.amount.toFixed(2)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-2xs font-semibold text-emerald-700">
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-amber-900/50">
              <h3 className="font-serif text-base font-semibold text-amber-950">Sin transacciones</h3>
              <p className="mt-1 text-xs">No se encontraron movimientos financieros.</p>
            </div>
          )
        )}

      </section>
    </div>
  )
}
