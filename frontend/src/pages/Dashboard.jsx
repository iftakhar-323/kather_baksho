import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import { useTranslation } from "../i18n/I18nProvider";

function fmtBDT(n) {
  return "৳" + Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return "";
  const now = Date.now();
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [activeSubs, setActiveSubs] = useState([]);
  const [loyalty, setLoyalty] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.allSettled([
      API.get("/orders"),
      API.get("/subscriptions"),
      API.get("/auth/me"),
      API.get("/loyalty/tier"),
    ]).then(([ordersRes, subsRes, meRes, tierRes]) => {
      // Orders
      const orders = ordersRes.status === "fulfilled"
        ? (ordersRes.value.data?.orders || ordersRes.value.data || [])
        : [];
      const totalSpent = orders.reduce((s, o) => s + (o.total_price || 0), 0);
      const pending = orders.filter(o => o.status !== "delivered" && o.status !== "cancelled").length;
      setStats({
        totalOrders: orders.length,
        totalSpent,
        pendingDeliveries: pending,
        delivered: orders.filter(o => o.status === "delivered").length,
      });
      setRecentOrders(orders.slice(0, 5));

      // Subscriptions
      const subs = subsRes.status === "fulfilled"
        ? (subsRes.value.data || [])
        : [];
      setActiveSubs(Array.isArray(subs) ? subs.filter(s => s.status === "active").slice(0, 3) : []);

      // Loyalty
      const me = meRes.status === "fulfilled" ? meRes.value.data : {};
      const tier = tierRes.status === "fulfilled" ? tierRes.value.data : {};
      setLoyalty({
        points: me.points || 0,
        tier: tier.tier || "Green Sprout",
        nextTier: tier.next_tier?.name || tier.next_tier || "Growing Leaf",
        progress: tier.progress || 0,
      });

      setLoading(false);
    });
  }, [user]);

  if (!user) {
    return (
      <div className="empty" style={{ marginTop: 64 }}>
        <div className="emoji">🔒</div>
        <h3>Please log in</h3>
        <p>Sign in to view your dashboard.</p>
        <button className="btn btn-primary mt-16" onClick={() => window.__katherboxSetView?.("login")}>
          Sign In
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="empty">
        <div className="emoji">📊</div>
        <h3>Loading your dashboard...</h3>
      </div>
    );
  }

  const statusColor = (s) => {
    if (s === "delivered") return "var(--leaf-600)";
    if (s === "cancelled") return "var(--rose)";
    if (s === "processing" || s === "packed") return "#e67e22";
    return "var(--ink-400)";
  };

  return (
    <div className="dash-page">
      {/* Header */}
      <div className="dash-header">
        <div className="dash-avatar">
          {(user.name || user.email || "U")[0].toUpperCase()}
        </div>
        <div>
          <h1 className="dash-greeting">
            Welcome back, {user.name || user.email?.split("@")[0]}! 🌿
          </h1>
          <p className="dash-sub">{user.email}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="dash-stats-grid">
        <div className="dash-stat-card">
          <div className="dash-stat-icon">📦</div>
          <div className="dash-stat-value">{stats?.totalOrders || 0}</div>
          <div className="dash-stat-label">Total Orders</div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-icon">💰</div>
          <div className="dash-stat-value">{fmtBDT(stats?.totalSpent || 0)}</div>
          <div className="dash-stat-label">Total Spent</div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-icon">🚚</div>
          <div className="dash-stat-value">{stats?.pendingDeliveries || 0}</div>
          <div className="dash-stat-label">Pending Delivery</div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-icon">✅</div>
          <div className="dash-stat-value">{stats?.delivered || 0}</div>
          <div className="dash-stat-label">Delivered</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dash-section">
        <h3 className="dash-section-title">Quick Actions</h3>
        <div className="dash-actions-grid">
          <button className="dash-action-btn" onClick={() => window.__katherboxSetView?.("orders")}>
            <span className="dash-action-icon">📋</span>
            <span>My Orders</span>
          </button>
          <button className="dash-action-btn" onClick={() => window.__katherboxSetView?.("wishlist")}>
            <span className="dash-action-icon">❤️</span>
            <span>Wishlist</span>
          </button>
          <button className="dash-action-btn" onClick={() => window.__katherboxSetView?.("cart")}>
            <span className="dash-action-icon">🛒</span>
            <span>Cart</span>
          </button>
          <button className="dash-action-btn" onClick={() => window.__katherboxSetView?.("profile")}>
            <span className="dash-action-icon">👤</span>
            <span>Profile</span>
          </button>
          <button className="dash-action-btn" onClick={() => window.__katherboxSetView?.("loyalty")}>
            <span className="dash-action-icon">🏆</span>
            <span>Rewards</span>
          </button>
          <button className="dash-action-btn" onClick={() => window.__katherboxSetView?.("subscriptions")}>
            <span className="dash-action-icon">📦</span>
            <span>Subscriptions</span>
          </button>
        </div>
      </div>

      <div className="dash-two-col">
        {/* Recent Orders */}
        <div className="dash-section">
          <h3 className="dash-section-title">Recent Orders</h3>
          {recentOrders.length === 0 ? (
            <div className="dash-empty-card">
              <span>🛒</span>
              <p>No orders yet. Start shopping!</p>
              <button className="btn btn-primary btn-sm" onClick={() => window.__katherboxSetView?.("home")}>
                Browse Plants
              </button>
            </div>
          ) : (
            <div className="dash-orders-list">
              {recentOrders.map((o) => (
                <div
                  key={o.ID}
                  className="dash-order-row"
                  onClick={() => window.__katherboxOpenOrder?.(o)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="dash-order-id">#{o.ID}</div>
                  <div className="dash-order-info">
                    <div className="dash-order-price">{fmtBDT(o.total_price)}</div>
                    <div className="dash-order-time">{timeAgo(o.CreatedAt)}</div>
                  </div>
                  <div
                    className="dash-order-status"
                    style={{ color: statusColor(o.status) }}
                  >
                    {o.status || "pending"}
                  </div>
                  <span className="dash-order-arrow">→</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Loyalty & Tier */}
        <div className="dash-section">
          <h3 className="dash-section-title">Loyalty & Rewards</h3>
          <div className="dash-loyalty-card">
            <div className="dash-loyalty-tier">
              <span className="dash-tier-badge">🏆</span>
              <div>
                <div className="dash-tier-name">{loyalty?.tier}</div>
                <div className="dash-tier-next">
                  Next: {loyalty?.nextTier}
                </div>
              </div>
            </div>
            <div className="dash-points-row">
              <span className="dash-points-label">Green Points</span>
              <strong className="dash-points-value">🌱 {loyalty?.points || 0}</strong>
            </div>
            <div className="dash-progress-bar">
              <div
                className="dash-progress-fill"
                style={{ width: `${Math.min(100, loyalty?.progress || 0)}%` }}
              />
            </div>
            <div className="dash-progress-label">
              {Math.round(loyalty?.progress || 0)}% to {loyalty?.nextTier}
            </div>
          </div>

          {/* Active Subscriptions */}
          {activeSubs.length > 0 && (
            <>
              <h3 className="dash-section-title mt-16">Active Subscriptions</h3>
              <div className="dash-subs-list">
                {activeSubs.map((s) => (
                  <div key={s.ID} className="dash-sub-row">
                    <span className="dash-sub-icon">📦</span>
                    <div className="dash-sub-info">
                      <div className="dash-sub-name">{s.plan_name}</div>
                      <div className="dash-sub-meta">
                        Next delivery: {s.next_delivery || "TBD"}
                      </div>
                    </div>
                    <div className="dash-sub-price">{fmtBDT(s.price)}/mo</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
