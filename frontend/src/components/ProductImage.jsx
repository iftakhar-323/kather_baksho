import { useState } from "react";
import { placeholderFor } from "../utils/productImage";

// Renders a real product photo when a usable `src` is given and loads
// successfully; otherwise falls back to a designed, category-tuned SVG
// placeholder (never a bare emoji floating in a box).
//
// `emoji` is still accepted for backwards compatibility but is only used to
// pick the placeholder glyph when `category` isn't passed.
export default function ProductImage({
  src,
  emoji,
  category,
  seed = "",
  alt = "",
  className = "",
}) {
  const [failed, setFailed] = useState(false);

  const cat =
    category ||
    (emoji === "🪴" ? "decor" : emoji === "🧴" ? "care" : "plant");
  const resolved = !src || failed ? placeholderFor(cat, seed || alt) : src;

  return (
    <img
      src={resolved}
      alt={alt}
      className={`kb-pimg ${className}`.trim()}
      loading="lazy"
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}
