import { useEffect, useState } from "react";
import {
  getJournal,
  addJournalEntry,
  deleteJournalEntry,
  getSchedules,
  addSchedule,
  deleteSchedule,
  getCareCalendar,
} from "../api/care";
import { useToast } from "../components/Toast";
import { useTranslation } from "../i18n/I18nProvider";
import Reminders from "./Reminders";
import PageHeader from "../components/PageHeader";
import Segmented from "../components/Segmented";

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

const TASK_VALUES = ["water", "fertilize", "repot", "prune", "mist", "rotate"];

export default function Care() {
  const { t } = useTranslation();
  const toast = useToast();
  const [tab, setTab] = useState("dashboard");
  const [journal, setJournal] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [calendar, setCalendar] = useState([]);
  const [month, setMonth] = useState(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  );
  const [loading, setLoading] = useState(true);

  // journal form
  const [jProduct, setJProduct] = useState("");
  const [jNote, setJNote] = useState("");
  const [jPhoto, setJPhoto] = useState("🌿");
  const [jHeight, setJHeight] = useState("");

  // schedule form
  const [sProduct, setSProduct] = useState("");
  const [sType, setSType] = useState("water");
  const [sEvery, setSEvery] = useState(7);

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      getJournal(),
      getSchedules(),
      getCareCalendar(month),
    ])
      .then(([j, s, c]) => {
        const arr = (d, ...keys) =>
          Array.isArray(d) ? d : keys.map((k) => d?.[k]).find(Array.isArray) || [];
        setJournal(arr(j.data, "journal", "items"));
        setSchedules(arr(s.data, "schedules", "items"));
        setCalendar(arr(c.data, "calendar", "items"));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    getCareCalendar(month)
      .then((r) => setCalendar(Array.isArray(r.data) ? r.data : r.data?.calendar || r.data?.items || []))
      .catch(() => {});
  }, [month]);

  const onAddJournal = async (e) => {
    e.preventDefault();
    if (!jProduct || !jNote.trim()) return;
    try {
      await addJournalEntry({
        product_id: Number(jProduct),
        note: jNote.trim(),
        photo_emoji: jPhoto,
        height_cm: jHeight ? Number(jHeight) : null,
      });
      toast.ok(t("care.journal.added"));
      setJNote("");
      setJHeight("");
      loadAll();
    } catch (e) {
      toast.err(e?.response?.data?.error || e.message);
    }
  };

  const onAddSchedule = async (e) => {
    e.preventDefault();
    if (!sProduct) return;
    try {
      await addSchedule({
        product_id: Number(sProduct),
        task_type: sType,
        interval_days: Number(sEvery),
        next_run: new Date(Date.now() + Number(sEvery) * 86400000)
          .toISOString()
          .slice(0, 10),
      });
      toast.ok(t("care.schedules.created"));
      setSProduct("");
      loadAll();
    } catch (e) {
      toast.err(e?.response?.data?.error || e.message);
    }
  };

  const onDeleteJournal = async (id) => {
    try {
      await deleteJournalEntry(id);
      toast.ok(t("care.journal.deleted"));
      loadAll();
    } catch (e) {
      toast.err(e?.response?.data?.error || e.message);
    }
  };

  const onDeleteSchedule = async (id) => {
    try {
      await deleteSchedule(id);
      toast.ok(t("care.schedules.deleted"));
      loadAll();
    } catch (e) {
      toast.err(e?.response?.data?.error || e.message);
    }
  };

  const taskLabel = (value) => {
    const key = "care.tasks." + value;
    return t(key) !== key ? t(key) : value;
  };

  return (
    <div className="page-shell is-wide">
      <PageHeader
        title={t("care.dashboard.heading")}
        sub={t("care.dashboard.subhead")}
      />

      <Segmented
        className="mb-16"
        value={tab}
        onChange={setTab}
        options={[
          { value: "dashboard", label: t("care.dashboard.tabCalendar") },
          { value: "journal", label: t("care.dashboard.tabJournal") },
          { value: "schedules", label: t("care.dashboard.tabSchedules") },
          { value: "reminders", label: t("reminders.head") },
        ]}
      />

      {tab === "reminders" && <Reminders embedded />}

      {tab === "dashboard" && (
        <div>
          <div className="row mb-16 gap-8 row-wrap">
            <label className="muted">{t("care.dashboard.month")}</label>
            <input
              type="month"
              className="input care-month-input"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
            <span className="spacer" />
            <span className="muted">
              {(calendar || []).length === 1
                ? t("care.dashboard.taskCount", {
                    count: (calendar || []).length,
                  })
                : t("care.dashboard.taskCountPlural", {
                    count: (calendar || []).length,
                  })}
            </span>
          </div>
          <div className="card-grid is-tight">
            {(calendar || []).length === 0 && (
              <div className="empty care-empty-span">
                <div className="emoji">🌤</div>
                <h3>{t("care.dashboard.noTasksHeading")}</h3>
                <p className="muted">{t("care.dashboard.noTasksBody")}</p>
              </div>
            )}
            {(calendar || []).map((c, i) => {
              const label = taskLabel(c.task_type);
              return (
                <div key={i} className="card card-pad">
                  <div className="row">
                    <span className="entry-card-emoji">{label.split(" ")[0]}</span>
                    <span className="spacer" />
                    <span className="muted">{fmtDate(c.due_date)}</span>
                  </div>
                  <h4 className="care-task-name">
                    {c.product_name ||
                      t("care.dashboard.productFallback", { id: c.product_id })}
                  </h4>
                  <span className="tag tag-leaf">{label}</span>
                  {c.done && (
                    <span className="tag tag-success care-done-tag">
                      {t("care.dashboard.done")}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "journal" && (
        <div className="split-pane">
          <form onSubmit={onAddJournal} className="card card-pad-lg pane-form">
            <h3 className="mt-0">{t("care.journal.formTitle")}</h3>
            <label className="field-label">{t("care.journal.productId")}</label>
            <input
              className="input"
              type="number"
              value={jProduct}
              onChange={(e) => setJProduct(e.target.value)}
              required
            />
            <label className="field-label mt-8">{t("care.journal.note")}</label>
            <textarea
              className="textarea"
              rows={3}
              value={jNote}
              onChange={(e) => setJNote(e.target.value)}
              placeholder={t("care.journal.notePlaceholder")}
              required
            />
            <div className="row mt-8 gap-8">
              <div className="care-half">
                <label className="field-label">{t("care.journal.emoji")}</label>
                <input
                  className="input"
                  value={jPhoto}
                  onChange={(e) => setJPhoto(e.target.value)}
                  maxLength={4}
                />
              </div>
              <div className="care-half">
                <label className="field-label">{t("care.journal.heightCm")}</label>
                <input
                  className="input"
                  type="number"
                  value={jHeight}
                  onChange={(e) => setJHeight(e.target.value)}
                />
              </div>
            </div>
            <button className="btn btn-primary mt-8" type="submit">
              {t("care.journal.submit")}
            </button>
          </form>

          <div className="pane-list">
            {loading ? (
              <div className="empty">
                <div className="emoji">⏳</div>
                <h3>{t("care.journal.loading")}</h3>
              </div>
            ) : journal.length === 0 ? (
              <div className="empty">
                <div className="emoji">📓</div>
                <h3>{t("care.journal.empty")}</h3>
              </div>
            ) : (
              <div>
                {journal.map((j) => (
                  <div key={j.id} className="card card-pad entry-card">
                    <div className="row">
                      <span className="entry-card-emoji is-lg">{j.photo_emoji || "🌿"}</span>
                      <div className="entry-card-main">
                        <strong>
                          {j.product_name ||
                            t("care.dashboard.productFallback", {
                              id: j.product_id,
                            })}
                        </strong>
                        <div className="muted entry-card-meta">
                          {fmtDate(j.created_at)}
                          {j.height_cm
                            ? " · " +
                              t("care.journal.heightSuffix", {
                                cm: j.height_cm,
                              })
                            : ""}
                        </div>
                      </div>
                      <button
                        className="btn btn-ghost btn-xs"
                        onClick={() => onDeleteJournal(j.id)}
                      >
                        🗑
                      </button>
                    </div>
                    <p className="entry-card-note">{j.note}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "schedules" && (
        <div className="split-pane">
          <form onSubmit={onAddSchedule} className="card card-pad-lg pane-form">
            <h3 className="mt-0">{t("care.schedules.formTitle")}</h3>
            <label className="field-label">{t("care.schedules.productId")}</label>
            <input
              className="input"
              type="number"
              value={sProduct}
              onChange={(e) => setSProduct(e.target.value)}
              required
            />
            <label className="field-label mt-8">{t("care.schedules.task")}</label>
            <select
              className="select"
              value={sType}
              onChange={(e) => setSType(e.target.value)}
            >
              {TASK_VALUES.map((v) => (
                <option key={v} value={v}>
                  {taskLabel(v)}
                </option>
              ))}
            </select>
            <label className="field-label mt-8">
              {t("care.schedules.everyDays")}
            </label>
            <input
              className="input"
              type="number"
              min="1"
              value={sEvery}
              onChange={(e) => setSEvery(e.target.value)}
            />
            <button className="btn btn-primary mt-8" type="submit">
              {t("care.schedules.submit")}
            </button>
          </form>

          <div className="pane-list">
            {schedules.length === 0 ? (
              <div className="empty">
                <div className="emoji">⏰</div>
                <h3>{t("care.schedules.empty")}</h3>
              </div>
            ) : (
              <div>
                {schedules.map((s) => {
                  const label = taskLabel(s.task_type);
                  return (
                    <div key={s.id} className="card card-pad entry-card">
                      <div className="row">
                        <span className="entry-card-emoji">{label.split(" ")[0]}</span>
                        <div className="entry-card-main">
                          <strong>
                            {s.product_name ||
                              t("care.dashboard.productFallback", {
                                id: s.product_id,
                              })}
                          </strong>
                          <div className="muted entry-card-meta">
                            {s.interval_days === 1
                              ? t("care.schedules.everyDay", { n: s.interval_days })
                              : t("care.schedules.everyDays", { n: s.interval_days })}{" "}
                            · {t("care.schedules.next")} {fmtDate(s.next_due)}
                          </div>
                        </div>
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={() => onDeleteSchedule(s.id)}
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
