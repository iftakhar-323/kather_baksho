import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  listPosts,
  createPost,
  listComments,
  addComment,
  toggleLike,
  deletePost,
} from "../api/community";
import { useTranslation } from "../i18n/I18nProvider";
import { useConfirm } from "../components/Confirm";
import PageHeader from "../components/PageHeader";
import Segmented from "../components/Segmented";
import CommunityQA from "./CommunityQA";

const CATS = ["show-off", "tip", "question", "story"];

export default function Community() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const confirm = useConfirm();
  const [posts, setPosts] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("story");
  const [imageUrl, setImageUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [commentsByPost, setCommentsByPost] = useState({});
  const [draftComments, setDraftComments] = useState({});
  const [catFilter, setCatFilter] = useState("");
  const [mainTab, setMainTab] = useState("feed");

  const reload = () => {
    listPosts()
      .then((r) => setPosts(r.data || []))
      .catch(() => setPosts([]));
  };
  useEffect(() => { reload(); }, []);

  const submitPost = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await createPost({ title, body, image_url: imageUrl, category });
      setTitle("");
      setBody("");
      setImageUrl("");
      setCategory("story");
      setShowNew(false);
      reload();
    } catch (err) {
      setError(err?.response?.data?.error || err.message);
    } finally {
      setBusy(false);
    }
  };

  const openPost = (p) => {
    const same = expanded === p.id;
    setExpanded(same ? null : p.id);
    if (!same && !commentsByPost[p.id]) {
      listComments(p.id).then((r) => {
        setCommentsByPost((m) => ({ ...m, [p.id]: r.data || [] }));
      });
    }
  };

  const submitComment = async (postId) => {
    const text = (draftComments[postId] || "").trim();
    if (!text) return;
    try {
      const res = await addComment(postId, text);
      setCommentsByPost((m) => ({
        ...m,
        [postId]: [...(m[postId] || []), res.data],
      }));
      setDraftComments((d) => ({ ...d, [postId]: "" }));
    } catch (err) {
      setError(err?.response?.data?.error || err.message);
    }
  };

  const like = async (postId) => {
    try {
      await toggleLike(postId);
      reload();
    } catch {
      /* ignore */
    }
  };

  const remove = async (postId) => {
    const ok = await confirm({
      title: "Delete post",
      body: t("community.feed.deleteConfirm"),
      confirmText: "Delete",
      danger: true,
    });
    if (!ok) return;
    await deletePost(postId);
    reload();
  };

  const filtered = catFilter
    ? posts.filter((p) => p.category === catFilter)
    : posts;

  const catLabel = (slug) => {
    const key = "community.cats." + slug;
    return t(key) !== key ? t(key) : slug;
  };

  return (
    <div className="page-shell is-wide">
      <Segmented
        className="mb-16"
        value={mainTab}
        onChange={setMainTab}
        options={[
          { value: "feed", label: t("community.feed.heading") },
          { value: "qa", label: t("community.qa.heading") },
        ]}
      />

      {mainTab === "qa" && <CommunityQA embedded />}

      {mainTab === "feed" && (
      <>
      <PageHeader
        title={t("community.feed.heading")}
        sub={t("community.feed.subhead")}
        actions={
          user && (
            <button className="btn btn-primary" onClick={() => setShowNew((s) => !s)}>
              {showNew ? t("community.feed.close") : t("community.feed.newPostOpen")}
            </button>
          )
        }
      />

      {error && <div className="warning">{error}</div>}

      {showNew && (
        <div className="card card-pad mb-16">
          <h3 className="mt-0">{t("community.feed.newPostTitle")}</h3>
          <form className="auth-form" onSubmit={submitPost}>
            <div>
              <label className="field-label">
                {t("community.feed.fieldCategory")}
              </label>
              <select
                className="select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATS.map((c) => (
                  <option key={c} value={c}>
                    {catLabel(c)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">
                {t("community.feed.fieldTitle")}
              </label>
              <input
                className="input"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">
                {t("community.feed.fieldBody")}
              </label>
              <textarea
                className="textarea"
                required
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">
                {t("community.feed.fieldImage")}
              </label>
              <input
                className="input"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder={t("community.feed.imagePlaceholder")}
              />
            </div>
            <button type="submit" disabled={busy} className="btn btn-primary">
              {busy ? t("community.feed.posting") : t("community.feed.post")}
            </button>
          </form>
        </div>
      )}

      <div className="chip-row">
        <button
          className={"chip" + (!catFilter ? " is-active" : "")}
          onClick={() => setCatFilter("")}
        >
          {t("community.feed.all")}
        </button>
        {CATS.map((c) => (
          <button
            key={c}
            className={"chip" + (catFilter === c ? " is-active" : "")}
            onClick={() => setCatFilter(c)}
          >
            {catLabel(c)}
          </button>
        ))}
      </div>

      {!user && (
        <div className="empty">
          <div className="emoji">🔒</div>
          <h3>{t("community.feed.loginToJoin")}</h3>
          <p>{t("community.feed.loginBody")}</p>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="empty">
          <div className="emoji">📭</div>
          <h3>{t("community.feed.noPostsHeading")}</h3>
          <p>{t("community.feed.noPostsBody")}</p>
        </div>
      )}

      {filtered.map((p) => {
        const isOpen = expanded === p.id;
        const comments = commentsByPost[p.id] || [];
        return (
          <div key={p.id} className="card post-card">
            <div className="post-card-body">
              <div className="row-between post-card-head">
                <div className="post-card-headline" onClick={() => openPost(p)}>
                  <div className="muted post-card-meta">
                    {catLabel(p.category)} {t("community.feed.by", {
                      name: p.author || t("community.feed.anonymous"),
                    })}{" "}
                    •{" "}
                    {new Date(p.created_at).toLocaleDateString()}
                  </div>
                  <div className="post-card-title">{p.title}</div>
                </div>
                {(user?.id === p.user_id || user?.role === "admin") && (
                  <button
                    onClick={() => remove(p.id)}
                    className="btn btn-ghost btn-sm"
                  >
                    🗑
                  </button>
                )}
              </div>

              {p.image_url && (
                <img
                  src={p.image_url}
                  alt=""
                  className="post-card-img"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}

              <div className="post-card-text">{p.body}</div>

              {p.like_count > 0 && p.liked_by_names?.length > 0 && (
                <div className="post-card-likedby">
                  <strong>Liked by:</strong> {p.liked_by_names.join(", ")}
                </div>
              )}

              <div className="row gap-12" style={{ alignItems: "center" }}>
                <button
                  className={
                    "btn btn-sm " +
                    (p.liked_by_me ? "btn-primary" : "btn-secondary")
                  }
                  onClick={() => like(p.id)}
                  title={p.liked_by_names?.length > 0 ? "Liked by: " + p.liked_by_names.join(", ") : ""}
                >
                  {p.liked_by_me ? "♥" : "♡"} {p.like_count}
                </button>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => openPost(p)}
                >
                  💬 {p.comment_count}{" "}
                  {isOpen
                    ? t("community.feed.commentsHide")
                    : t("community.feed.commentsOpen")}
                </button>
              </div>
            </div>

            {isOpen && (
              <div className="post-card-comments">
                {comments.length === 0 && (
                  <p className="muted mt-12">{t("community.feed.noComments")}</p>
                )}
                {comments.map((c) => (
                  <div key={c.id} className="post-comment">
                    <div className="post-comment-author">
                      {c.author || t("community.feed.anonymous")}
                    </div>
                    <div className="post-comment-body">{c.body}</div>
                  </div>
                ))}
                {user && (
                  <div className="row gap-8 mt-12">
                    <input
                      className="input post-comment-input"
                      placeholder={t("community.feed.writeCommentPlaceholder")}
                      value={draftComments[p.id] || ""}
                      onChange={(e) =>
                        setDraftComments((d) => ({
                          ...d,
                          [p.id]: e.target.value,
                        }))
                      }
                    />
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => submitComment(p.id)}
                    >
                      {t("community.feed.send")}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      </>
      )}
    </div>
  );
}