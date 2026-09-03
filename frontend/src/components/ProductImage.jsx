import { useState } from "react";

// Renders a real product photo when product.image_url is set and loads
// successfully; falls back to the existing emoji glyph otherwise (covers
// products that were seeded/created without an image).
export default function ProductImage({ src, emoji, alt = "", className = "" }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <>{emoji}</>;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`kb-pimg ${className}`.trim()}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
