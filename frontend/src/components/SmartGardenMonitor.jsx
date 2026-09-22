import { useState, useEffect, useCallback } from "react";
import API from "../api/axios";
import { useTranslation } from "../i18n/I18nProvider";

export default function SmartGardenMonitor() {
  const { t } = useTranslation();
  const [plants, setPlants] = useState([]);
  const [selectedPlantId, setSelectedPlantId] = useState(1);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [source, setSource] = useState("mongodb");
  const [hoveredBar, setHoveredBar] = useState(null);

  const loadPlants = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get("/iot/plants");
      const list = res.data?.plants || [];
      setPlants(list);
      setSource(res.data?.source || "mongodb");
      if (list.length > 0 && !selectedPlantId) {
        setSelectedPlantId(list[0].plant_id || list[0].PlantID || 1);
      }
    } catch (err) {
      console.warn("Failed to load IoT plants:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedPlantId]);

  const loadHistory = useCallback(async (pid) => {
    try {
      const res = await API.get(`/iot/telemetry/${pid}?limit=12`);
      setHistory(res.data?.history || []);
    } catch (err) {
      console.warn("Failed to load plant history:", err);
    }
  }, []);

  useEffect(() => {
    loadPlants();
  }, [loadPlants]);

  useEffect(() => {
    if (selectedPlantId) {
      loadHistory(selectedPlantId);
    }
  }, [selectedPlantId, loadHistory]);

  const handleSeed = async () => {
    try {
      setSeeding(true);
      await API.post("/iot/seed");
      await loadPlants();
      if (selectedPlantId) {
        await loadHistory(selectedPlantId);
      }
    } catch (err) {
      alert("Seeding failed: " + (err?.response?.data?.error || err.message));
    } finally {
      setSeeding(false);
    }
  };

  const currentPlant =
    plants.find((p) => (p.plant_id || p.PlantID) === selectedPlantId) ||
    plants[0] || {};

  const moisture =
    currentPlant?.soil_moisture_pct ?? currentPlant?.SoilMoisturePct ?? 45.0;
  const temp =
    currentPlant?.ambient_temp_c ?? currentPlant?.AmbientTempC ?? 24.2;
  const humidity =
    currentPlant?.humidity_pct ?? currentPlant?.HumidityPct ?? 62.0;
  const lux = currentPlant?.light_lux ?? currentPlant?.LightLux ?? 820.0;
  const battery =
    currentPlant?.battery_pct ?? currentPlant?.BatteryPct ?? 94.0;
  const status = currentPlant?.status ?? currentPlant?.Status ?? "Optimal";
  const alertMsg =
    currentPlant?.alert_message ??
    currentPlant?.AlertMessage ??
    "Plant environment is balanced and healthy.";

  const isOptimal = status === "Optimal";
  const needsWater = status === "Needs Water" || moisture < 25;

  return (
    <div
      style={{
        backgroundColor: "var(--card-bg, #ffffff)",
        borderRadius: "20px",
        padding: "26px",
        border: "1px solid var(--brand-100, #dcfce7)",
        boxShadow: "0 10px 30px rgba(0, 30, 15, 0.06)",
        fontFamily: "inherit",
        color: "var(--ink-900, #1b261b)",
        marginBottom: "28px",
      }}
    >
      {/* Header Banner */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          paddingBottom: "20px",
          borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "28px" }}>🌱📡</span>
            <h3
              style={{
                margin: 0,
                fontSize: "20px",
                fontWeight: "700",
                color: "var(--brand-900, #134e4a)",
              }}
            >
              {t("iot.liveTelemetry")}
            </h3>
            <span
              style={{
                padding: "3px 10px",
                borderRadius: "20px",
                fontSize: "11px",
                fontWeight: "700",
                backgroundColor: "#dcfce7",
                color: "#166534",
                letterSpacing: "0.5px",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  backgroundColor: "#22c55e",
                  display: "inline-block",
                  boxShadow: "0 0 8px #22c55e",
                }}
              />
              MQTT + MongoDB Time-Series
            </span>
          </div>
          <p
            style={{
              margin: "6px 0 0 0",
              fontSize: "13px",
              color: "var(--ink-600, #4b5563)",
            }}
          >
            Continuous capacitive soil moisture, ambient climate telemetry & automated watering triggers.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={loadPlants}
            disabled={loading}
            className="btn btn-ghost btn-sm"
            style={{
              fontSize: "12px",
              padding: "7px 14px",
              borderRadius: "8px",
              border: "1px solid var(--ink-200, #e5e7eb)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              cursor: loading ? "wait" : "pointer",
            }}
          >
            <span>🔄</span>
            <span>{loading ? t("actions.loading") : t("actions.refresh")}</span>
          </button>

          <button
            type="button"
            onClick={handleSeed}
            disabled={seeding}
            style={{
              fontSize: "12px",
              padding: "7px 14px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#2d6a4f",
              color: "#ffffff",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              cursor: seeding ? "wait" : "pointer",
              boxShadow: "0 2px 8px rgba(45, 106, 79, 0.25)",
            }}
          >
            <span>⚡</span>
            <span>{seeding ? "Seeding…" : "Seed 24h Telemetry"}</span>
          </button>
        </div>
      </div>

      {/* Specimen Switcher Tabs */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          marginTop: "20px",
        }}
      >
        {plants.map((p) => {
          const pid = p.plant_id || p.PlantID;
          const pName = p.plant_name || p.PlantName || `Specimen #${pid}`;
          const pStatus = p.status || p.Status || "Optimal";
          const active = pid === selectedPlantId;

          return (
            <button
              key={pid}
              type="button"
              onClick={() => setSelectedPlantId(pid)}
              style={{
                padding: "8px 14px",
                borderRadius: "12px",
                fontSize: "12.5px",
                fontWeight: active ? "700" : "500",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                border: active
                  ? "2px solid #2d6a4f"
                  : "1px solid var(--ink-200, #e5e7eb)",
                backgroundColor: active
                  ? "#f0fdf4"
                  : "var(--card-bg, #ffffff)",
                color: active ? "#166534" : "var(--ink-700, #374151)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: active ? "0 2px 6px rgba(45, 106, 79, 0.15)" : "none",
              }}
            >
              <span style={{ fontSize: "14px" }}>
                {pStatus === "Optimal" ? "🟢" : "💧"}
              </span>
              <span>{pName}</span>
            </button>
          );
        })}
      </div>

      {/* Wellness & Status Banner */}
      <div
        style={{
          marginTop: "18px",
          padding: "14px 18px",
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          backgroundColor: isOptimal
            ? "rgba(34, 197, 94, 0.08)"
            : "rgba(234, 88, 12, 0.1)",
          border: isOptimal
            ? "1px solid rgba(34, 197, 94, 0.3)"
            : "1px solid rgba(234, 88, 12, 0.3)",
        }}
      >
        <span style={{ fontSize: "22px" }}>
          {isOptimal ? "🌿" : "⚠️"}
        </span>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontWeight: "700",
              fontSize: "13.5px",
              color: isOptimal ? "#15803d" : "#c2410c",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {status}
          </div>
          <div
            style={{
              fontSize: "12.5px",
              color: "var(--ink-700, #374151)",
              marginTop: "2px",
            }}
          >
            {alertMsg}
          </div>
        </div>
        <div
          style={{
            fontSize: "11px",
            color: "var(--ink-400, #9ca3af)",
            fontWeight: "500",
          }}
        >
          {currentPlant.location || "Smart Garden Planter"}
        </div>
      </div>

      {/* 4 Sensor Metric Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginTop: "20px",
        }}
      >
        {/* Soil Moisture */}
        <div
          style={{
            padding: "18px",
            borderRadius: "14px",
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "12px",
              color: "#64748b",
              fontWeight: "600",
            }}
          >
            <span>{t("iot.soilMoisture")}</span>
            <span style={{ fontSize: "16px" }}>💧</span>
          </div>
          <div
            style={{
              fontSize: "26px",
              fontWeight: "800",
              color: needsWater ? "#dc2626" : "#0f172a",
              marginTop: "8px",
            }}
          >
            {moisture.toFixed(1)}%
          </div>

          {/* Progress bar */}
          <div
            style={{
              width: "100%",
              height: "8px",
              borderRadius: "4px",
              backgroundColor: "#e2e8f0",
              overflow: "hidden",
              marginTop: "12px",
            }}
          >
            <div
              style={{
                width: `${Math.min(100, Math.max(5, moisture))}%`,
                height: "100%",
                backgroundColor:
                  moisture < 25
                    ? "#ef4444"
                    : moisture > 70
                    ? "#3b82f6"
                    : "#10b981",
                transition: "width 0.4s ease",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "10.5px",
              color: "#94a3b8",
              marginTop: "6px",
            }}
          >
            <span>Dry (&lt;25%)</span>
            <span>Target 40-60%</span>
            <span>Wet (&gt;70%)</span>
          </div>
        </div>

        {/* Ambient Temperature */}
        <div
          style={{
            padding: "18px",
            borderRadius: "14px",
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "12px",
              color: "#64748b",
              fontWeight: "600",
            }}
          >
            <span>{t("iot.ambientTemp")}</span>
            <span style={{ fontSize: "16px" }}>🌡️</span>
          </div>
          <div
            style={{
              fontSize: "26px",
              fontWeight: "800",
              color: temp > 34 ? "#ea580c" : "#0f172a",
              marginTop: "8px",
            }}
          >
            {temp.toFixed(1)}°C
          </div>
          <div
            style={{
              fontSize: "11.5px",
              color: "#16a34a",
              marginTop: "12px",
              fontWeight: "500",
            }}
          >
            Botanical range: 18°C – 28°C
          </div>
        </div>

        {/* Air Humidity */}
        <div
          style={{
            padding: "18px",
            borderRadius: "14px",
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "12px",
              color: "#64748b",
              fontWeight: "600",
            }}
          >
            <span>{t("iot.humidity")}</span>
            <span style={{ fontSize: "16px" }}>🌫️</span>
          </div>
          <div
            style={{
              fontSize: "26px",
              fontWeight: "800",
              color: "#0f172a",
              marginTop: "8px",
            }}
          >
            {humidity.toFixed(1)}%
          </div>
          <div
            style={{
              fontSize: "11.5px",
              color: "#64748b",
              marginTop: "12px",
              fontWeight: "500",
            }}
          >
            Tropical indoor baseline
          </div>
        </div>

        {/* Sunlight Lux & Battery */}
        <div
          style={{
            padding: "18px",
            borderRadius: "14px",
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "12px",
              color: "#64748b",
              fontWeight: "600",
            }}
          >
            <span>{t("iot.lightLux")}</span>
            <span style={{ fontSize: "16px" }}>☀️</span>
          </div>
          <div
            style={{
              fontSize: "26px",
              fontWeight: "800",
              color: "#0f172a",
              marginTop: "8px",
            }}
          >
            {lux.toFixed(0)}{" "}
            <span style={{ fontSize: "13px", fontWeight: "500", color: "#94a3b8" }}>
              lux
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "11.5px",
              color: "#64748b",
              marginTop: "12px",
            }}
          >
            <span>{t("iot.battery")}</span>
            <span style={{ fontWeight: "700", color: "#16a34a" }}>
              {battery.toFixed(0)}% 🔋
            </span>
          </div>
        </div>
      </div>

      {/* 12-Hour History Bar Chart */}
      {history.length > 0 && (
        <div
          style={{
            marginTop: "24px",
            paddingTop: "20px",
            borderTop: "1px solid rgba(0, 0, 0, 0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <span
              style={{
                fontSize: "13px",
                fontWeight: "700",
                color: "var(--ink-800, #1f2937)",
              }}
            >
              12-Hour Soil Moisture Time-Series Log ({currentPlant.plant_name || currentPlant.PlantName})
            </span>
            <span style={{ fontSize: "11px", color: "var(--ink-400, #9ca3af)" }}>
              Data Store: {source} • MQTT Topic: kather_baksho/plants/{selectedPlantId}/telemetry
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: "8px",
              height: "80px",
              width: "100%",
              backgroundColor: "#f8fafc",
              padding: "12px 14px",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              boxSizing: "border-box",
            }}
          >
            {history
              .slice(0, 12)
              .reverse()
              .map((h, idx) => {
                const m = h.soil_moisture_pct || h.SoilMoisturePct || 35;
                const heightPct = Math.min(100, Math.max(12, m));
                const isHovered = hoveredBar === idx;

                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredBar(idx)}
                    onMouseLeave={() => setHoveredBar(null)}
                    style={{
                      flex: 1,
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                      alignItems: "center",
                      position: "relative",
                      cursor: "pointer",
                    }}
                  >
                    {isHovered && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: "100%",
                          marginBottom: "6px",
                          backgroundColor: "#0f172a",
                          color: "#ffffff",
                          fontSize: "10.5px",
                          fontWeight: "600",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          whiteSpace: "nowrap",
                          zIndex: 10,
                          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        }}
                      >
                        {m.toFixed(1)}% moisture
                      </div>
                    )}
                    <div
                      style={{
                        width: "100%",
                        height: `${heightPct}%`,
                        backgroundColor:
                          m < 25 ? "#ef4444" : isHovered ? "#16a34a" : "#22c55e",
                        borderRadius: "4px 4px 0 0",
                        transition: "all 0.2s ease",
                      }}
                    />
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
