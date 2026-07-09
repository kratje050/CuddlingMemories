import { useState } from "react";
import { Send } from "lucide-react";
import Button from "./Button.jsx";
import { deliveryMethods, giftcardTypes } from "../lib/giftcards.js";

const initialValues = {
  purchaser_name: "",
  purchaser_email: "",
  recipient_name: "",
  giftcard_type: "Vrij bedrag",
  amount: "",
  package_id: "",
  personal_message: "",
  delivery_method: "Digitaal per e-mail",
  message: "",
  botField: "",
};

export default function GiftCardForm() {
  const [values, setValues] = useState(initialValues);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const update = (name, value) => setValues((current) => ({ ...current, [name]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setStatus("sending");
    setMessage("");

    try {
      const response = await fetch("/api/submit-giftcard-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.ok) throw new Error(body.message || "Aanvraag versturen is niet gelukt.");
      setStatus("success");
      setValues(initialValues);
      setMessage("Dank je wel. De cadeaubon aanvraag is ontvangen.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Aanvraag versturen is niet gelukt.");
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-lg bg-card p-5 shadow-soft warm-border md:grid-cols-2 md:p-8">
      <input type="text" value={values.botField} onChange={(event) => update("botField", event.target.value)} className="hidden" tabIndex={-1} autoComplete="off" />
      <Field label="Naam aanvrager" value={values.purchaser_name} onChange={(value) => update("purchaser_name", value)} required />
      <Field label="E-mailadres aanvrager" type="email" value={values.purchaser_email} onChange={(value) => update("purchaser_email", value)} required />
      <Field label="Naam ontvanger" value={values.recipient_name} onChange={(value) => update("recipient_name", value)} required />
      <label className="grid gap-2 text-sm font-semibold text-coffee">
        Soort cadeaubon
        <select value={values.giftcard_type} onChange={(event) => update("giftcard_type", event.target.value)} className="rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa">
          {giftcardTypes.map((type) => <option key={type}>{type}</option>)}
        </select>
      </label>
      <Field label="Bedrag of pakket" value={values.amount} onChange={(value) => update("amount", value)} placeholder="Bijv. 50 of Newbornshoot" />
      <label className="grid gap-2 text-sm font-semibold text-coffee">
        Gewenste leverwijze
        <select value={values.delivery_method} onChange={(event) => update("delivery_method", event.target.value)} className="rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa">
          {deliveryMethods.map((method) => <option key={method}>{method}</option>)}
        </select>
      </label>
      <TextArea label="Persoonlijke boodschap" value={values.personal_message} onChange={(value) => update("personal_message", value)} />
      <TextArea label="Bericht" value={values.message} onChange={(value) => update("message", value)} required />
      {message && <p className={`rounded-lg px-4 py-3 text-sm md:col-span-2 ${status === "error" ? "bg-red-50 text-red-800" : "bg-linen text-coffee"}`}>{message}</p>}
      <Button type="submit" disabled={status === "sending"} className="gap-2 md:col-span-2">
        {status === "sending" ? "Bezig met verzenden" : "Cadeaubon aanvragen"} <Send size={16} />
      </Button>
    </form>
  );
}

function Field({ label, type = "text", value, onChange, required, placeholder }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-coffee">
      {label}
      <input type={type} required={required} placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} className="rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa" />
    </label>
  );
}

function TextArea({ label, value, onChange, required }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-coffee md:col-span-2">
      {label}
      <textarea rows={4} required={required} value={value} onChange={(event) => onChange(event.target.value)} className="resize-none rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa" />
    </label>
  );
}
