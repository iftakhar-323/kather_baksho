import { useEffect } from "react";

// Full-screen click-to-zoom viewer for a single product photo.
export default function Lightbox({ src, alt, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  if (!src) return null;

  return (
    <div
      className="kb-lightbox-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      <button className="kb-lightbox-close" onClick={onClose} aria-label="Close">
        ✕
      </button>
      <img
        src={src}
        alt={alt}
        className="kb-lightbox-img"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
