import { useState, useEffect } from "react";
import { useTranslation } from "../i18n/I18nProvider";

export default function OfflineBanner() {
  const { t } = useTranslation();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowReconnected(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline && !showReconnected) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        padding: "10px 16px",
        fontSize: "13.5px",
        fontWeight: 500,
        backgroundColor: isOffline ? "#854d0e" : "#15803d",
        color: "#ffffff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        transition: "all 0.3s ease",
      }}
    >
      <span style={{ fontSize: "16px" }}>{isOffline ? "📡" : "✅"}</span>
      <span>
        {isOffline ? t("pwa.offlineBanner") : t("pwa.reconnected")}
      </span>
      {isOffline && (
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            background: "rgba(255, 255, 255, 0.2)",
            border: "1px solid rgba(255, 255, 255, 0.4)",
            color: "#fff",
            borderRadius: "4px",
            padding: "2px 10px",
            fontSize: "12px",
            cursor: "pointer",
            marginLeft: "8px",
          }}
        >
          {t("actions.retry")}
        </button>
      )}
    </div>
  );
}
