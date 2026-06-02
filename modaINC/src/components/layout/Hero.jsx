export default function Hero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-amber-900/10 bg-linear-to-br from-amber-100 via-orange-50 to-white p-6 md:p-10">
      <div className="pointer-events-none absolute -right-24 -top-16 h-56 w-56 rounded-full bg-orange-200/50 blur-2xl" />
      <div className="pointer-events-none absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-amber-300/40 blur-2xl" />

    
      <h1
        className="max-w-3xl text-3xl leading-tight text-amber-950 md:text-5xl"
        style={{ fontFamily: 'Playfair Display, ui-serif, Georgia, serif' }}
      >
        Diseña tu prenda ideal y conecta con fabricantes expertos en confección a medida.
      </h1>
      <p className="mt-4 max-w-2xl text-sm text-amber-900/85 md:text-base">
        Explora escaparates, compara estilos y parte desde diseños prefabricados para personalizar
        telas, botones, acabados y medidas corporales.
      </p>
    </section>
  )
}
