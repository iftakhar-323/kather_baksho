import { useState, useMemo, useEffect, useRef } from "react";
import { useTranslation } from "../i18n/I18nProvider";

function fmtBDT(n) {
  return "৳" + Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

// ── Confetti particle system ────────────────────────────────────────────────
function Confetti({ active }) {
  const canvasRef = useRef(null);
  const particles = useRef([]);
  const raf = useRef(null);

  useEffect(() => {
    if (!active || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight;

    const colors = ["#2d6a4f", "#40916c", "#52b788", "#95d5b2", "#d4a373",
      "#e9c46a", "#e76f51", "#264653", "#f4a261", "#ff6b6b"];

    for (let i = 0; i < 120; i++) {
      particles.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * -canvas.height,
        w: Math.random() * 8 + 4,
        h: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 3 + 2,
        rot: Math.random() * 360,
        vr: (Math.random() - 0.5) * 8,
        opacity: 1,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = 0;
      for (const p of particles.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.vy += 0.05;
        if (p.y > canvas.height + 20) {
          p.opacity -= 0.02;
        }
        if (p.opacity <= 0) continue;
        alive++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (alive > 0) raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);

    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      particles.current = [];
    };
  }, [active]);

  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 10,
      }}
    />
  );
}

// ── OTP Input component ──────────────────────────────────────────────────────
function OtpInput({ length = 6, onComplete }) {
  const [values, setValues] = useState(Array(length).fill(""));
  const refs = useRef([]);

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...values];
    next[i] = val;
    setValues(next);
    if (val && i < length - 1) refs.current[i + 1]?.focus();
    if (next.every((v) => v !== "")) onComplete(next.join(""));
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !values[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  return (
    <div className="pm-otp-grid">
      {values.map((v, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          className="pm-otp-digit"
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={v}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          autoFocus={i === 0}
        />
      ))}
    </div>
  );
}

// ── Main PaymentModal ────────────────────────────────────────────────────────
export default function PaymentModal({ total, items, user, onClose, onComplete }) {
  // eslint-disable-next-line no-unused-vars
  const { t } = useTranslation();

  // Steps: 0=Summary, 1=Delivery, 2=Payment, 3=OTP/Processing, 4=Success
  const [step, setStep] = useState(0);
  const [method, setMethod] = useState("bkash");

  // Delivery form
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");
  const [deliveryNote, setDeliveryNote] = useState("");

  // Payment form states
  const [mobileNo, setMobileNo] = useState("");
  const [pin, setPin] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, _setCardHolder] = useState(user?.name || "");
  const [cardExp, setCardExp] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  const [error, setError] = useState("");
  const [processingStatus, setProcessingStatus] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [successData, setSuccessData] = useState(null);

  // Detect card brand
  const cardBrand = useMemo(() => {
    const clean = cardNumber.replace(/\s+/g, "");
    if (/^4/.test(clean)) return "VISA";
    if (/^5[1-5]/.test(clean)) return "MASTERCARD";
    if (/^3[47]/.test(clean)) return "AMEX";
    return "CARD";
  }, [cardNumber]);

  const STEPS = [
    { num: 1, label: "Review" },
    { num: 2, label: "Delivery" },
    { num: 3, label: "Payment" },
    { num: 4, label: "Confirm" },
  ];

  const generateTxnId = (prefix) => {
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    const ts = Date.now().toString().slice(-4);
    return `${prefix}${randomStr}${ts}`;
  };

  const handleNextFromSummary = () => {
    setError("");
    setStep(1);
  };

  const handleNextFromDelivery = (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Please enter recipient name"); return; }
    if (!phone.trim()) { setError("Please enter contact phone number"); return; }
    if (!address.trim()) { setError("Please enter delivery address"); return; }
    setStep(2);
  };

  const handleProcessPayment = () => {
    setError("");
    // Validate
    if (method === "bkash" || method === "nagad" || method === "rocket") {
      if (!mobileNo.trim() || mobileNo.length < 11) {
        setError("Please enter a valid 11-digit mobile number"); return;
      }
      if (!pin || pin.length < 4) {
        setError("Please enter your 4 or 5-digit PIN"); return;
      }
    } else if (method === "card") {
      if (cardNumber.replace(/\s+/g, "").length < 16) {
        setError("Please enter valid 16-digit card number"); return;
      }
      if (!cardExp.trim()) { setError("Please enter expiration date (MM/YY)"); return; }
      if (!cardCvc.trim() || cardCvc.length < 3) { setError("Please enter valid CVC"); return; }
    }

    // For mobile wallets, show OTP step
    if (method === "bkash" || method === "nagad" || method === "rocket") {
      setStep(3);
      setShowOtp(true);
      setProcessingStatus("Sending OTP to " + mobileNo.slice(0, 3) + "****" + mobileNo.slice(-3) + "...");
      return;
    }

    // For card and COD, go straight to processing
    startProcessing();
  };

  const handleOtpComplete = (_otp) => {
    setOtpVerified(true);
    setShowOtp(false);
    setProcessingStatus("OTP verified ✓ — Processing payment...");
    setTimeout(() => startProcessing(), 600);
  };

  const startProcessing = () => {
    setStep(3);
    setShowOtp(false);
    setProcessingStatus("Establishing encrypted session...");

    setTimeout(() => {
      setProcessingStatus("Authorizing with payment provider...");
    }, 800);

    setTimeout(() => {
      setProcessingStatus("Verifying security token...");
    }, 1600);

    setTimeout(() => {
      setProcessingStatus("Transaction approved ✓");
    }, 2200);

    setTimeout(() => {
      const txnId =
        method === "cod" ? generateTxnId("COD") :
        method === "bkash" ? generateTxnId("BK") :
        method === "nagad" ? generateTxnId("NG") :
        method === "rocket" ? generateTxnId("RK") :
        generateTxnId("TX");

      setSuccessData({
        paymentMethod: method,
        paymentStatus: method === "cod" ? "Pending COD" : "Paid",
        transactionId: txnId,
        shippingAddress: `${name}, ${phone}, ${address}${deliveryNote ? ` (${deliveryNote})` : ""}`,
      });
      setStep(4);
    }, 2800);
  };

  const handleFinish = () => {
    if (successData) onComplete(successData);
  };

  const methodName = {
    bkash: "bKash", nagad: "Nagad", rocket: "Rocket",
    card: cardBrand, cod: "Cash on Delivery"
  };

  return (
    <div className="pm-backdrop" onClick={onClose}>
      <div className="pm-modal pm-modal-enhanced" onClick={(e) => e.stopPropagation()} role="dialog">
        <Confetti active={step === 4} />

        {/* Modal Header */}
        <div className="pm-header">
          <div className="pm-title-wrap">
            <span className="pm-shield-ico">{step === 4 ? "🎉" : "🔒"}</span>
            <div>
              <h3 className="pm-title">
                {step === 4 ? "Order Confirmed!" : "Checkout & Payment"}
              </h3>
              <p className="pm-sub">
                {step === 4 ? "Thank you for your purchase" : "Secure 256-Bit SSL Encryption"}
              </p>
            </div>
          </div>
          {step !== 3 && (
            <button className="pm-close" onClick={onClose} title="Close">✕</button>
          )}
        </div>

        {/* Stepper Progress */}
        {step < 4 && (
          <div className="pm-stepper pm-stepper-4">
            {STEPS.map((s, i) => (
              <div key={s.num} className="pm-step-wrap">
                <div className={`pm-step ${step >= i ? "is-active" : ""} ${step > i ? "is-done" : ""}`}>
                  <span className="pm-step-num">
                    {step > i ? "✓" : s.num}
                  </span>
                  <span className="pm-step-label">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`pm-step-line ${step > i ? "is-filled" : ""}`} />}
              </div>
            ))}
          </div>
        )}

        {/* Error Alert */}
        {error && <div className="pm-error-alert">⚠️ {error}</div>}

        {/* ═══ STEP 0: Order Summary ═══ */}
        {step === 0 && (
          <div className="pm-body">
            <div className="pm-summary-header">
              <h4>Order Summary</h4>
              <span className="pm-item-count">{items?.length || 0} items</span>
            </div>

            <div className="pm-items-list">
              {(items || []).map((item, idx) => {
                const p = item.product || {};
                const cat = p.category || "plant";
                const emoji = cat === "plant" ? "🌿" : cat === "care" ? "🧴" : "🏺";
                return (
                  <div key={idx} className="pm-item-row">
                    <div className="pm-item-thumb">{emoji}</div>
                    <div className="pm-item-info">
                      <div className="pm-item-name">{p.name || "Product"}</div>
                      <div className="pm-item-meta">
                        <span className="pm-item-qty">×{item.quantity}</span>
                        <span className="pm-item-cat">{cat}</span>
                      </div>
                    </div>
                    <div className="pm-item-price">{fmtBDT(p.price * item.quantity)}</div>
                  </div>
                );
              })}
            </div>

            <div className="pm-summary-totals">
              <div className="pm-summary-line">
                <span>Subtotal</span>
                <span>{fmtBDT(total)}</span>
              </div>
              <div className="pm-summary-line">
                <span>Delivery</span>
                <span className="pm-free-badge">Calculated at next step</span>
              </div>
              <div className="pm-summary-line pm-summary-total-line">
                <span>Estimated Total</span>
                <strong>{fmtBDT(total)}</strong>
              </div>
            </div>

            <div className="pm-footer">
              <div className="pm-secure-note">
                🛡️ Your data is protected by 256-bit SSL encryption
              </div>
              <button
                type="button"
                className="btn btn-primary btn-lg pm-btn-full"
                onClick={handleNextFromSummary}
              >
                Continue to Delivery →
              </button>
            </div>
          </div>
        )}

        {/* ═══ STEP 1: Delivery Information ═══ */}
        {step === 1 && (
          <form onSubmit={handleNextFromDelivery} className="pm-body">
            <div className="pm-field-group">
              <label className="field-label">Recipient Full Name</label>
              <input className="input" placeholder="e.g. Ayesha Rahman"
                value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="pm-field-group">
              <label className="field-label">Contact Phone Number</label>
              <input className="input" placeholder="01700000000"
                value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <div className="pm-field-group">
              <label className="field-label">Full Delivery Address</label>
              <textarea className="textarea" placeholder="House, Road, Area, District..."
                value={address} onChange={(e) => setAddress(e.target.value)} rows={3} required />
            </div>
            <div className="pm-field-group">
              <label className="field-label">Delivery Instructions (Optional)</label>
              <input className="input" placeholder="e.g. Leave with security guard"
                value={deliveryNote} onChange={(e) => setDeliveryNote(e.target.value)} />
            </div>
            <div className="pm-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setStep(0)}>← Back</button>
              <button type="submit" className="btn btn-primary btn-lg">
                Continue to Payment →
              </button>
            </div>
          </form>
        )}

        {/* ═══ STEP 2: Payment Method ═══ */}
        {step === 2 && (
          <div className="pm-body">
            <div className="pm-methods-grid">
              <button type="button"
                className={`pm-method-card pm-bkash ${method === "bkash" ? "is-selected" : ""}`}
                onClick={() => setMethod("bkash")}>
                <div className="pm-method-badge">🌸 bKash</div>
                <span className="pm-method-sub">Mobile Banking</span>
              </button>
              <button type="button"
                className={`pm-method-card pm-nagad ${method === "nagad" ? "is-selected" : ""}`}
                onClick={() => setMethod("nagad")}>
                <div className="pm-method-badge">🟠 Nagad</div>
                <span className="pm-method-sub">Mobile Banking</span>
              </button>
              <button type="button"
                className={`pm-method-card pm-rocket ${method === "rocket" ? "is-selected" : ""}`}
                onClick={() => setMethod("rocket")}>
                <div className="pm-method-badge">🟣 Rocket</div>
                <span className="pm-method-sub">Mobile Banking</span>
              </button>
              <button type="button"
                className={`pm-method-card pm-card-opt ${method === "card" ? "is-selected" : ""}`}
                onClick={() => setMethod("card")}>
                <div className="pm-method-badge">💳 Card</div>
                <span className="pm-method-sub">Visa / MasterCard</span>
              </button>
              <button type="button"
                className={`pm-method-card pm-cod ${method === "cod" ? "is-selected" : ""}`}
                onClick={() => setMethod("cod")}>
                <div className="pm-method-badge">💵 Cash on Delivery</div>
                <span className="pm-method-sub">Pay at doorstep</span>
              </button>
            </div>

            {/* Sub-form per method */}
            <div className="pm-method-details">
              {(method === "bkash" || method === "nagad" || method === "rocket") && (
                <div className={`pm-wallet-form pm-theme-${method}`}>
                  <div className="pm-wallet-head">
                    <span className="pm-wallet-icon">
                      {method === "bkash" ? "🌸" : method === "nagad" ? "🟠" : "🟣"}
                    </span>
                    <div>
                      <strong>
                        {method === "bkash" ? "bKash" : method === "nagad" ? "Nagad" : "Rocket"} Payment Gateway
                      </strong>
                      <p className="muted" style={{ fontSize: 12 }}>
                        Enter your registered account number & PIN. An OTP will be sent.
                      </p>
                    </div>
                  </div>
                  <div className="pm-field-row mt-12">
                    <div className="pm-field-group">
                      <label className="field-label">Account Mobile Number</label>
                      <input className="input" placeholder="01700000000"
                        value={mobileNo} onChange={(e) => setMobileNo(e.target.value)} maxLength={11} />
                    </div>
                    <div className="pm-field-group">
                      <label className="field-label">PIN</label>
                      <input className="input" type="password" placeholder="•••••"
                        value={pin} onChange={(e) => setPin(e.target.value)} maxLength={5} />
                    </div>
                  </div>
                </div>
              )}

              {method === "card" && (
                <div className="pm-card-form">
                  <div className="pm-card-preview">
                    <div className="pm-card-chip">💳</div>
                    <div className="pm-card-brand">{cardBrand}</div>
                    <div className="pm-card-num-disp">{cardNumber || "•••• •••• •••• ••••"}</div>
                    <div className="pm-card-foot-disp">
                      <span>{cardHolder || "CARDHOLDER NAME"}</span>
                      <span>{cardExp || "MM/YY"}</span>
                    </div>
                  </div>
                  <div className="pm-field-group mt-12">
                    <label className="field-label">Card Number</label>
                    <input className="input" placeholder="4000 1234 5678 9010"
                      value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} maxLength={19} />
                  </div>
                  <div className="pm-field-row mt-8">
                    <div className="pm-field-group">
                      <label className="field-label">Expiration (MM/YY)</label>
                      <input className="input" placeholder="12/28"
                        value={cardExp} onChange={(e) => setCardExp(e.target.value)} maxLength={5} />
                    </div>
                    <div className="pm-field-group">
                      <label className="field-label">CVC / CVV</label>
                      <input className="input" type="password" placeholder="123"
                        value={cardCvc} onChange={(e) => setCardCvc(e.target.value)} maxLength={4} />
                    </div>
                  </div>
                </div>
              )}

              {method === "cod" && (
                <div className="pm-cod-info">
                  <div style={{ fontSize: 36 }}>🚚</div>
                  <strong>Cash on Delivery Selected</strong>
                  <p className="muted mt-4" style={{ fontSize: 13, maxWidth: 360, margin: "4px auto 0" }}>
                    Pay <strong>{fmtBDT(total)}</strong> in cash when our delivery rider brings your plants & products to your doorstep.
                  </p>
                </div>
              )}
            </div>

            <div className="pm-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
              <button type="button" className="btn btn-primary btn-lg" onClick={handleProcessPayment}>
                {method === "cod" ? "Confirm Order (COD)" : `Pay ${fmtBDT(total)} Now`}
              </button>
            </div>
          </div>
        )}

        {/* ═══ STEP 3: OTP / Processing ═══ */}
        {step === 3 && (
          <div className="pm-body pm-processing-body">
            {showOtp && !otpVerified ? (
              <div className="pm-otp-section">
                <div className="pm-otp-icon">📱</div>
                <h3>Enter OTP</h3>
                <p className="muted mt-4" style={{ fontSize: 13 }}>
                  A 6-digit OTP has been sent to <strong>{mobileNo}</strong>
                </p>
                <OtpInput length={6} onComplete={handleOtpComplete} />
                <p className="pm-otp-hint mt-12">
                  💡 For demo, enter any 6 digits (e.g. 123456)
                </p>
                <button type="button" className="btn btn-ghost btn-sm mt-8" onClick={() => setStep(2)}>
                  ← Change payment method
                </button>
              </div>
            ) : (
              <>
                <div className="pm-spinner" />
                <h3 className="mt-16">Processing Payment</h3>
                <p className="pm-status-msg mt-8">{processingStatus}</p>
                <div className="pm-processing-bar mt-16">
                  <div className="pm-processing-fill" />
                </div>
                <div className="pm-sec-badge mt-16">
                  🛡️ Verified by SSL Security Protocol • Do not refresh or close
                </div>
              </>
            )}
          </div>
        )}

        {/* ═══ STEP 4: Success ═══ */}
        {step === 4 && successData && (
          <div className="pm-body pm-success-body">
            <div className="pm-success-icon">✅</div>
            <h2 className="pm-success-title">Payment Successful!</h2>
            <p className="pm-success-sub">Your order has been placed successfully</p>

            <div className="pm-success-card">
              <div className="pm-success-row">
                <span>Payment Method</span>
                <span className={`pay-pill pay-pill-${method}`}>
                  {methodName[method]}
                </span>
              </div>
              <div className="pm-success-row">
                <span>Transaction ID</span>
                <strong className="pm-txn-id">{successData.transactionId}</strong>
              </div>
              <div className="pm-success-row">
                <span>Amount Paid</span>
                <strong className="pm-success-amount">{fmtBDT(total)}</strong>
              </div>
              <div className="pm-success-row">
                <span>Status</span>
                <span className="pm-status-paid">
                  {successData.paymentStatus === "Paid" ? "✓ Paid" : "⏳ Pending COD"}
                </span>
              </div>
            </div>

            <div className="pm-success-delivery">
              <div className="pm-success-delivery-icon">📦</div>
              <div>
                <strong>Delivery to:</strong>
                <p className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                  {name}, {phone}<br />{address}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-lg pm-btn-full mt-16"
              onClick={handleFinish}
            >
              View My Orders →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
