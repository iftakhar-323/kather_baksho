import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getMyOrders } from "../api/orders";
import { addToCart } from "../api/cart";
import { useToast } from "../components/Toast";
import { useTranslation } from "../i18n/I18nProvider";
import DeliveryTrack from "../components/DeliveryTrack";
import { SkeletonCartList } from "../components/Skeleton";
import { notifyCartChanged } from "../context/CartContext";
import Invoice from "../components/Invoice";

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

// status → colour tone for the pill (all render white text on a solid fill)
const STATUS_TONE = {
  "Pending": "warn",
  "Processing": "info",
  "Packed": "info",
  "On the Way": "accent",
  "Delivered": "ok",
  "Cancelled": "danger",
  "Returned": "danger",
  "Refunded": "muted",
};

function fmtOrderDate(o) {
  const raw = o.CreatedAt || o.created_at || o.createdAt;
  const d = raw ? new Date(raw) : null;
  return d && !Number.isNaN(d.getTime())
    ? d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
    : "";
}

function emojiFor(category) {
  if (category === "plant") return "🌿";
  if (category === "care") return "🧴";
  return "🪵";
}

export default function Orders() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [reordering, setReordering] = useState(null);
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const toast = useToast();

  useEffect(() => {
    if (!user) return;
    getMyOrders()
      .then((res) => setOrders(res.data || []))
      .catch((err) => {
        console.error(err);
        setError(t("orders.loadFailed"));
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleReorder = async (order) => {
    if (!order.items || order.items.length === 0) return;
    setReordering(order.ID);
    try {
      // Re-add all items sequentially
      for (const item of order.items) {
        await addToCart(item.product_id, item.quantity);
      }
      notifyCartChanged();
      toast.ok("Items added to cart");
      window.__katherboxSetView?.("cart");
    } catch {
      toast.err("Could not reorder all items. Some may be out of stock.");
    } finally {
      setReordering(null);
    }
  };

  if (!user) {
    return (
      <div className="empty" style={{ marginTop: 64 }}>
        <div className="emoji">🔒</div>
        <h3>{t("orders.loginTitle")}</h3>
        <p>{t("orders.loginBody")}</p>
      </div>
    );
  }
  if (loading) {
    return (
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <h2 className="mb-16">{t("orders.headerTitle")}</h2>
        <SkeletonCartList count={4} />
      </div>
    );
  }
  if (error) {
    return (
      <div className="empty">
        <div className="emoji">⚠️</div>
        <h3 style={{ color: "var(--danger-strong)" }}>{error}</h3>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="empty" style={{ marginTop: 64 }}>
        <div className="emoji">📭</div>
        <h3>{t("orders.emptyTitle")}</h3>
        <p>{t("orders.emptyBody")}</p>
        <button
          className="btn btn-primary mt-16"
          onClick={() => window.__katherboxSetView?.("home")}
        >
          {t("orders.emptyAction")}
        </button>
      </div>
    );
  }

  if (invoiceOrder) {
    return (
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <button
          className="btn btn-ghost mb-16 no-print"
          onClick={() => setInvoiceOrder(null)}
        >
          {t("orderDetail.backToOrders")}
        </button>
        <Invoice order={invoiceOrder} user={user} onClose={() => setInvoiceOrder(null)} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <h2 className="mb-16">{t("orders.headerTitle")}</h2>

      <div className="stack gap-12">
        {orders.map((o) => {
          const isOpen = expanded === o.ID;
          const statusTone = STATUS_TONE[o.status] || "muted";
          const statusLabel = t(STATUS_KEYS[o.status] || "orders.placed") || o.status;
          return (
            <article key={o.ID} className="card card-pad">
              <div
                className="row"
                style={{ flexWrap: "wrap", gap: 12, alignItems: "center" }}
              >
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                    {t("orders.orderId", { id: o.ID })}
                    <span className={`pay-pill pay-pill-${o.payment_method || 'cod'}`}>
                      {o.payment_method || 'cod'}
                    </span>
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--ink-400)" }}>
                    {fmtOrderDate(o)}
                  </div>
                </div>
                <span className={`kb-status kb-status-${statusTone}`}>{statusLabel}</span>
                <div
                  style={{
                    fontFamily: "var(--heading)",
                    fontWeight: 700,
                    color: "var(--text-h)",
                    fontSize: 18,
                    minWidth: 90,
                    textAlign: "right",
                  }}
                >
                  ৳{o.total_price.toFixed(2)}
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setExpanded(isOpen ? null : o.ID)}
                >
                  {isOpen
                    ? t("orders.hide")
                    : t("orders.itemsToggle", { count: o.items?.length || 0 })}
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => window.__katherboxOpenOrder?.(o)}
                  title={t("orders.detailsTitle")}
                >
                  {t("orders.detailsLabel")}
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleReorder(o)}
                  disabled={reordering === o.ID}
                  title="Add these items to cart again"
                >
                  {reordering === o.ID ? "Adding..." : "Buy Again 🔄"}
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setInvoiceOrder(o)}
                  title={t("orders.invoiceTitle") || "View & print invoice"}
                >
                  🧾 {t("orders.invoiceLabel") || "Invoice"}
                </button>
              </div>

              {isOpen && (
                <div className="mt-16">
                  <DeliveryTrack status={o.status} createdAt={o.CreatedAt || o.created_at} />
                  <div className="stack gap-8 mt-16">
                    {(o.items || []).map((it) => (
                      <div
                        key={it.ID}
                        className="row"
                        style={{
                          justifyContent: "space-between",
                          fontSize: 14,
                          padding: "8px 0",
                          borderTop: "1px solid var(--neutral-100)",
                        }}
                      >
                        <span>
                          {emojiFor(it.product?.category)}{" "}
                          {it.product?.name || t("orders.productFallback", { id: it.product_id })}
                        </span>
                        <span className="muted">
                          {t("orders.qtyPrice", {
                            qty: it.quantity,
                            price: "৳" + Number(it.price).toFixed(2),
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}