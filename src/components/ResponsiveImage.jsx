import { getLocalImageMetadata, resolvePublicImageUrl } from "../data/localPublicImages.js";

export default function ResponsiveImage({ src, alt, srcSet, width, height, sizes = "100vw", loading = "lazy", ...props }) {
  const resolvedSrc = resolvePublicImageUrl(src);
  const metadata = getLocalImageMetadata(resolvedSrc);
  const responsiveSrcSet = srcSet || metadata?.srcSet;
  return (
    <img
      {...props}
      src={resolvedSrc}
      srcSet={responsiveSrcSet}
      sizes={responsiveSrcSet ? sizes : undefined}
      width={width || metadata?.width}
      height={height || metadata?.height}
      alt={alt || "Foto van Cuddling Memories Fotografie"}
      loading={loading}
      decoding="async"
    />
  );
}
