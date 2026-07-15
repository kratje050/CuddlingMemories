export const giftcardStatuses = ["Nieuw", "Wacht op betaling", "Betaald", "Verzonden", "Gebruikt", "Verlopen", "Geannuleerd"];

export const giftcardTypes = [
  "Vrij bedrag",
  "Portretshoot",
  "Cakesmash",
  "Zwangerschapsshoot",
  "Gezinsshoot",
  "Newbornshoot",
  "Bevalling",
  "Mini-shoot",
];

export const deliveryMethods = ["Digitaal per e-mail", "Later afstemmen"];

export function createGiftcardCode() {
  const part = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `CM-${part}`;
}

// Live check of een code geldig/inwisselbaar is, zonder 'm te verzilveren
// (dat gebeurt pas server-side bij het echt versturen van de boeking, via
// book_slot()). Gebruikt in de boekingswizard voor directe feedback.
const GIFTCARD_CHECK_MESSAGES = {
  GIFTCARD_INVALID: "Deze code is niet bekend. Controleer de spelling.",
  GIFTCARD_NOT_REDEEMABLE: "Deze cadeaubon is nog niet betaald of al gebruikt/geannuleerd.",
  GIFTCARD_EXPIRED: "Deze cadeaubon is verlopen.",
};

export async function checkGiftcardCode(code, supabase) {
  const { data, error } = await supabase.rpc("check_giftcard_code", { p_code: code });
  if (error) {
    return { valid: false, message: "Code controleren is niet gelukt. Probeer het opnieuw." };
  }
  if (!data?.valid) {
    return { valid: false, message: GIFTCARD_CHECK_MESSAGES[data?.reason] || "Deze code is niet geldig." };
  }
  return { valid: true, giftcardType: data.giftcard_type, amount: data.amount };
}
