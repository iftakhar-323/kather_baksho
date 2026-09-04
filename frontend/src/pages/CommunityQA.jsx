import { useEffect, useState } from "react";
import {
  getQuestions,
  askQuestion,
  answerQuestion,
  upvoteAnswer,
  getLeaderboard,
} from "../api/communityExt";
// names above match the actual API module
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { useTranslation } from "../i18n/I18nProvider";
import PageHeader from "../components/PageHeader";
import Segmented from "../components/Segmented";

function fmtDate(s) {
  if (!s) return "";
  try {
    return new Date(s).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return "";
  }
}

export default function CommunityQA({ embedded = false }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const [questions, setQuestions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("qa");
  const [askOpen, setAskOpen] = useState(false);
  const [qTitle, setQTitle] = useState("");
  const [qBody, setQBody] = useState("");
  const [qProductId, setQProductId] = useState("");
  const [qTags, setQTags] = useState("");
  const [activeQ, setActiveQ] = useState(null);
  const [aBody, setABody] = useState("");

  const loadAll = () => {
    setLoading(true);
    Promise.all([getQuestions(), getLeaderboard("points")])
      .then(([q, l]) => {
        const qs = q.data?.questions || q.data?.items || [];
        setQuestions(qs);
        setLeaderboard(l.data?.leaderboard || l.data?.items || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadAll();
  }, []);

  const onAsk = async (e) => {
    e.preventDefault();
    if (!qTitle.trim()) return;
    try {
      await askQuestion({
        title: qTitle.trim(),
        body: qBody.trim(),
        product_id: qProductId ? Number(qProductId) : null,
        tags: qTags
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
      });
      toast.ok(t("community.qa.questionPosted"));
      setQTitle("");
      setQBody("");
      setQProductId("");
      setQTags("");
      setAskOpen(false);
      loadAll();
    } catch (e) {
      toast.err(e?.response?.data?.error || e.message);
    }
  };

  const onAnswer = async (e) => {
    e.preventDefault();
    if (!aBody.trim() || !activeQ) return;
    try {
      await answerQuestion(activeQ.id, aBody.trim());
      toast.ok(t("community.qa.answerPosted"));
      setABody("");
      const r = await getQuestions();
      const updated = (r.data?.questions || r.data?.items || []).find(
        (q) => q.id === activeQ.id
      );
      if (updated) setActiveQ(updated);
    } catch (e) {
      toast.err(e?.response?.data?.error || e.message);
    }
  };

  const onUpvote = async (aid) => {
    try {
      await upvoteAnswer(aid);
      const r = await getQuestions();
      const updated = (r.data?.questions || r.data?.items || []).find(
        (q) => q.id === activeQ.id
      );
      if (updated) setActiveQ(updated);
    } catch (e) {
      toast.err(e?.response?.data?.error || e.message);
    }
  };

  return (
    <div className={embedded ? "" : "page-shell is-wide"}>
      {!embedded && (
        <PageHeader title={t("community.qa.heading")} sub={t("community.qa.subhead")} />
      )}

      <div className="row gap-8 mb-16 row-wrap">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "qa", label: t("community.qa.tabQuestions") },
            { value: "leaderboard", label: t("community.qa.tabLeaderboard") },
          ]}
        />
        {user && tab === "qa" && (
          <>
            <span className="spacer" />
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setAskOpen((s) => !s)}
            >
              {askOpen ? t("community.qa.cancel") : t("community.qa.askOpen")}
            </button>
          </>
        )}
      </div>

      {askOpen && (
        <form onSubmit={onAsk} className="card card-pad-lg mb-16">
          <h3 className="mt-0">{t("community.qa.askTitle")}</h3>
          <input
            className="input"
            placeholder={t("community.qa.titlePlaceholder")}
            value={qTitle}
            onChange={(e) => setQTitle(e.target.value)}
            required
          />
          <textarea
            className="textarea mt-8"
            rows={4}
            placeholder={t("community.qa.bodyPlaceholder")}
            value={qBody}
            onChange={(e) => setQBody(e.target.value)}
          />
          <div className="row mt-8 gap-8 row-wrap">
            <input
              className="input qa-product-input"
              placeholder={t("community.qa.productIdPlaceholder")}
              value={qProductId}
              onChange={(e) => setQProductId(e.target.value)}
              type="number"
            />
            <input
              className="input qa-tags-input"
              placeholder={t("community.qa.tagsPlaceholder")}
              value={qTags}
              onChange={(e) => setQTags(e.target.value)}
            />
          </div>
          <button className="btn btn-primary mt-8" type="submit">
            {t("community.qa.submitQuestion")}
          </button>
        </form>
      )}

      {tab === "qa" && (
        <div className="qa-layout">
          <div className="qa-list-col">
            {loading ? (
              <div className="empty">
                <div className="emoji">⏳</div>
                <h3>{t("community.qa.loading")}</h3>
              </div>
            ) : questions.length === 0 ? (
              <div className="empty">
                <div className="emoji">💭</div>
                <h3>{t("community.qa.noQuestionsHeading")}</h3>
                <p className="muted">{t("community.qa.noQuestionsBody")}</p>
              </div>
            ) : (
              <div className="stack gap-8">
                {questions.map((q) => (
                  <div
                    key={q.id}
                    className="card card-pad card-clickable qa-question-card"
                    onClick={() => setActiveQ(q)}
                  >
                    <h4 className="qa-question-title">{q.title}</h4>
                    <div className="row muted qa-question-meta">

                      <span>
                        {t("community.qa.by", {
                          name: q.author_name || t("community.qa.anonymous"),
                        })}
                      </span>
                      <span>·</span>
                      <span>{fmtDate(q.created_at)}</span>
                      {q.product_id && (
                        <>
                          <span>·</span>
                          <span>
                            {t("community.qa.productRef", {
                              id: q.product_id,
                            })}
                          </span>
                        </>
                      )}
                      {q.status && q.status !== "open" && (
                        <span className="tag tag-success">{q.status}</span>
                      )}
                    </div>
                    {(q.tags || []).length > 0 && (
                      <div className="row gap-4 mt-8 row-wrap">
                        {q.tags.map((tg) => (
                          <span key={tg} className="tag">#{tg}</span>
                        ))}
                      </div>
                    )}
                    <div className="muted qa-question-answers">
                      {(q.answer_count || 0) === 1
                        ? t("community.qa.answerCount", {
                            count: q.answer_count || 0,
                          })
                        : t("community.qa.answerCountPlural", {
                            count: q.answer_count || 0,
                          })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="qa-detail-col">
            {activeQ ? (
              <div className="card card-pad-lg qa-detail">
                <button
                  className="btn btn-ghost btn-xs"
                  onClick={() => setActiveQ(null)}
                >
                  {t("community.qa.backToList")}
                </button>
                <h3 className="qa-detail-title">{activeQ.title}</h3>
                {activeQ.body && <p className="qa-detail-body">{activeQ.body}</p>}
                <h4 className="mt-16">
                  {t("community.qa.answersHeading", {
                    count: (activeQ.answers || []).length,
                  })}
                </h4>
                {(activeQ.answers || []).length === 0 && (
                  <p className="muted">{t("community.qa.noAnswers")}</p>
                )}
                {(activeQ.answers || []).map((a) => (
                  <div key={a.id} className="card card-pad qa-answer">
                    <p className="qa-answer-body">{a.body}</p>
                    <div className="row mt-8 qa-answer-meta">
                      <span className="muted">
                        {t("community.qa.answerAuthor", {
                          name: a.author_name || t("community.qa.anonymous"),
                        })}{" "}
                        · {fmtDate(a.created_at)}
                      </span>
                      <span className="spacer" />
                      <button
                        className="btn btn-ghost btn-xs"
                        onClick={() => onUpvote(a.id)}
                      >
                        ▲ {a.upvotes || 0}
                      </button>
                    </div>
                  </div>
                ))}
                {user && (
                  <form onSubmit={onAnswer} className="mt-8">
                    <textarea
                      className="input"
                      rows={3}
                      placeholder={t("community.qa.answerPlaceholder")}
                      value={aBody}
                      onChange={(e) => setABody(e.target.value)}
                      style={{ resize: "vertical" }}
                    />
                    <button
                      className="btn btn-primary btn-sm mt-8"
                      disabled={!aBody.trim()}
                    >
                      {t("community.qa.postAnswer")}
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <div className="card card-pad-lg muted">
                <h4 style={{ marginTop: 0 }}>
                  {t("community.qa.topHelpersTitle")}
                </h4>
                {(leaderboard || []).slice(0, 5).map((u, i) => (
                  <div key={u.user_id || i} className="row qa-mini-lb-row">
                    <span className="qa-mini-lb-rank">#{i + 1}</span>
                    <span className="qa-mini-lb-name">
                      {u.name || t("community.qa.anonymous")}
                    </span>
                    <strong>
                      {t("community.qa.pts", { n: u.points || 0 })}
                    </strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "leaderboard" && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th className="qa-rank-col">{t("community.qa.rank")}</th>
                <th>{t("community.qa.helper")}</th>
                <th>{t("community.qa.points")}</th>
                <th>{t("community.qa.answers")}</th>
              </tr>
            </thead>
            <tbody>
              {(leaderboard || []).map((u, i) => (
                <tr key={u.user_id || i}>
                  <td>
                    <strong className={i < 3 ? "text-accent" : undefined}>
                      #{i + 1}
                    </strong>
                  </td>
                  <td>{u.name || t("community.qa.anonymous")}</td>
                  <td>{u.points || 0}</td>
                  <td>{u.answer_count || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
