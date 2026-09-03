// User avatar helpers — 100% offline, no external services (Gravatar, DiceBear…).
//
// Every user gets a distinct, deterministic avatar derived from their email
// (falling back to name): a two-tone gradient disc, a soft geometric accent,
// and the person's initials. Same input always renders the same avatar, so
// there's no flicker between renders and no network round-trip.

// Small deterministic string hash (djb2-ish), always non-negative.
function hash(str = "") {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) + h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

// Curated, legible palette pairs (bg gradient start/end). Text is always white.
const PALETTES = [
  ["#2f8f5b", "#1f6d43"], // forest
  ["#3f8b98", "#2c6570"], // teal
  ["#a9743f", "#7d5324"], // terracotta
  ["#5b6bbf", "#3f4c96"], // indigo
  ["#b0568a", "#883f68"], // plum
  ["#c0803a", "#96601f"], // amber
  ["#4c8a55", "#356a3d"], // leaf
  ["#7a5cc0", "#5a3f96"], // violet
  ["#3d7d9e", "#2a5a75"], // ocean
  ["#b8574e", "#8f3f38"], // clay
  ["#5f9a72", "#437253"], // sage
  ["#8a6d3b", "#665020"], // bronze
];

// Pull up to two initials out of a display name.
export function initialsFrom(name = "", email = "") {
  const src = String(name).trim() || String(email).split("@")[0] || "?";
  const parts = src.replace(/[^\p{L}\p{N} ._-]/gu, "").split(/[ ._-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Returns a `data:` URI SVG avatar. `seed` should be a stable id (email).
export function avatarFor(seed = "", label = "") {
  const key = String(seed || label || "anon").toLowerCase();
  const h = hash(key);
  const [c1, c2] = PALETTES[h % PALETTES.length];
  const initials = initialsFrom(label, seed);
  const rot = h % 360;
  const blobX = 20 + (hash(key + "x") % 60);
  const blobY = 18 + (hash(key + "y") % 50);
  const blobR = 26 + (hash(key + "r") % 22);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1" gradientTransform="rotate(${rot} .5 .5)">
<stop offset="0" stop-color="${c1}"/>
<stop offset="1" stop-color="${c2}"/>
</linearGradient>
</defs>
<rect width="160" height="160" fill="url(#bg)"/>
<circle cx="${blobX}%" cy="${blobY}%" r="${blobR}%" fill="#ffffff" fill-opacity="0.12"/>
<circle cx="${100 - blobX * 0.6}%" cy="${100 - blobY * 0.4}%" r="${blobR * 0.7}%" fill="#000000" fill-opacity="0.08"/>
<text x="80" y="86" font-size="62" font-weight="600" fill="#ffffff" text-anchor="middle"
 dominant-baseline="central" font-family="'Segoe UI', system-ui, -apple-system, sans-serif"
 letter-spacing="1">${initials}</text>
</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// Resolve the best avatar for a user-ish object ({avatar_url|avatarUrl, name, email}).
export function resolveAvatar(user) {
  if (!user) return avatarFor("anon");
  const explicit = user.avatar_url || user.avatarUrl;
  if (explicit && String(explicit).trim()) return String(explicit).trim();
  return avatarFor(user.email || user.user_email || user.name || "", user.name || user.user_name || "");
}
