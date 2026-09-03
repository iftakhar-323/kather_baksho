import { useEffect } from "react";

// Client-side, fully offline order invoice. Renders from the order object the
// Orders API already returns (Items.Product preloaded) — no extra network
// call — and a "Print / Save as PDF" button that uses the browser's own
// print-to-PDF via an @media print stylesheet (see index.css "DEMO PASS").

const COMPANY = {
  name: "KatherBox",
  tagline: "Plants, planters & plant care",
  address: "House 42, Road 7, Dhanmondi, Dhaka 1205, Bangladesh",
  email: "hello@katherbox.com",
  phone: "+880 1700 000000",
};

const GIFT_WRAP_FEE = 50;

function money(n) {
  return "৳" + Number(n || 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(s) {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return String(s);
  }
}

function printNow() {
  document.body.classList.add("kb-printing");
  const cleanup = () => {
    document.body.classList.remove("kb-printing");
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  // Fallback for browsers that don't fire afterprint reliably.
  setTimeout(cleanup, 1500);
  window.print();
}

export default function Invoice({ order, user, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!order) return null;

  const id = order.id ?? order.ID;
  const items = order.items || [];
  const itemsTotal = items.reduce((s, it) => s + Number(it.price || 0) * Number(it.quantity || 0), 0);
  const discount = Number(order.discount_amount || 0);
  const giftWrap = order.gift_wrap ? GIFT_WRAP_FEE : 0;
  const grand = Number(order.total_price ?? itemsTotal - discount + giftWrap);
  const shipping = Math.max(0, grand - itemsTotal + discount - giftWrap);

  const paid =
    /paid/i.test(order.payment_status || "") ||
    (order.payment_method && order.payment_method !== "cod" && !/pending/i.test(order.payment_status || ""));

  return (
    <div className="kb-print-area">
      <div className="kb-invoice-actions no-print">
        <button className="btn btn-primary" onClick={printNow}>
          🧾 Print / Save as PDF
        </button>
        {onClose && (
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        )}
      </div>

      <article className="kb-invoice">
        <header className="kb-invoice-head">
          <div className="kb-invoice-brand">
            <span className="logo">🪴</span>
            <div>
              <h1>{COMPANY.name}</h1>
              <div style={{ fontSize: 12, color: "#83907f" }}>{COMPANY.tagline}</div>
            </div>
          </div>
          <div className="kb-invoice-meta">
            <div className="big">INVOICE</div>
            <div>#{String(id).padStart(6, "0")}</div>
            <div>{fmtDate(order.created_at)}</div>
            <div style={{ marginTop: 6 }}>
              <span className={`kb-invoice-status ${paid ? "paid" : "pending"}`}>
                {paid ? "PAID" : "PAYMENT DUE"}
              </span>
            </div>
          </div>
        </header>

        <div className="kb-invoice-parties">
          <div>
            <h4>Billed to</h4>
            <div style={{ lineHeight: 1.6 }}>
              <strong>{order.shipping_name || user?.name || "Customer"}</strong>
              <br />
              {order.shipping_phone || user?.phone || ""}
              <br />
              {order.shipping_address || user?.address || "—"}
              {order.delivery_note ? (
                <>
                  <br />
                  <span style={{ color: "#83907f" }}>Note: {order.delivery_note}</span>
                </>
              ) : null}
            </div>
          </div>
          <div>
            <h4>From</h4>
            <div style={{ lineHeight: 1.6 }}>
              <strong>{COMPANY.name}</strong>
              <br />
              {COMPANY.address}
              <br />
              {COMPANY.email} · {COMPANY.phone}
            </div>
          </div>
          <div>
            <h4>Payment</h4>
            <div style={{ lineHeight: 1.6 }}>
              Method: <strong style={{ textTransform: "uppercase" }}>{order.payment_method || "cod"}</strong>
              <br />
              Status: {order.payment_status || (order.payment_method === "cod" ? "Pending COD" : "Paid")}
              {order.transaction_id ? (
                <>
                  <br />
                  Txn: <span style={{ fontFamily: "monospace" }}>{order.transaction_id}</span>
                </>
              ) : null}
              <br />
              Order status: {order.status}
            </div>
          </div>
        </div>

        <table className="kb-invoice-table">
          <thead>
            <tr>
              <th>Item</th>
              <th className="num">Unit price</th>
              <th className="num">Qty</th>
              <th className="num">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ color: "#83907f" }}>No line items recorded.</td>
              </tr>
            ) : (
              items.map((it, i) => (
                <tr key={it.ID || i}>
                  <td>
                    {it.product?.name || `Product #${it.product_id}`}
                    {it.product?.category ? (
                      <span style={{ color: "#83907f", fontSize: 12 }}> · {it.product.category}</span>
                    ) : null}
                  </td>
                  <td className="num">{money(it.price)}</td>
                  <td className="num">{it.quantity}</td>
                  <td className="num">{money(Number(it.price) * Number(it.quantity))}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="kb-invoice-totals">
          <div className="row">
            <span>Subtotal</span>
            <span>{money(itemsTotal)}</span>
          </div>
          {discount > 0 && (
            <div className="row">
              <span>Discount{order.coupon_code ? ` (${order.coupon_code})` : ""}</span>
              <span>−{money(discount)}</span>
            </div>
          )}
          {giftWrap > 0 && (
            <div className="row">
              <span>Gift wrap</span>
              <span>{money(giftWrap)}</span>
            </div>
          )}
          <div className="row">
            <span>Shipping</span>
            <span>{shipping > 0 ? money(shipping) : "Free"}</span>
          </div>
          <div className="row grand">
            <span>Total</span>
            <span>{money(grand)}</span>
          </div>
        </div>

        <footer className="kb-invoice-foot">
          Thank you for shopping with {COMPANY.name}! · Questions? {COMPANY.email}
          <br />
          This invoice was generated on {fmtDate(new Date().toISOString())}.
        </footer>
      </article>
    </div>
  );
}
