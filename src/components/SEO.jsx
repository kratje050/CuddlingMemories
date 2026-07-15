import { useEffect } from "react";

const keywords =
  "fotograaf Groningen, fotograaf Friesland, fotograaf Zoutkamp, zwangerschapsfotografie, newbornfotografie, cakesmash fotografie, gezinsfotografie, portretfotografie, motherhood fotografie, buiten fotoshoot";

const defaultImage = "/images/home/moeder-met-kind-1200.webp";

export default function SEO({ title, description, image = defaultImage }) {
  useEffect(() => {
    const fullTitle = `${title} | Cuddling Memories Fotografie`;
    const origin = window.location.origin;
    const url = `${origin}${window.location.pathname}`;
    const absoluteImage = image.startsWith("http") ? image : `${origin}${image}`;

    document.title = fullTitle;

    const upsertMeta = (attr, key, content) => {
      let tag = document.querySelector(`meta[${attr}="${key}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(attr, key);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };

    const upsertLink = (rel, href) => {
      let tag = document.querySelector(`link[rel="${rel}"]`);
      if (!tag) {
        tag = document.createElement("link");
        tag.setAttribute("rel", rel);
        document.head.appendChild(tag);
      }
      tag.setAttribute("href", href);
    };

    upsertMeta("name", "description", description);
    upsertMeta("name", "keywords", keywords);
    upsertLink("canonical", url);

    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:image", absoluteImage);
    upsertMeta("property", "og:locale", "nl_NL");
    upsertMeta("property", "og:site_name", "Cuddling Memories Fotografie");

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", fullTitle);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", absoluteImage);
  }, [title, description, image]);

  return null;
}
