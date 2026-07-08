import Button from "../components/Button.jsx";
import SEO from "../components/SEO.jsx";

export default function NotFound() {
  return (
    <>
      <SEO title="Pagina niet gevonden" description="Deze pagina bestaat niet. Ga terug naar Cuddling Memories Fotografie." />
      <section className="min-h-[70vh] pt-36">
        <div className="container-soft pb-16">
          <div className="mx-auto max-w-2xl rounded-lg bg-card p-8 text-center shadow-soft warm-border md:p-12">
            <p className="script-line text-5xl text-cocoa">404</p>
            <h1 className="display-title mt-2 text-4xl font-semibold text-coffee md:text-5xl">Deze pagina is niet gevonden</h1>
            <p className="mt-5 text-sm leading-7 text-coffee/75">De link klopt misschien niet meer. Vanaf de homepage vind je snel weer de juiste plek.</p>
            <Button to="/" className="mt-8">Terug naar home</Button>
          </div>
        </div>
      </section>
    </>
  );
}
