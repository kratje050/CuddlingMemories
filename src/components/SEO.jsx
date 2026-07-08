import { useEffect } from "react";

const keywords =
  "fotograaf Groningen, fotograaf Friesland, fotograaf Zoutkamp, zwangerschapsfotografie, newbornfotografie, cakesmash fotografie, gezinsfotografie, portretfotografie, motherhood fotografie, buiten fotoshoot";

export default function SEO({ title, description }) {
  useEffect(() => {
    document.title = `${title} | Cuddling Memories Fotografie`;

    const upsert = (name, content) => {
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", name);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };

    upsert("description", description);
    upsert("keywords", keywords);
  }, [title, description]);

  return null;
}
