import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getAnonymousVisitorId, trackConversionEvent } from "../lib/conversionTracking.js";

const PRIVATE_PATH = /^\/(admin|galerij|klantportaal)(\/|$)/;

export default function VisitorTracker() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (PRIVATE_PATH.test(pathname)) return;
    try {
      if (pathname === "/pakketten") trackConversionEvent("packages_viewed", pathname);
      if (pathname === "/boek-een-shoot") trackConversionEvent("booking_opened", pathname);

      const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam" }).format(new Date());
      const sessionKey = `cm-visit-${today}`;
      if (sessionStorage.getItem(sessionKey)) return;

      const visitorId = getAnonymousVisitorId();
      sessionStorage.setItem(sessionKey, "1");

      fetch("/api/track-visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitor_id: visitorId, path: pathname }),
        keepalive: true,
      }).catch(() => null);
    } catch {
      // De website blijft zonder analytics volledig bruikbaar wanneer de
      // browser opslag heeft uitgeschakeld.
    }
  }, [pathname]);

  return null;
}
