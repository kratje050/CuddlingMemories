import { Link } from "react-router-dom";
import { Home, MapPin } from "lucide-react";

const inputClass =
  "rounded-lg border border-cocoa/20 bg-cream px-4 py-3 text-sm outline-none transition focus:border-cocoa";

export default function DetailsStep({ values, onChange }) {
  const update = (field) => (event) => {
    const value = field === "privacy" ? event.target.checked : event.target.value;
    onChange({ ...values, [field]: value });
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
              Bij een locatie-afspraak worden eventuele reiskosten standaard als heen- en terugreis berekend vanaf mijn huis in Zoutkamp.
            </span>
          </label>
        )}
      </div>
      <label className="grid gap-2 text-sm font-semibold text-coffee">
        Bericht
        <textarea required rows="5" value={values.bericht} onChange={update("bericht")} className={`${inputClass} resize-none`} />
      </label>
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
