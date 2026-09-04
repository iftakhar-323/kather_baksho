// Product imagery helpers — 100% offline, no external services.
//
// A product's `image_url` may hold one URL or several (comma / newline /
// whitespace separated). When none are set we synthesise a *drawn* SVG
// illustration — a planter with a plant whose shape, foliage, pot and
// backdrop are all derived from the product so every item in the catalogue
// looks distinct instead of a wall of identical emoji.

const EMOJI = { plant: "🌿", decor: "🪴", care: "🧴" };

// Per-category backdrop tint + accent.
const BACKDROP = {
  plant: { a: "#eaf6ee", b: "#cfe9d6" },
  decor: { a: "#f6ece0", b: "#ecdcc6" },
  care: { a: "#e6f1f4", b: "#d3e7ec" },
  default: { a: "#eef1f4", b: "#dde3ea" },
};

const FOLIAGE = ["#3f9e63", "#2f8f5b", "#4caf6a", "#5bb37a", "#2e7d4f", "#6bbf7f", "#48a06a"];
const POTS = [
  ["#c8763e", "#a95d2c"], // terracotta
  ["#7d8a99", "#5c6875"], // stone grey
  ["#d9c4a3", "#bda27c"], // sand
  ["#3f6f5a", "#2d5343"], // glazed green
  ["#b9564e", "#8f3f38"], // clay red
  ["#e0dbd0", "#c3bdae"], // cream
  ["#4a5d7a", "#354561"], // slate blue
];
const BLOOM_COLORS = ["#e5687f", "#f2b134", "#ef7d9d", "#f4a63c", "#c86fb0", "#e8734a"];

function hash(str = "") {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}
const pick = (arr, n) => arr[n % arr.length];

export function emojiFor(category) {
  return EMOJI[category] || "🌱";
}

// Which plant silhouette to draw. Subcategory gives a strong hint; otherwise
// the hash decides so a "plant" grid still has variety.
function formFor(product, h) {
  const sub = String(product?.subcategory || "").toLowerCase();
  const cat = String(product?.category || "").toLowerCase();
  const name = String(product?.name || "").toLowerCase();
  if (sub === "plant_box" || /\bbox\b/.test(name)) return "giftbox";
  if (/cact|succulent/.test(sub) || /cactus|aloe|echeveria|haworthia|jade/.test(name)) {
    return h % 2 ? "cactus" : "succulent";
  }
  if (/flower|rose|hibiscus|orchid|bougain|marigold|lily|tulip|jasmine/.test(sub + name)) return "flowering";
  if (/pothos|ivy|pearls|trailing|philodendron|hanging/.test(name)) return "trailing";
  if (/snake|sansevieria|zz |bamboo|blade/.test(name)) return "blades";
  if (/palm|areca|fern/.test(name)) return "palm";
  if (/monstera|rubber|fiddle|calathea|maranta|anthurium|aglaonema/.test(name)) return "broadleaf";
  if (cat === "care" || /soil|fertiliz|compost|perlite|vermiculite|mix|meal|salt|neem|spray|oil|tonic|food|hormone|fungicide|insecticid/.test(sub + name)) {
    if (/spray|oil|tonic|liquid|food|mist|fungicide|insecticid|transpirant|seal/.test(name)) return "care-bottle";
    if (/soil|mix|compost|perlite|vermiculite|coir|meal|cake|earth|manure/.test(name)) return "care-bag";
    if (/kit|box|set|bundle/.test(name)) return "care-box";
    if (/powder|salt|strip|meter|test|hormone/.test(name)) return "care-tub";
    return h % 2 ? "care-bottle" : "care-bag";
  }
  if (cat === "decor") return h % 2 ? "pot-only" : "broadleaf";
  const forms = ["broadleaf", "blades", "bushy", "flowering", "succulent", "palm", "trailing"];
  return pick(forms, h);
}

// ---- SVG piece builders (all return raw markup strings) ----

function potSvg(colors, style) {
  const [c1, c2] = colors;
  const rim = `<rect x="150" y="300" width="200" height="26" rx="8" fill="${c2}"/>`;
  let body;
  if (style === 0) {
    body = `<path d="M162 326 L338 326 L318 452 Q316 470 298 470 L202 470 Q184 470 182 452 Z" fill="${c1}"/>`;
  } else if (style === 1) {
    body = `<path d="M168 326 L332 326 L332 452 Q332 472 312 472 L188 472 Q168 472 168 452 Z" fill="${c1}"/>`;
  } else {
    body = `<path d="M172 326 L328 326 L322 430 Q320 486 250 486 Q180 486 178 430 Z" fill="${c1}"/>`;
  }
  const shade = `<path d="M250 326 L338 326 L318 452 Q316 470 298 470 L250 470 Z" fill="#000" fill-opacity="0.1"/>`;
  return rim + body + shade;
}

function soil() {
  return `<ellipse cx="250" cy="326" rx="88" ry="12" fill="#4b3623"/>`;
}

function leaf(cx, cy, len, wide, rot, fill, curve = 0) {
  return `<path transform="rotate(${rot} ${cx} ${cy})"
    d="M${cx} ${cy} C ${cx - wide} ${cy - len * 0.4 + curve}, ${cx - wide * 0.5} ${cy - len}, ${cx} ${cy - len}
       C ${cx + wide * 0.5} ${cy - len}, ${cx + wide} ${cy - len * 0.4 - curve}, ${cx} ${cy} Z"
    fill="${fill}"/>
    <line transform="rotate(${rot} ${cx} ${cy})" x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - len}"
       stroke="#000" stroke-opacity="0.12" stroke-width="2"/>`;
}

function plantSvg(form, h, foliage) {
  const f2 = pick(FOLIAGE, h + 3);
  switch (form) {
    case "blades": {
      let s = "";
      const n = 5 + (h % 4);
      for (let i = 0; i < n; i++) {
        const rot = -34 + (i * 68) / (n - 1);
        s += leaf(250, 320, 210 + ((i * 37) % 60), 26, rot, i % 2 ? foliage : f2);
      }
      return s;
    }
    case "broadleaf": {
      let s = "";
      const n = 5 + (h % 3);
      for (let i = 0; i < n; i++) {
        const rot = -60 + (i * 120) / (n - 1);
        s += leaf(250, 322, 120 + ((i * 53) % 40), 62, rot, i % 2 ? foliage : f2, 12);
      }
      return s;
    }
    case "palm": {
      let s = "";
      for (let i = 0; i < 7; i++) {
        const rot = -75 + i * 25;
        s += leaf(250, 322, 175, 20, rot, i % 2 ? foliage : f2);
      }
      return s;
    }
    case "trailing": {
      let s = leaf(250, 316, 70, 40, 0, foliage, 8);
      for (const dir of [-1, 1]) {
        for (let i = 0; i < 6; i++) {
          const x = 250 + dir * (26 + i * 22);
          const y = 300 + i * 30 + (i % 2) * 8;
          s += `<circle cx="${x}" cy="${y}" r="${13 - i}" fill="${i % 2 ? foliage : f2}"/>`;
        }
      }
      return s;
    }
    case "succulent": {
      let s = "";
      for (let ring = 0; ring < 3; ring++) {
        const r = 70 - ring * 22;
        const cnt = 8 - ring * 2;
        for (let i = 0; i < cnt; i++) {
          const rot = (i * 360) / cnt + ring * 15;
          s += leaf(250, 318, r, 20, rot, ring % 2 ? foliage : f2);
        }
      }
      return s;
    }
    case "cactus": {
      const bodyH = 150 + (h % 60);
      return `
        <rect x="228" y="${322 - bodyH}" width="44" height="${bodyH}" rx="22" fill="${foliage}"/>
        <rect x="196" y="${322 - bodyH * 0.55}" width="30" height="70" rx="15" fill="${foliage}"/>
        <rect x="196" y="${322 - bodyH * 0.55 - 40}" width="30" height="46" rx="15" fill="${foliage}"/>
        <rect x="274" y="${322 - bodyH * 0.7}" width="30" height="90" rx="15" fill="${f2}"/>
        <rect x="274" y="${322 - bodyH * 0.7 - 44}" width="30" height="52" rx="15" fill="${f2}"/>`;
    }
    case "flowering": {
      let s = "";
      const stems = 4 + (h % 3);
      for (let i = 0; i < stems; i++) {
        const rot = -40 + (i * 80) / (stems - 1);
        const len = 150 + ((i * 41) % 50);
        const rad = (rot * Math.PI) / 180;
        const tx = 250 + Math.sin(rad) * len;
        const ty = 322 - Math.cos(rad) * len;
        const bloom = pick(BLOOM_COLORS, h + i);
        s += `<line x1="250" y1="322" x2="${tx.toFixed(0)}" y2="${ty.toFixed(0)}" stroke="${foliage}" stroke-width="7" stroke-linecap="round"/>`;
        s += `<circle cx="${tx.toFixed(0)}" cy="${ty.toFixed(0)}" r="20" fill="${bloom}"/>`;
        s += `<circle cx="${tx.toFixed(0)}" cy="${ty.toFixed(0)}" r="8" fill="#ffe9a8"/>`;
      }
      return s;
    }
    case "care":
    case "care-bottle": {
      const capW = 40 + (h % 3) * 8;
      return `
        <rect x="${250 - capW / 2}" y="118" width="${capW}" height="34" rx="6" fill="${f2}"/>
        <rect x="234" y="150" width="32" height="26" fill="${f2}"/>
        <path d="M198 176 Q198 200 210 214 L210 400 Q210 420 230 420 L270 420 Q290 420 290 400 L290 214 Q302 200 302 176 Z" fill="${foliage}"/>
        <rect x="214" y="250" width="72" height="96" rx="6" fill="#fff" fill-opacity="0.9"/>
        <line x1="226" y1="272" x2="274" y2="272" stroke="${foliage}" stroke-opacity="0.5" stroke-width="5" stroke-linecap="round"/>
        <line x1="226" y1="292" x2="274" y2="292" stroke="${foliage}" stroke-opacity="0.35" stroke-width="5" stroke-linecap="round"/>
        <line x1="226" y1="312" x2="258" y2="312" stroke="${foliage}" stroke-opacity="0.35" stroke-width="5" stroke-linecap="round"/>`;
    }
    case "care-bag": {
      const lean = (h % 5) - 2;
      return `
        <path d="M170 180 L330 180 L316 200 L184 200 Z" fill="${f2}"/>
        <path d="M182 200 L318 200 Q330 200 330 214 L${322 + lean} 418 Q320 440 296 440 L204 440 Q180 440 178 418 L${170 + lean} 214 Q170 200 182 200 Z" fill="${foliage}"/>
        <rect x="206" y="252" width="88" height="104" rx="6" fill="#fff" fill-opacity="0.9"/>
        <circle cx="250" cy="292" r="20" fill="${foliage}" fill-opacity="0.5"/>
        <path d="M250 300 q-14 -22 0 -40 q14 18 0 40" fill="${foliage}" fill-opacity="0.6"/>`;
    }
    case "care-box": {
      return `
        <path d="M160 214 L250 180 L340 214 L250 250 Z" fill="${f2}"/>
        <path d="M160 214 L250 250 L250 430 L160 392 Z" fill="${foliage}"/>
        <path d="M340 214 L250 250 L250 430 L340 392 Z" fill="${foliage}" fill-opacity="0.82"/>
        <path d="M250 250 L250 430 M205 232 L205 411" stroke="#000" stroke-opacity="0.08" stroke-width="4"/>
        <rect x="196" y="300" width="70" height="54" rx="5" fill="#fff" fill-opacity="0.9" transform="skewY(11)"/>`;
    }
    case "care-tub": {
      return `
        <ellipse cx="250" cy="196" rx="76" ry="18" fill="${f2}"/>
        <path d="M174 196 L174 388 Q174 410 250 410 Q326 410 326 388 L326 196" fill="${foliage}"/>
        <ellipse cx="250" cy="196" rx="76" ry="18" fill="#000" fill-opacity="0.12"/>
        <ellipse cx="250" cy="188" rx="64" ry="14" fill="${f2}"/>
        <rect x="210" y="258" width="80" height="86" rx="6" fill="#fff" fill-opacity="0.9"/>`;
    }
    case "giftbox": {
      const ribbon = pick(BLOOM_COLORS, h + 1);
      const lidTilt = (h % 5) - 2;
      return `
        <rect x="162" y="230" width="176" height="180" rx="10" fill="${foliage}"/>
        <rect x="162" y="230" width="176" height="180" rx="10" fill="#000" fill-opacity="0.05"/>
        <rect x="150" y="${196 + lidTilt}" width="200" height="52" rx="10" fill="${f2}"/>
        <rect x="234" y="196" width="32" height="214" fill="${ribbon}" fill-opacity="0.92"/>
        <rect x="150" y="212" width="200" height="26" fill="${ribbon}" fill-opacity="0.92"/>
        <path d="M250 196 Q218 150 196 176 Q188 200 250 208 Q312 200 304 176 Q282 150 250 196 Z" fill="${ribbon}"/>
        <path d="M196 300 q-14 -30 4 -48 M214 300 q-6 -34 14 -46 M232 298 q4 -30 22 -34" stroke="#fff" stroke-opacity="0.35" stroke-width="5" fill="none" stroke-linecap="round"/>
        <circle cx="210" cy="264" r="12" fill="#fff" fill-opacity="0.25"/>
        <circle cx="292" cy="286" r="10" fill="#fff" fill-opacity="0.22"/>`;
    }
    case "pot-only":
      return "";
    case "bushy":
    default: {
      let s = "";
      for (let i = 0; i < 14; i++) {
        const a = (i * 360) / 14;
        const rad = (a * Math.PI) / 180;
        const r = 74 + ((i * 29) % 26);
        s += `<circle cx="${(250 + Math.cos(rad) * r).toFixed(0)}" cy="${(300 + Math.sin(rad) * r * 0.8).toFixed(0)}" r="30" fill="${i % 2 ? foliage : f2}"/>`;
      }
      s += `<circle cx="250" cy="292" r="46" fill="${foliage}"/>`;
      return s;
    }
  }
}

// Build one 500x500 SVG for a product. `variant` shifts the framing/backdrop
// so a product can have a small "gallery" of its own generated shots.
function buildSvg(product, variant = 0) {
  const seed = product?.name || product?.slug || "kb";
  const h = hash(seed + "::" + variant);
  const cat = product?.category || "plant";
  const bd = BACKDROP[cat] || BACKDROP.default;
  const foliage = pick(FOLIAGE, hash(seed));
  const potColors = pick(POTS, hash(seed + "pot"));
  const potStyle = hash(seed + "ps") % 3;
  const form = formFor(product, hash(seed + "form"));

  const rot = (h % 10) - 5;
  const scale = variant === 2 ? 1.28 : 1 + ((h % 5) - 2) * 0.03;
  const ty = variant === 1 ? 18 : 0;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="${bd.a}"/><stop offset="1" stop-color="${bd.b}"/>
</linearGradient>
</defs>
<rect width="500" height="500" fill="url(#bg)"/>
<circle cx="250" cy="230" r="150" fill="#fff" fill-opacity="0.35"/>
<ellipse cx="250" cy="474" rx="140" ry="20" fill="#000" fill-opacity="0.07"/>
<g transform="translate(0 ${ty}) rotate(${rot} 250 320) scale(${scale.toFixed(3)}) translate(${(250 - 250 * scale).toFixed(1)} ${(320 - 320 * scale).toFixed(1)})">
${plantSvg(form, h, foliage)}
${form.startsWith("care") || form === "giftbox" ? "" : soil()}
${form.startsWith("care") || form === "giftbox" ? "" : potSvg(potColors, potStyle)}
</g>
<text x="250" y="486" font-size="15" letter-spacing="5" text-anchor="middle"
 fill="#2f6543" fill-opacity="0.45" font-family="system-ui, sans-serif">KATHERBOX</text>
</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg.replace(/\n\s*/g, " "))}`;
}

// Public: a designed placeholder for a category + seed string.
// Kept for backwards compatibility with callers that pass (category, seed).
export function placeholderFor(category, seed = "") {
  return buildSvg({ category, name: seed }, 0);
}

// Normalise `product.image_url` into a clean list of sources. When the product
// has no real photo, returns three generated "shots" so the gallery has a
// thumbnail strip.
export function productImages(product) {
  if (!product) return [];
  const raw = String(product.image_url || "")
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (raw.length) return raw;
  return [buildSvg(product, 0), buildSvg(product, 1), buildSvg(product, 2)];
}

// A single representative image (for cards / lists).
export function productThumb(product) {
  const imgs = productImages(product);
  return imgs[0];
}

// True when the product has at least one real (non-generated) photo.
export function hasRealImage(product) {
  return Boolean(String(product?.image_url || "").trim());
}
