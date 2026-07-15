export function getAnonymousVisitorId() {
  let visitorId = localStorage.getItem("cm-anonymous-visitor");
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem("cm-anonymous-visitor", visitorId);
  }
  return visitorId;
}

export function trackConversionEvent(event, path = window.location.pathname, eventData = {}) {
  try {
    const visitorId = getAnonymousVisitorId();
    fetch("/api/track-visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitor_id: visitorId, path, event, event_data: eventData }),
      keepalive: true,
    }).catch(() => null);
  } catch {
    // Analytics mag de website nooit blokkeren wanneer browseropslag uitstaat.
  }
}
