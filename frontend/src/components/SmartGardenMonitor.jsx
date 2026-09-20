import { useState, useEffect, useCallback } from "react";
import API from "../api/axios";

export default function SmartGardenMonitor() {
  const [plants, setPlants] = useState([]);
  const [selectedPlantId, setSelectedPlantId] = useState(1);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [source, setSource] = useState("mongodb");

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

  const currentPlant = plants.find(
    (p) => (p.plant_id || p.PlantID) === selectedPlantId
  ) || plants[0];

  const moisture = currentPlant?.soil_moisture_pct ?? currentPlant?.SoilMoisturePct ?? 45;
  const temp = currentPlant?.ambient_temp_c ?? currentPlant?.AmbientTempC ?? 24;
  const humidity = currentPlant?.humidity_pct ?? currentPlant?.HumidityPct ?? 60;
  const lux = currentPlant?.light_lux ?? currentPlant?.LightLux ?? 600;
  const battery = currentPlant?.battery_pct ?? currentPlant?.BatteryPct ?? 92;
  const status = currentPlant?.status ?? currentPlant?.Status ?? "Optimal";
  const alertMsg = currentPlant?.alert_message ?? currentPlant?.AlertMessage ?? "";

  const isAlert = status !== "Optimal";

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-emerald-100 dark:border-zinc-800 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-emerald-50 dark:border-zinc-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌱📡</span>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Smart Garden IoT Telemetry
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              MongoDB Time-Series
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Live soil moisture, micro-climate telemetry & automated irrigation alerts powered by MongoDB NoSQL store
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadPlants}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg transition"
          >
            {loading ? "Refreshing..." : "🔄 Refresh"}
          </button>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="px-3 py-1.5 text-xs font-medium bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition"
          >
            {seeding ? "Seeding..." : "⚡ Seed 24h IoT Data"}
          </button>
        </div>
      </div>

      {/* Plant Selectors Tabs */}
      <div className="flex flex-wrap gap-2 mt-5">
        {plants.map((p) => {
          const pid = p.plant_id || p.PlantID;
          const pName = p.plant_name || p.PlantName || `Plant #${pid}`;
          const pStatus = p.status || p.Status;
          const active = pid === selectedPlantId;

          return (
            <button
              key={pid}
              onClick={() => setSelectedPlantId(pid)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition ${
                active
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-200 shadow-sm"
                  : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              }`}
            >
              <span>{pStatus === "Optimal" ? "🟢" : "⚠️"}</span>
              <span>{pName}</span>
            </button>
          );
        })}
      </div>

      {/* Alert Warning Box */}
      {isAlert && (
        <div className="mt-4 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <div className="text-xs">
            <span className="font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wide">
              {status}:
            </span>{" "}
            <span className="text-amber-800 dark:text-amber-300">{alertMsg}</span>
          </div>
        </div>
      )}

      {/* Active Sensor Gauges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
        {/* Soil Moisture */}
        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
          <div className="flex justify-between items-center text-xs text-zinc-500 dark:text-zinc-400">
            <span>Soil Moisture</span>
            <span>💧</span>
          </div>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-2">
            {moisture.toFixed(1)}%
          </div>
          <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden mt-3">
            <div
              className={`h-full transition-all duration-500 ${
                moisture < 25 ? "bg-red-500" : moisture > 70 ? "bg-blue-500" : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(100, Math.max(5, moisture))}%` }}
            />
          </div>
          <div className="text-[10px] text-zinc-400 mt-1 flex justify-between">
            <span>Dry (&lt;25%)</span>
            <span>Wet (&gt;70%)</span>
          </div>
        </div>

        {/* Ambient Temperature */}
        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
          <div className="flex justify-between items-center text-xs text-zinc-500 dark:text-zinc-400">
            <span>Temperature</span>
            <span>🌡️</span>
          </div>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-2">
            {temp.toFixed(1)}°C
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-3 font-medium">
            Ideal botanical range: 18–28°C
          </p>
        </div>

        {/* Relative Humidity */}
        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
          <div className="flex justify-between items-center text-xs text-zinc-500 dark:text-zinc-400">
            <span>Air Humidity</span>
            <span>🌫️</span>
          </div>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-2">
            {humidity.toFixed(1)}%
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-3 font-medium">
            Tropical canopy baseline
          </p>
        </div>

        {/* Sunlight Lux */}
        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
          <div className="flex justify-between items-center text-xs text-zinc-500 dark:text-zinc-400">
            <span>Sunlight / Lux</span>
            <span>☀️</span>
          </div>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-2">
            {lux.toFixed(0)} <span className="text-xs font-normal text-zinc-400">lux</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mt-3">
            <span>Sensor Battery</span>
            <span className="font-semibold text-emerald-600">{battery}% 🔋</span>
          </div>
        </div>
      </div>

      {/* 12-Hour Moisture Trend Mini Sparkline */}
      {history.length > 0 && (
        <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              12-Hour Soil Moisture Trend ({currentPlant?.plant_name || currentPlant?.PlantName})
            </span>
            <span className="text-[10px] text-zinc-400">Database: {source}</span>
          </div>
          <div className="flex items-end gap-1.5 h-14 w-full bg-zinc-50 dark:bg-zinc-800/30 p-2 rounded-lg">
            {history.slice(0, 12).reverse().map((h, idx) => {
              const m = h.soil_moisture_pct || h.SoilMoisturePct || 30;
              const heightPct = Math.min(100, Math.max(10, m));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div
                    className={`w-full rounded-t transition-all ${
                      m < 25 ? "bg-red-400" : "bg-emerald-500"
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                  <div className="absolute -top-7 hidden group-hover:block bg-zinc-900 text-white text-[9px] px-1.5 py-0.5 rounded shadow z-10 whitespace-nowrap">
                    {m.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

