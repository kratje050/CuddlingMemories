import { useEffect, useState } from "react";
import { getPage } from "./api.js";

export function usePageMeta(slug, fallbackTitle, fallbackDescription) {
  const [meta, setMeta] = useState({ title: fallbackTitle, description: fallbackDescription });

  useEffect(() => {
    let active = true;
    getPage(slug)
      .then((page) => {
        if (!active || !page) return;
        setMeta({
          title: page.meta_title || fallbackTitle,
          description: page.meta_description || fallbackDescription,
        });
      })
      .catch(() => {
        // Blijft bij de statische fallback als Supabase niet bereikbaar is.
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  return meta;
}
