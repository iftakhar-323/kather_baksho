import { useState, useEffect, useRef } from "react";
import { useTranslation } from "../i18n/I18nProvider";

export default function VoiceSearchButton({ onTranscript, style }) {
  const { lang } = useTranslation();
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [toastMsg, setToastMsg] = useState("");
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setListening(true);
      setToastMsg(lang === "bn" ? "শুনছি... বলুন" : "Listening... Speak now");
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (transcript && onTranscript) {
        onTranscript(transcript);
        setToastMsg(transcript);
      }
      setListening(false);
      setTimeout(() => setToastMsg(""), 2500);
    };

    recognition.onerror = (event) => {
      console.warn("Speech recognition error:", event.error);
      setListening(false);
      if (event.error === "not-allowed") {
        setToastMsg(lang === "bn" ? "মাইক্রোফোন অ্যাক্সেস দিন" : "Mic permission needed");
      } else {
        setToastMsg(lang === "bn" ? "আবার চেষ্টা করুন" : "Please try again");
      }
      setTimeout(() => setToastMsg(""), 3000);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [lang, onTranscript]);

  const toggleListening = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!supported) {
      alert(lang === "bn" 
        ? "আপনার ব্রাউজারে ভয়েস সার্চ সাপোর্ট নেই। Chrome বা Edge ব্যবহার করুন।" 
        : "Voice recognition not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
    } else {
      // Dynamic language: bn-BD for Bangla, en-US for English
      if (recognitionRef.current) {
        recognitionRef.current.lang = lang === "bn" ? "bn-BD" : "en-US";
        try {
          recognitionRef.current.start();
        } catch (err) {
          console.warn("Speech restart err", err);
        }
      }
    }
  };

  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center", ...style }}>
      <button
        type="button"
        onClick={toggleListening}
        title={listening ? (lang === "bn" ? "ভয়েস সার্চ বন্ধ করুন" : "Stop listening") : (lang === "bn" ? "বাংলা/ইংরেজি ভয়েস সার্চ" : "Voice search (Bangla/English)")}
        style={{
          background: listening ? "#e11d48" : "transparent",
          border: "none",
          color: listening ? "#fff" : "rgba(255, 255, 255, 0.65)",
          width: "28px",
          height: "28px",
          borderRadius: "50%",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          fontSize: "0.95rem",
          transition: "all 0.2s ease",
          boxShadow: listening ? "0 0 12px #e11d48" : "none",
          animation: listening ? "pulse 1.2s infinite" : "none"
        }}
      >
        <span>{listening ? "🎙️" : "🎤"}</span>
      </button>

      {/* Floating Status / Transcript Bubble */}
      {toastMsg && (
        <div style={{
          position: "absolute",
          top: "120%",
          right: "-10px",
          background: "rgba(15, 23, 42, 0.95)",
          border: "1px solid rgba(82, 183, 136, 0.3)",
          boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
          color: "#4ade80",
          fontSize: "0.75rem",
          fontWeight: 600,
          padding: "0.35rem 0.75rem",
          borderRadius: "1rem",
          whiteSpace: "nowrap",
          zIndex: 1000,
          pointerEvents: "none"
        }}>
          {toastMsg}
        </div>
      )}
    </div>
  );
}
