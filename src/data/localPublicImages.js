const images = {
  "/images/portfolio/portret/portret-01-5332f06b5575-1600.webp": {
    width: 1600, height: 2400,
    srcSet: "/images/portfolio/portret/portret-01-5332f06b5575-480.webp 480w, /images/portfolio/portret/portret-01-5332f06b5575-960.webp 960w, /images/portfolio/portret/portret-01-5332f06b5575-1600.webp 1600w",
  },
  "/images/portfolio/zwangerschap/zwangerschap-buik-5256a5b3dc57-1600.webp": {
    width: 1600, height: 2400,
    srcSet: "/images/portfolio/zwangerschap/zwangerschap-buik-5256a5b3dc57-480.webp 480w, /images/portfolio/zwangerschap/zwangerschap-buik-5256a5b3dc57-960.webp 960w, /images/portfolio/zwangerschap/zwangerschap-buik-5256a5b3dc57-1600.webp 1600w",
  },
  "/images/portfolio/cakesmash/cakesmash-01-1e7f21dd3936-1600.webp": {
    width: 1600, height: 2400,
    srcSet: "/images/portfolio/cakesmash/cakesmash-01-1e7f21dd3936-480.webp 480w, /images/portfolio/cakesmash/cakesmash-01-1e7f21dd3936-960.webp 960w, /images/portfolio/cakesmash/cakesmash-01-1e7f21dd3936-1600.webp 1600w",
  },
  "/images/portfolio/cakesmash/cakesmash-02-f931a695e212-1600.webp": {
    width: 1600, height: 2400,
    srcSet: "/images/portfolio/cakesmash/cakesmash-02-f931a695e212-480.webp 480w, /images/portfolio/cakesmash/cakesmash-02-f931a695e212-960.webp 960w, /images/portfolio/cakesmash/cakesmash-02-f931a695e212-1600.webp 1600w",
  },
  "/images/portfolio/bevalling/bevalling-01-b9a242dd9d78-1600.webp": {
    width: 1600, height: 2400,
    srcSet: "/images/portfolio/bevalling/bevalling-01-b9a242dd9d78-480.webp 480w, /images/portfolio/bevalling/bevalling-01-b9a242dd9d78-960.webp 960w, /images/portfolio/bevalling/bevalling-01-b9a242dd9d78-1600.webp 1600w",
  },
  "/images/portfolio/bevalling/bevalling-02-ea82361cb3b5-1600.webp": {
    width: 1600, height: 2400,
    srcSet: "/images/portfolio/bevalling/bevalling-02-ea82361cb3b5-480.webp 480w, /images/portfolio/bevalling/bevalling-02-ea82361cb3b5-960.webp 960w, /images/portfolio/bevalling/bevalling-02-ea82361cb3b5-1600.webp 1600w",
  },
  "/images/home/herinnering-7d395cb82685-1440.webp": {
    width: 1440, height: 1920,
    srcSet: "/images/home/herinnering-7d395cb82685-480.webp 480w, /images/home/herinnering-7d395cb82685-960.webp 960w, /images/home/herinnering-7d395cb82685-1440.webp 1440w",
  },
};

const aliases = {
  "cuddling-memories-portret-portret-portret-20260711-01-450a9bbf.jpg": "/images/portfolio/portret/portret-01-5332f06b5575-1600.webp",
  "1783705533468-0-IMG_9628.jpeg": "/images/portfolio/zwangerschap/zwangerschap-buik-5256a5b3dc57-1600.webp",
  "1783615360285-IMG_1233.jpeg": "/images/portfolio/cakesmash/cakesmash-01-1e7f21dd3936-1600.webp",
  "1783615469223-IMG_1320.jpeg": "/images/portfolio/cakesmash/cakesmash-02-f931a695e212-1600.webp",
  "cuddling-memories-bevalling-bevalling-bevalling-20260711-01-e6fb97f3.jpg": "/images/portfolio/bevalling/bevalling-01-b9a242dd9d78-1600.webp",
  "cuddling-memories-bevalling-bevalling-bevalling-20260711-02-fc73db3a.jpg": "/images/portfolio/bevalling/bevalling-02-ea82361cb3b5-1600.webp",
  "memory_image_main-1783628906622-instagram-11.jpg": "/images/home/herinnering-7d395cb82685-1440.webp",
};

export function resolvePublicImageUrl(value) {
  const original = String(value || "");
  const filename = original.split("?")[0].split("/").pop();
  return aliases[filename] || value;
}

export function getLocalImageMetadata(value) {
  return images[resolvePublicImageUrl(value)] || null;
}
