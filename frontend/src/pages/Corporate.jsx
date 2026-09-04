import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { createCorporateQuote, getMyCorporateQuotes } from "../api/corporate";
import { useTranslation } from "../i18n/I18nProvider";
import CorporateOrders from "./CorporateOrders";
import PageHeader from "../components/PageHeader";
import Segmented from "../components/Segmented";

export default function Corporate() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [mainTab, setMainTab] = useState("quote");
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState(user?.name || "");
  const [contactEmail, setContactEmail] = useState(user?.email || "");
  const [contactPhone, setContactPhone] = useState("");
  const [message, setMessage] = useState("Happy holidays from our team!");
  const [budgetPerGift, setBudgetPerGift] = useState(1000);
  const [recipients, setRecipients] = useState([{ name: "", address: "" }]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [quotes, setQuotes] = useState([]);

  const load = () => {
    getMyCorporateQuotes().then((r) => setQuotes(r.data || []));
  };
  useEffect(() => { load(); }, []);

  const addRow = () => setRecipients([...recipients, { name: "", address: "" }]);
  const removeRow = (i) =>
    setRecipients(recipients.filter((_, idx) => idx !== i));
  const updateRow = (i, key, val) => {
    const next = [...recipients];
    next[i] = { ...next[i], [key]: val };
    setRecipients(next);
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMsg("");
    try {
      const res = await createCorporateQuote({
        company_name: companyName,
        contact_name: contactName,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        message,
        budget_per_gift: parseFloat(budgetPerGift),
        recipients: JSON.stringify(recipients),
      });
      setMsg(t("corporate.submitToast", { id: res.data.ID, email: contactEmail }));
      setCompanyName("");
      setRecipients([{ name: "", address: "" }]);
      load();
    } catch (err) {
      setError(err?.response?.data?.error || err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!user) {
    return (
      <div className="empty empty-gate">
        <div className="emoji">🔒</div>
        <h3>{t("corporate.loginHeading")}</h3>
        <p>{t("corporate.loginBody")}</p>
      </div>
    );
  }

  const totalEstimate = (budgetPerGift || 0) * recipients.length;

  return (
    <div className="page-shell is-wide">
      <PageHeader title={t("corporate.head")} sub={t("corporate.subhead")} />

      <Segmented
        className="mb-16"
        value={mainTab}
        onChange={setMainTab}
        options={[
          { value: "quote", label: t("corporate.formHeading") },
          { value: "orders", label: t("corporateOrders.head") },
        ]}
      />

      {mainTab === "orders" && <CorporateOrders embedded />}

      {mainTab === "quote" && (
      <>
      {msg && <div className="notice">{msg}</div>}
      {error && <div className="warning">{error}</div>}

      <div className="card card-pad">
        <h3 className="mt-0">{t("corporate.formHeading")}</h3>
        <form className="auth-form" onSubmit={submit}>
          <div className="row gap-12 row-wrap">
            <div className="corp-field">
              <label className="field-label">{t("corporate.companyLabel")}</label>
              <input className="input" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </div>
            <div className="corp-field">
              <label className="field-label">{t("corporate.contactNameLabel")}</label>
              <input className="input" required value={contactName} onChange={(e) => setContactName(e.target.value)} />
            </div>
          </div>
          <div className="row gap-12 row-wrap">
            <div className="corp-field">
              <label className="field-label">{t("corporate.emailLabel")}</label>
              <input className="input" type="email" required value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
            </div>
            <div className="corp-field">
              <label className="field-label">{t("corporate.phoneLabel")}</label>
              <input className="input" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="field-label">{t("corporate.messageLabel")}</label>
            <textarea className="textarea" value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          <div>
            <label className="field-label">{t("corporate.budgetLabel")}</label>
            <input className="input" type="number" min="100" value={budgetPerGift} onChange={(e) => setBudgetPerGift(e.target.value)} />
          </div>

          <div>
            <label className="field-label">
              {t("corporate.recipientsLabel", { count: recipients.length })}
            </label>
            {recipients.map((r, i) => (
              <div key={i} className="row gap-8 corp-recipient-row">
                <input
                  className="input corp-recipient-name"
                  placeholder={t("corporate.recipientNamePlaceholder")}
                  required
                  value={r.name}
                  onChange={(e) => updateRow(i, "name", e.target.value)}
                />
                <input
                  className="input corp-recipient-addr"
                  placeholder={t("corporate.recipientAddressPlaceholder")}
                  required
                  value={r.address}
                  onChange={(e) => updateRow(i, "address", e.target.value)}
                />
                {recipients.length > 1 && (
                  <button type="button" onClick={() => removeRow(i)} className="btn btn-danger btn-sm">
                    {t("corporate.removeRecipient")}
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={addRow} className="btn btn-secondary btn-sm mt-8">
              {t("corporate.addRecipient")}
            </button>
          </div>

          <div className="total-row mt-12">
            <span>{t("corporate.estimatedTotal")}</span>
            <span>৳{totalEstimate.toFixed(2)}</span>
          </div>

          <button type="submit" disabled={busy} className="btn btn-primary mt-8">
            {busy ? t("corporate.submitting") : t("corporate.submitBtn")}
          </button>
        </form>
      </div>

      <section className="section">
        <h2>{t("corporate.pastQuotesHeading")}</h2>
        {quotes.length === 0 && (
          <div className="empty">
            <div className="emoji">📑</div>
            <h3>{t("corporate.noQuotesHeading")}</h3>
          </div>
        )}
        {quotes.length > 0 && (
          <div className="card list-flush">
            {quotes.map((q) => (
              <div key={q.ID} className="list-row">
                <div className="list-row-icon">🏢</div>
                <div className="list-row-main">
                  <div className="list-row-title">{q.company_name}</div>
                  <div className="list-row-sub">
                    {t("corporate.quoteMeta", {
                      id: q.ID,
                      amount: Number(q.total_estimate).toFixed(0),
                    })}
                  </div>
                </div>
                <span className={"status-pill " + (q.status === "delivered" ? "status-delivered" : q.status === "cancelled" ? "status-cancelled" : "status-processing")}>
                  {q.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
      </>
      )}
    </div>
  );
}