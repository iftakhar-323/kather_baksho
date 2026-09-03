import { useState } from "react";
import { productThumb } from "../utils/productImage";

// Renders a real product photo when a usable `src` is given and loads
// successfully; otherwise falls back to a designed, product-tuned SVG
// illustration (a drawn planter, never a bare emoji in a box).
//
// `emoji` is still accepted for backwards compatibility and only nudges the
// category guess when `category` isn't passed.
export default function ProductImage({
  src,
  emoji,
  category,
  subcategory,
  seed = "",
  alt = "",
  className = "",
}) {
  const [failed, setFailed] = useState(false);

  const cat =
    category ||
    (emoji === "🪴" ? "decor" : emoji === "🧴" ? "care" : "plant");

  const resolved =
    !src || failed
      ? productThumb({ category: cat, subcategory, name: seed || alt })
      : src;

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
