import { Link } from "react-router-dom";

const inputClass =
  "rounded-lg border border-cocoa/20 bg-cream px-4 py-3 text-sm outline-none transition focus:border-cocoa";

export default function DetailsStep({ values, onChange }) {
  const update = (field) => (event) => {
    const value = field === "privacy" ? event.target.checked : event.target.value;
    onChange({ ...values, [field]: value });
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
        Locatie of omgeving
        <input
          type="text"
          required
          placeholder="Bijv. Groningen, Friesland of Zoutkamp"
          value={values.omgeving}
          onChange={update("omgeving")}
          className={inputClass}
        />
      </label>
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
