import { Link } from "react-router-dom";
import { Home, MapPin, Gift } from "lucide-react";
import { useState } from "react";
import { supabase } from "../../lib/supabaseClient.js";
import { checkGiftcardCode } from "../../lib/giftcards.js";

const inputClass =
  "rounded-lg border border-cocoa/20 bg-cream px-4 py-3 text-sm outline-none transition focus:border-cocoa";

export default function DetailsStep({ values, onChange }) {
  const [giftcardStatus, setGiftcardStatus] = useState(null); // null | "checking" | {valid, message?, amount?, giftcardType?}

  const update = (field) => (event) => {
    const value = field === "privacy" ? event.target.checked : event.target.value;
    onChange({ ...values, [field]: value });
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

  const chooseLocationType = (locationType) => {
    onChange({
      ...values,
      locationType,
      omgeving: locationType === "studio" ? "" : values.omgeving,
    });
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
          <label className="grid gap-2 text-sm font-semibold text-coffee">
            Locatie of omgeving
            <input
              type="text"
              required
              placeholder="Bijv. Groningen, Friesland of een buitenlocatie"
              value={values.omgeving}
              onChange={update("omgeving")}
              className={inputClass}
            />
            <span className="text-xs font-normal leading-5 text-coffee/62">
              Bij een locatie-afspraak worden eventuele reiskosten standaard als heen- en terugreis berekend vanaf mijn locatie in Zoutkamp of Gouda.
            </span>
          </label>
        )}
      </div>
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
    </div>
  );
}
