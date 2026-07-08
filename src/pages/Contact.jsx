import { Send, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Button from "../components/Button.jsx";
import FAQItem from "../components/FAQItem.jsx";
import SEO from "../components/SEO.jsx";
import SectionTitle from "../components/SectionTitle.jsx";
import { faqs } from "../data/faq.js";

const shootOptions = ["Portretshoot", "Cakesmash", "Zwangerschapsshoot", "Gezinsshoot", "Newbornshoot", "Motherhood", "Buiten shoot", "Model staan met 50% korting", "Anders"];
const encodeForm = (data) => new URLSearchParams(data).toString();
const imageBase = "https://6a4e5b6a100cca13d5bf6c14--cuddling-memories-website.netlify.app";

export default function Contact() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const requestedShoot = params.get("shoot");
  const selectedShoot = useMemo(() => (shootOptions.includes(requestedShoot) ? requestedShoot : "Zwangerschapsshoot"), [requestedShoot]);
  const [status, setStatus] = useState("idle");
  useEffect(() => { const select = document.getElementById("shoot"); if (select) select.value = selectedShoot; }, [selectedShoot]);
  const handleSubmit = async (event) => { event.preventDefault(); setStatus("sending"); const formData = new FormData(event.currentTarget); try { const response = await fetch("/__forms.html", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: encodeForm(formData) }); if (response.ok || import.meta.env.DEV) { navigate("/bedankt"); return; } setStatus("error"); } catch { if (import.meta.env.DEV) { navigate("/bedankt"); return; } setStatus("error"); } };
  return (
    <>
      <SEO title="Contact en boeken" description="Boek een fotoshoot bij Cuddling Memories via het formulier voor zwangerschap, newborn, cakesmash, gezin, portret, motherhood en buiten fotografie." />
      <section className="pt-36"><div className="container-soft grid gap-10 pb-16 lg:grid-cols-[0.85fr_1.15fr]"><div><SectionTitle centered={false} eyebrow="Boeken" title="Vertel mij over jouw gewenste shoot" /><p className="mt-6 text-base leading-8 text-coffee/78">Vul het formulier in met je gewenste shoot en periode. Daarna stemmen we samen af wat mooi past bij jouw moment.</p><div className="mt-8 rounded-lg bg-linen p-6 shadow-soft warm-border"><ShieldCheck className="text-cocoa" size={26} /><h2 className="mt-4 display-title text-2xl font-semibold text-coffee">Alle aanvragen via dit formulier</h2><p className="mt-3 text-sm leading-7 text-coffee/75">Zo blijft alle informatie overzichtelijk bij elkaar en kan Demy zorgvuldig reageren op jouw aanvraag.</p></div><img src={`${imageBase}/images/detail-soft.jpg`} alt="Zachte newborn fotografie" className="mt-8 aspect-[4/3] w-full rounded-lg object-cover shadow-soft warm-border" /></div>
      <form name="booking" method="POST" action="/bedankt" data-netlify="true" netlify-honeypot="bot-field" onSubmit={handleSubmit} className="rounded-lg bg-card p-5 shadow-soft warm-border md:p-8"><input type="hidden" name="form-name" value="booking" /><p className="hidden"><label>Laat dit veld leeg<input name="bot-field" tabIndex="-1" autoComplete="off" /></label></p><div className="grid gap-5 md:grid-cols-2"><label className="grid gap-2 text-sm font-semibold text-coffee">Naam<input name="naam" type="text" required className="rounded-lg border border-cocoa/20 bg-cream px-4 py-3 text-sm outline-none transition focus:border-cocoa" /></label><label className="grid gap-2 text-sm font-semibold text-coffee">E-mailadres<input name="email" type="email" required className="rounded-lg border border-cocoa/20 bg-cream px-4 py-3 text-sm outline-none transition focus:border-cocoa" /></label><label className="grid gap-2 text-sm font-semibold text-coffee md:col-span-2">Gewenste shoot<select id="shoot" name="shoot" defaultValue={selectedShoot} required className="rounded-lg border border-cocoa/20 bg-cream px-4 py-3 text-sm outline-none transition focus:border-cocoa">{shootOptions.map((option) => <option key={option}>{option}</option>)}</select></label><label className="grid gap-2 text-sm font-semibold text-coffee">Gewenste periode of datum<input name="periode" type="text" required className="rounded-lg border border-cocoa/20 bg-cream px-4 py-3 text-sm outline-none transition focus:border-cocoa" /></label><label className="grid gap-2 text-sm font-semibold text-coffee">Locatie of omgeving<input name="omgeving" type="text" required className="rounded-lg border border-cocoa/20 bg-cream px-4 py-3 text-sm outline-none transition focus:border-cocoa" /></label><label className="grid gap-2 text-sm font-semibold text-coffee md:col-span-2">Bericht<textarea name="bericht" required rows="6" className="resize-none rounded-lg border border-cocoa/20 bg-cream px-4 py-3 text-sm outline-none transition focus:border-cocoa"></textarea></label><label className="flex gap-3 rounded-lg bg-linen/70 p-4 text-sm leading-6 text-coffee/78 md:col-span-2"><input name="privacy" type="checkbox" required className="mt-1 h-4 w-4 accent-cocoa" />Ik ga akkoord met de privacyverklaring en geef toestemming om mijn aanvraag te beantwoorden.</label></div>{status === "error" && <p className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">Verzenden is niet gelukt. Probeer het later opnieuw.</p>}<Button type="submit" className="mt-7 w-full gap-2" disabled={status === "sending"}>{status === "sending" ? "Bezig met verzenden" : "Aanvraag versturen"} <Send size={16} /></Button></form></div></section>
      <section className="pb-16"><div className="container-soft"><SectionTitle eyebrow="FAQ" title="Veelgestelde vragen" /><div className="mx-auto mt-9 grid max-w-4xl gap-3">{faqs.map((item, index) => <FAQItem key={item.question} item={item} defaultOpen={index === 0} />)}</div></div></section>
    </>
  );
}
