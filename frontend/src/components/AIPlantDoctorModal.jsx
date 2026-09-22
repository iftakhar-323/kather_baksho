import { useState } from "react";
import API from "../api/axios";
import { useTranslation } from "../i18n/I18nProvider";
import { diagnoseOffline } from "../utils/edgePlantDoctor";
import VoiceSearchButton from "./VoiceSearchButton";

export default function AIPlantDoctorModal({ isOpen, onClose }) {
  const { t, lang } = useTranslation();
  const [tab, setTab] = useState("diagnose"); // 'diagnose' or 'chat'
  const [plantName, setPlantName] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [environment, setEnvironment] = useState("Indoor Living Room");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const speakText = (text) => {
    if (!window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = lang === "bn" ? "bn-BD" : "en-US";
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // Chat tab states
  const [question, setQuestion] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    {
      sender: "doctor",
      text: "Hello! I am your AI Botanical Doctor. Ask me any question about watering schedules, sunlight needs, soil, or diagnosing plant issues!",
    },
  ]);

  if (!isOpen) return null;

  const quickSymptoms = [
    "Yellow leaves (হলুদ পাতা)",
    "Brown crispy tips (বাদামী ডগা)",
    "White spots / Spider mites (সাদা পোকা বা মাকড়)",
    "Drooping / Wilting (গাছ ঝুলে পড়া)",
    "Black mushy roots (শিকড় পচে যাওয়া)",
  ];

  const handleDiagnose = async (e) => {
    e.preventDefault();
    if (!symptoms.trim()) {
      setError("Please specify or select symptoms.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    if (!navigator.onLine) {
      const offlineRes = diagnoseOffline(symptoms, plantName || "Houseplant", null, lang);
      setResult({
        diagnosis: offlineRes.diagnosis,
        confidence: offlineRes.confidence,
        severity: offlineRes.severity,
        remedy: offlineRes.remedy,
        preventative_care: offlineRes.prevention,
        is_edge_ai: true,
      });
      setLoading(false);
      return;
    }

    try {
      const res = await API.post("/ai/diagnose", {
        plant_name: plantName || "Houseplant",
        symptoms,
        environment,
      });
      setResult(res.data);
    } catch (err) {
      console.warn("[AI Doctor] Server diagnosis failed, using offline Edge AI:", err);
      const offlineRes = diagnoseOffline(symptoms, plantName || "Houseplant", null, lang);
      setResult({
        diagnosis: offlineRes.diagnosis,
        confidence: offlineRes.confidence,
        severity: offlineRes.severity,
        remedy: offlineRes.remedy,
        preventative_care: offlineRes.prevention,
        is_edge_ai: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    const userQ = question;
    setChatHistory((prev) => [...prev, { sender: "user", text: userQ }]);
    setQuestion("");
    setChatLoading(true);

    try {
      const res = await API.post("/ai/chat", {
        question: userQ,
        context: plantName || "Houseplants",
      });
      setChatHistory((prev) => [
        ...prev,
        { sender: "doctor", text: res.data.answer },
      ]);
    } catch {
      setChatHistory((prev) => [
        ...prev,
        {
          sender: "doctor",
          text: "I am having trouble connecting right now. Generally, check your plant's soil moisture and light conditions!",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "680px",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          display: "flex",
          flexDirection: "column",
          fontFamily: "system-ui, sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#f0fdf4",
            borderTopLeftRadius: "16px",
            borderTopRightRadius: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "28px" }}>🩺🌿</span>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "20px",
                  fontWeight: "700",
                  color: "#166534",
                }}
              >
                AI Plant Doctor
              </h2>
              <p style={{ margin: 0, fontSize: "13px", color: "#15803d" }}>
                Instant botanical diagnosis & care with offline fallback architecture
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#6b7280",
            }}
          >
            ×
          </button>
        </div>

        {/* Tab switcher */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #e5e7eb",
            background: "#f9fafb",
          }}
        >
          <button
            onClick={() => setTab("diagnose")}
            style={{
              flex: 1,
              padding: "12px",
              border: "none",
              background: tab === "diagnose" ? "#ffffff" : "transparent",
              fontWeight: tab === "diagnose" ? "700" : "500",
              color: tab === "diagnose" ? "#16a34a" : "#6b7280",
              borderBottom:
                tab === "diagnose" ? "2px solid #16a34a" : "transparent",
              cursor: "pointer",
            }}
          >
            🔍 Symptom Diagnosis
          </button>
          <button
            onClick={() => setTab("chat")}
            style={{
              flex: 1,
              padding: "12px",
              border: "none",
              background: tab === "chat" ? "#ffffff" : "transparent",
              fontWeight: tab === "chat" ? "700" : "500",
              color: tab === "chat" ? "#16a34a" : "#6b7280",
              borderBottom:
                tab === "chat" ? "2px solid #16a34a" : "transparent",
              cursor: "pointer",
            }}
          >
            💬 Ask Care Questions
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ padding: "24px" }}>
          {tab === "diagnose" && (
            <div>
              <form onSubmit={handleDiagnose}>
                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: "600",
                      marginBottom: "6px",
                      color: "#374151",
                    }}
                  >
                    Plant Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Monstera, Snake Plant, Ficus Bonsai"
                    value={plantName}
                    onChange={(e) => setPlantName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #d1d5db",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: "600",
                      marginBottom: "6px",
                      color: "#374151",
                    }}
                  >
                    Quick Symptom Selection
                  </label>
                  <div
                    style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}
                  >
                    {quickSymptoms.map((qs, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() =>
                          setSymptoms((prev) => (prev ? `${prev}, ${qs}` : qs))
                        }
                        style={{
                          fontSize: "12px",
                          padding: "6px 12px",
                          borderRadius: "20px",
                          border: "1px solid #86efac",
                          background: "#f0fdf4",
                          color: "#166534",
                          cursor: "pointer",
                        }}
                      >
                        + {qs}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <label
                      style={{
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#374151",
                        margin: 0
                      }}
                    >
                      Observed Symptoms / Notes *
                    </label>
                    <VoiceSearchButton
                      onTranscript={(txt) => setSymptoms((prev) => (prev ? `${prev} ${txt}` : txt))}
                    />
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Describe what you see: discoloration, spots, bugs, leaf curling..."
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #d1d5db",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: "600",
                      marginBottom: "6px",
                      color: "#374151",
                    }}
                  >
                    Plant Environment
                  </label>
                  <select
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #d1d5db",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="Indoor Living Room">Indoor Living Room (Indirect Light)</option>
                    <option value="Balcony / Semi-Outdoor">Balcony / Semi-Outdoor</option>
                    <option value="Direct Sun Rooftop">Direct Sun Rooftop</option>
                    <option value="Air Conditioned Office">Air Conditioned Office (Low Humidity)</option>
                  </select>
                </div>

                {error && (
                  <div
                    style={{
                      color: "#b91c1c",
                      background: "#fee2e2",
                      padding: "10px",
                      borderRadius: "8px",
                      marginBottom: "16px",
                      fontSize: "13px",
                    }}
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "#16a34a",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "600",
                    fontSize: "15px",
                    cursor: loading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  {loading ? "Analyzing Symptoms..." : "Diagnose Plant Now"}
                </button>
              </form>

              {/* Diagnosis Output */}
              {result && (
                <div
                  style={{
                    marginTop: "24px",
                    padding: "20px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "12px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span
                        style={{
                          fontSize: "18px",
                          fontWeight: "700",
                          color: "#0f172a",
                        }}
                      >
                        {result.diagnosis}
                      </span>
                      <button
                        type="button"
                        onClick={() => speakText(`${result.diagnosis}. ${result.remedy || ""} ${result.preventative_care || ""}`)}
                        title="Listen to diagnosis"
                        style={{
                          background: "#f0fdf4",
                          border: "1px solid #86efac",
                          color: "#166534",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        🔊 Listen
                      </button>
                    </div>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "600",
                        background:
                          result.severity === "Severe"
                            ? "#fee2e2"
                            : result.severity === "Moderate"
                            ? "#fef3c7"
                            : "#dcfce7",
                        color:
                          result.severity === "Severe"
                            ? "#b91c1c"
                            : result.severity === "Moderate"
                            ? "#b45309"
                            : "#15803d",
                      }}
                    >
                      {result.is_edge_ai && (
                        <span
                          style={{
                            marginRight: "8px",
                            padding: "4px 8px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "700",
                            background: "#e0e7ff",
                            color: "#4338ca",
                          }}
                        >
                          ⚡ {t("aiDoctor.tabEdge")}
                        </span>
                      )}
                      {result.severity} Severity ({Math.round((result.confidence || 0.85) * 100)}% Confidence)
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: "14px",
                      color: "#475569",
                      lineHeight: "1.5",
                      marginBottom: "16px",
                    }}
                  >
                    <strong>Cause:</strong> {result.cause}
                  </p>

                  <div style={{ marginBottom: "16px" }}>
                    <strong
                      style={{
                        fontSize: "14px",
                        color: "#0f172a",
                        display: "block",
                        marginBottom: "8px",
                      }}
                    >
                      Recommended Treatment Plan:
                    </strong>
                    <ol
                      style={{
                        margin: 0,
                        paddingLeft: "20px",
                        fontSize: "13px",
                        color: "#334155",
                        lineHeight: "1.6",
                      }}
                    >
                      {result.action_plan?.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </div>

                  {result.recommended_products?.length > 0 && (
                    <div style={{ marginBottom: "12px" }}>
                      <strong
                        style={{
                          fontSize: "14px",
                          color: "#0f172a",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        Recommended Care Supplies:
                      </strong>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "8px",
                        }}
                      >
                        {result.recommended_products.map((pname, idx) => (
                          <span
                            key={idx}
                            style={{
                              background: "#ecfdf5",
                              border: "1px solid #a7f3d0",
                              color: "#065f46",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "500",
                            }}
                          >
                            🌿 {pname}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div
                    style={{
                      fontSize: "11px",
                      color: "#94a3b8",
                      borderTop: "1px solid #e2e8f0",
                      paddingTop: "8px",
                      marginTop: "12px",
                      textAlign: "right",
                    }}
                  >
                    Engine: {result.provider_used}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "chat" && (
            <div>
              <div
                style={{
                  height: "300px",
                  overflowY: "auto",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "16px",
                  marginBottom: "16px",
                  background: "#f9fafb",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {chatHistory.map((msg, i) => (
                  <div
                    key={i}
                    style={{
                      alignSelf:
                        msg.sender === "user" ? "flex-end" : "flex-start",
                      background:
                        msg.sender === "user" ? "#16a34a" : "#ffffff",
                      color: msg.sender === "user" ? "#ffffff" : "#1f2937",
                      padding: "10px 14px",
                      borderRadius: "12px",
                      maxWidth: "80%",
                      fontSize: "14px",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                      lineHeight: "1.4",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px"
                    }}
                  >
                    <div>{msg.text}</div>
                    {msg.sender === "doctor" && (
                      <button
                        type="button"
                        onClick={() => speakText(msg.text)}
                        title="Listen to this message"
                        style={{
                          alignSelf: "flex-start",
                          background: "none",
                          border: "none",
                          color: "#16a34a",
                          fontSize: "11px",
                          cursor: "pointer",
                          padding: "2px 4px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                          marginTop: "2px"
                        }}
                      >
                        🔊 Listen
                      </button>
                    )}
                  </div>
                ))}
                {chatLoading && (
                  <div
                    style={{
                      alignSelf: "flex-start",
                      background: "#ffffff",
                      padding: "8px 12px",
                      borderRadius: "12px",
                      fontSize: "13px",
                      color: "#6b7280",
                    }}
                  >
                    Botanical AI is thinking...
                  </div>
                )}
              </div>

              <form
                onSubmit={handleSendChat}
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center" }}>
                  <input
                    type="text"
                    placeholder="Ask a question (e.g. How often to water Snake Plant?)"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 42px 10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #d1d5db",
                      fontSize: "14px",
                      boxSizing: "border-box"
                    }}
                  />
                  <div style={{ position: "absolute", right: "8px" }}>
                    <VoiceSearchButton
                      onTranscript={(txt) => setQuestion(txt)}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={chatLoading}
                  style={{
                    padding: "10px 18px",
                    background: "#16a34a",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "600",
                    cursor: chatLoading ? "not-allowed" : "pointer",
                  }}
                >
                  Send
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

