type SupabaseAdmin = {
  from: (table: string) => any;
};

type BookingForInvoice = {
  id?: string | null;
  package_id?: string | null;
  booking_date?: string | null;
  actual_shoot_date?: string | null;
  full_payment_due_mode?: "booking" | "before_shoot" | "after_shoot" | null;
  full_payment_due_date?: string | null;
  deposit_status?: string | null;
  shoot_type?: string | null;
  location?: string | null;
  budget?: number | string | null;
  model_discount?: boolean | null;
  discount_code?: string | null;
  discount_amount?: number | string | null;
  auto_invoice_disabled?: boolean | null;
  packages?: { title?: string | null; price?: number | string | null } | null;
};

export async function ensureAutomaticInvoice(supabase: SupabaseAdmin, booking: BookingForInvoice) {
  if (!booking?.id || !booking.package_id) return null;
  if (booking.auto_invoice_disabled) return null;
  if (booking.full_payment_due_mode === "after_shoot" && !booking.actual_shoot_date && booking.deposit_status !== "Betaald") return null;

  const issuedAt = dateInAmsterdam();
  const configuredDueAt = booking.full_payment_due_mode === "after_shoot" && !booking.actual_shoot_date
    ? null
    : booking.full_payment_due_date || booking.actual_shoot_date || booking.booking_date;
  const dueAt = configuredDueAt ? (configuredDueAt >= issuedAt ? configuredDueAt : issuedAt) : null;

  const { data: existing, error: existingError } = await supabase
    .from("invoices")
    .select("id,invoice_number,total_amount,amount_excl,vat_rate,vat_amount,due_at,status")
    .eq("booking_id", booking.id)
    .order("issued_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) {
    const dueDateChanged = existing.status !== "Betaald" && existing.due_at !== dueAt;
    if (Number(existing.vat_rate || 0) !== 0 || Number(existing.vat_amount || 0) !== 0 || Number(existing.amount_excl || 0) !== Number(existing.total_amount || 0) || dueDateChanged) {
      const { data: corrected, error: correctionError } = await supabase
        .from("invoices")
        .update({ amount_excl: existing.total_amount, vat_rate: 0, vat_amount: 0, ...(dueDateChanged ? { due_at: dueAt } : {}) })
        .eq("id", existing.id)
        .select("id,invoice_number")
        .single();
      if (correctionError) throw correctionError;
      return corrected;
    }
    return existing;
  }

  let packageRow = booking.packages || null;
  if (!packageRow?.title || packageRow.price == null) {
    const { data, error } = await supabase
      .from("packages")
      .select("title,price")
      .eq("id", booking.package_id)
      .maybeSingle();
    if (error) throw error;
    packageRow = data;
  }
  if (!packageRow || packageRow.price == null) return null;

  const { data: addonRows, error: addonError } = await supabase
    .from("booking_addons")
    .select("title_snapshot,price_snapshot")
    .eq("booking_id", booking.id)
    .order("created_at", { ascending: true });
  if (addonError) throw addonError;

  const { data: giftcard, error: giftcardError } = await supabase
    .from("giftcards")
    .select("code,amount")
    .eq("redeemed_booking_id", booking.id)
    .maybeSingle();
  if (giftcardError) throw giftcardError;

  const addonTotal = roundMoney((addonRows || []).reduce((sum: number, addon: Record<string, unknown>) => sum + Number(addon.price_snapshot || 0), 0));
  const packagePrice = booking.budget != null
    ? roundMoney(Math.max(0, Number(booking.budget || 0) - addonTotal))
    : roundMoney(Number(packageRow.price || 0) * (booking.model_discount ? 0.5 : 1));
  const subtotal = roundMoney(packagePrice + addonTotal);
  const giftcardAmount = roundMoney(Math.min(subtotal, Number(giftcard?.amount || 0)));
  const total = roundMoney(Math.max(0, subtotal - giftcardAmount));
  const amountExcl = total;
  const invoiceNumber = automaticInvoiceNumber(booking.id, issuedAt);
  const isPaid = total === 0;

  const payload = {
    booking_id: booking.id,
    invoice_number: invoiceNumber,
    title: packageRow.title || booking.shoot_type || "Fotoshoot",
    description: booking.full_payment_due_mode === "after_shoot" && !booking.actual_shoot_date
      ? `Fotoshootdatum volgens afspraak${booking.location ? ` - ${booking.location}` : ""}`
      : booking.actual_shoot_date || booking.booking_date
      ? `Fotoshoot op ${formatDate(booking.actual_shoot_date || booking.booking_date || "")}${booking.location ? ` - ${booking.location}` : ""}`
      : "Fotoshoot volgens afspraak",
    amount_excl: amountExcl,
    vat_rate: 0,
    vat_amount: 0,
    total_amount: total,
    issued_at: issuedAt,
    due_at: dueAt,
    status: isPaid ? "Betaald" : "Verzonden",
    paid_at: isPaid ? new Date().toISOString() : null,
    notes: JSON.stringify({
      automatic: true,
      package_title: packageRow.title || booking.shoot_type || "Fotoshoot",
      package_price: packagePrice,
      addons: (addonRows || []).map((addon: Record<string, unknown>) => ({ title: addon.title_snapshot, price: Number(addon.price_snapshot || 0) })),
      addon_total: addonTotal,
      giftcard_code: giftcard?.code || null,
      giftcard_amount: giftcardAmount,
      discount_code: booking.discount_code || null,
      discount_amount: booking.discount_amount == null ? 0 : Number(booking.discount_amount),
      full_payment_due_date: dueAt,
    }),
  };

  const { data: created, error: createError } = await supabase
    .from("invoices")
    .insert(payload)
    .select("id,invoice_number,title,total_amount")
    .single();

  // Een gelijktijdige portaal-load kan dezelfde deterministische factuur al
  // hebben aangemaakt. In dat geval gebruiken we simpelweg die bestaande rij.
  if (createError?.code === "23505") {
    const { data } = await supabase
      .from("invoices")
      .select("id,invoice_number")
      .eq("invoice_number", invoiceNumber)
      .maybeSingle();
    return data || null;
  }
  if (createError) throw createError;
  return created ? { ...created, created: true } : null;
}

function automaticInvoiceNumber(bookingId: string, issuedAt: string) {
  const year = issuedAt.slice(0, 4);
  const bookingPart = bookingId.replaceAll("-", "").slice(0, 8).toUpperCase();
  return `CM-${year}-${bookingPart}`;
}

function roundMoney(value: number) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function dateInAmsterdam() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Amsterdam",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year.slice(-2)}`;
}
