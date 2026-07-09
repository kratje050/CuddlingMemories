export const giftcardStatuses = ["Nieuw", "Wacht op betaling", "Betaald", "Verzonden", "Gebruikt", "Verlopen", "Geannuleerd"];

export const giftcardTypes = [
  "Vrij bedrag",
  "Portretshoot",
  "Cakesmash",
  "Zwangerschapsshoot",
  "Gezinsshoot",
  "Newbornshoot",
  "Mini-shoot",
];

export const deliveryMethods = ["Digitaal per e-mail", "Later afstemmen"];

export function createGiftcardCode() {
  const part = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `CM-${part}`;
}
