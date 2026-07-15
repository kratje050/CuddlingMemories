import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Banknote, CheckCircle2, CreditCard, Landmark, WalletCards } from "lucide-react";
import AdminLayout from "../components/AdminLayout.jsx";
import DataTable from "../components/DataTable.jsx";
import { supabase } from "../../lib/supabaseClient.js";
import { formatDate } from "../../lib/formatDate.js";

const views = [
  { key: "open_deposit", label: "Openstaande aanbetalingen", icon: WalletCards },
  { key: "open_balance", label: "Openstaande restbedragen", icon: CreditCard },
  { key: "overdue", label: "Verlopen betaaltermijnen", icon: AlertTriangle },
  { key: "cash", label: "Contante betalingen", icon: Banknote },
  { key: "bank", label: "Bankoverschrijvingen", icon: Landmark },
  { key: "paid", label: "Volledig betaald", icon: CheckCircle2 },
];

const inactiveStatuses = new Set(["Geannuleerd", "Gearchiveerd"]);
const paidTransactionStatuses = new Set(["paid", "betaald", "completed", "voltooid"]);

export default function AdminPayments() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeView, setActiveView] = useState("open_deposit");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      const [bookingResult, invoiceResult, transactionResult] = await Promise.all([
        supabase
          .from("bookings")
          .select("id,customer_name,customer_email,shoot_type,booking_date,status,deposit_amount,deposit_due_date,deposit_status,deposit_paid_at,deposit_payment_method,deposit_payment_reference,full_payment_due_date,full_payment_method,packages(id,title,price)")
          .order("booking_date", { ascending: true, nullsFirst: false }),
        supabase.from("invoices").select("id,booking_id,invoice_number,total_amount,due_at,status,paid_at,issued_at").order("issued_at", { ascending: false }),
        supabase.from("payment_transactions").select("id,booking_id,provider,payment_type,amount,status,paid_at,provider_payload,created_at").order("created_at", { ascending: false }),
      ]);
      if (!active) return;
      const firstError = bookingResult.error || invoiceResult.error || transactionResult.error;
      if (firstError) {
        setError(firstError.message);
        setRows([]);
      } else {
        setRows(buildPaymentRows(bookingResult.data || [], invoiceResult.data || [], transactionResult.data || []));
      }
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, []);

  const summaries = useMemo(() => Object.fromEntries(views.map((view) => {
    const matches = rows.filter((row) => row.groups.includes(view.key));
    return [view.key, { count: matches.length, amount: matches.reduce((sum, row) => sum + amountForView(row, view.key), 0) }];
  })), [rows]);

  const visibleRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => row.groups.includes(activeView)).filter((row) => !query || [row.customer_name, row.customer_email, row.shoot_type, row.invoice_number, row.payment_reference].some((value) => String(value || "").toLowerCase().includes(query)));
  }, [rows, activeView, search]);

  const columns = [
    { key: "customer_name", label: "Klant" },
    { key: "shoot_type", label: "Shoot" },
    { key: "booking_date", label: "Shootdatum", render: (row) => row.booking_date ? formatDate(row.booking_date) : "Nog niet ingepland" },
    { key: "payment_method", label: "Betaalwijze", render: (row) => paymentMethodLabel(activeView === "open_balance" ? row.balance_payment_method : activeView === "cash" ? "cash" : activeView === "bank" ? "bank_transfer" : row.deposit_payment_method) },
    { key: "payment_status", label: "Betaalstatus", render: (row) => <StatusBadge overdue={row.groups.includes("overdue")} paid={row.groups.includes("paid")} label={statusForView(row, activeView)} /> },
    { key: "deadline", label: "Uiterlijk", render: (row) => deadlineForView(row, activeView) },
    { key: "amount", label: "Bedrag", render: (row) => formatEuro(amountForView(row, activeView)) },
    { key: "payment_reference", label: "Kenmerk", render: (row) => row.payment_reference || "-" },
  ];

  return (
    <AdminLayout>
      <div>
        <p className="fine-label text-cocoa">Financieel overzicht</p>
        <h1 className="display-title mt-2 text-3xl font-semibold text-coffee">Betalingen</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-coffee/65">
          Alle aanbetalingen, facturen en gekozen betaalwijzen bij elkaar. Een betaalde aanbetaling wordt automatisch van het openstaande restbedrag afgetrokken.
        </p>
      </div>

      {error && <p className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {views.map(({ key, label, icon: Icon }) => {
          const summary = summaries[key] || { count: 0, amount: 0 };
          const selected = activeView === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveView(key)}
              className={`min-h-36 rounded-lg border p-4 text-left shadow-soft transition ${selected ? "border-cocoa bg-cocoa text-card" : "border-cocoa/15 bg-card text-coffee hover:border-cocoa/40 hover:bg-linen/40"}`}
            >
              <Icon size={20} strokeWidth={1.7} />
              <span className="mt-4 block text-sm font-semibold leading-5">{label}</span>
              <span className={`mt-2 block text-xs ${selected ? "text-card/75" : "text-coffee/55"}`}>{summary.count} boeking{summary.count === 1 ? "" : "en"}</span>
              <span className="mt-1 block font-semibold">{formatEuro(summary.amount)}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="fine-label text-cocoa">Geselecteerd overzicht</p>
          <h2 className="display-title mt-1 text-2xl font-semibold text-coffee">{views.find((view) => view.key === activeView)?.label}</h2>
        </div>
        <label className="grid w-full max-w-sm gap-1 text-xs font-semibold text-coffee/65">
          Zoeken
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Naam, e-mail, shoot of factuurnummer"
            className="rounded-lg border border-cocoa/20 bg-card px-3 py-2.5 text-sm text-coffee outline-none focus:border-cocoa"
          />
        </label>
      </div>

      <div className="mt-4">
        <DataTable
          loading={loading}
          rows={visibleRows}
          columns={columns}
          getRowKey={(row) => row.id}
          onRowClick={(row) => navigate(`/admin/bookings/${row.id}`)}
          emptyLabel="Geen boekingen in dit betalingsoverzicht."
        />
      </div>
      <p className="mt-3 text-xs leading-5 text-coffee/55">Klik op een boeking om de aanbetaling, factuurstatus of betaaldatum te bekijken en aan te passen.</p>
    </AdminLayout>
  );
}

function buildPaymentRows(bookings, invoices, transactions) {
  const invoicesByBooking = new Map();
  invoices.forEach((invoice) => {
    if (!invoicesByBooking.has(invoice.booking_id)) invoicesByBooking.set(invoice.booking_id, invoice);
  });
  const transactionsByBooking = new Map();
  transactions.forEach((transaction) => {
    if (!transactionsByBooking.has(transaction.booking_id)) transactionsByBooking.set(transaction.booking_id, []);
    transactionsByBooking.get(transaction.booking_id).push(transaction);
  });
  const today = localDateKey(new Date());

  return bookings.map((booking) => {
    const invoice = invoicesByBooking.get(booking.id) || null;
    const bookingTransactions = transactionsByBooking.get(booking.id) || [];
    const latestTransaction = bookingTransactions[0] || null;
    const paidInvoiceTransactions = bookingTransactions.filter((transaction) => transaction.payment_type === "invoice" && paidTransactionStatuses.has(String(transaction.status || "").toLowerCase()));
    const paidDepositTransactions = bookingTransactions.filter((transaction) => transaction.payment_type === "deposit" && paidTransactionStatuses.has(String(transaction.status || "").toLowerCase()));
    const depositAmount = Number(booking.deposit_amount || 0);
    const depositPaid = booking.deposit_status === "Betaald";
    const invoiceTotal = Number(invoice?.total_amount || 0);
    const paidDepositContribution = depositPaid
      ? depositAmount
      : paidDepositTransactions.reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
    const paidInvoiceContribution = paidInvoiceTransactions.reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
    const packageRecord = Array.isArray(booking.packages) ? booking.packages[0] : booking.packages;
    const packagePrice = Number(packageRecord?.price || 0);
    const invoicePaid = invoice?.status === "Betaald" || (invoiceTotal > 0 && paidDepositContribution + paidInvoiceContribution >= invoiceTotal);
    const fullyPaidWithoutInvoice = !invoice && packagePrice > 0 && paidDepositContribution >= packagePrice;
    const remainingAmount = invoicePaid ? 0 : Math.max(0, invoiceTotal - (depositPaid ? Math.min(depositAmount, invoiceTotal) : 0));
    const active = !inactiveStatuses.has(booking.status);
    const depositOpen = active && depositAmount > 0 && !["Betaald", "Terugbetaald"].includes(booking.deposit_status);
    const balanceOpen = active && Boolean(invoice) && !["Betaald", "Gecrediteerd"].includes(invoice.status) && remainingAmount > 0;
    const depositOverdue = depositOpen && (booking.deposit_status === "Vervallen" || (booking.deposit_due_date && booking.deposit_due_date < today));
    const invoiceOverdue = balanceOpen && (invoice?.status === "Vervallen" || (invoice?.due_at && invoice.due_at < today));
    const depositPaymentMethod = depositAmount > 0 ? "bank_transfer" : booking.deposit_payment_method || null;
    const balancePaymentMethod = booking.full_payment_method || bookingTransactions.find((transaction) => transaction.payment_type === "invoice")?.provider || null;
    const groups = [];
    if (depositOpen) groups.push("open_deposit");
    if (balanceOpen) groups.push("open_balance");
    if (depositOverdue || invoiceOverdue) groups.push("overdue");
    if (balancePaymentMethod === "cash") groups.push("cash");
    if (depositPaymentMethod === "bank_transfer" || balancePaymentMethod === "bank_transfer") groups.push("bank");
    if (invoicePaid || fullyPaidWithoutInvoice) groups.push("paid");

    return {
      ...booking,
      groups,
      invoice,
      invoice_number: invoice?.invoice_number || "-",
      invoice_status: invoice?.status || "Geen factuur",
      invoice_total: invoiceTotal || (fullyPaidWithoutInvoice ? packagePrice : 0),
      remaining_amount: remainingAmount,
      deposit_payment_method: depositPaymentMethod,
      balance_payment_method: balancePaymentMethod,
      payment_reference: booking.deposit_payment_reference || latestTransaction?.provider_payload?.reference || "",
      deposit_overdue: depositOverdue,
      invoice_overdue: invoiceOverdue,
    };
  });
}

function amountForView(row, view) {
  if (view === "open_deposit") return Number(row.deposit_amount || 0);
  if (view === "open_balance") return Number(row.remaining_amount || 0);
  if (view === "overdue") return (row.deposit_overdue ? Number(row.deposit_amount || 0) : 0) + (row.invoice_overdue ? Number(row.remaining_amount || 0) : 0);
  if (view === "paid") return Number(row.invoice_total || 0);
  if (row.invoice_status === "Betaald") return Number(row.invoice_total || 0);
  if (view === "cash") return row.balance_payment_method === "cash" ? Number(row.remaining_amount || 0) : 0;
  if (view === "bank") return Number(row.deposit_amount || 0) + (row.balance_payment_method === "bank_transfer" ? Number(row.remaining_amount || 0) : 0);
  return Number(row.deposit_amount || 0);
}

function deadlineForView(row, view) {
  if (view === "open_deposit") return row.deposit_due_date ? formatDate(row.deposit_due_date) : "Niet bepaald";
  if (view === "open_balance") return row.invoice?.due_at ? formatDate(row.invoice.due_at) : row.full_payment_due_date ? formatDate(row.full_payment_due_date) : "Niet bepaald";
  if (view === "overdue") {
    const dates = [row.deposit_overdue ? row.deposit_due_date : null, row.invoice_overdue ? row.invoice?.due_at : null].filter(Boolean).sort();
    return dates[0] ? formatDate(dates[0]) : "-";
  }
  if (view === "paid") return row.invoice?.paid_at ? formatDate(row.invoice.paid_at) : row.deposit_paid_at ? formatDate(row.deposit_paid_at) : "Betaald";
  return row.deposit_due_date ? formatDate(row.deposit_due_date) : "-";
}

function statusForView(row, view) {
  if (view === "overdue") return "Termijn verlopen";
  if (view === "paid") return "Volledig betaald";
  if (view === "open_balance") return row.invoice_status;
  if (view === "cash" || view === "bank") return row.invoice_status === "Betaald" ? "Volledig betaald" : row.deposit_status || "Gekozen";
  return row.deposit_status || "Openstaand";
}

function paymentMethodLabel(method) {
  if (method === "cash") return "Contant";
  if (method === "bank_transfer") return "Bankoverschrijving";
  return "Nog niet gekozen";
}

function StatusBadge({ label, overdue, paid }) {
  const color = overdue ? "border-red-200 bg-red-50 text-red-800" : paid ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-cocoa/20 bg-linen text-coffee";
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${color}`}>{label}</span>;
}

function localDateKey(date) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function formatEuro(value) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(Number(value || 0));
}
