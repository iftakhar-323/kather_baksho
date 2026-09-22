import { useState, useEffect } from "react";
import { getInventoryForecast } from "../api/analytics";

function fmtBDT(n) {
  return "৳" + Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export default function AdminInventoryAI() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all', 'critical', 'warning'
  const [showPOModal, setShowPOModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState({});

  useEffect(() => {
    loadForecast();
  }, []);

  const loadForecast = async () => {
    setLoading(true);
    try {
      const res = await getInventoryForecast(30);
      setData(res.data);
      // Pre-select critical & warning items for PO
      const initialSelected = {};
      (res.data.forecasts || []).forEach((item) => {
        if (item.risk_level === "CRITICAL" || item.risk_level === "WARNING") {
          initialSelected[item.product_id] = item.suggested_order;
        }
      });
      setSelectedItems(initialSelected);
    } catch (err) {
      console.error("Failed to load inventory forecast:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
        <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🤖</div>
        <p>Running AI predictive inventory analysis & burn-rate projections...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#ef4444" }}>
        Failed to load inventory intelligence data.
      </div>
    );
  }

  const forecasts = data.forecasts || [];
  const filtered = forecasts.filter((item) => {
    if (filter === "critical") return item.risk_level === "CRITICAL";
    if (filter === "warning") return item.risk_level === "WARNING";
    return true;
  });

  const poItems = forecasts.filter((item) => (selectedItems[item.product_id] || 0) > 0);
  const poTotalCost = poItems.reduce(
    (sum, item) => sum + (selectedItems[item.product_id] || 0) * (item.estimated_cost / (item.suggested_order || 1)),
    0
  );

  return (
    <div style={{ padding: "0.5rem 0" }}>
      {/* Top Stat Cards */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.5rem"
      }}>
        <div style={{
          background: "linear-gradient(135deg, #1e293b, #0f172a)", border: "1px solid #ef4444",
          borderRadius: "1rem", padding: "1.25rem", color: "#fff"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", color: "#f87171", fontWeight: 600 }}>🚨 Critical Stockout Risk</span>
            <span style={{ fontSize: "1.2rem" }}>🔥</span>
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, marginTop: "0.5rem", color: "#fca5a5" }}>
            {data.critical_items_count} <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>items (&lt; 5d runway)</span>
          </div>
        </div>

        <div style={{
          background: "linear-gradient(135deg, #1e293b, #0f172a)", border: "1px solid #f59e0b",
          borderRadius: "1rem", padding: "1.25rem", color: "#fff"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", color: "#fbbf24", fontWeight: 600 }}>⚠️ Reorder Warning</span>
            <span style={{ fontSize: "1.2rem" }}>📦</span>
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, marginTop: "0.5rem", color: "#fde68a" }}>
            {data.warning_items_count} <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>items (5-14d runway)</span>
          </div>
        </div>

        <div style={{
          background: "linear-gradient(135deg, #1e293b, #0f172a)", border: "1px solid #10b981",
          borderRadius: "1rem", padding: "1.25rem", color: "#fff"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", color: "#34d399", fontWeight: 600 }}>💰 Est. Restock Capital</span>
            <span style={{ fontSize: "1.2rem" }}>🏷️</span>
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, marginTop: "0.5rem", color: "#a7f3d0" }}>
            {fmtBDT(data.total_restock_cost)}
          </div>
        </div>

        <div style={{
          background: "linear-gradient(135deg, #1e293b, #0f172a)", border: "1px solid #3b82f6",
          borderRadius: "1rem", padding: "1.25rem", color: "#fff"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", color: "#60a5fa", fontWeight: 600 }}>🌿 Catalog Monitored</span>
            <span style={{ fontSize: "1.2rem" }}>🌱</span>
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, marginTop: "0.5rem", color: "#bfdbfe" }}>
            {data.total_products} <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>varieties</span>
          </div>
        </div>
      </div>

      {/* Action Header & Filters */}
      <div style={{
        display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between",
        gap: "1rem", marginBottom: "1rem"
      }}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => setFilter("all")}
            style={{
              padding: "0.45rem 0.9rem", borderRadius: "0.5rem", fontSize: "0.85rem", fontWeight: 600,
              cursor: "pointer", border: "none",
              background: filter === "all" ? "#2d6a4f" : "#1e293b",
              color: filter === "all" ? "#fff" : "#94a3b8"
            }}
          >
            All Items ({forecasts.length})
          </button>
          <button
            onClick={() => setFilter("critical")}
            style={{
              padding: "0.45rem 0.9rem", borderRadius: "0.5rem", fontSize: "0.85rem", fontWeight: 600,
              cursor: "pointer", border: "none",
              background: filter === "critical" ? "#ef4444" : "#1e293b",
              color: filter === "critical" ? "#fff" : "#94a3b8"
            }}
          >
            🚨 Critical Only ({data.critical_items_count})
          </button>
          <button
            onClick={() => setFilter("warning")}
            style={{
              padding: "0.45rem 0.9rem", borderRadius: "0.5rem", fontSize: "0.85rem", fontWeight: 600,
              cursor: "pointer", border: "none",
              background: filter === "warning" ? "#f59e0b" : "#1e293b",
              color: filter === "warning" ? "#fff" : "#94a3b8"
            }}
          >
            ⚠️ Warning ({data.warning_items_count})
          </button>
        </div>

        <button
          onClick={() => setShowPOModal(true)}
          style={{
            background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff",
            border: "none", padding: "0.6rem 1.25rem", borderRadius: "0.5rem",
            fontWeight: 700, fontSize: "0.9rem", cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            boxShadow: "0 4px 14px rgba(16, 185, 129, 0.4)"
          }}
        >
          <span>📋 Generate Supplier PO ({poItems.length})</span>
        </button>
      </div>

      {/* Forecast Data Table */}
      <div style={{
        background: "#0f172a", border: "1px solid #1e293b", borderRadius: "1rem",
        overflowX: "auto"
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
          <thead>
            <tr style={{ background: "#1e293b", color: "#94a3b8", borderBottom: "1px solid #334155" }}>
              <th style={{ padding: "0.85rem 1rem" }}>Product</th>
              <th style={{ padding: "0.85rem 1rem" }}>Category</th>
              <th style={{ padding: "0.85rem 1rem" }}>Current Stock</th>
              <th style={{ padding: "0.85rem 1rem" }}>Daily Velocity</th>
              <th style={{ padding: "0.85rem 1rem" }}>Stockout Runway</th>
              <th style={{ padding: "0.85rem 1rem" }}>Suggested Reorder</th>
              <th style={{ padding: "0.85rem 1rem" }}>Est. Cost</th>
              <th style={{ padding: "0.85rem 1rem", textAlign: "center" }}>PO Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const isCrit = item.risk_level === "CRITICAL";
              const isWarn = item.risk_level === "WARNING";
              const runwayDisplay = item.runway_days > 365 ? "> 1 yr" : `${item.runway_days.toFixed(1)} days`;

              return (
                <tr
                  key={item.product_id}
                  style={{
                    borderBottom: "1px solid #1e293b",
                    background: isCrit ? "rgba(239, 68, 68, 0.05)" : "transparent"
                  }}
                >
                  <td style={{ padding: "0.85rem 1rem", fontWeight: 600, color: "#f8fafc" }}>
                    {item.name}
                  </td>
                  <td style={{ padding: "0.85rem 1rem", color: "#94a3b8" }}>
                    <span style={{
                      padding: "0.2rem 0.6rem", borderRadius: "1rem",
                      background: "#1e293b", fontSize: "0.75rem", textTransform: "capitalize"
                    }}>
                      {item.category}
                    </span>
                  </td>
                  <td style={{ padding: "0.85rem 1rem", fontWeight: 700, color: isCrit ? "#f87171" : "#e2e8f0" }}>
                    {item.current_stock} units
                  </td>
                  <td style={{ padding: "0.85rem 1rem", color: "#94a3b8" }}>
                    {item.daily_burn_rate.toFixed(2)} /day
                  </td>
                  <td style={{ padding: "0.85rem 1rem" }}>
                    <span style={{
                      padding: "0.25rem 0.6rem", borderRadius: "1rem", fontSize: "0.75rem", fontWeight: 700,
                      background: isCrit ? "rgba(239, 68, 68, 0.2)" : isWarn ? "rgba(245, 158, 11, 0.2)" : "rgba(16, 185, 129, 0.2)",
                      color: isCrit ? "#fca5a5" : isWarn ? "#fde68a" : "#6ee7b7",
                      display: "inline-flex", alignItems: "center", gap: "0.3rem"
                    }}>
                      {isCrit ? "🚨" : isWarn ? "⚠️" : "✅"} {runwayDisplay}
                    </span>
                  </td>
                  <td style={{ padding: "0.85rem 1rem", color: "#f8fafc" }}>
                    <input
                      type="number"
                      min="0"
                      value={selectedItems[item.product_id] || 0}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setSelectedItems((prev) => ({ ...prev, [item.product_id]: val }));
                      }}
                      style={{
                        width: "70px", padding: "0.3rem 0.5rem", borderRadius: "0.35rem",
                        background: "#1e293b", border: "1px solid #334155", color: "#fff",
                        textAlign: "center"
                      }}
                    />
                  </td>
                  <td style={{ padding: "0.85rem 1rem", fontWeight: 600, color: "#34d399" }}>
                    {fmtBDT(item.estimated_cost)}
                  </td>
                  <td style={{ padding: "0.85rem 1rem", textAlign: "center" }}>
                    <button
                      onClick={() => {
                        setSelectedItems((prev) => {
                          const current = prev[item.product_id] || 0;
                          return { ...prev, [item.product_id]: current > 0 ? 0 : item.suggested_order || 10 };
                        });
                      }}
                      style={{
                        background: (selectedItems[item.product_id] || 0) > 0 ? "#10b981" : "#334155",
                        color: "#fff", border: "none", padding: "0.35rem 0.65rem", borderRadius: "0.35rem",
                        fontSize: "0.75rem", fontWeight: 600, cursor: "pointer"
                      }}
                    >
                      {(selectedItems[item.product_id] || 0) > 0 ? "✓ Added" : "+ Include"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Purchase Order (PO) Printable Modal */}
      {showPOModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center",
          padding: "1rem"
        }}>
          <div style={{
            background: "#ffffff", color: "#1e293b", width: "100%", maxWidth: "720px",
            maxHeight: "90vh", borderRadius: "1rem", overflowY: "auto", padding: "2rem",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)"
          }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #0f172a", paddingBottom: "1rem" }}>
              <div>
                <h2 style={{ margin: 0, color: "#166534", fontSize: "1.5rem" }}>🌿 KATHER BAKSHO</h2>
                <p style={{ margin: "0.25rem 0 0", color: "#64748b", fontSize: "0.85rem" }}>
                  Automated Replenishment Purchase Order (PO)
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{data.draft_po_number}</div>
                <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Date: {new Date().toLocaleDateString()}</div>
              </div>
            </div>

            {/* Vendor Details */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", margin: "1.5rem 0" }}>
              <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "0.5rem" }}>
                <div style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, color: "#64748b" }}>Supplier / Nursery:</div>
                <div style={{ fontWeight: 700, marginTop: "0.25rem" }}>Bengal Botanical Growers Consortium</div>
                <div style={{ fontSize: "0.85rem", color: "#475569" }}>Plot 14, Savar Horticultural Zone, Dhaka</div>
                <div style={{ fontSize: "0.85rem", color: "#475569" }}>dispatch@bengalbotanics.local</div>
              </div>
              <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "0.5rem" }}>
                <div style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, color: "#64748b" }}>Deliver To Warehouse:</div>
                <div style={{ fontWeight: 700, marginTop: "0.25rem" }}>Kather Baksho Central Hub</div>
                <div style={{ fontSize: "0.85rem", color: "#475569" }}>House 42, Road 11, Banani, Dhaka</div>
                <div style={{ fontSize: "0.85rem", color: "#475569" }}>inventory@katherbox.local</div>
              </div>
            </div>

            {/* Line Items */}
            <table style={{ width: "100%", borderCollapse: "collapse", margin: "1.5rem 0", fontSize: "0.88rem" }}>
              <thead>
                <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                  <th style={{ padding: "0.6rem 0.75rem" }}>Item Description</th>
                  <th style={{ padding: "0.6rem 0.75rem", textAlign: "center" }}>Qty</th>
                  <th style={{ padding: "0.6rem 0.75rem", textAlign: "right" }}>Est. Unit Cost</th>
                  <th style={{ padding: "0.6rem 0.75rem", textAlign: "right" }}>Line Total</th>
                </tr>
              </thead>
              <tbody>
                {poItems.map((item) => {
                  const qty = selectedItems[item.product_id] || 0;
                  const unitCost = item.estimated_cost / (item.suggested_order || 1);
                  const lineTotal = qty * unitCost;

                  return (
                    <tr key={item.product_id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "0.6rem 0.75rem", fontWeight: 600 }}>{item.name} ({item.category})</td>
                      <td style={{ padding: "0.6rem 0.75rem", textAlign: "center" }}>{qty}</td>
                      <td style={{ padding: "0.6rem 0.75rem", textAlign: "right" }}>{fmtBDT(unitCost)}</td>
                      <td style={{ padding: "0.6rem 0.75rem", textAlign: "right", fontWeight: 700 }}>{fmtBDT(lineTotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="3" style={{ padding: "0.75rem", textAlign: "right", fontWeight: 700, fontSize: "1rem" }}>Total Payable:</td>
                  <td style={{ padding: "0.75rem", textAlign: "right", fontWeight: 800, fontSize: "1.1rem", color: "#166534" }}>{fmtBDT(poTotalCost)}</td>
                </tr>
              </tfoot>
            </table>

            {/* Modal Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
              <button
                onClick={() => setShowPOModal(false)}
                style={{
                  background: "#f1f5f9", border: "1px solid #cbd5e1", color: "#475569",
                  padding: "0.6rem 1.25rem", borderRadius: "0.5rem", fontWeight: 600, cursor: "pointer"
                }}
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                style={{
                  background: "#16a34a", color: "#fff", border: "none",
                  padding: "0.6rem 1.5rem", borderRadius: "0.5rem", fontWeight: 700, cursor: "pointer"
                }}
              >
                🖨️ Print / Save PO PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
