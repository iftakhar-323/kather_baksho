import { useState, useEffect, useRef } from "react";

export default function LiveDeliveryRadar({ orderId = 1 }) {
  const [status, setStatus] = useState("Connecting to live GPS stream...");
  const [checkpoint, setCheckpoint] = useState(null);
  const [connected, setConnected] = useState(false);
  const [logs, setLogs] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    // Connect to WebSocket via Traefik gateway or direct Go backend
    const host = window.location.port === "8085" ? window.location.host : `${window.location.hostname || "localhost"}:8081`;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${host}/ws/orders/${orderId}/track`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setStatus("Connected to Live Courier Transponder");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === "gps_update") {
          setCheckpoint(data);
          setStatus(`In Transit: ${data.location}`);
          setLogs((prev) => [
            {
              time: new Date().toLocaleTimeString(),
              location: data.location,
              lat: data.lat,
              lng: data.lng,
              speed: data.speed_kmh,
              step: data.step,
            },
            ...prev.slice(0, 5),
          ]);
        }
      } catch (err) {
        console.warn("WebSocket parse error:", err);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      setStatus("Tracking session completed / disconnected");
    };

    ws.onerror = (err) => {
      console.warn("WebSocket error:", err);
      setConnected(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [orderId]);

  const progress = checkpoint?.progress_percent ?? 20;
  const speed = checkpoint?.speed_kmh ?? 0;
  const eta = checkpoint?.eta_minutes ?? 25;
  const step = checkpoint?.step ?? 1;
  const totalSteps = checkpoint?.total_steps ?? 6;
  const rider = checkpoint?.rider_name || "Mohammad Al-Amin";
  const note = checkpoint?.note || "Package secured in botanical protective wooden frame.";

  return (
    <div className="bg-white dark:bg-zinc-900 border border-emerald-100 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      {/* Header with Live Badge */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-emerald-50 dark:border-zinc-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛵📍</span>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Live Order #{orderId} Real-Time GPS Tracking
            </h3>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                connected
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 animate-pulse"
                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-500" : "bg-zinc-400"}`} />
              {connected ? "LIVE GPS STREAM" : "OFFLINE"}
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Real-time courier telemetry powered by Go Goroutines & WebSockets
          </p>
        </div>

        {/* Courier Rider Card */}
        <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-2 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
          <span className="text-2xl">👨‍🌾</span>
          <div className="text-xs">
            <div className="font-bold text-emerald-900 dark:text-emerald-200">{rider}</div>
            <div className="text-emerald-700 dark:text-emerald-400 font-mono">EV-Van #DH-902 · +880 1711-234567</div>
          </div>
        </div>
      </div>

      {/* Real-Time Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
        <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
          <span className="text-[11px] text-zinc-500">Current Checkpoint</span>
          <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-1 truncate">
            {checkpoint?.location || "Mirpur Botanical Hub"}
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
            Checkpoint {step} of {totalSteps}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
          <span className="text-[11px] text-zinc-500">Estimated Arrival</span>
          <div className="text-xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
            {eta > 0 ? `${eta} mins` : "Arrived! 🏡"}
          </div>
          <div className="text-[10px] text-zinc-400 mt-1">Dynamic Dijkstra ETA</div>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
          <span className="text-[11px] text-zinc-500">Transit Speed</span>
          <div className="text-xl font-black text-zinc-900 dark:text-zinc-100 mt-1">
            {speed.toFixed(1)} <span className="text-xs font-normal text-zinc-400">km/h</span>
          </div>
          <div className="text-[10px] text-zinc-400 mt-1">Eco-electric delivery van</div>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
          <span className="text-[11px] text-zinc-500">Route Progress</span>
          <div className="text-xl font-black text-zinc-900 dark:text-zinc-100 mt-1">
            {progress}%
          </div>
          <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className="bg-emerald-600 h-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Live Route Milestones Visualizer */}
      <div className="mt-6 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/20 border border-zinc-100 dark:border-zinc-800">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
            Dhaka City Delivery Checkpoints
          </span>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 italic">
            "{note}"
          </span>
        </div>

        {/* Milestone Steps */}
        <div className="flex items-center justify-between relative mt-4 px-2">
          {/* Connecting Line */}
          <div className="absolute left-6 right-6 top-3 h-0.5 bg-zinc-200 dark:bg-zinc-700 z-0" />
          <div
            className="absolute left-6 top-3 h-0.5 bg-emerald-600 transition-all duration-700 z-0"
            style={{ width: `calc(${progress}% - 32px)` }}
          />

          {[
            { s: 1, label: "Mirpur Hub" },
            { s: 2, label: "Mirpur 10" },
            { s: 3, label: "Agargaon" },
            { s: 4, label: "Bijoy Sarani" },
            { s: 5, label: "Local Area" },
            { s: 6, label: "Doorstep" },
          ].map((m) => {
            const passed = step >= m.s;
            const current = step === m.s;

            return (
              <div key={m.s} className="flex flex-col items-center gap-2 z-10">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    current
                      ? "bg-emerald-600 text-white ring-4 ring-emerald-100 dark:ring-emerald-950/80 scale-110"
                      : passed
                      ? "bg-emerald-500 text-white"
                      : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500"
                  }`}
                >
                  {passed && !current ? "✓" : m.s}
                </div>
                <span className="text-[10px] font-medium text-zinc-600 dark:text-zinc-400 hidden sm:inline">
                  {m.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live GPS Telemetry Log */}
      {logs.length > 0 && (
        <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
          <span>
            📍 Lat: <strong className="text-zinc-700 dark:text-zinc-300 font-mono">{logs[0].lat}</strong> | Lng:{" "}
            <strong className="text-zinc-700 dark:text-zinc-300 font-mono">{logs[0].lng}</strong>
          </span>
          <span>Last ping: {logs[0].time}</span>
        </div>
      )}
    </div>
  );
}
