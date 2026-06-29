import { useState, useMemo } from 'react'
import { useAppContext } from '../../context/AppContext'
import RatingStars from './RatingStars'

export const STATUS_LABELS = {
  recibido: 'Solicitud creada',
  pendiente_cotizacion: 'Pendiente de cotización',
  cotizacion_enviada: 'Cotización enviada',
  cotizacion_aprobada: 'Cotización aprobada',
  pendiente_pago: 'Pendiente de pago',
  pagado: 'Pagado',
  pedido_confirmado: 'Pedido confirmado',
  en_preparacion: 'En preparación',
  en_confeccion: 'En confección',
  en_revision: 'En revisión',
  listo_para_entrega: 'Listo para entrega',
  enviado: 'Enviado',
  entregado: 'Entregado',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
}

const STATUS_PROGRESS = {
  recibido: 5,
  pendiente_cotizacion: 10,
  cotizacion_enviada: 15,
  cotizacion_aprobada: 20,
  pendiente_pago: 25,
  pagado: 35,
  pedido_confirmado: 45,
  en_preparacion: 55,
  en_confeccion: 70,
  en_revision: 85,
  listo_para_entrega: 90,
  enviado: 95,
  entregado: 100,
  finalizado: 100,
  cancelado: 0,
}

const VALID_TRANSITIONS = {
  recibido: ['pendiente_cotizacion', 'en_preparacion', 'cancelado'],
  pendiente_cotizacion: ['cotizacion_enviada', 'cancelado'],
  cotizacion_enviada: ['cotizacion_aprobada', 'cotizacion_rechazada', 'cancelado'],
  cotizacion_aprobada: ['pendiente_pago', 'cancelado'],
  pendiente_pago: ['pagado', 'cancelado'],
  pagado: ['pedido_confirmado', 'en_preparacion', 'cancelado'],
  pedido_confirmado: ['en_preparacion', 'cancelado'],
  en_preparacion: ['en_confeccion', 'cancelado'],
  en_confeccion: ['en_revision', 'cancelado'],
  en_revision: ['listo_para_entrega', 'cancelado'],
  listo_para_entrega: ['enviado', 'entregado', 'cancelado'],
  enviado: ['entregado'],
  entregado: ['finalizado'],
  finalizado: [],
  cancelado: [],
}

const DELIVERY_STATUS_LABELS = {
  pendiente_coordinacion: 'Pendiente de coordinación',
  preparando_envio: 'Preparando envío',
  listo_retiro: 'Listo para retirar',
  enviado: 'Enviado',
  en_transito: 'En tránsito',
  entregado: 'Entregado',
  fallido: 'Entrega fallida',
  cancelado: 'Cancelado',
}

export default function OrderDetailPage({ orderId, onBack, onGoToManufacturerProfile }) {
  const {
    orders,
    users,
    orderStatusHistory,
    deliveries,
    ratings,
    currentUser,
    updateOrderStatus,
    registerDelivery,
    submitRating,
  } = useAppContext()

  const order = useMemo(() => orders.find((o) => o.id === orderId), [orders, orderId])
  const delivery = useMemo(() => deliveries.find((d) => d.orderId === orderId), [deliveries, orderId])
  const rating = useMemo(() => ratings.find((r) => r.orderId === orderId), [ratings, orderId])
  const history = useMemo(() => {
    return orderStatusHistory
      .filter((h) => h.orderId === orderId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [orderStatusHistory, orderId])

  // Form states - Status update
  const [nextStatus, setNextStatus] = useState('')
  const [observation, setObservation] = useState('')
  const [showStatusConfirm, setShowStatusConfirm] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [statusError, setStatusError] = useState('')
  const [statusSuccess, setStatusSuccess] = useState('')

  // Form states - Delivery registration
  const [deliveryForm, setDeliveryForm] = useState({
    method: delivery?.method ?? 'envio',
    company: delivery?.company ?? '',
    trackingNumber: delivery?.trackingNumber ?? '',
    status: delivery?.status ?? 'pendiente_coordinacion',
    estimatedShippingDate: delivery?.estimatedShippingDate ?? '',
    estimatedDeliveryDate: delivery?.estimatedDeliveryDate ?? '',
    address: delivery?.address ?? '',
    contactName: delivery?.contactName ?? '',
    contactPhone: delivery?.contactPhone ?? '',
    notes: delivery?.notes ?? '',
    cost: delivery?.cost ?? 0,
  })
  const [deliveryError, setDeliveryError] = useState('')
  const [deliverySuccess, setDeliverySuccess] = useState('')
  const [isSavingDelivery, setIsSavingDelivery] = useState(false)
  const [showCopyMessage, setShowCopyMessage] = useState(false)

  // Form states - Reception confirmation
  const [showConfirmReceipt, setShowConfirmReceipt] = useState(false)
  const [isConfirmingReceipt, setIsConfirmingReceipt] = useState(false)

  // Form states - Rating submission
  const [ratingForm, setRatingForm] = useState({
    generalRating: 5,
    productQuality: 5,
    communication: 5,
    deliveryTime: 5,
    valueForMoney: 5,
    comment: '',
    metExpectations: true,
    correctMeasures: true,
    recommend: true,
    onTime: true,
  })
  const [ratingImages, setRatingImages] = useState([])
  const [showRatingConfirm, setShowRatingConfirm] = useState(false)
  const [isSubmittingRating, setIsSubmittingRating] = useState(false)
  const [ratingError, setRatingError] = useState('')

  if (!order) {
    return (
      <div className="rounded-3xl border border-amber-950/10 bg-white p-8 text-center text-amber-950">
        <h2 className="font-serif text-2xl font-semibold">Pedido no encontrado</h2>
        <p className="mt-2 text-sm text-amber-900/75">
          El pedido que buscas no existe o ha sido eliminado.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-6 rounded-xl bg-amber-900 px-4 py-2 font-semibold text-amber-50"
        >
          Volver al panel
        </button>
      </div>
    )
  }

  const isClient = currentUser?.role === 'cliente'
  const isManufacturer = currentUser?.role === 'fabricante'
  const progressPercent = STATUS_PROGRESS[order.status] ?? 0
  const isCancelled = order.status === 'cancelado'
  const isFinalized = order.status === 'finalizado'

  // Options for next status
  const nextStatusOptions = VALID_TRANSITIONS[order.status] ?? []

  // Status Change handlers
  const handleStatusSubmit = (e) => {
    e.preventDefault()
    if (!nextStatus) {
      setStatusError('Por favor selecciona un estado.')
      return
    }
    if (nextStatus === order.status) {
      setStatusError('No puedes seleccionar el estado actual.')
      return
    }
    setStatusError('')
    setShowStatusConfirm(true)
  }

  const confirmStatusChange = async () => {
    setIsUpdatingStatus(true)
    try {
      const result = updateOrderStatus(order.id, nextStatus, observation, currentUser.name)
      if (result.ok) {
        setStatusSuccess('Estado actualizado correctamente.')
        setNextStatus('')
        setObservation('')
        setTimeout(() => setStatusSuccess(''), 3000)
      } else {
        setStatusError(result.message)
      }
    } catch {
      setStatusError('Error al actualizar el estado.')
    } finally {
      setIsUpdatingStatus(false)
      setShowStatusConfirm(false)
    }
  }

  // Delivery handlers
  const handleDeliverySubmit = (e) => {
    e.preventDefault()
    if (!deliveryForm.contactPhone.trim()) {
      setDeliveryError('El teléfono de contacto es obligatorio.')
      return
    }
    if (deliveryForm.method === 'envio' && !deliveryForm.address.trim()) {
      setDeliveryError('La dirección de envío es obligatoria.')
      return
    }
    if (deliveryForm.method === 'retiro' && !deliveryForm.address.trim()) {
      setDeliveryError('La dirección de retiro es obligatoria.')
      return
    }

    const today = new Date().toISOString().split('T')[0]
    if (deliveryForm.estimatedShippingDate && deliveryForm.estimatedShippingDate < today) {
      setDeliveryError('La fecha de envío no puede ser anterior a la actual.')
      return
    }
    if (
      deliveryForm.estimatedShippingDate &&
      deliveryForm.estimatedDeliveryDate &&
      deliveryForm.estimatedDeliveryDate < deliveryForm.estimatedShippingDate
    ) {
      setDeliveryError('La fecha de entrega estimada debe ser posterior o igual a la de envío.')
      return
    }

    setDeliveryError('')
    setIsSavingDelivery(true)
    setTimeout(() => {
      try {
        const result = registerDelivery(order.id, deliveryForm)
        if (result.ok) {
          setDeliverySuccess('Información de entrega guardada correctamente.')
          setTimeout(() => setDeliverySuccess(''), 3000)
        } else {
          setDeliveryError(result.message)
        }
      } catch {
        setDeliveryError('Error al guardar datos de entrega.')
      } finally {
        setIsSavingDelivery(false)
      }
    }, 800)
  }

  const handleCopyTracking = () => {
    if (delivery?.trackingNumber) {
      navigator.clipboard.writeText(delivery.trackingNumber)
      setShowCopyMessage(true)
      setTimeout(() => setShowCopyMessage(false), 2000)
    }
  }

  // Confirm receipt handlers
  const confirmReceipt = () => {
    setIsConfirmingReceipt(true)
    setTimeout(() => {
      try {
        const nextOrderState = 'entregado'
        const result = updateOrderStatus(order.id, nextOrderState, 'El cliente ha confirmado la entrega del producto.', 'Cliente')
        if (result.ok) {
          registerDelivery(order.id, {
            ...delivery,
            status: 'entregado'
          })
        }
      } catch {
        // error handled silently
      } finally {
        setIsConfirmingReceipt(false)
        setShowConfirmReceipt(false)
      }
    }, 1000)
  }

  // Rating stars change handlers
  const setRatingCategoryValue = (category, value) => {
    setRatingForm((prev) => ({ ...prev, [category]: value }))
  }

  // Rating Images handler
  const handleRatingImagesChange = async (e) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length + ratingImages.length > 3) {
      setRatingError('Puedes subir un máximo de 3 imágenes.')
      return
    }

    const loaders = files.map((file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result || ''))
        reader.onerror = () => reject(new Error('Error al leer imagen.'))
        reader.readAsDataURL(file)
      })
    })

    try {
      const results = await Promise.all(loaders)
      setRatingImages((prev) => [...prev, ...results])
      setRatingError('')
    } catch {
      setRatingError('Error al cargar algunas imágenes.')
    }
    e.target.value = ''
  }

  const removeRatingImage = (indexToRemove) => {
    setRatingImages((prev) => prev.filter((_, index) => index !== indexToRemove))
  }

  // Rating submission handlers
  const handleRatingSubmit = (e) => {
    e.preventDefault()
    if (ratingForm.comment.trim().length < 10) {
      setRatingError('El comentario debe tener al menos 10 caracteres.')
      return
    }
    if (ratingForm.comment.trim().length > 300) {
      setRatingError('El comentario no puede exceder los 300 caracteres.')
      return
    }
    setRatingError('')
    setShowRatingConfirm(true)
  }

  const confirmRatingPublish = () => {
    setIsSubmittingRating(true)
    setTimeout(() => {
      try {
        const result = submitRating({
          ...ratingForm,
          orderId: order.id,
          clientId: order.clientId,
          manufacturerId: order.manufacturerId,
          images: ratingImages,
        })
        if (!result.ok) {
          setRatingError(result.message)
        }
      } catch {
        setRatingError('Error al publicar calificación.')
      } finally {
        setIsSubmittingRating(false)
        setShowRatingConfirm(false)
      }
    }, 1000)
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
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-xl font-bold text-amber-950 md:text-2xl">
                Pedido #{order.id}
              </h1>
              {isCancelled ? (
                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                  Cancelado
                </span>
              ) : isFinalized ? (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                  Finalizado
                </span>
              ) : (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                  {STATUS_LABELS[order.status] ?? order.status}
                </span>
              )}
            </div>
            <p className="text-xs text-amber-900/75 md:text-sm">
              Creado el {order.createdAt} · Total: <span className="font-semibold">${order.total.toFixed(2)}</span>
            </p>
          </div>
        </div>

        {isClient && order.manufacturerId && (
          <button
            type="button"
            onClick={() => onGoToManufacturerProfile(order.manufacturerId)}
            className="rounded-xl bg-amber-900 px-4 py-2 text-sm font-semibold text-amber-50 transition hover:bg-amber-800"
          >
            Ver Perfil de {order.manufacturerName}
          </button>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        
        {/* Left Column: Seguimiento, Timeline */}
        <div className="grid gap-6">
          
          {/* Progress Bar (HU-15) */}
          <article className="rounded-3xl border border-amber-900/10 bg-white p-5 md:p-6 shadow-sm">
            <h2 className="font-serif text-lg font-bold text-amber-950">Progreso de la Confección</h2>
            <div className="mt-4">
              <div className="flex justify-between text-sm font-semibold text-amber-900">
                <span>Estado: {STATUS_LABELS[order.status] ?? order.status}</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="mt-2 h-4 w-full rounded-full bg-amber-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isCancelled ? 'bg-red-500' : 'bg-amber-700'}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </article>

          {/* Timeline de Estados (HU-15) */}
          <article className="rounded-3xl border border-amber-900/10 bg-white p-5 md:p-6 shadow-sm">
            <h2 className="font-serif text-lg font-bold text-amber-950">Historial de Actualizaciones</h2>
            
            {history.length ? (
              <div className="relative mt-6 border-l-2 border-amber-900/20 pl-6 ml-3 space-y-6">
                {history.map((item) => {
                  const itemIsCurrent = item.status === order.status
                  return (
                    <div key={item.id} className="relative">
                      {/* Icon point */}
                      <span className={`absolute -left-[31px] top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full border-2 bg-white ${itemIsCurrent ? 'border-amber-700 scale-110' : 'border-amber-900/30'}`}>
                        <span className={`h-2 w-2 rounded-full ${itemIsCurrent ? (isCancelled ? 'bg-red-500' : 'bg-amber-700') : 'bg-transparent'}`} />
                      </span>
                      
                      <div className={`rounded-2xl border p-4 ${itemIsCurrent ? 'border-amber-900/25 bg-amber-50/20 shadow-xs' : 'border-amber-900/10 bg-white'}`}>
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <span className="font-semibold text-amber-950">
                            {STATUS_LABELS[item.status] ?? item.status}
                          </span>
                          <span className="text-xs text-amber-900/60 font-medium">
                            {item.createdAt}
                          </span>
                        </div>
                        <p className="mt-1.5 text-sm text-amber-900/80">
                          {item.description}
                        </p>
                        <p className="mt-1 text-xs text-amber-900/50">
                          Actualizado por: <span className="font-medium">{item.updatedBy || 'Sistema'}</span>
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="mt-4 text-sm text-amber-900/70">No hay historial disponible para este pedido.</p>
            )}
          </article>

          {/* Details of garment */}
          <article className="rounded-3xl border border-amber-900/10 bg-white p-5 md:p-6 shadow-sm">
            <h2 className="font-serif text-lg font-bold text-amber-950">Detalle de la Prenda</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-900/60">Diseño solicitado</p>
                <p className="text-base font-bold text-amber-950">{order.designName}</p>
                <p className="text-sm text-amber-900">Precio base: ${order.basePrice}</p>
                
                {order.modifications.length ? (
                  <div className="mt-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-900/60">Personalizaciones</p>
                    <ul className="mt-1 divide-y divide-amber-900/10 text-sm text-amber-900/85">
                      {order.modifications.map((item) => (
                        <li key={item.id} className="flex justify-between py-1">
                          <span>{item.name}</span>
                          <span className="font-semibold">+${item.extraCost}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-900/60">Medidas vinculadas (cm)</p>
                {order.measures && Object.keys(order.measures).length ? (
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-amber-900/85 bg-amber-50/50 rounded-2xl p-3 border border-amber-900/5">
                    {Object.entries(order.measures).map(([key, value]) => (
                      <div key={key} className="flex justify-between gap-1 border-b border-amber-900/5 pb-1 capitalize">
                        <span className="text-amber-900/70">{key}</span>
                        <span className="font-semibold text-amber-950">{value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-amber-900/60 italic">Sin medidas adjuntas.</p>
                )}
              </div>
            </div>
          </article>
        </div>

        {/* Right Column: Acciones de entrega y calificaciones */}
        <div className="grid gap-6 content-start">
          
          {/* CLIENT VIEW: Entrega y Recepción (HU-17) */}
          {isClient && (
            <article className="rounded-3xl border border-amber-900/10 bg-white p-5 md:p-6 shadow-sm">
              <h2 className="font-serif text-lg font-bold text-amber-950">Datos de Entrega</h2>
              
              {delivery ? (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-amber-900/60">Método de entrega</p>
                      <p className="font-semibold text-amber-950">
                        {delivery.method === 'envio' ? 'Envío a domicilio' : 'Retiro en tienda'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-amber-900/60">Estado de entrega</p>
                      <span className="inline-block rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-900">
                        {DELIVERY_STATUS_LABELS[delivery.status] ?? delivery.status}
                      </span>
                    </div>
                  </div>

                  {delivery.method === 'envio' && delivery.company && (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-amber-900/60">Empresa transportadora</p>
                        <p className="font-semibold text-amber-950">{delivery.company}</p>
                      </div>
                      {delivery.trackingNumber && (
                        <div>
                          <p className="text-xs text-amber-900/60">N° seguimiento</p>
                          <div className="flex items-center gap-1">
                            <span className="font-mono font-semibold text-amber-950">{delivery.trackingNumber}</span>
                            <button
                              type="button"
                              onClick={handleCopyTracking}
                              className="text-amber-800 hover:text-amber-900 p-0.5 rounded-lg border border-amber-900/10"
                              title="Copiar número"
                            >
                              <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                              </svg>
                            </button>
                            {showCopyMessage && <span className="text-[10px] text-emerald-600 font-semibold absolute bg-white px-1 py-0.5 border border-emerald-500 rounded">Copiado</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="text-sm">
                    <p className="text-xs text-amber-900/60">Dirección / Punto de Retiro</p>
                    <p className="font-medium text-amber-950">{delivery.address || 'N/A'}</p>
                  </div>

                  {(delivery.estimatedShippingDate || delivery.estimatedDeliveryDate) && (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {delivery.estimatedShippingDate && (
                        <div>
                          <p className="text-xs text-amber-900/60">Fecha estimada de envío</p>
                          <p className="font-semibold text-amber-950">{delivery.estimatedShippingDate}</p>
                        </div>
                      )}
                      {delivery.estimatedDeliveryDate && (
                        <div>
                          <p className="text-xs text-amber-900/60">Fecha estimada de entrega</p>
                          <p className="font-semibold text-amber-950">{delivery.estimatedDeliveryDate}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {delivery.contactName && (
                    <div className="grid grid-cols-2 gap-2 text-sm border-t border-amber-900/5 pt-2">
                      <div>
                        <p className="text-xs text-amber-900/60">Contacto</p>
                        <p className="font-medium text-amber-950">{delivery.contactName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-amber-900/60">Teléfono</p>
                        <p className="font-medium text-amber-950">{delivery.contactPhone}</p>
                      </div>
                    </div>
                  )}

                  {delivery.notes && (
                    <div className="text-sm bg-amber-50/50 rounded-xl p-2.5 border border-amber-900/5 text-amber-900/90 text-xs">
                      <span className="font-semibold block text-[10px] uppercase text-amber-900/50 tracking-wider">Observaciones</span>
                      {delivery.notes}
                    </div>
                  )}

                  {/* Confirm Receipt Button (HU-17) */}
                  {delivery.status !== 'entregado' && ['enviado', 'listo_retiro'].includes(delivery.status) && (
                    <button
                      type="button"
                      onClick={() => setShowConfirmReceipt(true)}
                      className="mt-4 w-full rounded-2xl bg-amber-900 py-3 text-sm font-semibold text-amber-50 transition hover:bg-amber-800 shadow-sm"
                    >
                      Confirmar Recepción del Producto
                    </button>
                  )}
                </div>
              ) : (
                <p className="mt-4 text-sm text-amber-900/60 italic">Los datos de entrega aún no han sido registrados por el fabricante.</p>
              )}
            </article>
          )}

          {/* CLIENT VIEW: Calificación del Fabricante (HU-18) */}
          {isClient && (isFinalized || order.status === 'entregado') && (
            <article className="rounded-3xl border border-amber-900/10 bg-white p-5 md:p-6 shadow-sm">
              <h2 className="font-serif text-lg font-bold text-amber-950">Calificación del Servicio</h2>
              
              {rating ? (
                <div className="mt-4 space-y-3">
                  <p className="text-sm text-emerald-700 font-semibold flex items-center gap-1.5">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Ya has calificado este pedido
                  </p>
                  
                  <div className="rounded-2xl border border-amber-900/10 bg-amber-50/20 p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-amber-900">General:</span>
                      <RatingStars rating={rating.generalRating} size="h-4.5 w-4.5" />
                    </div>
                    {rating.comment && (
                      <p className="mt-2 text-sm text-amber-950 italic">
                        "{rating.comment}"
                      </p>
                    )}
                    {rating.images && rating.images.length > 0 && (
                      <div className="mt-3 flex gap-2">
                        {rating.images.map((imgSrc, i) => (
                          <img
                            key={i}
                            src={imgSrc}
                            alt="Prenda recibida"
                            className="h-14 w-14 rounded-lg object-cover border border-amber-900/10"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleRatingSubmit} className="mt-4 space-y-4">
                  <p className="text-xs text-amber-900/70">
                    Tu pedido ha sido completado. Comparte tu experiencia calificando al fabricante.
                  </p>

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-amber-950">Calificación general *</span>
                      <RatingStars
                        rating={ratingForm.generalRating}
                        onRatingChange={(val) => setRatingCategoryValue('generalRating', val)}
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-amber-900/80">Calidad del producto</span>
                      <RatingStars
                        rating={ratingForm.productQuality}
                        onRatingChange={(val) => setRatingCategoryValue('productQuality', val)}
                        size="h-4 w-4"
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-amber-900/80">Comunicación</span>
                      <RatingStars
                        rating={ratingForm.communication}
                        onRatingChange={(val) => setRatingCategoryValue('communication', val)}
                        size="h-4 w-4"
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-amber-900/80">Cumplimiento de tiempo</span>
                      <RatingStars
                        rating={ratingForm.deliveryTime}
                        onRatingChange={(val) => setRatingCategoryValue('deliveryTime', val)}
                        size="h-4 w-4"
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-amber-900/80">Relación calidad-precio</span>
                      <RatingStars
                        rating={ratingForm.valueForMoney}
                        onRatingChange={(val) => setRatingCategoryValue('valueForMoney', val)}
                        size="h-4 w-4"
                      />
                    </div>
                  </div>

                  <div className="grid gap-1">
                    <label className="text-xs font-semibold text-amber-950 flex justify-between">
                      Comentario
                      <span className="text-amber-900/50 font-normal">
                        {ratingForm.comment.length} / 300
                      </span>
                    </label>
                    <textarea
                      rows={3}
                      value={ratingForm.comment}
                      onChange={(e) => setRatingForm((prev) => ({ ...prev, comment: e.target.value }))}
                      placeholder="Cuéntanos qué tal quedó tu prenda... (mín. 10 caracteres)"
                      className="rounded-xl border border-amber-900/20 px-3 py-2 text-sm outline-none transition focus:border-amber-700 focus:ring-1 focus:ring-amber-700 bg-amber-50/10"
                    />
                  </div>

                  {/* Optional Questions (HU-18) */}
                  <div className="space-y-2 border-t border-amber-900/5 pt-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-900/50">Preguntas opcionales</p>
                    
                    <label className="flex items-center justify-between text-xs text-amber-950 cursor-pointer">
                      <span>¿El producto cumplió tus expectativas?</span>
                      <input
                        type="checkbox"
                        checked={ratingForm.metExpectations}
                        onChange={(e) => setRatingForm((prev) => ({ ...prev, metExpectations: e.target.checked }))}
                        className="h-4 w-4 rounded border-amber-900/20 text-amber-800 focus:ring-amber-800"
                      />
                    </label>
                    <label className="flex items-center justify-between text-xs text-amber-950 cursor-pointer">
                      <span>¿Las medidas fueron correctas?</span>
                      <input
                        type="checkbox"
                        checked={ratingForm.correctMeasures}
                        onChange={(e) => setRatingForm((prev) => ({ ...prev, correctMeasures: e.target.checked }))}
                        className="h-4 w-4 rounded border-amber-900/20 text-amber-800 focus:ring-amber-800"
                      />
                    </label>
                    <label className="flex items-center justify-between text-xs text-amber-950 cursor-pointer">
                      <span>¿Recomendarías a este fabricante?</span>
                      <input
                        type="checkbox"
                        checked={ratingForm.recommend}
                        onChange={(e) => setRatingForm((prev) => ({ ...prev, recommend: e.target.checked }))}
                        className="h-4 w-4 rounded border-amber-900/20 text-amber-800 focus:ring-amber-800"
                      />
                    </label>
                    <label className="flex items-center justify-between text-xs text-amber-950 cursor-pointer">
                      <span>¿La entrega se realizó a tiempo?</span>
                      <input
                        type="checkbox"
                        checked={ratingForm.onTime}
                        onChange={(e) => setRatingForm((prev) => ({ ...prev, onTime: e.target.checked }))}
                        className="h-4 w-4 rounded border-amber-900/20 text-amber-800 focus:ring-amber-800"
                      />
                    </label>
                  </div>

                  {/* Images Upload (HU-18) */}
                  <div className="border-t border-amber-900/5 pt-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-900/50 mb-2">Imágenes de la Prenda Recibida</p>
                    <div className="flex flex-wrap gap-2 items-center">
                      {ratingImages.map((img, idx) => (
                        <div key={idx} className="relative h-14 w-14 rounded-lg overflow-hidden border border-amber-900/10 bg-amber-50/50">
                          <img src={img} alt="Preview" className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeRatingImage(idx)}
                            className="absolute right-0.5 top-0.5 rounded-full bg-red-500/80 p-0.5 text-white hover:bg-red-600"
                          >
                            <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      {ratingImages.length < 3 && (
                        <label className="flex h-14 w-14 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-amber-900/20 bg-amber-50/30 hover:bg-amber-50">
                          <svg className="h-5 w-5 text-amber-900/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                          </svg>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleRatingImagesChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {ratingError && (
                    <p className="text-xs font-bold text-red-600 bg-red-50 p-2 rounded-xl border border-red-200">
                      {ratingError}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-amber-900 py-3 text-sm font-semibold text-amber-50 transition hover:bg-amber-800"
                  >
                    Publicar Calificación
                  </button>
                </form>
              )}
            </article>
          )}

          {/* MANUFACTURER VIEW: Actualizar Estado (HU-15) */}
          {isManufacturer && (
            <article className="rounded-3xl border border-amber-900/10 bg-white p-5 md:p-6 shadow-sm">
              <h2 className="font-serif text-lg font-bold text-amber-950">Actualizar Estado</h2>
              
              {!nextStatusOptions.length ? (
                <p className="mt-4 text-sm text-amber-900/60 italic">
                  El pedido está en un estado terminal ({STATUS_LABELS[order.status]}) y no se puede modificar.
                </p>
              ) : (
                <form onSubmit={handleStatusSubmit} className="mt-4 space-y-4">
                  <div className="grid gap-1">
                    <label htmlFor="next-status-select" className="text-xs font-semibold text-amber-950">Nuevo Estado *</label>
                    <select
                      id="next-status-select"
                      value={nextStatus}
                      onChange={(e) => setNextStatus(e.target.value)}
                      className="rounded-xl border border-amber-900/20 px-3 py-2 text-sm outline-none bg-white focus:border-amber-700"
                    >
                      <option value="">Selecciona el siguiente paso</option>
                      {nextStatusOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {STATUS_LABELS[opt] ?? opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-1">
                    <label htmlFor="status-observation-input" className="text-xs font-semibold text-amber-950">Observación / Nota para el cliente</label>
                    <textarea
                      id="status-observation-input"
                      rows={2}
                      value={observation}
                      onChange={(e) => setObservation(e.target.value)}
                      placeholder="Ej. Ya hemos cortado las piezas, comenzaremos costura mañana..."
                      className="rounded-xl border border-amber-900/20 px-3 py-2 text-sm outline-none bg-white focus:border-amber-700"
                    />
                  </div>

                  {statusError && (
                    <p className="text-xs font-semibold text-red-600 bg-red-50 p-2 rounded-xl border border-red-200">
                      {statusError}
                    </p>
                  )}
                  
                  {statusSuccess && (
                    <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                      {statusSuccess}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-amber-900 py-3 text-sm font-semibold text-amber-50 transition hover:bg-amber-800"
                  >
                    Actualizar Estado
                  </button>
                </form>
              )}
            </article>
          )}

          {/* MANUFACTURER VIEW: Registrar Entrega (HU-17) */}
          {isManufacturer && (order.status !== 'recibido' && order.status !== 'pendiente_cotizacion' && order.status !== 'cotizacion_enviada') && (
            <article className="rounded-3xl border border-amber-900/10 bg-white p-5 md:p-6 shadow-sm">
              <h2 className="font-serif text-lg font-bold text-amber-950">Registrar Información de Entrega</h2>
              
              <form onSubmit={handleDeliverySubmit} className="mt-4 space-y-3.5">
                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-1">
                    <label htmlFor="delivery-method-select" className="text-xs font-semibold text-amber-950">Método de entrega *</label>
                    <select
                      id="delivery-method-select"
                      value={deliveryForm.method}
                      onChange={(e) => setDeliveryForm((prev) => ({ ...prev, method: e.target.value }))}
                      className="rounded-xl border border-amber-900/20 px-2 py-1.5 text-xs outline-none bg-white focus:border-amber-700"
                    >
                      <option value="envio">Envío a domicilio</option>
                      <option value="retiro">Retiro en taller</option>
                      <option value="encuentro">Punto de encuentro</option>
                      <option value="mensajeria">Empresa de mensajería</option>
                    </select>
                  </div>
                  
                  <div className="grid gap-1">
                    <label htmlFor="delivery-cost-input" className="text-xs font-semibold text-amber-950">Costo de entrega ($)</label>
                    <input
                      id="delivery-cost-input"
                      type="number"
                      min={0}
                      value={deliveryForm.cost}
                      onChange={(e) => setDeliveryForm((prev) => ({ ...prev, cost: e.target.value }))}
                      className="rounded-xl border border-amber-900/20 px-2 py-1.5 text-xs outline-none bg-white focus:border-amber-700"
                    />
                  </div>
                </div>

                {['envio', 'mensajeria'].includes(deliveryForm.method) && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="grid gap-1">
                      <label htmlFor="delivery-company-input" className="text-xs font-semibold text-amber-950">Empresa de transporte</label>
                      <input
                        id="delivery-company-input"
                        type="text"
                        value={deliveryForm.company}
                        onChange={(e) => setDeliveryForm((prev) => ({ ...prev, company: e.target.value }))}
                        placeholder="Ej. Correos de CR"
                        className="rounded-xl border border-amber-900/20 px-2 py-1.5 text-xs outline-none bg-white focus:border-amber-700"
                      />
                    </div>
                    
                    <div className="grid gap-1">
                      <label htmlFor="delivery-tracking-input" className="text-xs font-semibold text-amber-950">N° de seguimiento</label>
                      <input
                        id="delivery-tracking-input"
                        type="text"
                        value={deliveryForm.trackingNumber}
                        onChange={(e) => setDeliveryForm((prev) => ({ ...prev, trackingNumber: e.target.value }))}
                        placeholder="Ej. CR-109283"
                        className="rounded-xl border border-amber-900/20 px-2 py-1.5 text-xs outline-none bg-white focus:border-amber-700"
                      />
                    </div>
                  </div>
                )}

                <div className="grid gap-1">
                  <label htmlFor="delivery-address-input" className="text-xs font-semibold text-amber-950">
                    {deliveryForm.method === 'envio' ? 'Dirección de envío *' : 'Punto o dirección de retiro *'}
                  </label>
                  <textarea
                    id="delivery-address-input"
                    rows={2}
                    value={deliveryForm.address}
                    onChange={(e) => setDeliveryForm((prev) => ({ ...prev, address: e.target.value }))}
                    placeholder={deliveryForm.method === 'envio' ? 'Dirección completa del cliente' : 'Ubicación física de tu taller'}
                    className="rounded-xl border border-amber-900/20 px-3 py-2 text-xs outline-none bg-white focus:border-amber-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-1">
                    <label htmlFor="delivery-shipping-date" className="text-xs font-semibold text-amber-950">Fecha estimada envío</label>
                    <input
                      id="delivery-shipping-date"
                      type="date"
                      value={deliveryForm.estimatedShippingDate}
                      onChange={(e) => setDeliveryForm((prev) => ({ ...prev, estimatedShippingDate: e.target.value }))}
                      className="rounded-xl border border-amber-900/20 px-2 py-1.5 text-xs outline-none bg-white focus:border-amber-700"
                    />
                  </div>
                  
                  <div className="grid gap-1">
                    <label htmlFor="delivery-delivery-date" className="text-xs font-semibold text-amber-950">Fecha estimada entrega</label>
                    <input
                      id="delivery-delivery-date"
                      type="date"
                      value={deliveryForm.estimatedDeliveryDate}
                      onChange={(e) => setDeliveryForm((prev) => ({ ...prev, estimatedDeliveryDate: e.target.value }))}
                      className="rounded-xl border border-amber-900/20 px-2 py-1.5 text-xs outline-none bg-white focus:border-amber-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-1">
                    <label htmlFor="delivery-contact-name" className="text-xs font-semibold text-amber-950">Nombre de contacto *</label>
                    <input
                      id="delivery-contact-name"
                      type="text"
                      value={deliveryForm.contactName}
                      onChange={(e) => setDeliveryForm((prev) => ({ ...prev, contactName: e.target.value }))}
                      className="rounded-xl border border-amber-900/20 px-2 py-1.5 text-xs outline-none bg-white focus:border-amber-700"
                    />
                  </div>
                  
                  <div className="grid gap-1">
                    <label htmlFor="delivery-contact-phone" className="text-xs font-semibold text-amber-950">Teléfono de contacto *</label>
                    <input
                      id="delivery-contact-phone"
                      type="text"
                      value={deliveryForm.contactPhone}
                      onChange={(e) => setDeliveryForm((prev) => ({ ...prev, contactPhone: e.target.value }))}
                      className="rounded-xl border border-amber-900/20 px-2 py-1.5 text-xs outline-none bg-white focus:border-amber-700"
                    />
                  </div>
                </div>

                <div className="grid gap-1">
                  <label htmlFor="delivery-status-select" className="text-xs font-semibold text-amber-950">Estado de la entrega</label>
                  <select
                    id="delivery-status-select"
                    value={deliveryForm.status}
                    onChange={(e) => setDeliveryForm((prev) => ({ ...prev, status: e.target.value }))}
                    className="rounded-xl border border-amber-900/20 px-2 py-1.5 text-xs outline-none bg-white focus:border-amber-700"
                  >
                    {Object.entries(DELIVERY_STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-1">
                  <label className="text-xs font-semibold text-amber-950">Notas / Horario</label>
                  <textarea
                    rows={1}
                    value={deliveryForm.notes}
                    onChange={(e) => setDeliveryForm((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Horario de atención, instrucciones extra..."
                    className="rounded-xl border border-amber-900/20 px-3 py-2 text-xs outline-none bg-white focus:border-amber-700"
                  />
                </div>

                {deliveryError && (
                  <p className="text-xs font-semibold text-red-600 bg-red-50 p-2 rounded-xl border border-red-200">
                    {deliveryError}
                  </p>
                )}
                
                {deliverySuccess && (
                  <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                    {deliverySuccess}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSavingDelivery}
                  className="w-full rounded-2xl bg-amber-900 py-3 text-sm font-semibold text-amber-50 transition hover:bg-amber-800 disabled:opacity-50"
                >
                  {isSavingDelivery ? 'Guardando...' : 'Guardar Información de Entrega'}
                </button>
              </form>
            </article>
          )}

        </div>
      </div>

      {/* CONFIRMATION MODALS */}

      {/* 1. Status Confirm Modal (HU-15) */}
      {showStatusConfirm && (
        <section className="fixed inset-0 z-30 grid place-items-center bg-amber-950/60 p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl border border-amber-900/10">
            <h3 className="font-serif text-lg font-bold text-amber-950">Confirmar cambio de estado</h3>
            <p className="mt-3 text-sm text-amber-900/80">
              ¿Estás seguro de que quieres cambiar el estado de este pedido a{' '}
              <span className="font-bold">"{STATUS_LABELS[nextStatus] ?? nextStatus}"</span>?
            </p>
            {observation && (
              <div className="mt-3 rounded-2xl bg-amber-50/50 p-3 border border-amber-900/5 text-xs text-amber-900/75">
                <span className="font-semibold block">Nota adjunta:</span>
                "{observation}"
              </div>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowStatusConfirm(false)}
                className="rounded-xl border border-amber-900/20 bg-white px-4 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={confirmStatusChange}
                className="rounded-xl bg-amber-900 px-4 py-2 text-sm font-semibold text-amber-50 transition hover:bg-amber-800 disabled:opacity-50"
              >
                {isUpdatingStatus ? 'Procesando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 2. Receipt Confirm Modal (HU-17) */}
      {showConfirmReceipt && (
        <section className="fixed inset-0 z-30 grid place-items-center bg-amber-950/60 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl border border-amber-900/10">
            <h3 className="font-serif text-lg font-bold text-amber-950">Confirmar Recepción del Pedido</h3>
            <p className="mt-3 text-sm text-amber-900/80">
              ¿Confirmas que has recibido tu prenda confeccionada por <span className="font-bold">{order.manufacturerName}</span>?
            </p>
            <div className="mt-3 text-xs text-amber-800/80 bg-amber-100/50 p-3 rounded-2xl border border-amber-200">
              <strong>Aviso:</strong> El estado del pedido se cambiará a <span className="font-bold">Entregado</span> y se te habilitará la opción para calificar el servicio del fabricante.
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmReceipt(false)}
                className="rounded-xl border border-amber-900/20 bg-white px-4 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isConfirmingReceipt}
                onClick={confirmReceipt}
                className="rounded-xl bg-amber-900 px-4 py-2 text-sm font-semibold text-amber-50 transition hover:bg-amber-800 disabled:opacity-50"
              >
                {isConfirmingReceipt ? 'Confirmando...' : 'Sí, lo he recibido'}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 3. Rating Confirm Modal (HU-18) */}
      {showRatingConfirm && (
        <section className="fixed inset-0 z-30 grid place-items-center bg-amber-950/60 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl border border-amber-900/10">
            <h3 className="font-serif text-lg font-bold text-amber-950">Confirmar Publicación</h3>
            <p className="mt-2 text-xs text-amber-900/70">
              Verifica los datos antes de publicar tu reseña:
            </p>
            <div className="mt-3 space-y-2 rounded-2xl bg-amber-50/50 p-4 border border-amber-900/5 text-sm text-amber-900">
              <p><strong>Fabricante:</strong> {order.manufacturerName}</p>
              <div className="flex items-center gap-1">
                <strong>Puntuación General:</strong>
                <RatingStars rating={ratingForm.generalRating} size="h-4 w-4" />
              </div>
              <p className="italic">"{ratingForm.comment}"</p>
              {ratingImages.length > 0 && (
                <p className="text-xs text-amber-900/60">
                  Subiendo {ratingImages.length} fotos de muestra.
                </p>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowRatingConfirm(false)}
                className="rounded-xl border border-amber-900/20 bg-white px-4 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSubmittingRating}
                onClick={confirmRatingPublish}
                className="rounded-xl bg-amber-900 px-4 py-2 text-sm font-semibold text-amber-50 transition hover:bg-amber-800 disabled:opacity-50"
              >
                {isSubmittingRating ? 'Publicando...' : 'Confirmar y Publicar'}
              </button>
            </div>
          </div>
        </section>
      )}

    </div>
  )
}
