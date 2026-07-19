export const discountTypes = ["percentage", "vast_bedrag"];

export function createDiscountCode() {
  const part = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `KORTING-${part}`;
}

export function formatDiscountValue(discountType, discountValue) {
  const value = Number(discountValue || 0);
  return discountType === "percentage" ? `${value}%` : `€${value.toFixed(2)}`;
}

// Live check of een code geldig/bruikbaar is, zonder 'm te verzilveren (dat
// gebeurt pas server-side bij het echt versturen van de boeking, via
// book_slot()). Gebruikt in de boekingswizard voor directe feedback.
const DISCOUNT_CHECK_MESSAGES = {
  DISCOUNT_INVALID: "Deze code is niet bekend. Controleer de spelling.",
  DISCOUNT_NOT_ACTIVE: "Deze kortingscode is niet meer actief.",
  DISCOUNT_EXPIRED: "Deze kortingscode is verlopen.",
  DISCOUNT_LIMIT_REACHED: "Deze kortingscode is al het maximaal aantal keer gebruikt.",
};

export async function checkDiscountCode(code, supabase) {
  const { data, error } = await supabase.rpc("check_discount_code", { p_code: code });
  if (error) {
    return { valid: false, message: "Code controleren is niet gelukt. Probeer het opnieuw." };
  }
  if (!data?.valid) {
    return { valid: false, message: DISCOUNT_CHECK_MESSAGES[data?.reason] || "Deze code is niet geldig." };
  }
  return { valid: true, discountType: data.discount_type, discountValue: data.discount_value };
}
