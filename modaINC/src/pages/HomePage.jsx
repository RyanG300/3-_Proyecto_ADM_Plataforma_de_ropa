import CatalogSection from '../components/catalog/CatalogSection'
import Hero from '../components/layout/Hero'
import ManufacturersSection from '../components/manufacturer/ManufacturersSection'
import SuggestedManufacturers from '../components/manufacturer/SuggestedManufacturers'

export default function HomePage({
  catalog,
  manufacturers,
  currentUser,
  suggestedManufacturers,
  onGoLogin,
  onOpenShowcase,
}) {
  return (
    <div className="grid gap-4">
      <Hero />

      <section className="rounded-3xl border border-amber-900/10 bg-white/85 p-5 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-serif text-2xl text-amber-950">¿Quieres vender o comprar?</h2>
            <p className="text-sm text-amber-900/80">
              Accede a tu cuenta para gestionar pedidos, escaparates y administración.
            </p>
          </div>
          <button
            type="button"
            onClick={onGoLogin}
            className="rounded-xl bg-amber-900 px-4 py-2 font-semibold text-amber-50 transition hover:bg-amber-800"
          >
            Ir a iniciar sesión
          </button>
        </div>
      </section>

      <SuggestedManufacturers
        suggestions={suggestedManufacturers}
        onOpenShowcase={onOpenShowcase}
      />

      <CatalogSection catalog={catalog} />
      <ManufacturersSection
        manufacturers={manufacturers}
        currentUser={currentUser}
        onOpenShowcase={onOpenShowcase}
      />
    </div>
  )
}
