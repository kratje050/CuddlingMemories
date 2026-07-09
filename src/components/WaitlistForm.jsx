import { useState } from "react";
import { Send } from "lucide-react";
import Button from "./Button.jsx";
import { shootTypeOptions } from "../lib/constants.js";
import { waitlistFlexibilityOptions } from "../lib/waitlist.js";

const initialValues = {
  customer_name: "",
  customer_email: "",
  shoot_type: "Gezinsshoot",
  preferred_date: "",
  preferred_month: "",
  flexibility: "Ik ben flexibel",
  message: "",
  botField: "",
};

export default function WaitlistForm({ preferredMonth = "" }) {
  const [values, setValues] = useState({ ...initialValues, preferred_month: preferredMonth });
  const [status, setStatus] = useState("idle");
  const [notice, setNotice] = useState("");

  const update = (name, value) => setValues((current) => ({ ...current, [name]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setStatus("sending");
    setNotice("");
    try {
      const response = await fetch("/api/submit-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.ok) throw new Error(body.message || "Aanmelden is niet gelukt.");
      setStatus("success");
      setNotice("Dank je wel. Je staat op de wachtlijst.");
      setValues({ ...initialValues, preferred_month: preferredMonth });
    } catch (error) {
      setStatus("error");
      setNotice(error instanceof Error ? error.message : "Aanmelden is niet gelukt.");
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-lg bg-card p-5 shadow-soft warm-border md:grid-cols-2">
      <input type="text" value={values.botField} onChange={(event) => update("botField", event.target.value)} className="hidden" tabIndex={-1} autoComplete="off" />
      <Field label="Naam" value={values.customer_name} onChange={(value) => update("customer_name", value)} required />
      <Field label="E-mailadres" type="email" value={values.customer_email} onChange={(value) => update("customer_email", value)} required />
      <label className="grid gap-2 text-sm font-semibold text-coffee">
        Gewenste shoot
        <select value={values.shoot_type} onChange={(event) => update("shoot_type", event.target.value)} className="rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa">
          {shootTypeOptions.map((type) => <option key={type}>{type}</option>)}
        </select>
      </label>
      <Field label="Gewenste datum" type="date" value={values.preferred_date} onChange={(value) => update("preferred_date", value)} />
      <Field label="Gewenste maand" placeholder="2026-08" value={values.preferred_month} onChange={(value) => update("preferred_month", value)} />
      <label className="grid gap-2 text-sm font-semibold text-coffee">
        Flexibiliteit
        <select value={values.flexibility} onChange={(event) => update("flexibility", event.target.value)} className="rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa">
          {waitlistFlexibilityOptions.map((option) => <option key={option}>{option}</option>)}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-semibold text-coffee md:col-span-2">
        Bericht
        <textarea rows={4} value={values.message} onChange={(event) => update("message", event.target.value)} className="resize-none rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa" />
      </label>
      {notice && <p className={`rounded-lg px-4 py-3 text-sm md:col-span-2 ${status === "error" ? "bg-red-50 text-red-800" : "bg-linen text-coffee"}`}>{notice}</p>}
      <Button type="submit" disabled={status === "sending"} className="gap-2 md:col-span-2">
        {status === "sending" ? "Bezig met aanmelden" : "Aanmelden voor wachtlijst"} <Send size={16} />
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
