// Product imagery helpers — 100% offline, no external services.
//
// A product's `image_url` may hold one URL or several (comma / newline /
// whitespace separated). When none are set we synthesise a designed SVG
// placeholder so the catalogue still looks like a real store instead of a
// wall of bare emoji.

const EMOJI = {
  plant: "🌿", // 🌿
  decor: "🪴", // 🪴
  care: "🧴", // 🧴
};

// Two-stop gradient + accent per top-level category.
const PALETTE = {
  plant: { a: "#e6f6ea", b: "#8ecfa4", accent: "#2f8f5b" },
  decor: { a: "#f6ece0", b: "#d8b892", accent: "#a9743f" },
  care: { a: "#e4f1f4", b: "#93c9d2", accent: "#3f8b98" },
  default: { a: "#eef1f4", b: "#b9c4cf", accent: "#5b6b7b" },
};

export function emojiFor(category) {
  return EMOJI[category] || "🌱"; // 🌱
}

// Small deterministic string hash so the same product always renders the
// same placeholder (stable across reloads, no layout shift).
function hash(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

// Returns a `data:` URI for an SVG placeholder tuned to the category, with a
// per-product hue rotation for visual variety across a grid.
export function placeholderFor(category, seed = "") {
  const p = PALETTE[category] || PALETTE.default;
  const emoji = emojiFor(category);
  const rot = (hash(seed) % 24) - 12; // -12..+11 deg
  const cx = 30 + (hash(seed + "x") % 40); // highlight position 30..69
  const cy = 24 + (hash(seed + "y") % 34);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
<defs>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="${p.a}"/>
<stop offset="1" stop-color="${p.b}"/>
</linearGradient>
<radialGradient id="h" cx="${cx}%" cy="${cy}%" r="60%">
<stop offset="0" stop-color="#ffffff" stop-opacity="0.65"/>
<stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
</radialGradient>
</defs>
<rect width="600" height="600" fill="url(#g)"/>
<rect width="600" height="600" fill="url(#h)"/>
<circle cx="300" cy="300" r="180" fill="#ffffff" fill-opacity="0.28"/>
<text x="300" y="300" font-size="240" text-anchor="middle" dominant-baseline="central"
 transform="rotate(${rot} 300 300)">${emoji}</text>
<text x="300" y="540" font-size="26" letter-spacing="6" text-anchor="middle"
 fill="${p.accent}" fill-opacity="0.55" font-family="system-ui, sans-serif">KATHERBOX</text>
</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// Normalises whatever is in `product.image_url` into a clean list of image
// sources. Always returns at least one entry (a placeholder when empty).
export function productImages(product) {
  if (!product) return [];
  const raw = String(product.image_url || "")
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (raw.length) return raw;
  return [placeholderFor(product.category, product.name || product.slug || "")];
}

// True when the product has at least one real (non-placeholder) photo.
export function hasRealImage(product) {
  return Boolean(String(product?.image_url || "").trim());
}
