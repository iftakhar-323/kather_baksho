import { useEffect, useState } from "react";
import { getReminders, completeReminder } from "../api/notifications";
import { useTranslation } from "../i18n/I18nProvider";
import PageHeader from "../components/PageHeader";

const TYPE_ICON = {
  watering: "💧",
  fertilizer: "🌱",
  repotting: "🪴",
};

export default function Reminders({ embedded = false }) {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await getReminders();
      setItems(data || []);
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markDone = async (id) => {
    try {
      await completeReminder(id);
      setDone(id);
      // refresh list to drop the completed one and surface the next occurrence
      setTimeout(() => {
        setDone(null);
        load();
      }, 800);
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className={embedded ? "" : "page-shell"}>
      {!embedded && (
        <PageHeader title={t("reminders.head")} sub={t("reminders.subhead")} />
      )}

      {loading && <div className="empty">{t("reminders.loading")}</div>}
      {error && <div className="warning">{error}</div>}
      {!loading && !error && items.length === 0 && (
        <div className="empty">
          <div className="emoji">🌵</div>
          <h3>{t("reminders.noTasksHeading")}</h3>
          <p>{t("reminders.noTasksBody")}</p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="card list-flush">
          {items.map((r) => {
            const overdue = r.next_due_date < today;
            const dueSoon =
              !overdue &&
              new Date(r.next_due_date) - new Date(today) < 3 * 24 * 3600 * 1000;
            return (
              <div key={r.id} className="list-row">
                <div className={"list-row-icon" + (overdue ? " is-alert" : "")}>
                  {TYPE_ICON[r.type] || "🌿"}
                </div>

                <div className="list-row-main">
                  <div className="list-row-title">
                    {r.product?.name || t("reminders.plantFallback")}
                  </div>
                  <div className="list-row-sub">
                    {(r.type?.[0].toUpperCase() + r.type?.slice(1)) || ""} •{" "}
                    {t("reminders.taskEveryDays", { n: r.interval_days })}
                  </div>
                </div>

                <span
                  className={
                    "status-pill " +
                    (overdue
                      ? "status-cancelled"
                      : dueSoon
                      ? "status-processing"
                      : "status-delivered")
                  }
                >
                  {overdue
                    ? t("reminders.overdue")
                    : dueSoon
                    ? t("reminders.dueSoon")
                    : t("reminders.upcoming")}
                </span>

                <div className="list-row-when">{r.next_due_date}</div>

                <button
                  className={"btn btn-sm " + (done === r.id ? "btn-primary" : "btn-secondary")}
                  onClick={() => markDone(r.id)}
                  disabled={done === r.id}
                >
                  {done === r.id ? t("reminders.doneTag") : t("reminders.markDone")}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}