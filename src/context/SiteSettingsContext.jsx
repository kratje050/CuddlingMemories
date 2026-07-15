import { createContext, useContext, useEffect, useState } from "react";
import { getSiteSettings } from "../lib/api.js";

const defaults = {
  site_name: "Cuddling Memories Fotografie",
  logo_text: "Cuddling Memories",
  subtitle: "Fotografie",
  primary_email: "",
  instagram_url: "https://www.instagram.com/cuddlingmemories/",
  facebook_url: "https://www.facebook.com/profile.php?id=61590264604841",
  hero_title: "Voor herinneringen die blijven",
  hero_subtitle: "Liefdevolle fotografie",
  portfolio_album_limit: 6,
  footer_text: "Liefdevolle, pure en tijdloze fotografie voor momenten die steeds waardevoller worden.",
  default_seo_title: "Cuddling Memories Fotografie",
  default_seo_description:
    "Cuddling Memories Fotografie voor zwangerschap, newborn, gezin, portret, cakesmash, motherhood en buiten fotoshoots in Groningen, Friesland en Zoutkamp.",
};

const SiteSettingsContext = createContext(defaults);

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaults);

  useEffect(() => {
    let active = true;
    getSiteSettings()
      .then((data) => {
        if (active && data) setSettings({ ...defaults, ...data });
      })
      .catch(() => {
        // Blijft bij de statische fallback-waarden als Supabase niet bereikbaar is.
      });
    return () => {
      active = false;
    };
  }, []);

  return <SiteSettingsContext.Provider value={settings}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
