import { ArrowLeft, ArrowRight, Send, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Button from "../components/Button.jsx";
import FAQItem from "../components/FAQItem.jsx";
import SEO from "../components/SEO.jsx";
import SectionTitle from "../components/SectionTitle.jsx";
import MonthAvailabilityOverview from "../components/MonthAvailabilityOverview.jsx";
import WaitlistForm from "../components/WaitlistForm.jsx";
import StepIndicator from "../components/booking/StepIndicator.jsx";
import ShootTypeStep from "../components/booking/ShootTypeStep.jsx";
import PackageStep from "../components/booking/PackageStep.jsx";
import BookingCalendar from "../components/booking/BookingCalendar.jsx";
import TimeSlotStep from "../components/booking/TimeSlotStep.jsx";
import DetailsStep from "../components/booking/DetailsStep.jsx";
import BookingSummaryContent from "../components/booking/BookingSummaryContent.jsx";
import { getPublishedPackages, getVisibleFaqs } from "../lib/api.js";
import { getBookableShootTypes } from "../lib/bookingAvailability.js";
import { usePageMeta } from "../lib/usePageMeta.js";

const emptyDetails = { naam: "", email: "", locationType: "studio", omgeving: "", bericht: "", privacy: false };

export default function Contact() {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const requestedShoot = params.get("shoot");
  const requestedMonthParam = params.get("maand");
  const waitlistMonthParam = params.get("wachtlijst");
  const wizardRef = useRef(null);

  const initialMonth = useMemo(() => {
    if (!requestedMonthParam || !/^\d{4}-\d{2}$/.test(requestedMonthParam)) return null;
    const [year, month] = requestedMonthParam.split("-").map(Number);
    return new Date(year, month - 1, 1);
  }, [requestedMonthParam]);

  const { title, description } = usePageMeta(
    "contact",
    "Contact en boeken",
    "Boek een fotoshoot bij Cuddling Memories via de kalender voor zwangerschap, newborn, cakesmash, gezin, portret, motherhood en buiten fotografie."
  );

  const [step, setStep] = useState(0);
  const [bookableTypes, setBookableTypes] = useState([]);
  const [packages, setPackages] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [loadingBase, setLoadingBase] = useState(true);

  const [shootType, setShootType] = useState(null);
  const [packageId, setPackageId] = useState(null);
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [details, setDetails] = useState(emptyDetails);
  const [botField, setBotField] = useState("");
  const [detailsError, setDetailsError] = useState("");
  const [submitStatus, setSubmitStatus] = useState("idle");
  const [submitError, setSubmitError] = useState("");
  const formRenderedAt = useRef(Date.now());

  useEffect(() => {
    let active = true;
    Promise.all([getBookableShootTypes(), getPublishedPackages(), getVisibleFaqs()])
      .then(([types, pkgs, faqRows]) => {
        if (!active) return;
        setBookableTypes(types);
        setPackages(pkgs);
        setFaqs(faqRows);
        if (requestedShoot && types.includes(requestedShoot)) {
          setShootType(requestedShoot);
          setStep(1);
        }
      })
      .catch(() => {
        if (active) {
          setBookableTypes([]);
          setPackages([]);
          setFaqs([]);
        }
      })
      .finally(() => {
        if (active) setLoadingBase(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (requestedMonthParam && wizardRef.current) {
      wizardRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [requestedMonthParam, location.hash]);

  const packagesForShoot = useMemo(
    () => packages.filter((pkg) => pkg.shoot_type === shootType && pkg.price_unit === "shoot"),
    [packages, shootType]
  );
  const selectedPackage = useMemo(() => packages.find((pkg) => pkg.id === packageId) || null, [packages, packageId]);

  const goTo = (nextStep) => {
    window.scrollTo({ top: window.scrollY, behavior: "instant" });
    setStep(nextStep);
  };

  const handleShootSelect = (option) => {
    setShootType(option);
    setPackageId(null);
    goTo(1);
  };

  const handlePackageSelect = (id) => {
    setPackageId(id);
    goTo(2);
  };

  const handleDateSelect = (day) => {
    setDate(day);
    setTime(null);
    goTo(3);
  };

  const handleTimeSelect = (slot) => {
    setTime(slot);
    goTo(4);
  };

  const handleDetailsNext = () => {
    const needsLocation = details.locationType === "location";
    if (!details.naam || !details.email || (needsLocation && !details.omgeving) || !details.bericht || !details.privacy) {
      setDetailsError("Vul alle verplichte velden in en accepteer de privacyverklaring.");
      return;
    }
    setDetailsError("");
    goTo(5);
  };

  const handleSubmit = async () => {
    setSubmitStatus("sending");
    setSubmitError("");

    try {
      const bookingLocation =
        details.locationType === "location" ? `Op locatie: ${details.omgeving}` : "Bij mij thuis in Zoutkamp";

      const response = await fetch("/api/create-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          naam: details.naam,
          email: details.email,
          shoot: shootType,
          bookingDate: format(date, "yyyy-MM-dd"),
          startTime: time.start,
          packageId: packageId || "",
          omgeving: bookingLocation,
          bericht: details.bericht,
          privacy: details.privacy,
          "bot-field": botField,
          renderedAt: formRenderedAt.current,
        }),
      });

      const body = await response.json().catch(() => ({}));

      if (response.ok && body.ok) {
        navigate("/bedankt");
        return;
      }

      setSubmitStatus("error");
      setSubmitError(body.message || "Aanvraag versturen is niet gelukt. Probeer het opnieuw.");
    } catch {
      setSubmitStatus("error");
      setSubmitError("Aanvraag versturen is niet gelukt. Controleer je internetverbinding en probeer het opnieuw.");
    }
  };

  const backButton = step > 0 && step < 5 && (
    <button
      type="button"
      onClick={() => goTo(step - 1)}
      className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-coffee/60 transition hover:text-cocoa"
    >
      <ArrowLeft size={14} /> Vorige stap
    </button>
  );

  return (
    <>
      <SEO title={title} description={description} />
      <section className="pt-36">
        <div className="container-soft pb-16">
          <SectionTitle centered={false} eyebrow="Boeken" title="Vertel mij over jouw gewenste shoot" />
          <p className="mt-6 max-w-2xl text-base leading-8 text-coffee/78">
            Bekijk hieronder welke momenten nog beschikbaar zijn. Kies een shoot, pakket en een datum die voor jou
            past. Na je aanvraag neem ik contact met je op om alles definitief af te stemmen.
          </p>

          <div className="mt-10 rounded-lg bg-linen p-5 shadow-soft warm-border">
            <ShieldCheck className="text-cocoa" size={22} />
            <p className="mt-2 text-sm leading-6 text-coffee/78">
              Elke aanvraag is een <strong>boekingsaanvraag</strong>, nog geen definitieve boeking. Zodra ik 'm
              bevestig, is het tijdslot voor jou gereserveerd.
            </p>
          </div>

          {waitlistMonthParam && (
            <div className="mt-10 scroll-mt-28">
              <SectionTitle
                centered={false}
                eyebrow="Wachtlijst"
                title="Aanmelden voor de wachtlijst"
                text="Is je gewenste maand of dag vol? Laat je gegevens achter. Als er een passende plek vrijkomt, neem ik contact met je op."
              />
              <div className="mt-6">
                <WaitlistForm preferredMonth={waitlistMonthParam} />
              </div>
            </div>
          )}

          {loadingBase ? (
            <p className="mt-10 text-sm text-coffee/60">Even laden...</p>
          ) : (
            <div id="boeken" ref={wizardRef} className="mt-10 scroll-mt-44 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-lg bg-card p-5 shadow-soft warm-border md:p-8">
                {requestedMonthParam && step === 0 && (
                  <p className="mb-6 rounded-lg bg-linen px-4 py-3 text-sm leading-6 text-coffee/75 warm-border">
                    Kies eerst het soort shoot. Daarna opent de kalender direct in de gekozen maand.
                  </p>
                )}
                <div className="mb-6 overflow-x-auto">
                  <StepIndicator current={step} />
                </div>

                {backButton}

                {step === 0 && (
                  <ShootTypeStep options={bookableTypes} value={shootType} onSelect={handleShootSelect} />
                )}

                {step === 1 && (
                  <div>
                    <PackageStep packages={packagesForShoot} value={packageId} onSelect={handlePackageSelect} />
                    <button
                      type="button"
                      onClick={() => goTo(2)}
                      className="mt-4 text-xs font-semibold uppercase tracking-[0.1em] text-coffee/60 underline-offset-4 hover:text-cocoa hover:underline"
                    >
                      {packagesForShoot.length > 0 ? "Verder zonder specifiek pakket" : "Volgende stap"}
                    </button>
                  </div>
                )}

                {step === 2 && (
                  <BookingCalendar shootType={shootType} value={date} onSelect={handleDateSelect} initialMonth={initialMonth} />
                )}

                {step === 3 && (
                  <TimeSlotStep date={date} shootType={shootType} value={time} onSelect={handleTimeSelect} />
                )}

                {step === 4 && (
                  <div>
                    <DetailsStep values={details} onChange={setDetails} />
                    <input
                      type="text"
                      value={botField}
                      onChange={(event) => setBotField(event.target.value)}
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden="true"
                      className="absolute h-0 w-0 opacity-0"
                      style={{ left: "-9999px" }}
                    />
                    {detailsError && (
                      <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{detailsError}</p>
                    )}
                    <Button type="button" onClick={handleDetailsNext} className="mt-6 gap-2">
                      Volgende <ArrowRight size={16} />
                    </Button>
                  </div>
                )}

                {step === 5 && (
                  <div>
                    <p className="mb-5 text-sm text-coffee/75">Controleer je aanvraag en verstuur 'm hieronder.</p>
                    <BookingSummaryContent shootType={shootType} pkg={selectedPackage} date={date} time={time} details={details} />
                    {submitStatus === "error" && (
                      <p className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{submitError}</p>
                    )}
                    <Button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitStatus === "sending"}
                      className="mt-6 w-full gap-2"
                    >
                      {submitStatus === "sending" ? "Bezig met verzenden" : "Boeking aanvragen"} <Send size={16} />
                    </Button>
                  </div>
                )}
              </div>

              <aside className="h-fit rounded-lg bg-linen/70 p-5 shadow-soft warm-border lg:sticky lg:top-28">
                <h2 className="fine-label text-sm font-semibold text-cocoa">Jouw keuzes</h2>
                <div className="mt-4">
                  <BookingSummaryContent shootType={shootType} pkg={selectedPackage} date={date} time={time} details={details} />
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>

      <section className="pb-16">
        <div className="container-soft">
          <MonthAvailabilityOverview />
        </div>
      </section>

      <section className="pb-16">
        <div className="container-soft">
          <SectionTitle eyebrow="FAQ" title="Veelgestelde vragen" />
          <div className="mx-auto mt-9 grid max-w-4xl gap-3">
            {faqs.map((item, index) => (
              <FAQItem key={item.id} item={item} defaultOpen={index === 0} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
