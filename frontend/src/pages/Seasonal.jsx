import { useEffect, useState } from "react";
import { getSeasonalGuide } from "../api/seasonal";
import { useTranslation } from "../i18n/I18nProvider";
import PageHeader from "../components/PageHeader";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function Seasonal() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [active, setActive] = useState(() => MONTHS[new Date().getMonth()]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load all 12 months in one shot, then filter on the client.
  useEffect(() => {
    getSeasonalGuide()
      .then((res) => {
        setData(res.data.calendar || res.data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e?.response?.data?.error || e.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="empty">{t("seasonal.loading")}</div>;
  if (error) return <div className="empty"><p className="text-danger">{error}</p></div>;
  return (
    <div className="page-shell">
      <PageHeader title={t("seasonal.head")} sub={t("seasonal.subhead")} />

      <div className="tabs is-wrap">
        {MONTHS.map((m) => (
          <button
            key={m}
            className={"tab" + (m === active ? " is-active" : "")}
            onClick={() => setActive(m)}
          >
            {(t("seasonal.months." + m) !== "seasonal.months." + m
              ? t("seasonal.months." + m)
              : m
            ).slice(0, 3)}
          </button>
        ))}
      </div>

      <div className="card card-pad-lg mt-16">
        <h2 className="mt-0">
          {t("seasonal.months." + active) !== "seasonal.months." + active
            ? t("seasonal.months." + active)
            : active}
        </h2>
        {!data?.[active] ? (
          <p className="muted">{t("seasonal.noSuggestions")}</p>
        ) : (
          <div className="card-grid is-tight">
            {data[active].map((e, i) => (
              <div key={i} className="card card-pad seasonal-tile">
                <div className="seasonal-tile-icon">🌱</div>
                <h3 className="seasonal-tile-name">{e.name}</h3>
                <p className="muted seasonal-tile-why">{e.why}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}