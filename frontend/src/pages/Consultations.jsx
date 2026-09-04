import { useEffect, useState } from "react";
import {
  listExperts,
  bookConsultation,
  getMyConsultations,
  cancelConsultation,
} from "../api/consultations";
import { useTranslation } from "../i18n/I18nProvider";
import { useConfirm } from "../components/Confirm";
import PageHeader from "../components/PageHeader";

export default function Consultations() {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const [experts, setExperts] = useState([]);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [active, setActive] = useState(null);
  const [topic, setTopic] = useState("");
  const [when, setWhen] = useState("");
  const [notes, setNotes] = useState("");

  const loadAll = () => {
    setLoading(true);
    Promise.all([listExperts(), getMyConsultations()])
      .then(([e, l]) => {
        setExperts(e.data || []);
        setList(l.data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err?.response?.data?.error || err.message);
        setLoading(false);
      });
  };
  useEffect(() => { loadAll(); }, []);

  const book = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");
    try {
      await bookConsultation({
        expert_name: active.name,
        topic,
        scheduled_at: when,
        notes,
      });
      setMsg(t("consultations.bookedToast", { name: active.name, when: when }));
      setActive(null);
      setTopic("");
      setWhen("");
      setNotes("");
      getMyConsultations().then((r) => setList(r.data || []));
    } catch (err) {
      setError(err?.response?.data?.error || err.message);
    }
  };

  const cancel = async (c) => {
    const ok = await confirm({
      title: "Cancel consultation",
      body: t("consultations.cancelConfirm"),
      confirmText: "Cancel booking",
      danger: true,
    });
    if (!ok) return;
    await cancelConsultation(c.ID);
    loadAll();
  };

  return (
    <div className="page-shell is-wide">
      <PageHeader title={t("consultations.head")} sub={t("consultations.subhead")} />

      {msg && <div className="notice">{msg}</div>}
      {error && <div className="warning">{error}</div>}

      <section className="section">
        <h2>{t("consultations.expertsHeading")}</h2>
      {loading && <div className="empty">…</div>}
      <div className="product-grid">
        {experts.map((e) => (
          <div key={e.name} className="product-card">
            <div className="image"><span className="consult-expert-emoji">👩‍🌾</span></div>
            <div className="body">
              <h3>{e.name}</h3>
              <p className="desc">{e.specialty}</p>
              <div className="row" style={{ alignItems: "center" }}>
                <span className="price">৳{e.rate}</span>
                <span className="muted consult-rate-note">{t("consultations.perSession")}</span>
              </div>
              <button onClick={() => setActive(e)} className="btn btn-primary btn-block mt-8">
                {t("consultations.bookBtn")}
              </button>
            </div>
          </div>
        ))}
      </div>
      </section>

      {active && (
        <div className="modal-backdrop" onClick={() => setActive(null)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={book}>
            <h3>{t("consultations.modalTitle", { name: active.name })}</h3>
            <p className="muted">{active.specialty}</p>
            <div className="auth-form">
              <div>
                <label className="field-label">{t("consultations.fieldTopic")}</label>
                <input
                  className="input"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={t("consultations.topicPlaceholder")}
                />
              </div>
              <div>
                <label className="field-label">{t("consultations.fieldWhen")}</label>
                <input
                  className="input"
                  type="datetime-local"
                  required
                  value={when}
                  onChange={(e) => setWhen(e.target.value)}
                />
              </div>
              <div>
                <label className="field-label">{t("consultations.fieldNotes")}</label>
                <textarea
                  className="textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("consultations.notesPlaceholder")}
                />
              </div>
              <div className="row mt-8">
                <button type="button" onClick={() => setActive(null)} className="btn btn-ghost">
                  {t("consultations.cancelBtn")}
                </button>
                <span className="spacer" />
                <button type="submit" className="btn btn-primary">{t("consultations.confirmBtn")}</button>
              </div>
            </div>
          </form>
        </div>
      )}

      <section className="section">
        <h2>{t("consultations.yourBookingsHeading")}</h2>
        {list.length === 0 && !loading && (
          <div className="empty">
            <div className="emoji">📅</div>
            <h3>{t("consultations.noBookingsHeading")}</h3>
          </div>
        )}
        {list.length > 0 && (
          <div className="card list-flush">
            {list.map((c) => (
              <div key={c.ID} className="list-row">
                <div className="list-row-icon">📅</div>
                <div className="list-row-main">
                  <div className="list-row-title">{c.expert_name}</div>
                  <div className="list-row-sub">{c.topic}</div>
                </div>
                <span className={"status-pill " + (c.status === "cancelled" ? "status-cancelled" : "status-delivered")}>
                  {c.status}
                </span>
                <div className="list-row-when">{c.scheduled_at?.replace("T", " ")}</div>
                {c.status !== "cancelled" && (
                  <button onClick={() => cancel(c)} className="btn btn-danger btn-sm">
                    {t("consultations.cancelBtnRow")}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}