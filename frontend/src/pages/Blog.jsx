import { useEffect, useState } from "react";
import { getBlogPosts, getBlogCategories } from "../api/blog";
import { useTranslation } from "../i18n/I18nProvider";
import PageHeader from "../components/PageHeader";
// real names used; backend returns { posts, total, page }

function prettyCat(c) {
  const s = String(c || "").replace(/[_-]+/g, " ").trim();
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

function fmtDate(s) {
  if (!s) return "";
  try {
    return new Date(s).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export default function Blog() {
  const { t } = useTranslation();
  const [posts, setPosts] = useState([]);
  const [cats, setCats] = useState([]);
  const [cat, setCat] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 9;

  useEffect(() => {
    getBlogCategories()
      .then((r) => setCats(r.data?.categories || r.data?.items || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    getBlogPosts({
      category: cat || undefined,
      search: search || undefined,
      page,
      page_size: pageSize,
    })
      .then((r) => {
        setPosts(r.data?.posts || r.data?.items || []);
        setTotal(r.data?.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [cat, search, page]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="page-shell is-wide">
      <PageHeader title={t("blog.head")} sub={t("blog.subhead")} />

      <div className="row gap-8 row-wrap mb-16">
        <input
          className="input blog-search"
          placeholder={t("blog.searchPlaceholder")}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <button
          className={"chip" + (cat === "" ? " is-active" : "")}
          onClick={() => {
            setCat("");
            setPage(1);
          }}
        >
          {t("blog.all")}
        </button>
        {cats.map((c) => (
          <button
            key={c.slug || c.id || c.name}
            className={"chip" + (cat === (c.slug || c.id) ? " is-active" : "")}
            onClick={() => {
              setCat(c.slug || c.id);
              setPage(1);
            }}
          >
            {prettyCat(c.name || c.slug)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="empty">
          <div className="emoji">⏳</div>
          <h3>{t("blog.loading")}</h3>
        </div>
      ) : posts.length === 0 ? (
        <div className="empty">
          <div className="emoji">📭</div>
          <h3>{t("blog.emptyHeading")}</h3>
          <p className="muted">{t("blog.emptyBody")}</p>
        </div>
      ) : (
        <div className="card-grid">
          {posts.map((p) => (
            <article
              key={p.ID || p.id || p.slug}
              className="card card-clickable blog-card"
              onClick={() => window.__katherboxSetView?.(`blog-${p.slug || p.ID || p.id}`)}
            >
              <div className="blog-card-cover">
                {p.cover_url ? (
                  <img
                    src={p.cover_url}
                    alt=""
                    className="blog-card-img"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                ) : (
                  p.cover_emoji || "🌿"
                )}
              </div>
              <div className="blog-card-body">
                {(p.category_name || p.category) && (
                  <span className="tag tag-leaf">{prettyCat(p.category_name || p.category)}</span>
                )}
                <h3 className="blog-card-title">{p.title}</h3>
                <p className="muted blog-card-excerpt">
                  {p.excerpt || p.body?.slice(0, 120)}
                </p>
                <div className="row muted blog-card-meta">
                  <span>{fmtDate(p.published_at || p.created_at)}</span>
                  <span>·</span>
                  <span>{t("blog.minRead", { n: p.read_min || 3 })}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="row row-center gap-8 mt-24">
          <button
            className="btn btn-secondary btn-sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            {t("blog.prev")}
          </button>
          <span className="muted">
            {t("blog.pageOf", { page, total: totalPages })}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            {t("blog.nextBtn")}
          </button>
        </div>
      )}
    </div>
  );
}
