import API from "./axios";

// GET /api/products/
export const getProducts = (params = {}) => API.get("/products/", { params });

// GET /api/products/:id
export const getProduct = (id) => API.get(`/products/${id}`);

// GET /api/products/related/:id — curated related_ids, falls back to
// same-subcategory best sellers server-side if none are set.
export const getRelatedProducts = (id) => API.get(`/products/related/${id}`);

// GET /api/products/fbt/:id — curated fbt_ids ("frequently bought together").
export const getFrequentlyBoughtTogether = (id) => API.get(`/products/fbt/${id}`);

// ===== Gift recommendations =====
// GET /api/gifts/recommend?budget=2000&occasion=birthday&indoor=indoor
// Returns up to 8 ranked products with score + reason.
export const getGiftRecommendations = (params = {}) =>
  API.get("/gifts/recommend", { params });