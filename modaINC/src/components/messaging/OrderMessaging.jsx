import { useEffect, useMemo, useRef, useState } from 'react'

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('No se pudo leer el archivo seleccionado.'))
    reader.readAsDataURL(file)
  })
}

function buildContacts({ currentUser, users, orders }) {
  const contactMap = new Map()

  orders.forEach((order) => {
    const isClientSide = currentUser.role === 'cliente' && order.clientId === currentUser.id
    const isManufacturerSide =
      currentUser.role === 'fabricante' && order.manufacturerId === currentUser.id

    if (!isClientSide && !isManufacturerSide) return

    const contactId = isClientSide ? order.manufacturerId : order.clientId
    if (!contactId) return

    const fallbackName = isClientSide ? order.manufacturerName : order.clientName
    const userName = users.find((user) => user.id === contactId)?.name
    const contactName = userName || fallbackName || 'Contacto sin nombre'

    if (!contactMap.has(contactId)) {
      contactMap.set(contactId, {
        id: contactId,
        name: contactName,
        orders: [order],
      })
      return
    }

    contactMap.get(contactId).orders.push(order)
  })

  return [...contactMap.values()]
}

export default function OrderMessaging({
  currentUser,
  users = [],
  orders = [],
  messages = [],
  onSendMessage,
  title,
  subtitle,
  emptyMessage,
  sideLabel,
}) {
  const [activeContactId, setActiveContactId] = useState('')
  const [activeOrderId, setActiveOrderId] = useState('')
  const [textDraft, setTextDraft] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef(null)
  const mediaStreamRef = useRef(null)
  const recordedChunksRef = useRef([])

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const contacts = useMemo(
    () => buildContacts({ currentUser, users, orders }),
    [currentUser, users, orders],
  )

  useEffect(() => {
    if (!contacts.length) {
      setActiveContactId('')
      setActiveOrderId('')
      return
    }

    const exists = contacts.some((contact) => contact.id === activeContactId)
    if (!exists) {
      setActiveContactId(contacts[0].id)
    }
  }, [contacts, activeContactId])

  const activeContact = useMemo(
    () => contacts.find((contact) => contact.id === activeContactId) ?? null,
    [contacts, activeContactId],
  )

  const activeContactOrders = activeContact?.orders ?? []

  useEffect(() => {
    if (!activeContactOrders.length) {
      setActiveOrderId('')
      return
    }

    const exists = activeContactOrders.some((order) => order.id === activeOrderId)
    if (!exists) {
      setActiveOrderId(activeContactOrders[0].id)
    }
  }, [activeContactOrders, activeOrderId])

  const activeMessages = useMemo(() => {
    if (!activeOrderId) return []

    return messages
      .filter((message) => message.orderId === activeOrderId)
      .sort((first, second) => (first.sentAt ?? 0) - (second.sentAt ?? 0))
  }, [messages, activeOrderId])

  const activeOrder = useMemo(
    () => activeContactOrders.find((order) => order.id === activeOrderId) ?? null,
    [activeContactOrders, activeOrderId],
  )

  const submitMessage = async ({ type, text = '', file = null }) => {
    if (!activeOrderId) return

    let mediaDataUrl = ''
    let mediaMime = ''
    let mediaName = ''

    if (file) {
      mediaDataUrl = await fileToDataUrl(file)
      mediaMime = file.type || ''
      mediaName = file.name || ''
    }

    const result = onSendMessage?.({
      orderId: activeOrderId,
      senderId: currentUser.id,
      type,
      text,
      mediaDataUrl,
      mediaMime,
      mediaName,
    })

    if (result?.ok) {
      setFeedback({ type: 'ok', message: result.message })
      setTextDraft('')
      return
    }

    if (result) {
      setFeedback({ type: 'error', message: result.message })
    }
  }

  const handleSendText = () => {
    const value = textDraft.trim()
    if (!value) return
    submitMessage({ type: 'text', text: value })
  }

  const handleSendImage = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    await submitMessage({ type: 'image', file })
    event.target.value = ''
  }

  const handleSendAudio = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    await submitMessage({ type: 'audio', file })
    event.target.value = ''
  }

  const handleStartRecording = async () => {
    if (isRecording) return

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== 'function'
    ) {
      setFeedback({
        type: 'error',
        message: 'Tu navegador no soporta grabación directa de audio.',
      })
      return
    }

    if (typeof window === 'undefined' || typeof window.MediaRecorder === 'undefined') {
      setFeedback({
        type: 'error',
        message: 'MediaRecorder no está disponible en este navegador.',
      })
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      recordedChunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = async () => {
        const chunks = recordedChunksRef.current
        recordedChunksRef.current = []

        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop())
          mediaStreamRef.current = null
        }

        setIsRecording(false)

        if (!chunks.length) {
          setFeedback({
            type: 'error',
            message: 'No se detectó audio en la grabación.',
          })
          return
        }

        const blobType = recorder.mimeType || 'audio/webm'
        const audioBlob = new Blob(chunks, { type: blobType })
        const extension = blobType.includes('ogg') ? 'ogg' : 'webm'
        const audioFile = new File(
          [audioBlob],
          `mensaje-voz-${Date.now()}.${extension}`,
          { type: blobType },
        )

        await submitMessage({ type: 'audio', file: audioFile })
      }

      recorder.onerror = () => {
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop())
          mediaStreamRef.current = null
        }
        setIsRecording(false)
        setFeedback({
          type: 'error',
          message: 'No se pudo completar la grabación de audio.',
        })
      }

      mediaStreamRef.current = stream
      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
      setFeedback({
        type: 'ok',
        message: 'Grabación iniciada. Presiona "Detener y enviar voz" para enviar el audio.',
      })
    } catch {
      setFeedback({
        type: 'error',
        message: 'No se pudo acceder al micrófono. Revisa los permisos del navegador.',
      })
    }
  }

  const handleStopRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return
    mediaRecorderRef.current.stop()
  }

  return (
    <article className="rounded-3xl border border-amber-900/10 bg-white p-5 md:p-6">
      <h3 className="font-semibold text-amber-950">{title}</h3>
      <p className="text-sm text-amber-900/75">{subtitle}</p>

      {!contacts.length ? (
        <p className="mt-4 rounded-xl bg-amber-100 px-4 py-3 text-sm text-amber-900">
          {emptyMessage}
        </p>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-[260px_1fr]">
          <aside className="rounded-2xl border border-amber-900/10 bg-amber-50/40 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-900/65">
              {sideLabel}
            </p>
            <div className="grid gap-2">
              {contacts.map((contact) => (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => setActiveContactId(contact.id)}
                  className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                    contact.id === activeContactId
                      ? 'border-amber-900/30 bg-white text-amber-950'
                      : 'border-amber-900/10 bg-white/70 text-amber-900'
                  }`}
                >
                  <p className="font-semibold">{contact.name}</p>
                  <p className="text-xs text-amber-900/75">
                    {contact.orders.length} pedido{contact.orders.length === 1 ? '' : 's'}
                  </p>
                </button>
              ))}
            </div>
          </aside>

          <section className="grid gap-3 rounded-2xl border border-amber-900/10 bg-amber-50/30 p-3">
            {activeOrder ? (
              <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
                <div>
                  <p className="text-sm font-semibold text-amber-950">Chat por pedido</p>
                  <p className="text-xs text-amber-900/75">
                    Pedido {activeOrder.id} · {activeOrder.designName}
                  </p>
                </div>

                <label className="grid gap-1 text-xs text-amber-900">
                  Pedido activo
                  <select
                    value={activeOrderId}
                    onChange={(event) => setActiveOrderId(event.target.value)}
                    className="rounded-lg border border-amber-900/20 bg-white px-2.5 py-1.5 text-sm"
                  >
                    {activeContactOrders.map((order) => (
                      <option key={order.id} value={order.id}>
                        {order.designName} · {order.createdAt}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : null}

            <div className="max-h-80 min-h-44 space-y-2 overflow-y-auto rounded-xl border border-amber-900/10 bg-white p-3">
              {activeMessages.length ? (
                activeMessages.map((message) => {
                  const mine = message.senderId === currentUser.id

                  return (
                    <div
                      key={message.id}
                      className={`max-w-[85%] rounded-xl border px-3 py-2 text-sm ${
                        mine
                          ? 'ml-auto border-amber-900/20 bg-amber-100 text-amber-950'
                          : 'border-amber-900/10 bg-white text-amber-900'
                      }`}
                    >
                      <p className="text-xs font-semibold text-amber-900/80">
                        {mine ? 'Tú' : message.senderName}
                      </p>

                      {message.type === 'image' && message.mediaDataUrl ? (
                        <img
                          src={message.mediaDataUrl}
                          alt={message.mediaName || 'Imagen enviada'}
                          className="mt-1 max-h-56 w-full rounded-lg object-contain"
                        />
                      ) : null}

                      {message.type === 'audio' && message.mediaDataUrl ? (
                        <audio controls src={message.mediaDataUrl} className="mt-1 w-full" />
                      ) : null}

                      {message.text ? <p className="mt-1">{message.text}</p> : null}

                      <p className="mt-1 text-right text-xs text-amber-900/65">
                        {message.createdAt}
                      </p>
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-amber-900/70">
                  Aún no hay mensajes en este pedido. Envía el primero para iniciar la conversación.
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <textarea
                rows={2}
                value={textDraft}
                onChange={(event) => {
                  setTextDraft(event.target.value)
                  setFeedback(null)
                }}
                placeholder="Escribe un mensaje"
                className="rounded-xl border border-amber-900/20 bg-white px-3 py-2 text-sm"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSendText}
                  className="rounded-xl bg-amber-900 px-4 py-2 text-sm font-semibold text-amber-50"
                >
                  Enviar mensaje
                </button>

                <label className="inline-flex cursor-pointer items-center rounded-xl border border-amber-900/20 bg-white px-3 py-2 text-sm font-medium text-amber-900">
                  Enviar imagen
                  <input type="file" accept="image/*" onChange={handleSendImage} className="hidden" />
                </label>

                <label className="inline-flex cursor-pointer items-center rounded-xl border border-amber-900/20 bg-white px-3 py-2 text-sm font-medium text-amber-900">
                  Enviar mensaje de voz
                  <input type="file" accept="audio/*" onChange={handleSendAudio} className="hidden" />
                </label>

                {!isRecording ? (
                  <button
                    type="button"
                    onClick={handleStartRecording}
                    className="rounded-xl border border-amber-900/20 bg-white px-3 py-2 text-sm font-medium text-amber-900"
                  >
                    Grabar mensaje de voz
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStopRecording}
                    className="rounded-xl bg-red-700 px-3 py-2 text-sm font-semibold text-red-50"
                  >
                    Detener y enviar voz
                  </button>
                )}
              </div>
            </div>

            {feedback ? (
              <p
                className={`rounded-xl px-3 py-2 text-xs ${
                  feedback.type === 'ok'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {feedback.message}
              </p>
            ) : null}
          </section>
        </div>
      )}
    </article>
  )
}
