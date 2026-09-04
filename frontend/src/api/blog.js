import API from "./axios";

// GET /api/blog?category=&search=&page=1  → { posts, page, pages }
export const getBlogPosts = (params = {}) => API.get("/blog", { params });

// GET /api/blog/:slug
export const getBlogPost = (slug) => API.get(`/blog/${slug}`);

// POST /api/blog  (admin)
export const createBlogPost = (payload) => API.post("/blog", payload);

// DELETE /api/blog/by-id/:id  (admin)
export const deleteBlogPost = (id) => API.delete(`/blog/by-id/${id}`);

// The backend has no blog-comment endpoint yet.
export const addBlogComment = () =>
  Promise.reject(new Error("Comments are coming soon."));

// The backend has no categories endpoint — derive the list from the posts.
export const getBlogCategories = async () => {
  const { data } = await API.get("/blog", { params: { page_size: 100 } });
  const posts = Array.isArray(data) ? data : data?.posts || data?.items || [];
  const seen = new Map();
  for (const p of posts) {
    const c = (p.category || "").trim();
    if (c && !seen.has(c.toLowerCase())) seen.set(c.toLowerCase(), { slug: c, name: c });
  }
  return { data: { categories: [...seen.values()] } };
};
