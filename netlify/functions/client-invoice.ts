import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { clean, getSupabaseAdmin, json } from "./email-utils.ts";

const readEnv = (name: string) => globalThis.Netlify?.env?.get(name) || "";

export default async (req: Request) => {
  if (req.method !== "GET") return json(405, { ok: false, message: "Alleen GET is toegestaan." });

  try {
    const url = new URL(req.url);
    const token = clean(url.searchParams.get("token"), 160);
    const invoiceId = clean(url.searchParams.get("invoice"), 80);
    const supabase = getSupabaseAdmin();
    const { data: booking } = await supabase
      .from("bookings")
      .select("id,customer_name,customer_email,shoot_type,booking_date,start_time,location,deposit_amount,deposit_due_date,deposit_status,deposit_paid_at,deposit_payment_reference,full_payment_due_date,full_payment_method,portal_enabled")
      .eq("portal_token", token)
      .maybeSingle();
    if (!booking?.portal_enabled) return json(404, { ok: false, message: "Factuur niet gevonden." });

    const { data: invoice, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .eq("booking_id", booking.id)
      .maybeSingle();
    if (error) throw error;
    if (!invoice) return json(404, { ok: false, message: "Factuur niet gevonden." });

    const bytes = await createInvoicePdf(invoice, booking);
    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="factuur-${safeFileName(invoice.invoice_number)}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return json(500, { ok: false, message: error instanceof Error ? error.message : "Factuur maken is niet gelukt." });
  }
};

export async function createInvoicePdf(invoice: Record<string, any>, booking: Record<string, any>) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Factuur ${invoice.invoice_number}`);
  pdf.setAuthor(readEnv("INVOICE_BUSINESS_NAME") || "Cuddling Memories Fotografie");
  pdf.setSubject(`Factuur voor ${booking.customer_name}`);

  const page = pdf.addPage([595.28, 841.89]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const serifItalic = await pdf.embedFont(StandardFonts.TimesRomanItalic);

  const colors = {
    paper: rgb(0.992, 0.978, 0.962),
    card: rgb(1, 0.992, 0.982),
    blush: rgb(0.965, 0.91, 0.87),
    linen: rgb(0.91, 0.84, 0.78),
    cocoa: rgb(0.60, 0.42, 0.31),
    rose: rgb(0.76, 0.48, 0.39),
    coffee: rgb(0.25, 0.17, 0.14),
    muted: rgb(0.43, 0.37, 0.34),
    line: rgb(0.86, 0.75, 0.68),
  };

  page.drawRectangle({ x: 0, y: 0, width: 595.28, height: 841.89, color: colors.paper });
  const businessName = readEnv("INVOICE_BUSINESS_NAME") || "Cuddling Memories Fotografie";
  const issuedAt = formatDate(invoice.issued_at);
  const dueAt = invoice.due_at ? formatDate(invoice.due_at) : "Volgens afspraak";
  const meta = parseInvoiceMeta(invoice.notes);
  const packagePrice = numberOr(meta.package_price, invoice.total_amount);
  const paidDeposit = booking.deposit_status === "Betaald"
    ? Math.min(numberOr(booking.deposit_amount, 0), numberOr(invoice.total_amount, 0))
    : 0;
  const remainingAmount = invoice.status === "Betaald" ? 0 : Math.max(0, numberOr(invoice.total_amount, 0) - paidDeposit);
  const openDeposit = invoice.status !== "Betaald" && booking.deposit_status !== "Betaald"
    ? Math.min(numberOr(booking.deposit_amount, 0), numberOr(invoice.total_amount, 0))
    : 0;
  const amountDueNow = invoice.status === "Betaald" ? 0 : openDeposit || remainingAmount;
  const remainingAfterDeposit = Math.max(0, numberOr(invoice.total_amount, 0) - (paidDeposit || openDeposit));

  drawBotanical(page, 538, 814, 1, colors, false);
  drawBotanical(page, 530, 121, 0.72, colors, true);
  drawCentered(page, "Cuddling Memories", 780, 29, serifItalic, colors.coffee);
  drawCentered(page, "F O T O G R A F I E", 751, 9, regular, colors.coffee);
  page.drawLine({ start: { x: 205, y: 738 }, end: { x: 275, y: 738 }, thickness: 0.65, color: colors.rose });
  page.drawLine({ start: { x: 320, y: 738 }, end: { x: 390, y: 738 }, thickness: 0.65, color: colors.rose });
  drawHeart(page, 297.5, 738, 8, colors.rose);
  drawCentered(page, "FACTUUR", 691, 34, serif, colors.coffee);

  drawCard(page, 42, 611, 511, 69, colors.card, colors.line);
  drawMetaBlock(page, 42, 611, 170, "FACTUURNUMMER", String(invoice.invoice_number || "-"), "document", regular, bold, colors);
  drawMetaBlock(page, 212, 611, 170, "FACTUURDATUM", issuedAt, "calendar", regular, bold, colors);
  drawMetaBlock(page, 382, 611, 171, "VERVALDATUM", dueAt, "calendar", regular, bold, colors);
  page.drawLine({ start: { x: 212, y: 622 }, end: { x: 212, y: 668 }, thickness: 0.5, color: colors.line });
  page.drawLine({ start: { x: 382, y: 622 }, end: { x: 382, y: 668 }, thickness: 0.5, color: colors.line });

  drawCard(page, 42, 493, 511, 101, colors.card, colors.line);
  drawCircleIcon(page, 67, 566, 13, colors);
  page.drawText("KLANT- & SHOOTGEGEVENS", { x: 89, y: 563, size: 9, font: bold, color: colors.coffee });
  page.drawLine({ start: { x: 297, y: 507 }, end: { x: 297, y: 568 }, thickness: 0.5, color: colors.line });
  drawInfoLine(page, "Klantnaam", booking.customer_name || "Klant", 55, 536, 220, regular, bold, colors);
  drawInfoLine(page, "E-mailadres", booking.customer_email || "-", 55, 508, 220, regular, bold, colors);
  drawInfoLine(page, "Soort fotoshoot", booking.shoot_type || invoice.title || "Fotoshoot", 318, 536, 222, regular, bold, colors);
  drawInfoLine(page, "Datum", booking.booking_date ? formatDate(booking.booking_date) : "Volgens afspraak", 318, 518, 222, regular, bold, colors);
  drawInfoLine(page, "Locatie", booking.location || "Volgens afspraak", 318, 500, 222, regular, bold, colors);

  const tableX = 42;
  const tableY = 299;
  const tableW = 511;
  const tableH = 179;
  drawCard(page, tableX, tableY, tableW, tableH, colors.card, colors.line);
  page.drawRectangle({ x: tableX, y: 449, width: tableW, height: 29, color: colors.linen });
  page.drawText("OMSCHRIJVING", { x: 112, y: 459, size: 8, font: bold, color: colors.coffee });
  page.drawText("BEDRAG", { x: 476, y: 459, size: 8, font: bold, color: colors.coffee });
  page.drawLine({ start: { x: 433, y: tableY }, end: { x: 433, y: 478 }, thickness: 0.5, color: colors.line });

  const packageTitle = String(meta.package_title || invoice.title || booking.shoot_type || "Fotoshoot");
  const giftcardAmount = numberOr(meta.giftcard_amount, 0);
  const invoiceAddons = Array.isArray(meta.addons) ? meta.addons : [];
  const addonTotal = invoiceAddons.reduce((sum: number, addon: Record<string, unknown>) => sum + numberOr(addon.price, 0), 0);
  const packageDescription = invoiceAddons.length > 0
    ? `${packageTitle} + ${invoiceAddons.map((addon: Record<string, unknown>) => addon.title).join(", ")}`
    : packageTitle;
  drawInvoiceRow(page, 421, invoiceAddons.length > 0 ? "Hoofdpakket + add-ons" : "Omschrijving / pakket", packageDescription, formatEuro(packagePrice + addonTotal), regular, bold, colors);
  let nextRowY = 387;
  if (giftcardAmount > 0) {
    drawInvoiceRow(page, nextRowY, "Cadeaubon", `Cadeaubon ${String(meta.giftcard_code || "").trim()}`, `- ${formatEuro(giftcardAmount)}`, regular, bold, colors);
    nextRowY -= 34;
  }
  drawInvoiceRow(page, nextRowY, paidDeposit > 0 ? "Ontvangen aanbetaling" : openDeposit > 0 ? "Aanbetaling - nu te betalen" : "Aanbetaling", paidDeposit > 0 ? `Betaald op ${formatDate(booking.deposit_paid_at)}` : openDeposit > 0 ? `Uiterlijk ${formatDate(booking.deposit_due_date)}` : "Geen aanbetaling van toepassing", paidDeposit > 0 ? `- ${formatEuro(paidDeposit)}` : openDeposit > 0 ? formatEuro(openDeposit) : formatEuro(0), regular, bold, colors);
  page.drawRectangle({ x: tableX, y: tableY, width: tableW, height: 29, color: colors.blush });
  page.drawText(giftcardAmount > 0 ? "TOTAAL NA KORTING" : "TOTAALBEDRAG", { x: 112, y: 309, size: 8.5, font: bold, color: colors.coffee });
  drawRight(page, formatEuro(invoice.total_amount), 535, 307, 11.5, bold, colors.coffee);

  drawCard(page, 42, 238, 511, 46, colors.blush, colors.line);
  drawHeart(page, 72, 261, 11, colors.cocoa);
  page.drawText(invoice.status === "Betaald" ? "VOLDAAN" : openDeposit > 0 ? "NU TE BETALEN" : "NOG TE BETALEN", { x: 105, y: 254, size: 14, font: serif, color: colors.coffee });
  drawRight(page, formatEuro(amountDueNow), 530, 251, 21, serif, colors.coffee);

  const iban = readEnv("INVOICE_IBAN") || readEnv("BANK_IBAN");
  const holder = readEnv("BANK_ACCOUNT_HOLDER") || businessName;
  const reference = booking.deposit_payment_reference || invoice.invoice_number;
  drawCard(page, 42, 88, 247, 134, colors.card, colors.line);
  drawCircleIcon(page, 66, 196, 12, colors);
  page.drawText("BETALINGSINFORMATIE", { x: 88, y: 193, size: 8.5, font: bold, color: colors.coffee });
  drawInfoLine(page, "Rekeninghouder", holder, 55, 168, 220, regular, bold, colors);
  drawInfoLine(page, "IBAN", iban || "Neem contact op", 55, 148, 220, regular, bold, colors);
  drawInfoLine(page, paidDeposit > 0 && booking.full_payment_method === "cash" ? "Contant voldoen" : "Nu overmaken", formatEuro(amountDueNow), 55, 128, 220, regular, bold, colors);
  drawInfoLine(page, "Betalingskenmerk", reference, 55, 108, 220, regular, bold, colors);
  const paymentInstruction = invoice.status === "Betaald"
    ? "Bedankt, deze factuur is volledig voldaan."
    : paidDeposit > 0 && booking.full_payment_method === "cash"
    ? `Resterend bedrag contant voldoen voor ${formatDate(booking.full_payment_due_date || invoice.due_at)}.`
    : openDeposit > 0
    ? `Alleen aanbetaling voor ${formatDate(booking.deposit_due_date)}. Daarna ${formatEuro(remainingAfterDeposit)} voor ${formatDate(booking.full_payment_due_date || invoice.due_at)}.`
    : `Graag uiterlijk ${dueAt} voldoen.`;
  page.drawText(paymentInstruction.slice(0, 78), { x: 55, y: 94, size: 7.2, font: serifItalic, color: colors.rose });

  drawCard(page, 306, 88, 247, 134, colors.card, colors.line);
  drawCircleIcon(page, 330, 196, 12, colors);
  page.drawText("BEDRIJFSGEGEVENS", { x: 352, y: 193, size: 8.5, font: bold, color: colors.coffee });
  const companyEmail = extractEmailAddress(readEnv("EMAIL_FROM_ADDRESS") || readEnv("EMAIL_FROM")) || "ddytuber@gmail.com";
  const companyLines = [
    businessName,
    `E-mail: ${companyEmail}`,
    "Instagram: @cuddlingmemories",
    "Website: cuddlingmemories.nl",
    readEnv("INVOICE_KVK") ? `KvK: ${readEnv("INVOICE_KVK")}` : "",
  ].filter(Boolean);
  companyLines.slice(0, 5).forEach((line, index) => page.drawText(String(line).slice(0, 48), { x: 320, y: 168 - index * 17, size: index === 0 ? 9 : 8, font: index === 0 ? bold : regular, color: index === 0 ? colors.coffee : colors.muted }));

  drawCentered(page, "Bedankt voor je vertrouwen in Cuddling Memories.", 62, 13, serifItalic, colors.rose);
  page.drawLine({ start: { x: 42, y: 45 }, end: { x: 553, y: 45 }, thickness: 0.55, color: colors.line });
  page.drawText("www.cuddlingmemories.nl", { x: 55, y: 27, size: 7.5, font: regular, color: colors.muted });
  drawRight(page, companyEmail, 540, 27, 7.5, regular, colors.muted);

  return pdf.save();
}

function drawCard(page: any, x: number, y: number, width: number, height: number, color: any, borderColor: any) {
  page.drawRectangle({ x, y, width, height, color, borderColor, borderWidth: 0.65 });
}

function drawCentered(page: any, text: string, y: number, size: number, font: any, color: any) {
  const value = String(text);
  page.drawText(value, { x: (595.28 - font.widthOfTextAtSize(value, size)) / 2, y, size, font, color });
}

function drawMetaBlock(page: any, x: number, y: number, width: number, label: string, value: string, icon: string, regular: any, bold: any, colors: any) {
  const center = x + width / 2;
  if (icon === "calendar") drawCalendarIcon(page, center, y + 49, colors);
  else drawDocumentIcon(page, center, y + 49, colors);
  const labelWidth = bold.widthOfTextAtSize(label, 7.2);
  page.drawText(label, { x: center - labelWidth / 2, y: y + 27, size: 7.2, font: bold, color: colors.coffee });
  const safeValue = String(value).slice(0, 28);
  const valueWidth = regular.widthOfTextAtSize(safeValue, 9.2);
  page.drawText(safeValue, { x: center - valueWidth / 2, y: y + 11, size: 9.2, font: regular, color: colors.coffee });
}

function drawInfoLine(page: any, label: string, value: unknown, x: number, y: number, width: number, regular: any, bold: any, colors: any) {
  page.drawText(`${label}:`, { x, y, size: 7.6, font: bold, color: colors.coffee });
  const labelWidth = Math.max(76, bold.widthOfTextAtSize(`${label}:`, 7.6) + 10);
  const safeValue = String(value || "-").slice(0, 46);
  page.drawText(safeValue, { x: x + labelWidth, y, size: 7.8, font: regular, color: colors.muted });
  page.drawLine({ start: { x, y: y - 7 }, end: { x: x + width, y: y - 7 }, thickness: 0.35, color: colors.line });
}

function drawInvoiceRow(page: any, y: number, title: string, detail: string, amount: string, regular: any, bold: any, colors: any) {
  drawCircleIcon(page, 75, y + 4, 10, colors);
  page.drawText(title, { x: 112, y: y + 4, size: 8.6, font: bold, color: colors.coffee });
  page.drawText(String(detail).slice(0, 58), { x: 112, y: y - 9, size: 7.7, font: regular, color: colors.muted });
  drawRight(page, amount, 535, y - 2, 10.2, regular, colors.coffee);
  page.drawLine({ start: { x: 42, y: y - 20 }, end: { x: 553, y: y - 20 }, thickness: 0.35, color: colors.line });
}

function drawCircleIcon(page: any, x: number, y: number, radius: number, colors: any) {
  page.drawEllipse({ x, y, xScale: radius, yScale: radius, color: colors.blush, borderColor: colors.line, borderWidth: 0.5 });
  page.drawEllipse({ x, y, xScale: radius * 0.35, yScale: radius * 0.35, borderColor: colors.cocoa, borderWidth: 0.65 });
}

function drawCalendarIcon(page: any, x: number, y: number, colors: any) {
  page.drawRectangle({ x: x - 7, y: y - 7, width: 14, height: 14, borderColor: colors.cocoa, borderWidth: 0.75 });
  page.drawLine({ start: { x: x - 7, y: y + 2 }, end: { x: x + 7, y: y + 2 }, thickness: 0.6, color: colors.cocoa });
  page.drawLine({ start: { x: x - 4, y: y + 5 }, end: { x: x - 4, y: y + 9 }, thickness: 0.8, color: colors.cocoa });
  page.drawLine({ start: { x: x + 4, y: y + 5 }, end: { x: x + 4, y: y + 9 }, thickness: 0.8, color: colors.cocoa });
}

function drawDocumentIcon(page: any, x: number, y: number, colors: any) {
  page.drawRectangle({ x: x - 6, y: y - 8, width: 12, height: 16, borderColor: colors.rose, borderWidth: 0.75 });
  [-3, 0, 3].forEach((offset) => page.drawLine({ start: { x: x - 3, y: y + offset }, end: { x: x + 3, y: y + offset }, thickness: 0.45, color: colors.rose }));
}

function drawHeart(page: any, x: number, y: number, size: number, color: any) {
  const path = "M 0 2 C 0 7 -8 9 -8 2 C -8 -3 -2 -5 0 -1 C 2 -5 8 -3 8 2 C 8 9 0 14 0 14 C 0 14 -8 9 -8 2";
  page.drawSvgPath(path, { x, y: y - size * 0.55, scale: size / 14, borderColor: color, borderWidth: 1.1 });
}

function drawBotanical(page: any, x: number, y: number, scale: number, colors: any, mirror: boolean) {
  const direction = mirror ? -1 : 1;
  page.drawLine({ start: { x, y }, end: { x: x - 54 * direction * scale, y: y - 72 * scale }, thickness: 0.55, color: colors.line });
  for (let index = 0; index < 6; index += 1) {
    const stemX = x - (9 + index * 8) * direction * scale;
    const stemY = y - (12 + index * 10) * scale;
    page.drawLine({ start: { x: stemX, y: stemY }, end: { x: stemX - 14 * direction * scale, y: stemY + 8 * scale }, thickness: 0.45, color: colors.line });
    page.drawEllipse({ x: stemX - 17 * direction * scale, y: stemY + 9 * scale, xScale: 5 * scale, yScale: 2.5 * scale, color: colors.blush, borderColor: colors.line, borderWidth: 0.3 });
  }
}

function drawRight(page: any, text: unknown, rightX: number, y: number, size: number, font: any, color: any) {
  const value = String(text ?? "");
  const width = font.widthOfTextAtSize(value, size);
  page.drawText(value, { x: rightX - width, y, size, font, color });
}

function parseInvoiceMeta(value: unknown) {
  try {
    const parsed = JSON.parse(String(value || "{}"));
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function numberOr(value: unknown, fallback: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number(fallback || 0);
}

function formatEuro(value: unknown) {
  return `EUR ${numberOr(value, 0).toFixed(2).replace(".", ",")}`;
}

function formatDate(value: string) {
  if (!value) return "-";
  const [year, month, day] = String(value).slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year.slice(-2)}` : "-";
}

function safeFileName(value: string) {
  return String(value).replace(/[^a-zA-Z0-9_-]/g, "-");
}

export const config = { path: "/api/client-invoice" };

function extractEmailAddress(value: string) {
  const match = String(value || "").match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match?.[0] || "";
}
