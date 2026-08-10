import { useTranslation } from "../i18n/I18nProvider";

const STATUS_FLOW = ["Pending", "Processing", "Packed", "On the Way", "Delivered"];
const STATUS_KEYS = {
  "Pending": "orders.placed",
  "Processing": "orders.paid",
  "Packed": "orders.shipped",
  "On the Way": "orders.outForDelivery",
  "Delivered": "orders.delivered",
  "Cancelled": "orders.cancelled",
  "Returned": "orders.returned",
  "Refunded": "orders.refunded",
};

export default function DeliveryTrack({ status, createdAt }) {
  const { t } = useTranslation();
  const idx = STATUS_FLOW.indexOf(status);
  const ok = idx >= 0;
  const est = new Date(createdAt);
  est.setDate(est.getDate() + 5);

  return (
    <div className="tracker">
      <div className="est">
        {t("orders.estimatedDelivery")}: <strong>{est.toLocaleDateString()}</strong>
      </div>
      <div className="steps">
        {STATUS_FLOW.map((s, i) => {
          const reached = ok && i <= idx;
          const active = ok && i === idx;
          const cls = active ? "dot active" : reached ? "dot done" : "dot";
          return (
            <div key={s} className="row" style={{ flex: 1, gap: 0 }}>
              <span className={cls}>{reached ? "✓" : i + 1}</span>
              {i < STATUS_FLOW.length - 1 && (
                <span
                  className={"bar" + (i < idx ? " done" : "")}
                  style={{ marginLeft: 0 }}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="labels">
        {STATUS_FLOW.map((s) => (
          <span key={s}>{t(STATUS_KEYS[s] || "orders.placed")}</span>
        ))}
      </div>
    </div>
  );
}
