import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { CalendarClock, Check, Download, FileText, Image, LoaderCircle, ShieldCheck, WalletCards } from "lucide-react";
import Button from "../components/Button.jsx";
import SEO from "../components/SEO.jsx";
import { formatDate, formatDateTime } from "../lib/formatDate.js";

const progressSteps = ["Aangevraagd", "Bevestigd", "Gefotografeerd", "Selectie", "Afgerond"];
const questionnaireFields = [
  ["children", "Namen en leeftijden van de kinderen", "Bijv. Mila (4) en Sem (1)"],
  ["participants", "Wie komen er op de foto?", "Bijv. twee ouders en twee kinderen"],
  ["allergies", "Allergieën of voedingswensen", "Vooral belangrijk bij een cakesmash"],
  ["specialDetails", "Bijzonderheden", "Iets waar ik rekening mee kan houden"],
  ["photographerNotes", "Wat moet ik verder vooraf weten?", "Andere informatie die helpt bij de voorbereiding"],
];

export default function ClientPortal() {
  const { token } = useParams();
  const [portal, setPortal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");

  const load = async () => {
    setError("");
    const response = await fetch(`/api/client-portal?token=${encodeURIComponent(token)}`);
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.message || "Klantportaal laden is niet gelukt.");
    setPortal(body.portal);
  };

  useEffect(() => {
    load().catch((err) => setError(err.message)).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const runAction = async (action, values) => {
    setBusy(action);
    setNotice("");
    setError("");
    try {
      const response = await fetch("/api/client-portal-action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, action, ...values }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || "Opslaan is niet gelukt.");
      setNotice(body.message || "Opgeslagen.");
      await load();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setBusy("");
    }
  };

  const chooseBalancePaymentMethod = (method) => runAction("balance_payment_method", { method });

  if (loading) return <PortalState icon={LoaderCircle} title="Je klantportaal wordt geladen" text="Even geduld..." spin />;
  if (!portal) return <PortalState title="Klantportaal niet beschikbaar" text={error || "Controleer de link of neem contact op."} />;

  const { booking, galleries, invoices, change_requests: changeRequests, payment_details: paymentDetails } = portal;
  const progressIndex = getProgressIndex(booking.status, galleries);
  const openInvoice = invoices.find((invoice) => invoice.status !== "Betaald") || null;
  const remainingAfterDeposit = Number(openInvoice?.remaining_after_deposit || 0);

  return (
    <>
      <SEO title={`Klantportaal ${booking.customer_name}`} description="Beveiligd klantportaal voor je fotoshoot bij Cuddling Memories." />
      <section className="pt-32">
        <div className="container-soft pb-20">
          <p className="fine-label text-xs font-semibold text-cocoa">Jouw klantportaal</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="display-title text-4xl font-semibold text-coffee md:text-6xl">Welkom, {booking.customer_name}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-coffee/70">Hier vind je alles rond je {booking.shoot_type}: afspraak, voorbereiding, geaccepteerde voorwaarden, betaling, facturen en galerij.</p>
            </div>
            <span className="rounded-full bg-linen px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-cocoa">{booking.status}</span>
          </div>

          <ProgressBar current={progressIndex} />
          {notice && <p className="mt-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}
          {error && <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <PortalSection icon={CalendarClock} eyebrow="Afspraak" title={booking.shoot_type}>
              <InfoRow label="Datum" value={booking.booking_date ? formatDate(booking.booking_date) : "Nog niet ingepland"} />
              <InfoRow label="Tijd" value={booking.start_time ? `${booking.start_time.slice(0, 5)}${booking.end_time ? ` - ${booking.end_time.slice(0, 5)}` : ""}` : "Nog niet ingepland"} />
              <InfoRow label="Locatie" value={booking.location || "Nog af te stemmen"} />
              <InfoRow label="Pakket" value={booking.package?.title || "Nog niet gekozen"} />
              <InfoRow label="Add-ons" value={booking.addons?.length ? booking.addons.map((addon) => `${addon.title_snapshot} (${formatEuro(addon.price_snapshot)})`).join(", ") : "Geen"} />
            </PortalSection>

            <PortalSection icon={WalletCards} eyebrow="Aanbetaling" title={paymentTitle(booking)}>
              <InfoRow label="Bedrag" value={booking.deposit_amount ? formatEuro(booking.deposit_amount) : "Geen aanbetaling"} />
              <InfoRow label="Uiterlijk" value={booking.deposit_due_date ? formatDate(booking.deposit_due_date) : "Niet van toepassing"} />
              <InfoRow label="Status" value={booking.deposit_status || "Niet gevraagd"} />
              <InfoRow label="Resterende bedrag uiterlijk" value={booking.full_payment_due_date ? formatDate(booking.full_payment_due_date) : booking.full_payment_due_mode === "after_shoot" ? "Na invullen van de werkelijke shootdatum" : "Volgens afspraak"} />
              {booking.deposit_status === "Betaald" && <p className="mt-3 rounded-lg bg-emerald-50 px-4 py-3 text-xs leading-5 text-emerald-900">De betaalde aanbetaling wordt automatisch van het factuurbedrag afgetrokken. Je betaalt op de einddatum alleen het resterende bedrag.</p>}
              {Number(booking.deposit_amount || 0) > 0 && booking.deposit_status !== "Betaald" && <DepositBankTransfer booking={booking} details={paymentDetails} />}
              {remainingAfterDeposit > 0 && <BalancePaymentChoice booking={booking} amount={remainingAfterDeposit} details={paymentDetails} busy={busy} onChoose={chooseBalancePaymentMethod} />}
            </PortalSection>

            <PortalSection icon={Image} eyebrow="Galerij" title={galleries.length ? "Je foto’s" : "Nog niet beschikbaar"}>
              {galleries.length ? galleries.map((gallery) => (
                <a key={gallery.id} href={`/galerij/${gallery.secure_token}`} className="mt-3 flex items-center justify-between rounded-lg border border-cocoa/15 bg-cream px-4 py-4 text-sm font-semibold text-coffee transition hover:border-cocoa">
                  <span>{gallery.title}</span><span className="text-cocoa">Open galerij</span>
                </a>
              )) : <p className="text-sm leading-6 text-coffee/65">{portal.gallery_payment_locked ? "De definitieve galerij wordt beschikbaar nadat het volledige bedrag is ontvangen." : "Zodra de foto’s klaarstaan verschijnt de beveiligde galerij hier automatisch."}</p>}
            </PortalSection>

            <PortalSection icon={FileText} eyebrow="Facturen" title={invoices.length ? "Je factuur staat klaar" : "Nog geen facturen"}>
              {invoices.length ? invoices.map((invoice) => (
                <div key={invoice.id} className="mt-3 rounded-lg border border-cocoa/15 bg-cream p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-coffee">{invoice.title || "Fotoshoot"}</p>
                      <p className="mt-1 text-xs text-coffee/55">{invoice.invoice_number} · {formatDate(invoice.issued_at)}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.1em] ${invoice.status === "Betaald" ? "bg-emerald-50 text-emerald-800" : "bg-linen text-cocoa"}`}>{invoice.payment_phase === "deposit" ? "Aanbetaling open" : invoice.status}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-cocoa/10 pt-4">
                    <div>
                      <p className="text-xs text-coffee/55">Volledig factuurbedrag {formatEuro(invoice.total_amount)}</p>
                      {Number(invoice.deposit_applied || 0) > 0 && <p className="mt-1 text-xs font-semibold text-emerald-800">Aanbetaling ontvangen: - {formatEuro(invoice.deposit_applied)}</p>}
                      <p className="display-title mt-1 text-2xl font-semibold text-coffee">{invoice.status === "Betaald" ? "Volledig voldaan" : invoice.payment_phase === "deposit" ? `Nu te betalen ${formatEuro(invoice.current_due_amount)}` : `Nog te betalen ${formatEuro(invoice.current_due_amount ?? invoice.remaining_amount ?? invoice.total_amount)}`}</p>
                      {invoice.payment_phase === "deposit" ? <div className="mt-2 rounded-lg bg-linen/70 px-3 py-2 text-xs leading-5 text-coffee/70"><p><strong>Aanbetaling:</strong> {formatEuro(invoice.deposit_due_now)} uiterlijk {booking.deposit_due_date ? formatDate(booking.deposit_due_date) : "volgens afspraak"}</p><p><strong>Daarna resterend:</strong> {formatEuro(invoice.remaining_after_deposit)} uiterlijk {booking.full_payment_due_date ? formatDate(booking.full_payment_due_date) : "volgens afspraak"}</p><p className="mt-1 font-semibold text-cocoa">Maak nu alleen de aanbetaling over.</p></div> : <p className="mt-1 text-xs text-coffee/55">{invoice.status === "Betaald" ? "Er staat geen bedrag meer open." : `Te betalen uiterlijk ${invoice.due_at ? formatDate(invoice.due_at) : "volgens afspraak"}`}</p>}
                    </div>
                    <a href={`/api/client-invoice?token=${encodeURIComponent(token)}&invoice=${invoice.id}`} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-cocoa px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-card transition hover:bg-coffee"><Download size={15} /> Download factuur</a>
                  </div>
                </div>
              )) : <p className="text-sm leading-6 text-coffee/65">{booking.full_payment_due_mode === "after_shoot" && booking.deposit_status !== "Betaald" ? "De factuur verschijnt zodra de aanbetaling is ontvangen. De definitieve vervaldatum volgt nadat de werkelijke shootdatum bekend is." : "Zodra er een pakket aan je boeking is gekoppeld, verschijnt de factuur hier automatisch."}</p>}
            </PortalSection>
          </div>

          <div className="mt-6 grid gap-6">
            <QuestionnaireSection booking={booking} busy={busy} onSave={(answers) => runAction("questionnaire", { answers })} />
            <AcceptedTermsSection booking={booking} />
            <RescheduleSection requests={changeRequests} busy={busy} onSubmit={(values) => runAction("reschedule", values)} />
          </div>
        </div>
      </section>
    </>
  );
}

function ProgressBar({ current }) {
  return <div className="mt-8 overflow-x-auto rounded-lg bg-card p-5 shadow-soft warm-border"><ol className="flex min-w-[36rem] items-center">{progressSteps.map((step, index) => <li key={step} className="flex flex-1 items-center last:flex-none"><div className="grid justify-items-center gap-2"><span className={`grid h-9 w-9 place-items-center rounded-full border ${index <= current ? "border-cocoa bg-cocoa text-card" : "border-cocoa/20 bg-cream text-coffee/40"}`}>{index < current ? <Check size={16} /> : index + 1}</span><span className={`text-[0.65rem] font-semibold uppercase tracking-[0.1em] ${index <= current ? "text-coffee" : "text-coffee/40"}`}>{step}</span></div>{index < progressSteps.length - 1 && <span className={`mx-3 h-px flex-1 ${index < current ? "bg-cocoa" : "bg-cocoa/15"}`} />}</li>)}</ol></div>;
}

function PortalSection({ icon: Icon, eyebrow, title, children }) {
  return <section className="rounded-lg bg-card p-5 shadow-soft warm-border md:p-6"><Icon size={21} className="text-cocoa" /><p className="fine-label mt-3 text-[0.65rem] font-semibold text-cocoa">{eyebrow}</p><h2 className="display-title mt-1 text-2xl font-semibold text-coffee">{title}</h2><div className="mt-4">{children}</div></section>;
}

function QuestionnaireSection({ booking, busy, onSave }) {
  const [answers, setAnswers] = useState(booking.questionnaire_answers || {});
  return <PortalSection icon={FileText} eyebrow="Voorbereiding" title="Vragen voor de shoot"><p className="text-sm leading-6 text-coffee/65">Je kunt deze informatie later aanvullen totdat ik de voorbereiding vergrendel.</p><div className="mt-5 grid gap-4 md:grid-cols-2">{questionnaireFields.map(([key,label,placeholder]) => <label key={key} className="grid gap-2 text-sm font-semibold text-coffee">{label}<textarea rows={3} disabled={booking.questionnaire_locked} value={answers[key] || ""} onChange={(event) => setAnswers((current) => ({...current,[key]:event.target.value}))} placeholder={placeholder} className="resize-none rounded-lg border border-cocoa/20 bg-cream px-4 py-3 text-sm font-normal outline-none focus:border-cocoa disabled:opacity-60" /></label>)}</div><Button type="button" onClick={() => onSave(answers)} disabled={booking.questionnaire_locked || busy === "questionnaire"} className="mt-5">{booking.questionnaire_locked ? "Vragen vergrendeld" : busy === "questionnaire" ? "Opslaan..." : "Voorbereiding opslaan"}</Button></PortalSection>;
}

function AcceptedTermsSection({ booking }) {
  const acceptedAt = booking.terms_accepted_at || booking.contract_signed_at;
  const acceptedBy = booking.terms_accepted_by || booking.contract_signer_name;
  const version = booking.terms_version || booking.contract_version;
  return <PortalSection icon={ShieldCheck} eyebrow="Voorwaarden" title="Geaccepteerde annuleringsvoorwaarden"><p className="text-sm leading-6 text-coffee/65">Je hebt deze voorwaarden al tijdens het boeken geaccepteerd. Je hoeft hier niets opnieuw te ondertekenen.</p><div className="mt-4 max-h-72 overflow-y-auto whitespace-pre-line rounded-lg bg-cream p-4 text-sm leading-7 text-coffee/72">{booking.contract_text}</div>{acceptedAt ? <div className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900"><p className="font-semibold">Geaccepteerd bij het boeken</p><p className="mt-1">{acceptedBy ? `${acceptedBy} · ` : ""}{formatDateTime(acceptedAt)}{version ? ` · versie ${version}` : ""}</p></div> : <p className="mt-4 rounded-lg bg-linen px-4 py-3 text-sm leading-6 text-coffee/70">Deze boeking is gemaakt voordat de digitale acceptatie apart werd vastgelegd. Je hoeft in het klantportaal niets opnieuw te ondertekenen.</p>}</PortalSection>;
}

function RescheduleSection({ requests, busy, onSubmit }) {
  const [date,setDate]=useState(""); const [period,setPeriod]=useState(""); const [reason,setReason]=useState("");
  return <PortalSection icon={CalendarClock} eyebrow="Afspraak wijzigen" title="Andere datum aanvragen"><p className="text-sm leading-6 text-coffee/65">Een verzoek verandert de afspraak nog niet. Je ontvangt eerst een bevestiging.</p><div className="mt-5 grid gap-4 md:grid-cols-2"><label className="grid gap-2 text-sm font-semibold text-coffee">Gewenste datum<input type="date" value={date} onChange={(e)=>setDate(e.target.value)} className="rounded-lg border border-cocoa/20 bg-cream px-4 py-3 text-sm" /></label><label className="grid gap-2 text-sm font-semibold text-coffee">Voorkeurstijd of dagdeel<input value={period} onChange={(e)=>setPeriod(e.target.value)} placeholder="Bijv. namiddag" className="rounded-lg border border-cocoa/20 bg-cream px-4 py-3 text-sm" /></label><label className="grid gap-2 text-sm font-semibold text-coffee md:col-span-2">Toelichting (optioneel)<textarea rows={3} value={reason} onChange={(e)=>setReason(e.target.value)} className="resize-none rounded-lg border border-cocoa/20 bg-cream px-4 py-3 text-sm" /></label></div><Button type="button" onClick={()=>onSubmit({preferred_date:date,preferred_period:period,reason})} disabled={!date || busy === "reschedule"} className="mt-5">{busy === "reschedule" ? "Versturen..." : "Verplaatsingsverzoek versturen"}</Button>{requests.length>0 && <div className="mt-5 border-t border-cocoa/15 pt-4"><p className="text-xs font-semibold uppercase tracking-[0.1em] text-cocoa">Eerdere verzoeken</p>{requests.slice(0,3).map((request)=><p key={request.id} className="mt-2 text-sm text-coffee/65">{formatDate(request.preferred_date)} · {request.status}</p>)}</div>}</PortalSection>;
}

function DepositBankTransfer({ booking, details }) {
  return <div className="mt-5"><p className="text-sm font-semibold text-coffee">Aanbetaling via bankoverschrijving</p><p className="mt-1 text-xs leading-5 text-coffee/60">De aanbetaling moet via bankoverschrijving worden voldaan. Contant betalen is alleen mogelijk voor het resterende bedrag.</p><div className="mt-3 rounded-lg bg-linen p-4 text-sm text-coffee/75"><InfoRow label="Rekeninghouder" value={details?.account_holder||"Cuddling Memories Fotografie"}/><InfoRow label="IBAN" value={details?.iban||"Nog niet ingesteld"}/><InfoRow label="Nu overmaken" value={formatEuro(booking.deposit_amount)}/><InfoRow label="Betalingskenmerk" value={booking.deposit_payment_reference||"Wordt aangemaakt"}/><p className="mt-3 text-xs leading-5 text-coffee/55">Na ontvangst wordt de aanbetaling handmatig als betaald gemarkeerd.</p></div></div>;
}

function BalancePaymentChoice({ booking, amount, details, busy, onChoose }) {
  const method = booking.full_payment_method;
  return <div className="mt-5 border-t border-cocoa/15 pt-5"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-coffee">Hoe wil je het resterende bedrag voldoen?</p><p className="mt-1 text-xs text-coffee/55">Resterend bedrag: {formatEuro(amount)}</p></div>{busy === "balance_payment_method" && <span className="text-xs font-semibold text-cocoa">Keuze opslaan...</span>}</div><div className="mt-3 grid gap-3 sm:grid-cols-2"><button type="button" onClick={()=>onChoose("bank_transfer")} disabled={busy === "balance_payment_method"} className={`rounded-lg border p-4 text-left transition ${method==="bank_transfer"?"border-cocoa bg-linen":"border-cocoa/20 bg-cream hover:border-cocoa/50"}`}><span className="font-semibold text-coffee">Bankoverschrijving</span><span className="mt-1 block text-xs leading-5 text-coffee/60">Maak het resterende bedrag zelf over.</span></button><button type="button" onClick={()=>onChoose("cash")} disabled={busy === "balance_payment_method"} className={`rounded-lg border p-4 text-left transition ${method==="cash"?"border-cocoa bg-linen":"border-cocoa/20 bg-cream hover:border-cocoa/50"}`}><span className="font-semibold text-coffee">Contant betalen</span><span className="mt-1 block text-xs leading-5 text-coffee/60">Het resterende bedrag wordt contant voldaan.</span></button></div>{method==="bank_transfer"&&<div className="mt-3 rounded-lg bg-linen p-4 text-sm text-coffee/75"><InfoRow label="Rekeninghouder" value={details?.account_holder||"Cuddling Memories Fotografie"}/><InfoRow label="IBAN" value={details?.iban||"Nog niet ingesteld"}/><InfoRow label="Resterend bedrag" value={formatEuro(amount)}/><InfoRow label="Betalingskenmerk" value={booking.deposit_payment_reference||"Wordt aangemaakt"}/></div>}{method==="cash"&&<p className="mt-3 rounded-lg bg-linen px-4 py-3 text-sm leading-6 text-coffee/70">Je keuze voor contant betalen van het resterende bedrag is opgeslagen.</p>}</div>;
}

function InfoRow({label,value}) { return <div className="flex items-baseline justify-between gap-4 border-b border-cocoa/10 py-2 text-sm"><span className="text-coffee/55">{label}</span><span className="text-right font-semibold text-coffee">{value}</span></div>; }
function PortalState({icon:Icon,title,text,spin}) { return <section className="container-soft grid min-h-[70vh] place-items-center pt-32"><div className="max-w-md text-center">{Icon&&<Icon className={`mx-auto text-cocoa ${spin?"animate-spin":""}`} size={28}/>}<h1 className="display-title mt-4 text-3xl font-semibold text-coffee">{title}</h1><p className="mt-3 text-sm leading-6 text-coffee/65">{text}</p></div></section>; }
function getProgressIndex(status,galleries){ if(status==="Afgerond")return 4;if(galleries?.some((g)=>["Keuze ontvangen","Extra beelden aangevraagd","Afgerond"].includes(g.status)))return 3;if(["Shoot geweest","Galerij verstuurd"].includes(status))return status==="Galerij verstuurd"?3:2;if(["Datum ingepland","Aanbetaling gevraagd","Aanbetaling ontvangen"].includes(status))return 1;return 0; }
const formatEuro=(value)=>new Intl.NumberFormat("nl-NL",{style:"currency",currency:"EUR"}).format(Number(value||0));
const paymentTitle=(booking)=>booking.deposit_status==="Betaald"?"Aanbetaling ontvangen":Number(booking.deposit_amount||0)>0?"Kies je betaalwijze":"Geen aanbetaling nodig";
