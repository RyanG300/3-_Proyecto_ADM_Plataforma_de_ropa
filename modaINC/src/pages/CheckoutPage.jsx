import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const DEFAULT_CENTER = {
  lat: 9.9325,
  lng: -84.0796,
}

function MapEvents({ onPick }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng)
    },
  })

  return null
}

function MapViewportSync({ position }) {
  const map = useMap()

  useEffect(() => {
    map.setView(position)
  }, [map, position])

  return null
}

function sanitizePayment(payment) {
  const lastDigits = payment.cardNumber.replace(/\D/g, '').slice(-4)
  return {
    method: payment.method,
    cardName: payment.cardName.trim(),
    cardNumberMasked: lastDigits ? `**** **** **** ${lastDigits}` : 'No definido',
    expiry: payment.expiry.trim(),
  }
}

function buildInitialDelivery(currentUser) {
  return {
    recipientName: currentUser?.name ?? '',
    phone: '',
    reference: '',
    latitude: DEFAULT_CENTER.lat,
    longitude: DEFAULT_CENTER.lng,
  }
}

function buildInitialPayment(currentUser) {
  return {
    method: 'tarjeta',
    cardName: currentUser?.name ?? '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  }
}

export default function CheckoutPage({
  currentUser,
  draft,
  onBackToCustomization,
  onBackToShowcase,
  onGoLogin,
  onConfirmOrder,
}) {
  const [step, setStep] = useState('data')
  const [delivery, setDelivery] = useState(() => buildInitialDelivery(currentUser))
  const [payment, setPayment] = useState(() => buildInitialPayment(currentUser))
  const [feedback, setFeedback] = useState(null)
  const [referenceLookup, setReferenceLookup] = useState('')
  const reverseGeocodeRequestId = useRef(0)

  useEffect(() => {
    setDelivery(buildInitialDelivery(currentUser))
    setPayment(buildInitialPayment(currentUser))
    setStep('data')
    setFeedback(null)
  }, [currentUser?.id, draft?.design?.id])

  const selectedModifications = draft?.selectedModifications ?? []
  const measures = draft?.measures ?? null

  const estimatedTotal = useMemo(() => {
    if (!draft?.design) return 0

    if (draft.total) return Number(draft.total) || 0

    const extras = selectedModifications.reduce(
      (total, item) => total + (Number(item.extraCost) || 0),
      0,
    )
    return (Number(draft.design.basePrice) || 0) + extras
  }, [draft, selectedModifications])

  const mapPosition = useMemo(() => {
    const lat = Number(delivery.latitude)
    const lng = Number(delivery.longitude)

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng]
    }

    return [lat, lng]
  }, [delivery.latitude, delivery.longitude])

  const syncMapCoordinates = ({ lat, lng }) => {
    const latNumber = Number(lat.toFixed(6))
    const lngNumber = Number(lng.toFixed(6))

    setDelivery((prev) => ({
      ...prev,
      latitude: latNumber,
      longitude: lngNumber,
    }))

    const currentRequestId = reverseGeocodeRequestId.current + 1
    reverseGeocodeRequestId.current = currentRequestId

    setReferenceLookup('Buscando referencia de dirección...')

    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latNumber}&lon=${lngNumber}&accept-language=es`,
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error('No se pudo consultar la dirección.')
        }
        return response.json()
      })
      .then((data) => {
        if (reverseGeocodeRequestId.current !== currentRequestId) return

        const displayName =
          typeof data?.display_name === 'string' ? data.display_name.trim() : ''
        if (!displayName) {
          setReferenceLookup('No se pudo autocompletar una referencia para ese punto.')
          return
        }

        setDelivery((prev) => ({ ...prev, reference: displayName }))
        setReferenceLookup('Referencia autocompletada desde el mapa.')
      })
      .catch(() => {
        if (reverseGeocodeRequestId.current !== currentRequestId) return
        setReferenceLookup(
          'No fue posible autocompletar la referencia. Puedes escribirla manualmente.',
        )
      })

    setFeedback(null)
  }

  const setDeliveryField = (key, value) => {
    setDelivery((prev) => ({ ...prev, [key]: value }))
    setFeedback(null)
  }

  const setPaymentField = (key, value) => {
    setPayment((prev) => ({ ...prev, [key]: value }))
    setFeedback(null)
  }

  const validateData = () => {
    const recipientName = delivery.recipientName.trim()
    const phoneDigits = delivery.phone.replace(/\D/g, '')
    const reference = delivery.reference.trim()
    const lat = Number(delivery.latitude)
    const lng = Number(delivery.longitude)

    if (recipientName.length < 2) {
      return 'Ingresa un nombre de entrega válido.'
    }

    if (phoneDigits.length < 8) {
      return 'Ingresa un número de teléfono válido.'
    }

    if (!reference) {
      return 'Describe el punto de entrega.'
    }

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return 'La ubicación del mapa debe tener coordenadas numéricas.'
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return 'Las coordenadas están fuera del rango permitido.'
    }

    if (payment.method === 'tarjeta') {
      const cardNumber = payment.cardNumber.replace(/\D/g, '')
      if (payment.cardName.trim().length < 2) {
        return 'Ingresa el nombre del titular de la tarjeta.'
      }
      if (cardNumber.length < 12) {
        return 'Ingresa un número de tarjeta de prueba válido.'
      }
      if (!payment.expiry.trim()) {
        return 'Ingresa la fecha de expiración.'
      }
      if (payment.cvv.replace(/\D/g, '').length < 3) {
        return 'Ingresa un CVV de prueba válido.'
      }
    }

    return null
  }

  const handleContinuePreview = () => {
    if (!currentUser || currentUser.role !== 'cliente') {
      setFeedback({
        type: 'error',
        message: 'Debes iniciar sesión como cliente para confirmar el pedido.',
      })
      return
    }

    const validationError = validateData()
    if (validationError) {
      setFeedback({ type: 'error', message: validationError })
      return
    }

    setStep('preview')
    setFeedback(null)
  }

  const handleResetData = () => {
    setDelivery(buildInitialDelivery(currentUser))
    setPayment(buildInitialPayment(currentUser))
    setStep('data')
    setFeedback(null)
    setReferenceLookup('')
  }

  const handleConfirmOrder = () => {
    if (!draft?.design) {
      setFeedback({ type: 'error', message: 'No hay personalización para confirmar.' })
      return
    }

    const result = onConfirmOrder?.({
      design: draft.design,
      selectedModifications,
      measures,
      delivery,
      payment: sanitizePayment(payment),
    })

    if (result?.ok) {
      setFeedback({ type: 'ok', message: result.message })
      return
    }

    if (result) {
      setFeedback({ type: 'error', message: result.message })
    }
  }

  if (!draft?.design) {
    return (
      <section className="rounded-3xl border border-amber-900/10 bg-white p-6 text-amber-900">
        <p className="font-semibold">No hay una personalización pendiente por confirmar.</p>
        <button
          type="button"
          onClick={onBackToShowcase}
          className="mt-4 rounded-xl border border-amber-900/20 bg-white px-4 py-2 text-sm font-semibold text-amber-900"
        >
          Volver al escaparate
        </button>
      </section>
    )
  }

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onBackToCustomization}
          className="rounded-xl border border-amber-900/20 bg-white px-4 py-2 text-sm font-semibold text-amber-900"
        >
          Volver a personalización
        </button>
        <button
          type="button"
          onClick={onBackToShowcase}
          className="rounded-xl border border-amber-900/20 bg-white px-4 py-2 text-sm font-semibold text-amber-900"
        >
          Volver atrás (previo a personalización)
        </button>
      </div>

      <article className="rounded-3xl border border-amber-900/10 bg-white/90 p-5 md:p-6">
        <h2 className="font-serif text-2xl text-amber-950">Entrega, pago y confirmación</h2>
        <p className="text-sm text-amber-900/80">
          Completa los datos de entrega y pago para confirmar tu pedido personalizado.
        </p>

        {currentUser?.role === 'cliente' ? null : (
          <button
            type="button"
            onClick={onGoLogin}
            className="mt-3 rounded-xl bg-amber-900 px-4 py-2 text-sm font-semibold text-amber-50 transition hover:bg-amber-800"
          >
            Iniciar sesión como cliente
          </button>
        )}

        {step === 'data' ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.95fr]">
            <section className="grid gap-4">
              <div className="rounded-2xl border border-amber-900/10 bg-amber-50/40 p-4">
                <p className="text-sm font-semibold text-amber-950">Ubicación de entrega (mapa)</p>
                <div className="mt-2 overflow-hidden rounded-xl border border-amber-900/15">
                  <MapContainer
                    center={mapPosition}
                    zoom={15}
                    scrollWheelZoom
                    className="h-52 w-full"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapEvents onPick={syncMapCoordinates} />
                    <MapViewportSync position={mapPosition} />
                    <Marker
                      position={mapPosition}
                      draggable
                      eventHandlers={{
                        dragend: (event) => {
                          const marker = event.target
                          const position = marker.getLatLng()
                          syncMapCoordinates(position)
                        },
                      }}
                    />
                  </MapContainer>
                </div>
                <p className="mt-2 text-xs text-amber-900/75">
                  Haz clic en el mapa o arrastra el marcador para ajustar el punto exacto.
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <label className="grid gap-1 text-xs text-amber-900">
                    Latitud
                    <input
                      type="number"
                      value={delivery.latitude}
                      onChange={(event) => setDeliveryField('latitude', event.target.value)}
                      className="rounded-lg border border-amber-900/20 bg-white px-2.5 py-1.5 text-sm"
                    />
                  </label>
                  <label className="grid gap-1 text-xs text-amber-900">
                    Longitud
                    <input
                      type="number"
                      value={delivery.longitude}
                      onChange={(event) => setDeliveryField('longitude', event.target.value)}
                      className="rounded-lg border border-amber-900/20 bg-white px-2.5 py-1.5 text-sm"
                    />
                  </label>
                </div>
                <label className="mt-2 grid gap-1 text-xs text-amber-900">
                  Referencia del punto de entrega
                  <textarea
                    value={delivery.reference}
                    onChange={(event) => {
                      setDeliveryField('reference', event.target.value)
                      setReferenceLookup('Referencia editada manualmente.')
                    }}
                    rows={2}
                    className="rounded-lg border border-amber-900/20 bg-white px-2.5 py-1.5 text-sm"
                    placeholder="Ejemplo: Entrada principal del centro comercial, local 12"
                  />
                </label>
                {referenceLookup ? (
                  <p className="mt-1 text-xs text-amber-900/75">{referenceLookup}</p>
                ) : null}
              </div>

              <div className="rounded-2xl border border-amber-900/10 bg-amber-50/40 p-4">
                <p className="text-sm font-semibold text-amber-950">Datos de contacto</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <label className="grid gap-1 text-xs text-amber-900">
                    Nombre de quien recibe
                    <input
                      type="text"
                      value={delivery.recipientName}
                      onChange={(event) => setDeliveryField('recipientName', event.target.value)}
                      className="rounded-lg border border-amber-900/20 bg-white px-2.5 py-1.5 text-sm"
                    />
                  </label>
                  <label className="grid gap-1 text-xs text-amber-900">
                    Número de teléfono
                    <input
                      type="tel"
                      value={delivery.phone}
                      onChange={(event) => setDeliveryField('phone', event.target.value)}
                      className="rounded-lg border border-amber-900/20 bg-white px-2.5 py-1.5 text-sm"
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-900/10 bg-amber-50/40 p-4">
                <p className="text-sm font-semibold text-amber-950">Información de pago</p>
                <p className="mt-1 text-xs text-amber-900/80">
                  Prototipo: usa datos falsos. Esta información se guardará solo para simulación.
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <label className="grid gap-1 text-xs text-amber-900">
                    Método
                    <select
                      value={payment.method}
                      onChange={(event) => setPaymentField('method', event.target.value)}
                      className="rounded-lg border border-amber-900/20 bg-white px-2.5 py-1.5 text-sm"
                    >
                      <option value="tarjeta">Tarjeta</option>
                      <option value="transferencia">Transferencia</option>
                    </select>
                  </label>
                  <label className="grid gap-1 text-xs text-amber-900">
                    Titular
                    <input
                      type="text"
                      value={payment.cardName}
                      onChange={(event) => setPaymentField('cardName', event.target.value)}
                      className="rounded-lg border border-amber-900/20 bg-white px-2.5 py-1.5 text-sm"
                    />
                  </label>
                  <label className="grid gap-1 text-xs text-amber-900 sm:col-span-2">
                    Número de tarjeta (ficticio)
                    <input
                      type="text"
                      value={payment.cardNumber}
                      onChange={(event) => setPaymentField('cardNumber', event.target.value)}
                      className="rounded-lg border border-amber-900/20 bg-white px-2.5 py-1.5 text-sm"
                    />
                  </label>
                  <label className="grid gap-1 text-xs text-amber-900">
                    Expiración
                    <input
                      type="text"
                      value={payment.expiry}
                      onChange={(event) => setPaymentField('expiry', event.target.value)}
                      placeholder="MM/AA"
                      className="rounded-lg border border-amber-900/20 bg-white px-2.5 py-1.5 text-sm"
                    />
                  </label>
                  <label className="grid gap-1 text-xs text-amber-900">
                    CVV (ficticio)
                    <input
                      type="password"
                      value={payment.cvv}
                      onChange={(event) => setPaymentField('cvv', event.target.value)}
                      className="rounded-lg border border-amber-900/20 bg-white px-2.5 py-1.5 text-sm"
                    />
                  </label>
                </div>
              </div>

              <button
                type="button"
                onClick={handleContinuePreview}
                className="rounded-xl bg-amber-900 px-4 py-2 text-sm font-semibold text-amber-50 transition hover:bg-amber-800"
              >
                Ver vista previa
              </button>
            </section>

            <aside className="grid content-start gap-3 rounded-2xl bg-amber-100 p-4 text-sm text-amber-900">
              <p className="font-semibold text-amber-950">Resumen actual</p>
              <p>Diseño: {draft.design.name}</p>
              <p>Fabricante: {draft.design.manufacturerName || 'N/A'}</p>
              <p>Precio base: ${draft.design.basePrice}</p>

              <div>
                <p className="font-semibold text-amber-950">Personalizaciones</p>
                {selectedModifications.length ? (
                  <ul className="mt-1 grid gap-1">
                    {selectedModifications.map((item) => (
                      <li key={item.id} className="flex justify-between gap-2">
                        <span>{item.name}</span>
                        <span>+${Number(item.extraCost) || 0}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-amber-900/75">Sin personalizaciones.</p>
                )}
              </div>

              <div>
                <p className="font-semibold text-amber-950">Medidas</p>
                {measures && Object.keys(measures).length ? (
                  <ul className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1">
                    {Object.entries(measures).map(([key, value]) => (
                      <li key={key} className="flex justify-between gap-2 capitalize">
                        <span>{key}</span>
                        <span>{value}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-amber-900/75">Sin medidas registradas.</p>
                )}
              </div>

              <p className="text-base font-semibold text-amber-950">
                Total estimado: ${estimatedTotal.toFixed(2)}
              </p>
            </aside>
          </div>
        ) : (
          <div className="mt-4 grid gap-4">
            <article className="rounded-2xl border border-amber-900/10 bg-amber-50/50 p-4 text-sm text-amber-900">
              <h3 className="font-semibold text-amber-950">Vista previa final del pedido</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="grid gap-1">
                  <p><span className="font-semibold">Diseño:</span> {draft.design.name}</p>
                  <p>
                    <span className="font-semibold">Fabricante:</span>{' '}
                    {draft.design.manufacturerName || 'N/A'}
                  </p>
                  <p>
                    <span className="font-semibold">Total:</span> ${estimatedTotal.toFixed(2)}
                  </p>
                </div>
                <div className="grid gap-1">
                  <p>
                    <span className="font-semibold">Entrega:</span> {delivery.recipientName}
                  </p>
                  <p>
                    <span className="font-semibold">Teléfono:</span> {delivery.phone}
                  </p>
                  <p>
                    <span className="font-semibold">Coordenadas:</span> {delivery.latitude},{' '}
                    {delivery.longitude}
                  </p>
                </div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <p className="font-semibold text-amber-950">Personalizaciones elegidas</p>
                  {selectedModifications.length ? (
                    <ul className="mt-1 grid gap-1">
                      {selectedModifications.map((item) => (
                        <li key={item.id} className="flex justify-between gap-2">
                          <span>{item.name}</span>
                          <span>+${Number(item.extraCost) || 0}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-amber-900/75">Sin personalizaciones.</p>
                  )}
                </div>

                <div>
                  <p className="font-semibold text-amber-950">Información de pago (prototipo)</p>
                  <p className="text-xs text-amber-900/80">
                    Datos de pago ficticios usados para simulación.
                  </p>
                  <ul className="mt-1 grid gap-1">
                    <li>Método: {payment.method}</li>
                    <li>Titular: {payment.cardName}</li>
                    <li>Tarjeta: {sanitizePayment(payment).cardNumberMasked}</li>
                    <li>Expiración: {payment.expiry}</li>
                  </ul>
                </div>
              </div>

              <div>
                <p className="mt-3 font-semibold text-amber-950">Medidas incluidas (cm)</p>
                {measures && Object.keys(measures).length ? (
                  <ul className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1">
                    {Object.entries(measures).map(([key, value]) => (
                      <li key={key} className="flex justify-between gap-2 capitalize">
                        <span>{key}</span>
                        <span>{value}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-amber-900/75">Sin medidas registradas.</p>
                )}
              </div>
            </article>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleConfirmOrder}
                className="rounded-xl bg-amber-900 px-4 py-2 text-sm font-semibold text-amber-50 transition hover:bg-amber-800"
              >
                Confirmar y generar pedido
              </button>
              <button
                type="button"
                onClick={handleResetData}
                className="rounded-xl border border-amber-900/20 bg-white px-4 py-2 text-sm font-semibold text-amber-900"
              >
                Volver a insertar datos
              </button>
              <button
                type="button"
                onClick={onBackToShowcase}
                className="rounded-xl border border-amber-900/20 bg-white px-4 py-2 text-sm font-semibold text-amber-900"
              >
                Volver atrás (previo a personalización)
              </button>
            </div>
          </div>
        )}

        {feedback ? (
          <p
            className={`mt-4 rounded-xl px-3 py-2 text-xs ${
              feedback.type === 'ok'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {feedback.message}
          </p>
        ) : null}
      </article>
    </section>
  )
}
