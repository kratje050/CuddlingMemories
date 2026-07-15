import { CheckCircle2 } from "lucide-react";
import Button from "../components/Button.jsx";
import SEO from "../components/SEO.jsx";
import { useLocation } from "react-router-dom";

export default function Thanks() {
  const { state } = useLocation();
  const portalUrl = state?.portalUrl || "";
  return (
    <>
      <SEO
        title="Bedankt"
        description="Bedankt voor je aanvraag bij Cuddling Memories Fotografie. Ik neem contact met je op."
      />
      <section className="min-h-[70vh] pt-36">
        <div className="container-soft pb-16">
          <div className="mx-auto max-w-2xl rounded-lg bg-card p-8 text-center shadow-soft warm-border md:p-12">
            <CheckCircle2 className="mx-auto text-cocoa" size={42} />
            <p className="script-line mt-5 text-4xl text-cocoa">Bedankt</p>
            <h1 className="display-title mt-2 text-4xl font-semibold text-coffee md:text-5xl">Je aanvraag is verstuurd</h1>
            <p className="mt-5 text-sm leading-7 text-coffee/75">
              Ik lees je bericht en reageer zo snel mogelijk met de volgende stap voor jouw shoot. Je
              boekingsaanvraag is nog niet definitief — pas zodra ik 'm bevestig, is het tijdslot echt voor jou
              gereserveerd.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              {portalUrl && <Button href={portalUrl}>Open mijn klantportaal</Button>}
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
