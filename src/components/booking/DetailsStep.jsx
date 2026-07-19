import { Link } from "react-router-dom";
import { Home, MapPin, Gift, ClipboardList, Images, Tag } from "lucide-react";
import { useState } from "react";
import { supabase } from "../../lib/supabaseClient.js";
import { checkGiftcardCode } from "../../lib/giftcards.js";
import { checkDiscountCode, formatDiscountValue } from "../../lib/discountCodes.js";

const inputClass =
  "rounded-lg border border-cocoa/20 bg-cream px-4 py-3 text-sm outline-none transition focus:border-cocoa";

export default function DetailsStep({ values, onChange, shootType, modelUsageConsentRequired = false }) {
  const [giftcardStatus, setGiftcardStatus] = useState(null); // null | "checking" | {valid, message?, amount?, giftcardType?}
  const [discountStatus, setDiscountStatus] = useState(null); // null | "checking" | {valid, message?, discountType?, discountValue?}

  const update = (field) => (event) => {
    const value = ["privacy", "termsAccepted", "modelUsageConsent"].includes(field) ? event.target.checked : event.target.value;
    onChange({ ...values, [field]: value });
  };

  const updateQuestionnaire = (field) => (event) => {
    onChange({
      ...values,
      questionnaire: { ...(values.questionnaire || {}), [field]: event.target.value },
    });
  };

  const handleGiftcardBlur = async () => {
    const code = (values.giftcardCode || "").trim();
    if (!code) {
      setGiftcardStatus(null);
      return;
    }
    setGiftcardStatus("checking");
    const result = await checkGiftcardCode(code, supabase);
    setGiftcardStatus(result);
  };

  const handleDiscountBlur = async () => {
    const code = (values.discountCode || "").trim();
    if (!code) {
      setDiscountStatus(null);
      onChange({ ...values, discountStatus: null });
      return;
    }
    setDiscountStatus("checking");
    const result = await checkDiscountCode(code, supabase);
    setDiscountStatus(result);
    onChange({ ...values, discountStatus: result.valid ? result : null });
  };

  const chooseLocationType = (locationType) => {
    onChange({
      ...values,
      locationType,
      omgeving: locationType === "studio" ? "" : values.omgeving,
    });
  };

  const updateAddress = (field) => (event) => {
    onChange({ ...values, [field]: event.target.value });
  };

  return (
    <div className="grid gap-5">
      <label className="grid gap-2 text-sm font-semibold text-coffee">
        Naam
        <input type="text" required value={values.naam} onChange={update("naam")} className={inputClass} />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-coffee">
        E-mailadres
        <input type="email" required value={values.email} onChange={update("email")} className={inputClass} />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-coffee">
        Telefoonnummer (optioneel)
        <input
          type="tel"
          value={values.telefoon || ""}
          onChange={update("telefoon")}
          className={inputClass}
          placeholder="Bijv. 06 12345678"
        />
      </label>
      <div className="grid gap-3">
        <p className="text-sm font-semibold text-coffee">Waar wil je de shoot doen?</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => chooseLocationType("studio")}
            className={`rounded-lg border p-4 text-left transition ${
              values.locationType !== "location"
                ? "border-cocoa bg-linen text-coffee shadow-soft"
                : "border-cocoa/20 bg-cream text-coffee/72 hover:border-cocoa/45"
            }`}
          >
            <Home className="text-cocoa" size={19} />
            <span className="mt-3 block text-sm font-semibold">Bij mij thuis in Zoutkamp</span>
            <span className="mt-1 block text-xs leading-5 text-coffee/62">
              Dit is de standaardlocatie voor een fotoshoot.
            </span>
          </button>
          <button
            type="button"
            onClick={() => chooseLocationType("location")}
            className={`rounded-lg border p-4 text-left transition ${
              values.locationType === "location"
                ? "border-cocoa bg-linen text-coffee shadow-soft"
                : "border-cocoa/20 bg-cream text-coffee/72 hover:border-cocoa/45"
            }`}
          >
            <MapPin className="text-cocoa" size={19} />
            <span className="mt-3 block text-sm font-semibold">Op locatie of in de omgeving</span>
            <span className="mt-1 block text-xs leading-5 text-coffee/62">
              Bijvoorbeeld buiten, thuis of een afgesproken plek.
            </span>
          </button>
        </div>
        {values.locationType === "location" && (
          <div className="rounded-lg border border-cocoa/15 bg-linen/45 p-4 sm:p-5">
            <p className="text-sm font-semibold text-coffee">Adres van de shoot</p>
            <p className="mt-1 text-xs leading-5 text-coffee/60">Vul het volledige adres in, zodat de afspraak op de juiste locatie kan worden ingepland.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_9rem]">
              <label className="grid gap-2 text-sm font-semibold text-coffee">Straat<input type="text" required value={values.locationStreet || ""} onChange={updateAddress("locationStreet")} className={inputClass} placeholder="Bijv. Dorpsstraat" /></label>
              <label className="grid gap-2 text-sm font-semibold text-coffee">Huisnummer<input type="text" required value={values.locationHouseNumber || ""} onChange={updateAddress("locationHouseNumber")} className={inputClass} placeholder="12A" /></label>
              <label className="grid gap-2 text-sm font-semibold text-coffee">Postcode<input type="text" required value={values.locationPostalCode || ""} onChange={updateAddress("locationPostalCode")} className={`${inputClass} uppercase`} placeholder="9974 AA" /></label>
              <label className="grid gap-2 text-sm font-semibold text-coffee">Plaats<input type="text" required value={values.locationCity || ""} onChange={updateAddress("locationCity")} className={inputClass} placeholder="Groningen" /></label>
              <label className="grid gap-2 text-sm font-semibold text-coffee sm:col-span-2">Aanvulling locatie (optioneel)<input type="text" value={values.omgeving || ""} onChange={update("omgeving")} className={inputClass} placeholder="Bijv. ingang bij het parkeerterrein" /></label>
            </div>
            <p className="mt-4 rounded-lg bg-card p-4 text-xs leading-5 text-coffee/65 warm-border">Een shoot op locatie kost niet extra. Eventuele reisuren en reisafstand zijn al inbegrepen in de pakketprijs.</p>
          </div>
        )}
      </div>
      <section className="rounded-lg border border-cocoa/15 bg-card p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-linen text-cocoa"><ClipboardList size={19} /></span>
          <div>
            <h3 className="font-semibold text-coffee">Korte vragenlijst vóór de shoot</h3>
            <p className="mt-1 text-xs leading-5 text-coffee/60">Met deze informatie kan ik de shoot beter voorbereiden. Vul in wat voor jouw situatie van toepassing is.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-4">
          <Question label="Namen en leeftijden van de kinderen" value={values.questionnaire?.children || ""} onChange={updateQuestionnaire("children")} placeholder="Bijv. Mila (4) en Sem (1)" />
          <Question label="Wie komen er op de foto?" value={values.questionnaire?.participants || ""} onChange={updateQuestionnaire("participants")} placeholder="Bijv. twee ouders en twee kinderen" />
          {String(shootType || "").toLowerCase().includes("cakesmash") && (
            <Question label="Allergieën of voedingswensen" value={values.questionnaire?.allergies || ""} onChange={updateQuestionnaire("allergies")} placeholder="Noem allergieën ook wanneer er maar een vermoeden is" />
          )}
          <Question label="Bijzonderheden" value={values.questionnaire?.specialDetails || ""} onChange={updateQuestionnaire("specialDetails")} placeholder="Bijv. gevoeligheid voor prikkels, mobiliteit of iets waar ik rekening mee kan houden" />
          <Question label="Wat moet ik verder vooraf weten?" value={values.questionnaire?.photographerNotes || ""} onChange={updateQuestionnaire("photographerNotes")} placeholder="Andere informatie die helpt bij de voorbereiding" />
        </div>
      </section>
      <label className="grid gap-2 text-sm font-semibold text-coffee">
        Bericht (optioneel)
        <span className="text-xs font-normal leading-5 text-coffee/62">
          Boek je een shoot met korting? Geef dit dan onderaan aan.
        </span>
        <textarea
          rows="5"
          value={values.bericht}
          onChange={update("bericht")}
          placeholder="Typ hier je bericht. Boek je een shoot met korting? Geef dit dan onderaan aan."
          className={`${inputClass} resize-none`}
        />
      </label>
      <div className="rounded-lg bg-linen/50 p-4">
        <label className="grid gap-2 text-sm font-semibold text-coffee">
          <span className="inline-flex items-center gap-2">
            <Gift size={16} className="text-cocoa" /> Heb je een cadeaubon? (optioneel)
          </span>
          <input
            type="text"
            placeholder="Bijv. CM-A1B2C3"
            value={values.giftcardCode || ""}
            onChange={update("giftcardCode")}
            onBlur={handleGiftcardBlur}
            className={`${inputClass} uppercase`}
          />
        </label>
        {giftcardStatus === "checking" && <p className="mt-2 text-xs text-coffee/60">Code controleren...</p>}
        {giftcardStatus && giftcardStatus !== "checking" && giftcardStatus.valid && (
          <p className="mt-2 text-xs font-semibold text-cocoa">
            Cadeaubon geldig{giftcardStatus.amount ? ` — €${Number(giftcardStatus.amount).toFixed(2)}` : ""} ({giftcardStatus.giftcardType}). Wordt bij het versturen van je aanvraag verzilverd.
          </p>
        )}
        {giftcardStatus && giftcardStatus !== "checking" && !giftcardStatus.valid && (
          <p className="mt-2 text-xs font-semibold text-red-700">{giftcardStatus.message}</p>
        )}
      </div>
      <div className="rounded-lg bg-linen/50 p-4">
        <label className="grid gap-2 text-sm font-semibold text-coffee">
          <span className="inline-flex items-center gap-2">
            <Tag size={16} className="text-cocoa" /> Heb je een kortingscode? (optioneel)
          </span>
          <input
            type="text"
            placeholder="Bijv. korting-a1b2c3"
            value={values.discountCode || ""}
            onChange={update("discountCode")}
            onBlur={handleDiscountBlur}
            className={inputClass}
          />
        </label>
        {discountStatus === "checking" && <p className="mt-2 text-xs text-coffee/60">Code controleren...</p>}
        {discountStatus && discountStatus !== "checking" && discountStatus.valid && (
          <p className="mt-2 text-xs font-semibold text-cocoa">
            Kortingscode geldig ({formatDiscountValue(discountStatus.discountType, discountStatus.discountValue)} korting). Wordt bij het versturen van je aanvraag toegepast.
          </p>
        )}
        {discountStatus && discountStatus !== "checking" && !discountStatus.valid && (
          <p className="mt-2 text-xs font-semibold text-red-700">{discountStatus.message}</p>
        )}
      </div>
      <label className="flex gap-3 rounded-lg bg-linen/70 p-4 text-sm leading-6 text-coffee/78">
        <input type="checkbox" required checked={values.privacy} onChange={update("privacy")} className="mt-1 h-4 w-4 accent-cocoa" />
        <span>
          Ik ga akkoord met de{" "}
          <Link to="/privacybeleid" className="underline hover:text-cocoa" target="_blank">
            privacyverklaring
          </Link>{" "}
          en geef toestemming om mijn aanvraag te beantwoorden.
        </span>
      </label>
      <label className="flex gap-3 rounded-lg border border-cocoa/20 bg-card p-4 text-sm leading-6 text-coffee/78">
        <input type="checkbox" required checked={Boolean(values.termsAccepted)} onChange={update("termsAccepted")} className="mt-1 h-4 w-4 accent-cocoa" />
        <span>
          Ik heb de{" "}
          <Link to="/annuleringsvoorwaarden" className="font-semibold text-cocoa underline underline-offset-2" target="_blank">
            annuleringsvoorwaarden
          </Link>{" "}
          gelezen en ga akkoord. Annuleren of verplaatsen kan alleen schriftelijk of per e-mail.
        </span>
      </label>
      {modelUsageConsentRequired && (
        <label className="flex gap-3 rounded-lg border border-cocoa/30 bg-linen p-4 text-sm leading-6 text-coffee/85">
          <input type="checkbox" required checked={Boolean(values.modelUsageConsent)} onChange={update("modelUsageConsent")} className="mt-1 h-4 w-4 shrink-0 accent-cocoa" />
          <span>
            <span className="mb-1 flex items-center gap-2 font-semibold text-coffee"><Images size={17} className="text-cocoa" /> Toestemming gebruik foto&apos;s</span>
            Ik ga ermee akkoord dat de foto&apos;s uit deze modelsessie door Cuddling Memories Fotografie mogen worden gebruikt op social media en in het portfolio, waaronder de website.
          </span>
        </label>
      )}
    </div>
  );
}

function Question({ label, value, onChange, placeholder }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-coffee">
      {label} <span className="text-xs font-normal text-coffee/50">(optioneel)</span>
      <textarea rows="2" value={value} onChange={onChange} placeholder={placeholder} className={`${inputClass} resize-none`} />
    </label>
  );
}
