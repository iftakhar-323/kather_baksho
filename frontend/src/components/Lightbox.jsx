import { useEffect } from "react";

// Full-screen click-to-zoom viewer. Accepts either a single `src` or an
// `images` array with `index` + `onNav` for gallery navigation.
export default function Lightbox({
  src,
  images,
  index = 0,
  alt,
  onNav,
  onClose,
}) {
  const list = images && images.length ? images : src ? [src] : [];
  const many = list.length > 1;
  const cur = list[Math.max(0, Math.min(index, list.length - 1))];

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (many && e.key === "ArrowRight") onNav?.(1);
      if (many && e.key === "ArrowLeft") onNav?.(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, onNav, many]);

  if (!cur) return null;

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

      {many && (
        <button
          className="kb-lightbox-nav kb-lightbox-prev"
          onClick={(e) => {
            e.stopPropagation();
            onNav?.(-1);
          }}
          aria-label="Previous"
        >
          ‹
        </button>
      )}

      <img
        src={cur}
        alt={alt}
        className="kb-lightbox-img"
        onClick={(e) => e.stopPropagation()}
      />

      {many && (
        <button
          className="kb-lightbox-nav kb-lightbox-next"
          onClick={(e) => {
            e.stopPropagation();
            onNav?.(1);
          }}
          aria-label="Next"
        >
          ›
        </button>
      )}

      {many && (
        <div className="kb-lightbox-count">
          {index + 1} / {list.length}
        </div>
      )}
    </div>
  );
}
