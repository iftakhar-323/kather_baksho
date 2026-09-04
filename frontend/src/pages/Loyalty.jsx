import { useEffect, useState } from "react";
import {
  getMyLoyalty,
  getMyAchievements,
  claimAchievement,
  getRewards,
  redeemReward,
  getReferralCode,
  getMyReferrals,
  applyReferral,
} from "../api/loyalty";

const asArray = (d) =>
  Array.isArray(d) ? d : d?.achievements || d?.rewards || d?.items || [];
// aliases intentionally omitted — using real names above
import { useToast } from "../components/Toast";
import PageHeader from "../components/PageHeader";
import { useTranslation } from "../i18n/I18nProvider";

function fmt(n) {
  return Number(n || 0).toLocaleString("en-IN");
}

export default function Loyalty() {
  const { t } = useTranslation();
  const toast = useToast();
  const [me, setMe] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [referral, setReferral] = useState(null);
  const [referralCount, setReferralCount] = useState(0);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const loadAll = () => {
    getMyLoyalty()
      .then((r) => setMe(r.data))
      .catch(() => {});
    getMyAchievements().then((r) => setAchievements(asArray(r.data))).catch(() => setAchievements([]));
    getRewards().then((r) => setRewards(asArray(r.data))).catch(() => setRewards([]));
    getReferralCode().then((r) => setReferral(r.data)).catch(() => {});
    getMyReferrals().then((r) => setReferralCount(asArray(r.data).length)).catch(() => {});
  };

  useEffect(() => {
    loadAll();
  }, []);

  const onClaim = async (id) => {
    setBusy(true);
    try {
      const r = await claimAchievement(id);
      toast.ok(t("loyalty.claimedPointsToast", { n: r.data?.points || 0 }));
      loadAll();
    } catch (e) {
      toast.err(e?.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  };

  const onRedeem = async (id) => {
    setBusy(true);
    try {
      const r = await redeemReward(id);
      toast.ok(
        t("loyalty.redeemedCouponToast", {
          code: r.data?.coupon_code || t("loyalty.redeemedFallback"),
        })
      );
      loadAll();
    } catch (e) {
      toast.err(e?.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  };

  const onApplyCode = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    try {
      const r = await applyReferral(code.trim());
      toast.ok(t("loyalty.bonusAppliedToast", { n: r.data?.bonus || 0 }));
      setCode("");
      loadAll();
    } catch (e) {
      toast.err(e?.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  };

  if (!me) {
    return (
      <div className="empty">
        <div className="emoji">🏆</div>
        <h3>{t("loyalty.loading")}</h3>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <PageHeader title={t("loyalty.head")} sub={t("loyalty.subhead")} />

      <div className="stat-band">
        <div>
          <div className="stat-label">{t("loyalty.pointsLabel")}</div>
          <div className="stat-value is-accent">{fmt(me.points)}</div>
        </div>
        <div>
          <div className="stat-label">{t("loyalty.tierLabel")}</div>
          <div className="stat-value">{me.tier || t("loyalty.defaultTier")}</div>
        </div>
        <div>
          <div className="stat-label">{t("loyalty.totalSpentLabel")}</div>
          <div className="stat-value">৳{fmt(me.total_spend)}</div>
        </div>
        <div>
          <div className="stat-label">{t("loyalty.referralsLabel")}</div>
          <div className="stat-value">{fmt(referralCount)}</div>
        </div>
      </div>

      <section className="section">
        <h2>{t("loyalty.achievementsHeading")}</h2>
        {achievements.length === 0 && (
          <p className="muted">{t("loyalty.achievementsEmpty")}</p>
        )}
        <div className="card-grid is-tight">
          {achievements.map((a) => (
            <div key={a.id} className="card card-pad">
              <div className="loyalty-card-icon">{a.icon || "🏅"}</div>
              <h4 className="loyalty-card-title">{a.name}</h4>
              <p className="muted loyalty-card-desc">{a.description}</p>
              <div className="row mt-8">
                <span className="tag tag-leaf">
                  {t("loyalty.pointsTag", { n: a.points })}
                </span>
                <span className="spacer" />
                {a.claimed ? (
                  <span className="tag tag-success">{t("loyalty.claimedTag")}</span>
                ) : (
                  <button
                    className="btn btn-primary btn-xs"
                    disabled={busy || !a.unlocked}
                    onClick={() => onClaim(a.id)}
                  >
                    {a.unlocked ? t("loyalty.claimBtn") : t("loyalty.lockedBtn")}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>{t("loyalty.rewardsHeading")}</h2>
        {rewards.length === 0 && (
          <p className="muted">{t("loyalty.rewardsEmpty")}</p>
        )}
        <div className="card-grid is-tight">
          {rewards.map((r) => (
            <div key={r.id} className="card card-pad">
              <div className="loyalty-card-icon">{r.icon || "🎟️"}</div>
              <h4 className="loyalty-card-title">{r.name}</h4>
              <p className="muted loyalty-card-desc">{r.description}</p>
              <div className="row mt-8">
                <span className="tag tag-leaf">
                  {t("loyalty.pointsCostTag", { n: r.points_cost })}
                </span>
                <span className="spacer" />
                <button
                  className="btn btn-secondary btn-xs"
                  disabled={busy || (me.points || 0) < r.points_cost}
                  onClick={() => onRedeem(r.id)}
                >
                  {t("loyalty.redeem")}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section card card-pad-lg">
        <h2 className="mt-0">{t("loyalty.referralHeading")}</h2>
        <p className="muted">{t("loyalty.referralSubhead")}</p>
        {referral?.code && (
          <div className="row gap-8 mt-12">
            <code className="loyalty-code">{referral.code}</code>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                navigator.clipboard
                  .writeText(referral.code)
                  .then(() => toast.ok(t("loyalty.copiedToast")))
                  .catch(() => toast.info(t("loyalty.copyFailedToast")));
              }}
            >
              {t("loyalty.copyBtn")}
            </button>
            <span className="spacer" />
            <span className="muted">
              {t("loyalty.usedTimes", { n: referral.uses || 0 })}
            </span>
          </div>
        )}
        <form onSubmit={onApplyCode} className="row gap-8 mt-16">
          <input
            className="input loyalty-code-input"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t("loyalty.codePlaceholder")}
          />
          <button className="btn btn-primary" disabled={busy}>
            {t("loyalty.applyBtn")}
          </button>
        </form>
      </section>
    </div>
  );
}
