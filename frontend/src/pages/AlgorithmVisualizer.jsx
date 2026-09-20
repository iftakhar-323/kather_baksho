import { useState, useEffect } from "react";
import API from "../api/axios";

// 8 Delivery Hubs in Dhaka with relative 2D positions for SVG rendering
const HUBS = [
  { id: 0, name: "Central Hub (Mohammadpur)", x: 220, y: 250 },
  { id: 1, name: "Dhanmondi", x: 180, y: 350 },
  { id: 2, name: "Mirpur 10", x: 150, y: 130 },
  { id: 3, name: "Banani", x: 380, y: 150 },
  { id: 4, name: "Gulshan 2", x: 430, y: 230 },
  { id: 5, name: "Uttara Sector 7", x: 360, y: 50 },
  { id: 6, name: "Motijheel Hub", x: 350, y: 410 },
  { id: 7, name: "Old Dhaka", x: 250, y: 460 },
];

const EDGES = [
  { u: 0, v: 1, dist: 4.2 },
  { u: 0, v: 2, dist: 6.5 },
  { u: 0, v: 3, dist: 7.8 },
  { u: 1, v: 6, dist: 5.5 },
  { u: 1, v: 7, dist: 4.8 },
  { u: 2, v: 5, dist: 8.2 },
  { u: 3, v: 4, dist: 3.1 },
  { u: 3, v: 5, dist: 7.0 },
  { u: 4, v: 6, dist: 6.8 },
  { u: 6, v: 7, dist: 3.2 },
];

export default function AlgorithmVisualizer() {
  const [activeTab, setActiveTab] = useState("route"); // 'route', 'binpacking', 'ml'

  // --- Route State ---
  const [startNode, setStartNode] = useState(0);
  const [endNode, setEndNode] = useState(5);
  const [visitedNodes, setVisitedNodes] = useState([]);
  const [shortestPath, setShortestPath] = useState([]);
  const [pathDistance, setPathDistance] = useState(0);
  const [animating, setAnimating] = useState(false);

  // --- Bin Packing State ---
  const [boxCapacity] = useState(24);
  const [itemsToPack, setItemsToPack] = useState([
    { id: 1, name: "Monstera Deliciosa", size: 10, color: "#16a34a" },
    { id: 2, name: "Fiddle Leaf Fig", size: 12, color: "#15803d" },
    { id: 3, name: "Snake Plant", size: 6, color: "#059669" },
    { id: 4, name: "Pothos Vine", size: 4, color: "#10b981" },
    { id: 5, name: "Mini Succulent", size: 3, color: "#34d399" },
    { id: 6, name: "Bonsai Ficus", size: 8, color: "#047857" },
  ]);
  const [packedBins, setPackedBins] = useState([]);

  // --- ML Comparison State ---
  const [mlData, setMlData] = useState(null);
  const [mlLoading, setMlLoading] = useState(false);

  // --- Chaos Engineering State ---
  const [chaosConfig, setChaosConfig] = useState({
    enabled: false,
    latency_ms: 0,
    error_rate_percent: 0,
    target_prefixes: [],
  });
  const [chaosStats, setChaosStats] = useState({
    total_requests: 0,
    delayed_requests: 0,
    injected_failures: 0,
    circuit_breakers: {},
  });
  const [chaosLoading, setChaosLoading] = useState(false);
  const [simResults, setSimResults] = useState([]);

  // --- Dijkstra Algorithm ---
  const runDijkstra = () => {
    setAnimating(true);
    setVisitedNodes([]);
    setShortestPath([]);
    setPathDistance(0);

    const dist = {};
    const prev = {};
    const unvisited = new Set();

    HUBS.forEach((h) => {
      dist[h.id] = Infinity;
      prev[h.id] = null;
      unvisited.add(h.id);
    });

    dist[startNode] = 0;
    const visitedOrder = [];

    while (unvisited.size > 0) {
      let current = null;
      let minD = Infinity;

      unvisited.forEach((id) => {
        if (dist[id] < minD) {
          minD = dist[id];
          current = id;
        }
      });

      if (current === null || minD === Infinity) break;
      if (current === endNode) {
        visitedOrder.push(current);
        break;
      }

      unvisited.delete(current);
      visitedOrder.push(current);

      EDGES.forEach((e) => {
        let neighbor = null;
        if (e.u === current) neighbor = e.v;
        if (e.v === current) neighbor = e.u;

        if (neighbor !== null && unvisited.has(neighbor)) {
          const alt = dist[current] + e.dist;
          if (alt < dist[neighbor]) {
            dist[neighbor] = alt;
            prev[neighbor] = current;
          }
        }
      });
    }

    // Reconstruct path
    const path = [];
    let curr = endNode;
    while (curr !== null) {
      path.unshift(curr);
      curr = prev[curr];
    }

    // Animate visit steps
    let idx = 0;
    const interval = setInterval(() => {
      if (idx < visitedOrder.length) {
        setVisitedNodes((prevNodes) => [...prevNodes, visitedOrder[idx]]);
        idx++;
      } else {
        clearInterval(interval);
        setShortestPath(path);
        setPathDistance(dist[endNode] === Infinity ? 0 : dist[endNode]);
        setAnimating(false);
      }
    }, 250);
  };

  useEffect(() => {
    runDijkstra();
  }, [startNode, endNode]);

  // --- First-Fit Decreasing Bin Packing ---
  useEffect(() => {
    // Sort items descending by size
    const sorted = [...itemsToPack].sort((a, b) => b.size - a.size);
    const bins = [];

    sorted.forEach((item) => {
      let placed = false;
      for (let b of bins) {
        if (b.used + item.size <= boxCapacity) {
          b.items.push(item);
          b.used += item.size;
          placed = true;
          break;
        }
      }
      if (!placed) {
        bins.push({
          id: bins.length + 1,
          used: item.size,
          items: [item],
        });
      }
    });

    setPackedBins(bins);
  }, [itemsToPack, boxCapacity]);

  const addPlantItem = (name, size, color) => {
    setItemsToPack((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), name, size, color },
    ]);
  };

  const removePlantItem = (id) => {
    setItemsToPack((prev) => prev.filter((it) => it.id !== id));
  };

  // --- ML Benchmark Fetch ---
  const fetchMlComparison = async () => {
    setMlLoading(true);
    try {
      const res = await API.get("/ml/compare");
      setMlData(res.data);
    } catch {
      // fallback mock for standalone frontend preview
      setMlData({
        input_category: "Monstera - Chlorosis / Overwatering",
        model_a: {
          model_name: "MobilePlantNet-v3",
          architecture: "MobileNetV3-Small (Quantized INT8)",
          latency_ms: 4.85,
          confidence: 0.924,
          memory_alloc_mb: 12.4,
          throughput_inferences_per_sec: 206.2,
          prediction: "Chlorosis / Overwatering",
          precision_score: 0.912,
        },
        model_b: {
          model_name: "DeepBotanist-ResNet50",
          architecture: "ResNet50-DeepFeatureExtractor (FP32)",
          latency_ms: 31.42,
          confidence: 0.978,
          memory_alloc_mb: 64.8,
          throughput_inferences_per_sec: 31.8,
          prediction: "Nitrogen Deficiency Induced Chlorosis (Subtype-II)",
          precision_score: 0.968,
        },
        latency_speedup: "Model A is 6.47x faster than Model B",
        confidence_delta: "5.4% differential",
        recommendation:
          "Use Model A (MobilePlantNet) for low-latency edge devices and fast mobile checkouts.",
      });
    } finally {
      setMlLoading(false);
    }
  };

  const fetchChaosData = async () => {
    try {
      const [cfgRes, statRes] = await Promise.all([
        API.get("/chaos/config"),
        API.get("/chaos/stats"),
      ]);
      setChaosConfig(cfgRes.data);
      setChaosStats(statRes.data);
    } catch (err) {
      console.error("Failed to load chaos configuration", err);
    }
  };

  const handleUpdateChaos = async (newConfig) => {
    setChaosLoading(true);
    try {
      const res = await API.post("/chaos/config", newConfig);
      setChaosConfig(res.data.config);
      await fetchChaosData();
    } catch (err) {
      alert("Failed to update chaos configuration: " + err.message);
    } finally {
      setChaosLoading(false);
    }
  };

  const handleResetChaos = async () => {
    setChaosLoading(true);
    try {
      const res = await API.post("/chaos/reset");
      setChaosConfig(res.data.config);
      setChaosStats(res.data.stats);
      setSimResults([]);
      alert("Baseline restored! All injected faults and circuit breakers have been reset.");
    } catch (err) {
      alert("Failed to reset chaos: " + err.message);
    } finally {
      setChaosLoading(false);
    }
  };

  const handleTripBreaker = async (name) => {
    try {
      await API.post("/chaos/trip-breaker", { name });
      await fetchChaosData();
    } catch (err) {
      alert("Failed to trip breaker: " + err.message);
    }
  };

  const runChaosSimulation = async () => {
    setSimResults([]);
    const results = [];
    for (let i = 1; i <= 10; i++) {
      const start = performance.now();
      try {
        const res = await API.get("/products?limit=1");
        const duration = Math.round(performance.now() - start);
        results.push({ id: i, status: res.status, duration, ok: true });
      } catch (err) {
        const duration = Math.round(performance.now() - start);
        results.push({
          id: i,
          status: err.response?.status || 503,
          duration,
          ok: false,
          error: err.response?.data?.error || err.message,
        });
      }
      setSimResults([...results]);
    }
    await fetchChaosData();
  };

  useEffect(() => {
    if (activeTab === "ml" && !mlData) {
      fetchMlComparison();
    }
    if (activeTab === "chaos") {
      fetchChaosData();
      const interval = setInterval(fetchChaosData, 3000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px 16px", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#1e293b", margin: "0 0 8px 0" }}>
          ⚡ Engineering & Algorithm Studio
        </h1>
        <p style={{ color: "#64748b", margin: 0, fontSize: "15px" }}>
          Interactive visualization of supply chain optimization, nursery bin-packing, resilience testing, and machine learning telemetry.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "10px", borderBottom: "1px solid #e2e8f0", marginBottom: "24px" }}>
        {[
          { id: "route", label: "🗺️ Delivery Route (Dijkstra / TSP)" },
          { id: "binpacking", label: "📦 Nursery Box Packing (Bin Packing)" },
          { id: "ml", label: "🧠 ML Model Benchmarking (MobileNet vs ResNet)" },
          { id: "chaos", label: "💥 Chaos & Resilience Studio (Fault Injection)" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: "12px 18px",
              background: activeTab === t.id ? "#f0fdf4" : "transparent",
              color: activeTab === t.id ? "#16a34a" : "#64748b",
              border: "none",
              borderBottom: activeTab === t.id ? "3px solid #16a34a" : "3px solid transparent",
              fontWeight: activeTab === t.id ? "700" : "500",
              cursor: "pointer",
              fontSize: "14px",
              borderRadius: "6px 6px 0 0",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: Route Optimization (Dijkstra) ── */}
      {activeTab === "route" && (
        <div style={{ background: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", gap: "16px" }}>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: "700", margin: "0 0 4px 0", color: "#0f172a" }}>
                Dhaka Nursery Hub Route Optimization
              </h2>
              <span style={{ fontSize: "13px", color: "#64748b" }}>
                Shortest distance: <strong>{pathDistance.toFixed(1)} km</strong> | Path:{" "}
                <span style={{ color: "#16a34a", fontWeight: "600" }}>
                  {shortestPath.map((id) => HUBS[id].name).join(" ➔ ")}
                </span>
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "#475569", display: "block" }}>Origin Hub:</label>
                <select
                  value={startNode}
                  onChange={(e) => setStartNode(Number(e.target.value))}
                  style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                >
                  {HUBS.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: "12px", color: "#475569", display: "block" }}>Destination:</label>
                <select
                  value={endNode}
                  onChange={(e) => setEndNode(Number(e.target.value))}
                  style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                >
                  {HUBS.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={runDijkstra}
                disabled={animating}
                style={{
                  marginTop: "16px",
                  padding: "9px 16px",
                  background: "#16a34a",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                {animating ? "Calculating..." : "Re-Calculate"}
              </button>
            </div>
          </div>

          {/* SVG Graph Canvas */}
          <div style={{ background: "#f8fafc", borderRadius: "12px", border: "1px solid #cbd5e1", overflow: "hidden", display: "flex", justifyContent: "center" }}>
            <svg width="600" height="520" viewBox="50 20 500 480" style={{ maxWidth: "100%" }}>
              {/* Edges */}
              {EDGES.map((e, idx) => {
                const u = HUBS[e.u];
                const v = HUBS[e.v];
                const isShortestEdge =
                  shortestPath.some((node, i) => shortestPath[i + 1] !== undefined && ((node === e.u && shortestPath[i + 1] === e.v) || (node === e.v && shortestPath[i + 1] === e.u)));

                return (
                  <g key={idx}>
                    <line
                      x1={u.x}
                      y1={u.y}
                      x2={v.x}
                      y2={v.y}
                      stroke={isShortestEdge ? "#16a34a" : "#cbd5e1"}
                      strokeWidth={isShortestEdge ? 4 : 2}
                      strokeDasharray={isShortestEdge ? "none" : "4 4"}
                    />
                    <text
                      x={(u.x + v.x) / 2}
                      y={(u.y + v.y) / 2 - 6}
                      fill={isShortestEdge ? "#166534" : "#94a3b8"}
                      fontSize="11"
                      fontWeight={isShortestEdge ? "bold" : "normal"}
                      textAnchor="middle"
                    >
                      {e.dist}km
                    </text>
                  </g>
                );
              })}

              {/* Nodes */}
              {HUBS.map((h) => {
                const isStart = h.id === startNode;
                const isEnd = h.id === endNode;
                const isVisited = visitedNodes.includes(h.id);
                const isPath = shortestPath.includes(h.id);

                let fill = "#ffffff";
                let stroke = "#94a3b8";
                if (isVisited) {
                  fill = "#fef08a";
                  stroke = "#ca8a04";
                }
                if (isPath) {
                  fill = "#bbf7d0";
                  stroke = "#16a34a";
                }
                if (isStart) {
                  fill = "#3b82f6";
                  stroke = "#1d4ed8";
                }
                if (isEnd) {
                  fill = "#ef4444";
                  stroke = "#b91c1c";
                }

                return (
                  <g key={h.id}>
                    <circle cx={h.x} cy={h.y} r={16} fill={fill} stroke={stroke} strokeWidth={3} />
                    <text x={h.x} y={h.y + 4} fontSize="11" fontWeight="bold" textAnchor="middle" fill={isStart || isEnd ? "#ffffff" : "#0f172a"}>
                      {h.id}
                    </text>
                    <text x={h.x} y={h.y + 30} fontSize="12" fontWeight="600" textAnchor="middle" fill="#334155">
                      {h.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      )}

      {/* ── TAB 2: Nursery Box Packing (Bin Packing) ── */}
      {activeTab === "binpacking" && (
        <div style={{ background: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "700", margin: "0 0 4px 0" }}>
              First-Fit Decreasing Box Packing Optimization
            </h2>
            <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>
              Calculates the minimum number of shipping cartons required for plant deliveries to eliminate box void space and transport cost.
            </p>
          </div>

          {/* Quick Add Items */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "24px" }}>
            <button
              onClick={() => addPlantItem("Monstera Deliciosa", 10, "#16a34a")}
              style={{ padding: "8px 12px", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "8px", color: "#166534", cursor: "pointer", fontSize: "13px" }}
            >
              + Large Monstera (10 units)
            </button>
            <button
              onClick={() => addPlantItem("Fiddle Fig Tree", 12, "#15803d")}
              style={{ padding: "8px 12px", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "8px", color: "#166534", cursor: "pointer", fontSize: "13px" }}
            >
              + Tall Fiddle Fig (12 units)
            </button>
            <button
              onClick={() => addPlantItem("Snake Plant", 6, "#059669")}
              style={{ padding: "8px 12px", background: "#ecfdf5", border: "1px solid #6ee7b7", borderRadius: "8px", color: "#065f46", cursor: "pointer", fontSize: "13px" }}
            >
              + Medium Snake Plant (6 units)
            </button>
            <button
              onClick={() => addPlantItem("Potted Succulent", 3, "#34d399")}
              style={{ padding: "8px 12px", background: "#ecfdf5", border: "1px solid #6ee7b7", borderRadius: "8px", color: "#065f46", cursor: "pointer", fontSize: "13px" }}
            >
              + Small Succulent (3 units)
            </button>
          </div>

          {/* Cartons Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
            {packedBins.map((bin) => {
              const utilPercent = Math.round((bin.used / boxCapacity) * 100);
              return (
                <div key={bin.id} style={{ border: "2px dashed #cbd5e1", borderRadius: "12px", padding: "16px", background: "#f8fafc" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span style={{ fontWeight: "700", color: "#0f172a" }}>📦 Carton Box #{bin.id}</span>
                    <span style={{ fontSize: "12px", fontWeight: "600", color: utilPercent > 80 ? "#16a34a" : "#d97706" }}>
                      {bin.used}/{boxCapacity} units ({utilPercent}% full)
                    </span>
                  </div>

                  {/* Progress fill */}
                  <div style={{ height: "8px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden", marginBottom: "14px" }}>
                    <div style={{ width: `${utilPercent}%`, height: "100%", background: utilPercent > 80 ? "#16a34a" : "#f59e0b" }} />
                  </div>

                  {/* Items inside bin */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {bin.items.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "6px 10px",
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "6px",
                          fontSize: "13px",
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: item.color }} />
                          {item.name}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ color: "#64748b", fontSize: "12px" }}>{item.size}u</span>
                          <button
                            onClick={() => removePlantItem(item.id)}
                            style={{ border: "none", background: "none", color: "#ef4444", cursor: "pointer", fontSize: "14px" }}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 3: Machine Learning Model Benchmarking ── */}
      {activeTab === "ml" && (
        <div style={{ background: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: "700", margin: "0 0 4px 0" }}>
                Machine Learning Model Inference Comparison
              </h2>
              <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>
                Live comparative analysis between lightweight on-device INT8 models versus deep cloud neural networks.
              </p>
            </div>
            <button
              onClick={fetchMlComparison}
              disabled={mlLoading}
              style={{
                padding: "8px 16px",
                background: "#16a34a",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              {mlLoading ? "Benchmarking..." : "Run Fresh Benchmark"}
            </button>
          </div>

          {mlData && (
            <div>
              {/* Telemetry Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
                {/* Model A Card */}
                <div style={{ padding: "20px", borderRadius: "12px", border: "2px solid #86efac", background: "#f0fdf4" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                    <span style={{ fontSize: "16px", fontWeight: "800", color: "#166534" }}>{mlData.model_a.model_name}</span>
                    <span style={{ fontSize: "12px", background: "#dcfce7", color: "#15803d", padding: "4px 8px", borderRadius: "6px", fontWeight: "700" }}>
                      EDGE / ON-DEVICE
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#475569", marginBottom: "16px" }}>{mlData.model_a.architecture}</div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px" }}>
                    <div>
                      <span style={{ color: "#64748b" }}>Latency:</span>
                      <div style={{ fontSize: "20px", fontWeight: "800", color: "#16a34a" }}>{mlData.model_a.latency_ms} ms</div>
                    </div>
                    <div>
                      <span style={{ color: "#64748b" }}>Confidence:</span>
                      <div style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>{Math.round(mlData.model_a.confidence * 100)}%</div>
                    </div>
                    <div>
                      <span style={{ color: "#64748b" }}>Memory Footprint:</span>
                      <div style={{ fontWeight: "700" }}>{mlData.model_a.memory_alloc_mb} MB</div>
                    </div>
                    <div>
                      <span style={{ color: "#64748b" }}>Throughput:</span>
                      <div style={{ fontWeight: "700" }}>{mlData.model_a.throughput_inferences_per_sec} inf/s</div>
                    </div>
                  </div>
                </div>

                {/* Model B Card */}
                <div style={{ padding: "20px", borderRadius: "12px", border: "2px solid #cbd5e1", background: "#f8fafc" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                    <span style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>{mlData.model_b.model_name}</span>
                    <span style={{ fontSize: "12px", background: "#e2e8f0", color: "#334155", padding: "4px 8px", borderRadius: "6px", fontWeight: "700" }}>
                      CLOUD / SERVER
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#475569", marginBottom: "16px" }}>{mlData.model_b.architecture}</div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px" }}>
                    <div>
                      <span style={{ color: "#64748b" }}>Latency:</span>
                      <div style={{ fontSize: "20px", fontWeight: "800", color: "#64748b" }}>{mlData.model_b.latency_ms} ms</div>
                    </div>
                    <div>
                      <span style={{ color: "#64748b" }}>Confidence:</span>
                      <div style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>{Math.round(mlData.model_b.confidence * 100)}%</div>
                    </div>
                    <div>
                      <span style={{ color: "#64748b" }}>Memory Footprint:</span>
                      <div style={{ fontWeight: "700" }}>{mlData.model_b.memory_alloc_mb} MB</div>
                    </div>
                    <div>
                      <span style={{ color: "#64748b" }}>Throughput:</span>
                      <div style={{ fontWeight: "700" }}>{mlData.model_b.throughput_inferences_per_sec} inf/s</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tradeoff Summary */}
              <div style={{ padding: "16px", background: "#f1f5f9", borderRadius: "8px", fontSize: "14px", lineHeight: "1.6" }}>
                <strong style={{ color: "#0f172a" }}>Analysis & Recommendation:</strong>
                <p style={{ margin: "4px 0 0 0", color: "#334155" }}>
                  {mlData.latency_speedup}. {mlData.recommendation}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: Chaos & Resilience Studio ── */}
      {activeTab === "chaos" && (
        <div style={{ background: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: "0 0 6px 0" }}>
                💥 Chaos Engineering & Circuit Breaker Studio
              </h2>
              <p style={{ color: "#64748b", margin: 0, fontSize: "14px" }}>
                Inject controlled network latency, server fault spikes, and test automatic Circuit Breaker tripping without breaking production.
              </p>
            </div>
            <button
              onClick={handleResetChaos}
              style={{
                padding: "8px 16px",
                background: "#f1f5f9",
                color: "#0f172a",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                fontWeight: "600",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              🔄 Reset to Healthy Baseline
            </button>
          </div>

          {/* Master Switch & Live Counters */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
            <div style={{ padding: "16px", borderRadius: "10px", background: chaosConfig.enabled ? "#fee2e2" : "#f0fdf4", border: chaosConfig.enabled ? "1px solid #f87171" : "1px solid #86efac" }}>
              <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>CHAOS ENGINE STATUS</div>
              <div style={{ fontSize: "18px", fontWeight: "800", color: chaosConfig.enabled ? "#dc2626" : "#16a34a", margin: "6px 0" }}>
                {chaosConfig.enabled ? "🔥 ACTIVE FAULT" : "🛡️ INACTIVE (SAFE)"}
              </div>
              <button
                onClick={() => handleUpdateChaos({ ...chaosConfig, enabled: !chaosConfig.enabled })}
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  background: chaosConfig.enabled ? "#dc2626" : "#16a34a",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                {chaosConfig.enabled ? "Disarm Chaos" : "Arm / Enable Chaos"}
              </button>
            </div>

            <div style={{ padding: "16px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>TOTAL REQUESTS</div>
              <div style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", marginTop: "8px" }}>
                {chaosStats.total_requests}
              </div>
            </div>

            <div style={{ padding: "16px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>DELAYED (LATENCY)</div>
              <div style={{ fontSize: "24px", fontWeight: "800", color: "#d97706", marginTop: "8px" }}>
                {chaosStats.delayed_requests}
              </div>
            </div>

            <div style={{ padding: "16px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>INJECTED FAILURES</div>
              <div style={{ fontSize: "24px", fontWeight: "800", color: "#dc2626", marginTop: "8px" }}>
                {chaosStats.injected_failures}
              </div>
            </div>
          </div>

          {/* Fault Sliders */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px", background: "#f8fafc", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <div>
              <label style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: "600", color: "#334155", marginBottom: "8px" }}>
                <span>Artificial Latency Delay:</span>
                <span style={{ color: "#d97706", fontWeight: "700" }}>{chaosConfig.latency_ms} ms</span>
              </label>
              <input
                type="range"
                min="0"
                max="2000"
                step="50"
                value={chaosConfig.latency_ms}
                onChange={(e) => setChaosConfig({ ...chaosConfig, latency_ms: parseInt(e.target.value) })}
                style={{ width: "100%", cursor: "pointer" }}
              />
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                Simulates cellular 3G network jitter and slow third-party responses.
              </div>
            </div>

            <div>
              <label style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: "600", color: "#334155", marginBottom: "8px" }}>
                <span>Error Injection Probability:</span>
                <span style={{ color: "#dc2626", fontWeight: "700" }}>{chaosConfig.error_rate_percent}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={chaosConfig.error_rate_percent}
                onChange={(e) => setChaosConfig({ ...chaosConfig, error_rate_percent: parseInt(e.target.value) })}
                style={{ width: "100%", cursor: "pointer" }}
              />
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                Randomly throws HTTP 503 Service Unavailable to test client retry logic.
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
            <button
              onClick={() => handleUpdateChaos(chaosConfig)}
              disabled={chaosLoading}
              style={{
                padding: "10px 20px",
                background: "#0f172a",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              {chaosLoading ? "Applying..." : "Save Fault Parameters"}
            </button>
            <button
              onClick={runChaosSimulation}
              style={{
                padding: "10px 20px",
                background: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              🚀 Fire 10 Simulated Requests
            </button>
          </div>

          {/* Circuit Breakers Health Grid */}
          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", marginBottom: "12px" }}>
              🔌 Circuit Breakers State Monitor
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
              {Object.entries(chaosStats.circuit_breakers || {}).map(([name, state]) => (
                <div
                  key={name}
                  style={{
                    padding: "14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: state === "CLOSED" ? "#f0fdf4" : state === "OPEN" ? "#fef2f2" : "#fefce8",
                  }}
                >
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a", marginBottom: "4px" }}>{name}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "800",
                        color: state === "CLOSED" ? "#16a34a" : state === "OPEN" ? "#dc2626" : "#ca8a04",
                      }}
                    >
                      {state === "CLOSED" ? "● CLOSED (HEALTHY)" : state === "OPEN" ? "■ OPEN (TRIPPED)" : "▲ HALF-OPEN"}
                    </span>
                    <button
                      onClick={() => handleTripBreaker(name)}
                      style={{
                        padding: "2px 6px",
                        fontSize: "11px",
                        background: "#fff",
                        border: "1px solid #cbd5e1",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Trip
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Simulation Output */}
          {simResults.length > 0 && (
            <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "14px", fontWeight: "700", marginBottom: "10px" }}>Simulated Request Stream:</div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {simResults.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      padding: "6px 10px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "700",
                      background: r.ok ? "#dcfce7" : "#fee2e2",
                      color: r.ok ? "#15803d" : "#dc2626",
                      border: r.ok ? "1px solid #86efac" : "1px solid #f87171",
                    }}
                  >
                    #{r.id} {r.status} ({r.duration}ms)
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

