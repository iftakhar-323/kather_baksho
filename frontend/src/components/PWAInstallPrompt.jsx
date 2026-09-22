import { useState, useEffect } from "react";
import { useTranslation } from "../i18n/I18nProvider";

export default function PWAInstallPrompt() {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    ) {
      setIsInstalled(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled || isDismissed || !deferredPrompt) return null;

  return (
    <aside
      aria-label="Install App"
      style={{
        position: "fixed",
        bottom: "20px",
        left: "20px",
        right: "20px",
        maxWidth: "440px",
        margin: "0 auto",
        zIndex: 9998,
        backgroundColor: "var(--card-bg, #ffffff)",
        color: "var(--ink-900, #1b261b)",
        borderRadius: "14px",
        boxShadow: "0 12px 36px rgba(0, 30, 15, 0.22), 0 2px 6px rgba(0,0,0,0.08)",
        border: "1px solid var(--brand-200, #bbf7d0)",
        padding: "16px 18px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "14px",
        backdropFilter: "blur(8px)",
        animation: "slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "10px",
            backgroundColor: "#2d6a4f",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "22px",
            flexShrink: 0,
            color: "#fff",
          }}
        >
          🌿
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--brand-900, #134e4a)" }}>
            {t("pwa.installPromptTitle")}
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "var(--ink-600, #4b5563)",
              lineHeight: 1.3,
              marginTop: "2px",
            }}
          >
            {t("pwa.installPromptDesc")}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          style={{
            background: "transparent",
            border: "none",
            fontSize: "12px",
            color: "var(--ink-400, #9ca3af)",
            cursor: "pointer",
            padding: "6px 8px",
          }}
        >
          {t("pwa.dismiss")}
        </button>
        <button
          type="button"
          onClick={handleInstall}
          style={{
            backgroundColor: "#2d6a4f",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            padding: "8px 14px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(45, 106, 79, 0.3)",
          }}
        >
          {t("pwa.installBtn")}
        </button>
      </div>
    </aside>
  );
}
