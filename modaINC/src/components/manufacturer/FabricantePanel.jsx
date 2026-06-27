import { useMemo, useState } from 'react'
import { locationCatalog, styleCatalog } from '../../data/mockData'
import ReceivedOrders from './ReceivedOrders'

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'))
    reader.readAsDataURL(file)
  })
}

export default function FabricantePanel({ currentUser, showcases, orders = [], updateShowcase }) {
  const ownShowcase = useMemo(() => {
    return showcases.find((showcase) => showcase.manufacturerId === currentUser.id)
  }, [showcases, currentUser.id])

  const ownOrders = useMemo(() => {
    return orders.filter((order) => order.manufacturerId === currentUser.id)
  }, [orders, currentUser.id])

  const [newService, setNewService] = useState('')
  const [newImage, setNewImage] = useState('')
  const [previewImage, setPreviewImage] = useState('')
  const [newDesign, setNewDesign] = useState({
    name: '',
    type: 'Prenda',
    basePrice: '',
    image: '',
  })
  const [modifierDrafts, setModifierDrafts] = useState({})
  const [sessionDrafts, setSessionDrafts] = useState({})

  if (!ownShowcase) {
    return (
      <section className="rounded-2xl bg-amber-100 p-5 text-amber-900">
        No se encontró escaparate para tu cuenta.
      </section>
    )
  }

  const updateField = (field, value) => {
    updateShowcase(ownShowcase.id, { [field]: value })
  }

  // HU-04: el fabricante indica qué estilos confecciona, para que esa
  // información alimente la búsqueda y las sugerencias del cliente (HU-06/HU-07).
  const toggleStyle = (style) => {
    const current = ownShowcase.styles ?? []
    const next = current.includes(style)
      ? current.filter((item) => item !== style)
      : [...current, style]
    updateShowcase(ownShowcase.id, { styles: next })
  }

  const addService = () => {
    const value = newService.trim()
    if (!value) return
    updateShowcase(ownShowcase.id, {
      services: [...ownShowcase.services, value],
    })
    setNewService('')
  }

  const addImage = () => {
    const value = newImage.trim()
    if (!value) return
    updateShowcase(ownShowcase.id, {
      gallery: [...ownShowcase.gallery, value],
    })
    setNewImage('')
  }

  const addImageFromDevice = async (event) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    const dataUrl = await fileToDataUrl(selectedFile)
    updateShowcase(ownShowcase.id, {
      gallery: [...ownShowcase.gallery, dataUrl],
    })
    event.target.value = ''
  }

  const addDesign = () => {
    if (!newDesign.name.trim()) return

    const createdDesign = {
      id: `d-${Math.random().toString(36).slice(2, 9)}`,
      name: newDesign.name.trim(),
      type: newDesign.type.trim() || 'Prenda',
      basePrice: Number(newDesign.basePrice) || 0,
      image: newDesign.image.trim(),
      modificationSessions: ['General'],
      modifications: [],
    }

    updateShowcase(ownShowcase.id, {
      designs: [...ownShowcase.designs, createdDesign],
    })

    setNewDesign({ name: '', type: 'Prenda', basePrice: '', image: '' })
  }

  const setDesignImageFromDevice = async (event) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    const dataUrl = await fileToDataUrl(selectedFile)
    setNewDesign((prev) => ({ ...prev, image: dataUrl }))
    event.target.value = ''
  }

  const updateModifierDraft = (designId, field, value) => {
    setModifierDrafts((prev) => ({
      ...prev,
      [designId]: {
        name: prev[designId]?.name ?? '',
        image: prev[designId]?.image ?? '',
        extraCost: prev[designId]?.extraCost ?? '',
        section:
          prev[designId]?.section ??
          ownShowcase.designs.find((item) => item.id === designId)?.modificationSessions?.[0] ??
          'General',
        [field]: value,
      },
    }))
  }

  const updateSessionDraft = (designId, value) => {
    setSessionDrafts((prev) => ({ ...prev, [designId]: value }))
  }

  const addSession = (designId) => {
    const value = (sessionDrafts[designId] ?? '').trim()
    if (!value) return

    const updatedDesigns = ownShowcase.designs.map((design) => {
      if (design.id !== designId) return design

      if (design.modificationSessions?.includes(value)) {
        return design
      }

      return {
        ...design,
        modificationSessions: [...(design.modificationSessions ?? []), value],
      }
    })

    updateShowcase(ownShowcase.id, { designs: updatedDesigns })
    updateModifierDraft(designId, 'section', value)
    setSessionDrafts((prev) => ({ ...prev, [designId]: '' }))
  }

  const addModification = (designId) => {
    const draft = modifierDrafts[designId]
    if (!draft?.name?.trim()) return

    const updatedDesigns = ownShowcase.designs.map((design) => {
      if (design.id !== designId) return design

      const createdModification = {
        id: `m-${Math.random().toString(36).slice(2, 9)}`,
        name: draft.name.trim(),
        image: draft.image?.trim() ?? '',
        extraCost: Number(draft.extraCost) || 0,
        section:
          draft.section || design.modificationSessions?.[0] || 'General',
      }

      return {
        ...design,
        modifications: [...(design.modifications ?? []), createdModification],
      }
    })

    updateShowcase(ownShowcase.id, { designs: updatedDesigns })

    setModifierDrafts((prev) => ({
      ...prev,
      [designId]: { name: '', image: '', extraCost: '', section: draft.section || 'General' },
    }))
  }

  const setModificationImageFromDevice = async (designId, event) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    const dataUrl = await fileToDataUrl(selectedFile)
    updateModifierDraft(designId, 'image', dataUrl)
    event.target.value = ''
  }

  return (
    <section className="grid gap-4">
      <article className="rounded-3xl border border-amber-900/10 bg-white p-5 md:p-6">
        <h2 className="font-serif text-2xl text-amber-950">Mi escaparate</h2>
        <p className="mb-4 text-sm text-amber-900/80">
          Los cambios se reflejan inmediatamente en la vista pública.
        </p>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm text-amber-900">
            Nombre comercial
            <input
              type="text"
              value={ownShowcase.businessName}
              onChange={(event) => updateField('businessName', event.target.value)}
              className="rounded-xl border border-amber-900/20 px-3 py-2"
            />
          </label>

          <label className="grid gap-1 text-sm text-amber-900">
            Especialidad
            <input
              type="text"
              value={ownShowcase.specialty}
              onChange={(event) => updateField('specialty', event.target.value)}
              className="rounded-xl border border-amber-900/20 px-3 py-2"
            />
          </label>
        </div>

        <label className="mt-3 grid gap-1 text-sm text-amber-900">
          Descripción
          <textarea
            rows={4}
            value={ownShowcase.description}
            onChange={(event) => updateField('description', event.target.value)}
            className="rounded-xl border border-amber-900/20 px-3 py-2"
          />
        </label>

        <label className="mt-3 grid gap-1 text-sm text-amber-900 md:max-w-xs">
          Ubicación
          <select
            value={ownShowcase.location ?? ''}
            onChange={(event) => updateField('location', event.target.value)}
            aria-label="Ubicación del escaparate"
            className="rounded-xl border border-amber-900/20 px-3 py-2"
          >
            <option value="">Selecciona tu ubicación</option>
            {locationCatalog.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="mt-3">
          <legend className="text-sm text-amber-900">
            Estilos que confeccionas
          </legend>
          <p className="text-xs text-amber-900/70">
            Esto ayuda a los clientes a encontrarte por estilo en la búsqueda y en
            las sugerencias.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {styleCatalog.map((style) => (
              <label
                key={style}
                className="flex items-center gap-2 rounded-xl border border-amber-900/15 bg-amber-50/50 px-3 py-1.5 text-sm text-amber-900"
              >
                <input
                  type="checkbox"
                  checked={(ownShowcase.styles ?? []).includes(style)}
                  onChange={() => toggleStyle(style)}
                  aria-label={style}
                  className="h-4 w-4 accent-amber-800"
                />
                {style}
              </label>
            ))}
          </div>
        </fieldset>
      </article>

      <article className="rounded-3xl border border-amber-900/10 bg-white p-5 md:p-6">
        <h3 className="text-lg font-semibold text-amber-950">Servicios</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {ownShowcase.services.map((service) => (
            <span key={service} className="rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-900">
              {service}
            </span>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={newService}
            onChange={(event) => setNewService(event.target.value)}
            placeholder="Agregar servicio"
            className="flex-1 rounded-xl border border-amber-900/20 px-3 py-2"
          />
          <button
            type="button"
            onClick={addService}
            className="rounded-xl bg-amber-900 px-4 py-2 font-semibold text-amber-50"
          >
            Agregar
          </button>
        </div>
      </article>

      <article className="rounded-3xl border border-amber-900/10 bg-white p-5 md:p-6">
        <h3 className="text-lg font-semibold text-amber-950">Galería</h3>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
          {ownShowcase.gallery.map((image, index) => (
            <img
              key={`${image}-${index}`}
              src={image}
              alt={`Muestra ${index + 1}`}
              className="h-28 w-full rounded-xl object-cover"
            />
          ))}
          {!ownShowcase.gallery.length ? (
            <p className="col-span-full text-sm text-amber-900/75">Aún no hay imágenes cargadas.</p>
          ) : null}
        </div>
        <div className="mt-4 flex gap-2">
          <input
            type="url"
            value={newImage}
            onChange={(event) => setNewImage(event.target.value)}
            placeholder="https://..."
            className="flex-1 rounded-xl border border-amber-900/20 px-3 py-2"
          />
          <button
            type="button"
            onClick={addImage}
            className="rounded-xl bg-amber-900 px-4 py-2 font-semibold text-amber-50"
          >
            Subir
          </button>
        </div>
        <label className="mt-2 inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-amber-900/20 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
          Subir desde dispositivo
          <input type="file" accept="image/*" onChange={addImageFromDevice} className="hidden" />
        </label>
      </article>

      <article className="rounded-3xl border border-amber-900/10 bg-white p-5 md:p-6">
        <h3 className="text-lg font-semibold text-amber-950">Diseños prefabricados</h3>
        <p className="text-sm text-amber-900/75">
          Inserta prendas base con imagen y luego agrega modificaciones genéricas para clientes.
        </p>

        <div className="mt-4 grid gap-2 md:grid-cols-4">
          <input
            type="text"
            value={newDesign.name}
            onChange={(event) =>
              setNewDesign((prev) => ({ ...prev, name: event.target.value }))
            }
            placeholder="Nombre del prefabricado"
            className="rounded-xl border border-amber-900/20 px-3 py-2"
          />
          <input
            type="text"
            value={newDesign.type}
            onChange={(event) =>
              setNewDesign((prev) => ({ ...prev, type: event.target.value }))
            }
            placeholder="Tipo"
            className="rounded-xl border border-amber-900/20 px-3 py-2"
          />
          <input
            type="number"
            min={0}
            value={newDesign.basePrice}
            onChange={(event) =>
              setNewDesign((prev) => ({ ...prev, basePrice: event.target.value }))
            }
            placeholder="Precio base"
            className="rounded-xl border border-amber-900/20 px-3 py-2"
          />
          <input
            type="url"
            value={newDesign.image}
            onChange={(event) =>
              setNewDesign((prev) => ({ ...prev, image: event.target.value }))
            }
            placeholder="Imagen (opcional)"
            className="rounded-xl border border-amber-900/20 px-3 py-2"
          />
        </div>

        <label className="mt-2 inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-amber-900/20 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
          Seleccionar imagen desde dispositivo
          <input
            type="file"
            accept="image/*"
            onChange={setDesignImageFromDevice}
            className="hidden"
          />
        </label>

        <button
          type="button"
          onClick={addDesign}
          className="mt-3 rounded-xl bg-amber-900 px-4 py-2 font-semibold text-amber-50"
        >
          Agregar diseño prefabricado
        </button>

        <div className="mt-5 grid gap-4">
          {ownShowcase.designs.map((design) => {
            const draft = modifierDrafts[design.id] ?? {
              name: '',
              image: '',
              extraCost: '',
              section: design.modificationSessions?.[0] ?? 'General',
            }

            const groupedModifications = (design.modificationSessions ?? ['General']).map(
              (sectionName) => ({
                sectionName,
                items: (design.modifications ?? []).filter(
                  (item) => (item.section || 'General') === sectionName,
                ),
              }),
            )

            return (
              <article key={design.id} className="rounded-2xl border border-amber-900/10 bg-amber-50/50 p-4">
                <div className="grid gap-3 md:grid-cols-[140px_1fr]">
                  <button
                    type="button"
                    onClick={() => setPreviewImage(design.image)}
                    className="overflow-hidden rounded-xl border border-amber-900/15 bg-white"
                  >
                    {design.image ? (
                      <img
                        src={design.image}
                        alt={design.name}
                        className="h-32 w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-32 place-items-center text-xs text-amber-900/70">
                        Sin imagen
                      </div>
                    )}
                  </button>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-amber-900/70">{design.type}</p>
                    <h4 className="font-semibold text-amber-950">{design.name}</h4>
                    <p className="text-sm text-amber-900">Precio base: ${design.basePrice}</p>
                    <p className="text-xs text-amber-900/70">
                      Click en la preview para ver imagen ampliada.
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-amber-900/10 bg-white p-3">
                  <p className="text-sm font-semibold text-amber-950">Modificaciones disponibles</p>

                  <div className="mt-2 flex flex-wrap gap-2 rounded-xl border border-amber-900/10 bg-amber-50/40 p-2">
                    {(design.modificationSessions ?? ['General']).map((sessionName) => (
                      <span
                        key={`${design.id}-session-${sessionName}`}
                        className="rounded-full border border-amber-900/20 bg-white px-3 py-1 text-xs font-semibold text-amber-900"
                      >
                        {sessionName}
                      </span>
                    ))}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <input
                      type="text"
                      value={sessionDrafts[design.id] ?? ''}
                      onChange={(event) => updateSessionDraft(design.id, event.target.value)}
                      placeholder="Nueva sesión (ej. Tejidos)"
                      className="min-w-52 flex-1 rounded-xl border border-amber-900/20 px-3 py-2"
                    />
                    <button
                      type="button"
                      onClick={() => addSession(design.id)}
                      className="rounded-xl border border-amber-900/20 bg-white px-3 py-2 text-sm font-semibold text-amber-900"
                    >
                      Crear sesión
                    </button>
                  </div>

                  <div className="mt-3 grid gap-3">
                    {groupedModifications.map((group) => (
                      <div key={`${design.id}-${group.sectionName}`} className="rounded-xl border border-amber-900/10 bg-amber-50/50 p-3">
                        <p className="text-sm font-semibold text-amber-950">Sesión: {group.sectionName}</p>
                        <div className="mt-2 grid gap-2 md:grid-cols-3">
                          {group.items.map((item) => (
                            <div key={item.id} className="rounded-lg border border-amber-900/10 bg-white p-2">
                              <p className="text-sm font-medium text-amber-950">{item.name}</p>
                              <p className="text-xs text-amber-900/75">Costo adicional: ${item.extraCost}</p>
                              {item.image ? (
                                <button
                                  type="button"
                                  onClick={() => setPreviewImage(item.image)}
                                  className="mt-2 text-xs font-semibold text-amber-900 underline"
                                >
                                  Ver imagen
                                </button>
                              ) : null}
                            </div>
                          ))}
                          {!group.items.length ? (
                            <p className="text-sm text-amber-900/70">Sin modificaciones en esta sesión.</p>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 grid gap-2 md:grid-cols-4">
                    <select
                      value={draft.section}
                      onChange={(event) =>
                        updateModifierDraft(design.id, 'section', event.target.value)
                      }
                      className="rounded-xl border border-amber-900/20 px-3 py-2"
                    >
                      {(design.modificationSessions ?? ['General']).map((sessionName) => (
                        <option key={`${design.id}-option-${sessionName}`} value={sessionName}>
                          Sesión: {sessionName}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={draft.name}
                      onChange={(event) =>
                        updateModifierDraft(design.id, 'name', event.target.value)
                      }
                      placeholder="Nombre de modificación"
                      className="rounded-xl border border-amber-900/20 px-3 py-2"
                    />
                    <input
                      type="url"
                      value={draft.image}
                      onChange={(event) =>
                        updateModifierDraft(design.id, 'image', event.target.value)
                      }
                      placeholder="Imagen opcional"
                      className="rounded-xl border border-amber-900/20 px-3 py-2"
                    />
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={draft.extraCost}
                      onChange={(event) =>
                        updateModifierDraft(design.id, 'extraCost', event.target.value)
                      }
                      placeholder="Costo adicional"
                      className="rounded-xl border border-amber-900/20 px-3 py-2"
                    />
                  </div>
                  <label className="mt-2 inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-amber-900/20 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
                    Imagen de modificación desde dispositivo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => setModificationImageFromDevice(design.id, event)}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => addModification(design.id)}
                    className="mt-3 rounded-xl bg-amber-900 px-3 py-2 text-sm font-semibold text-amber-50"
                  >
                    Agregar modificación
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </article>

      <ReceivedOrders orders={ownOrders} />

      {previewImage ? (
        <section className="fixed inset-0 z-30 grid place-items-center bg-amber-950/60 p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-4">
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewImage('')}
                className="rounded-xl border border-amber-900/20 px-3 py-1 text-sm text-amber-900"
              >
                Cerrar
              </button>
            </div>
            <img src={previewImage} alt="Vista previa" className="max-h-[70vh] w-full rounded-2xl object-contain" />
          </div>
        </section>
      ) : null}
    </section>
  )
}
