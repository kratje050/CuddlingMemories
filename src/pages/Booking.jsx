import { ArrowLeft, ArrowRight, Send, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Button from "../components/Button.jsx";
import FAQItem from "../components/FAQItem.jsx";
import SEO from "../components/SEO.jsx";
import SectionTitle from "../components/SectionTitle.jsx";
import MonthAvailabilityOverview from "../components/MonthAvailabilityOverview.jsx";
import PregnancyPlanner from "../components/PregnancyPlanner.jsx";
import WaitlistForm from "../components/WaitlistForm.jsx";
import StepIndicator from "../components/booking/StepIndicator.jsx";
import ShootTypeStep from "../components/booking/ShootTypeStep.jsx";
import PackageStep from "../components/booking/PackageStep.jsx";
import BookingCalendar from "../components/booking/BookingCalendar.jsx";
import TimeSlotStep from "../components/booking/TimeSlotStep.jsx";
import DetailsStep from "../components/booking/DetailsStep.jsx";
import BookingSummaryContent from "../components/booking/BookingSummaryContent.jsx";
import { faqs as fallbackFaqs } from "../data/faq.js";
import { getPublishedPackages, getVisibleFaqs } from "../lib/api.js";
import { getBookableShootTypes } from "../lib/bookingAvailability.js";
import { mergeFaqs } from "../lib/faqUtils.js";
import { usePageMeta } from "../lib/usePageMeta.js";
import { CANCELLATION_TERMS_VERSION } from "../data/legalTerms.js";
import { trackConversionEvent } from "../lib/conversionTracking.js";

const emptyDetails = {
  naam: "",
  email: "",
  telefoon: "",
  locationType: "studio",
  omgeving: "",
  locationStreet: "",
  locationHouseNumber: "",
  locationPostalCode: "",
  locationCity: "",
  bericht: "",
  privacy: false,
  termsAccepted: false,
  modelUsageConsent: false,
  questionnaire: {},
  giftcardCode: "",
};

const isModelDiscountShootType = (value) => {
  const normalized = String(value || "").toLowerCase();
  return normalized.includes("model") && normalized.includes("korting");
};

const getPackagesForShootType = (allPackages, selectedShootType) => {
  if (!isModelDiscountShootType(selectedShootType)) {
    return allPackages.filter((pkg) => !pkg.is_addon && pkg.shoot_type === selectedShootType && pkg.price_unit === "shoot");
  }

  return allPackages
    .filter((pkg) => !pkg.is_addon && pkg.price_unit === "shoot" && pkg.model_discount_eligible)
    .filter((pkg) => !`${pkg.title || ""} ${pkg.shoot_type || ""}`.toLowerCase().includes("bevalling"))
    .map((pkg) => ({
      ...pkg,
      original_price: Number(pkg.price || 0),
      price: Math.round(Number(pkg.price || 0) * 50) / 100,
      deposit_value: pkg.deposit_type === "fixed"
        ? Math.min(Number(pkg.deposit_value || 0), Math.round(Number(pkg.price || 0) * 50) / 100)
        : pkg.deposit_value,
      is_model_discount_price: true,
    }));
};

export default function Booking() {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const requestedShoot = params.get("shoot");
  const requestedMonthParam = params.get("maand");
  const waitlistOfferToken = params.get("aanbod");
  const waitlistMonthParam = params.get("wachtlijst");
  const wizardRef = useRef(null);

  const initialMonth = useMemo(() => {
    if (!requestedMonthParam || !/^\d{4}-\d{2}$/.test(requestedMonthParam)) return null;
    const [year, month] = requestedMonthParam.split("-").map(Number);
    return new Date(year, month - 1, 1);
  }, [requestedMonthParam]);

  const { title, description } = usePageMeta(
    "boek-een-shoot",
    "Boek een shoot",
    "Boek een fotoshoot bij Cuddling Memories via de kalender voor zwangerschap, newborn, cakesmash, gezin, portret, motherhood en buiten fotografie."
  );

  const [step, setStep] = useState(0);
  const [bookableTypes, setBookableTypes] = useState([]);
  const [packages, setPackages] = useState([]);
  const [faqs, setFaqs] = useState(fallbackFaqs);
  const [loadingBase, setLoadingBase] = useState(true);

  const [shootType, setShootType] = useState(null);
  const [packageId, setPackageId] = useState(null);
  const [addonPackageIds, setAddonPackageIds] = useState([]);
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [plannedMonth, setPlannedMonth] = useState(null);
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
        const normalizedPackages = pkgs.filter((pkg) => pkg.price_unit !== "km").map((pkg) => (
          pkg.price_unit === "shoot" && !pkg.shoot_type && pkg.title
            ? { ...pkg, shoot_type: pkg.title }
            : pkg
        ));
        const packageShootTypes = normalizedPackages
          .filter((pkg) => pkg.price_unit === "shoot" && pkg.shoot_type)
          .map((pkg) => pkg.shoot_type);
        const mergedTypes = [...new Set([...types, ...packageShootTypes])];
        setBookableTypes(mergedTypes);
        setPackages(normalizedPackages);
        setFaqs(mergeFaqs(faqRows || [], fallbackFaqs));
        if (requestedShoot && mergedTypes.includes(requestedShoot)) {
          const matchingPackages = getPackagesForShootType(normalizedPackages, requestedShoot);
          setShootType(requestedShoot);
          if (matchingPackages.length === 1) {
            setPackageId(matchingPackages[0].id);
            setStep(2);
          } else {
            setStep(1);
          }
        }
      })
      .catch(() => {
        if (active) {
          setBookableTypes([]);
          setPackages([]);
          setFaqs(fallbackFaqs);
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

  useEffect(() => {
    if (shootType) trackConversionEvent("booking_started", "/boek-een-shoot");
  }, [shootType]);

  const packagesForShoot = useMemo(() => getPackagesForShootType(packages, shootType), [packages, shootType]);
  const addonsForShoot = useMemo(
    () => packages.filter((pkg) => pkg.is_addon && pkg.price_unit === "shoot" && (!pkg.shoot_type || pkg.shoot_type === shootType)),
    [packages, shootType]
  );
  const selectedPackage = useMemo(() => packagesForShoot.find((pkg) => pkg.id === packageId) || null, [packagesForShoot, packageId]);
  const selectedAddons = useMemo(() => addonsForShoot.filter((pkg) => addonPackageIds.includes(pkg.id)), [addonsForShoot, addonPackageIds]);
  const modelUsageConsentRequired = useMemo(() => {
    const labels = [shootType, selectedPackage?.title, ...selectedAddons.map((pkg) => pkg.title)]
      .filter(Boolean)
      .map((value) => String(value).toLowerCase());
    return labels.some((value) => value.includes("model") && (value.includes("50%") || value.includes("korting")));
  }, [shootType, selectedPackage, selectedAddons]);

  useEffect(() => {
    if (!modelUsageConsentRequired && details.modelUsageConsent) {
      setDetails((current) => ({ ...current, modelUsageConsent: false }));
    }
  }, [modelUsageConsentRequired, details.modelUsageConsent]);

  const goTo = (nextStep) => {
    setStep(nextStep);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const wizard = wizardRef.current;
        if (!wizard) return;
        const headerOffset = window.innerWidth < 1024 ? 118 : 132;
        const top = wizard.getBoundingClientRect().top + window.scrollY - headerOffset;
        window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      });
    });
  };

  const handlePregnancyPlan = (recommendedDate) => {
    const today = new Date();
    const target = recommendedDate >= today ? recommendedDate : today;
    setPlannedMonth(new Date(target.getFullYear(), target.getMonth(), 1));
    setDate(null);
    setTime(null);
    goTo(2);
  };

  const handleShootSelect = (option) => {
    const matchingPackages = getPackagesForShootType(packages, option);
    setShootType(option);
    setAddonPackageIds([]);
    setDate(null);
    setTime(null);
    setPlannedMonth(null);

    if (matchingPackages.length === 1) {
      const onlyPackage = matchingPackages[0];
      setPackageId(onlyPackage.id);
      trackConversionEvent("package_selected", "/boek-een-shoot", {
        package_id: onlyPackage.id,
        package_name: onlyPackage.title,
        package_names: [onlyPackage.title],
        shoot_type: option,
      });
      goTo(2);
      return;
    }

    setPackageId(null);
    goTo(1);
  };

  const handlePackageSelect = (id) => {
    setPackageId(id);
  };

  const handleAddonToggle = (id) => {
    setAddonPackageIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const handlePackageContinue = () => {
    const names = [selectedPackage, ...selectedAddons].filter(Boolean).map((pkg) => pkg.title);
    if (names.length) {
      trackConversionEvent("package_selected", "/boek-een-shoot", {
        package_id: selectedPackage?.id || "",
        package_name: selectedPackage?.title || names[0],
        package_names: names,
        shoot_type: shootType,
      });
    }
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
    const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email.trim());
    if (!emailIsValid) {
      setDetailsError("Vul een geldig e-mailadres in, bijvoorbeeld naam@gmail.com.");
      return;
    }
    const locationIncomplete = needsLocation && (!details.locationStreet || !details.locationHouseNumber || !details.locationPostalCode || !details.locationCity);
    if (!details.naam || !details.email || locationIncomplete || !details.privacy || !details.termsAccepted || (modelUsageConsentRequired && !details.modelUsageConsent)) {
      setDetailsError(modelUsageConsentRequired
        ? "Vul alle verplichte velden in en accepteer ook het gebruik van de modelfoto's voor social media en het portfolio."
        : needsLocation && locationIncomplete
          ? "Vul het volledige locatieadres in voordat je verdergaat."
          : "Vul alle verplichte velden in en accepteer de privacyverklaring en annuleringsvoorwaarden.");
      return;
    }
    setDetailsError("");
    goTo(5);
  };

  const handleSubmit = async () => {
    setSubmitStatus("sending");
    setSubmitError("");

    try {
      const bookingLocation = details.locationType === "location"
        ? `Op locatie: ${details.locationStreet} ${details.locationHouseNumber}, ${details.locationPostalCode} ${details.locationCity}${details.omgeving ? ` (${details.omgeving})` : ""}`
        : "Bij mij thuis in Zoutkamp";

      const response = await fetch("/api/create-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          naam: details.naam,
          email: details.email,
          telefoon: details.telefoon,
          shoot: shootType,
          bookingDate: format(date, "yyyy-MM-dd"),
          startTime: time.start,
          packageId: packageId || "",
          addonPackageIds,
          omgeving: bookingLocation,
          locationType: details.locationType,
          locationStreet: details.locationStreet,
          locationHouseNumber: details.locationHouseNumber,
          locationPostalCode: details.locationPostalCode,
          locationCity: details.locationCity,
          locationNotes: details.omgeving,
          bericht: details.bericht,
          privacy: details.privacy,
          termsAccepted: details.termsAccepted,
          modelUsageConsent: details.modelUsageConsent,
          termsVersion: CANCELLATION_TERMS_VERSION,
          questionnaire: details.questionnaire || {},
          giftcardCode: details.giftcardCode || "",
          waitlistOfferToken: waitlistOfferToken || "",
          "bot-field": botField,
          renderedAt: formRenderedAt.current,
        }),
      });

      const body = await response.json().catch(() => ({}));

      if (response.ok && body.ok) {
        trackConversionEvent("booking_completed", "/bedankt");
        navigate("/bedankt", { state: { portalUrl: body.portal_url || "" } });
        return;
      }

      setSubmitStatus("error");
      setSubmitError(body.message || "Aanvraag versturen is niet gelukt. Probeer het opnieuw.");
    } catch {
      setSubmitStatus("error");
      setSubmitError("Aanvraag versturen is niet gelukt. Controleer je internetverbinding en probeer het opnieuw.");
    }
  };

  const packageStepWasSkipped = packagesForShoot.length === 1 && packageId === packagesForShoot[0]?.id;
  const previousStep = step === 2 && packageStepWasSkipped ? 0 : step - 1;
  const backButton = step > 0 && (
    <button
      type="button"
      onClick={() => goTo(previousStep)}
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
                <div className="mb-6 min-w-0">
                  <StepIndicator current={step} onStepSelect={goTo} />
                </div>

                {backButton}

                {step === 0 && (
                  <ShootTypeStep options={bookableTypes} value={shootType} onSelect={handleShootSelect} />
                )}

                {step === 1 && (
                  <div>
                    {shootType?.toLowerCase().includes("zwangerschap") && (
                      <div className="mb-5">
                        <PregnancyPlanner compact onPlan={handlePregnancyPlan} />
                      </div>
                    )}
                    <PackageStep packages={packagesForShoot} addons={addonsForShoot} value={packageId} addonValues={addonPackageIds} onSelect={handlePackageSelect} onToggleAddon={handleAddonToggle} onContinue={handlePackageContinue} />
                  </div>
                )}

                {step === 2 && (
                  <BookingCalendar shootType={shootType} value={date} onSelect={handleDateSelect} initialMonth={plannedMonth || initialMonth} />
                )}

                {step === 3 && (
                  <TimeSlotStep date={date} shootType={shootType} value={time} onSelect={handleTimeSelect} />
                )}

                {step === 4 && (
                  <div>
                    <DetailsStep values={details} onChange={setDetails} shootType={shootType} modelUsageConsentRequired={modelUsageConsentRequired} />
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
                    <BookingSummaryContent shootType={shootType} pkg={selectedPackage} addons={selectedAddons} date={date} time={time} details={details} />
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

              <aside className={`h-fit rounded-lg bg-linen/70 p-5 shadow-soft warm-border lg:sticky lg:top-28 ${step === 5 ? "hidden lg:block" : ""}`}>
                <h2 className="fine-label text-sm font-semibold text-cocoa">Jouw keuzes</h2>
                <div className="mt-4">
                  <BookingSummaryContent shootType={shootType} pkg={selectedPackage} addons={selectedAddons} date={date} time={time} details={details} />
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
