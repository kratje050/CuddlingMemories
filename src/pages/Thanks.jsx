import { CheckCircle2 } from "lucide-react";
import Button from "../components/Button.jsx";
import SEO from "../components/SEO.jsx";

export default function Thanks() {
  return (
    <>
      <SEO
        title="Bedankt"
        description="Bedankt voor je aanvraag bij Cuddling Memories Fotografie. Demy neemt contact met je op."
      />
      <section className="min-h-[70vh] pt-36">
        <div className="container-soft pb-16">
          <div className="mx-auto max-w-2xl rounded-lg bg-card p-8 text-center shadow-soft warm-border md:p-12">
            <CheckCircle2 className="mx-auto text-cocoa" size={42} />
            <p className="script-line mt-5 text-4xl text-cocoa">Bedankt</p>
            <h1 className="display-title mt-2 text-4xl font-semibold text-coffee md:text-5xl">Je aanvraag is verstuurd</h1>
            <p className="mt-5 text-sm leading-7 text-coffee/75">
              Demy leest je bericht en reageert zo snel mogelijk met de volgende stap voor jouw shoot.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button to="/portfolio" variant="secondary">
                Bekijk portfolio
              </Button>
              <Button to="/">Terug naar home</Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
