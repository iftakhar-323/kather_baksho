import { useEffect, useState } from "react";
import Lightbox from "./Lightbox";
import { productImages, hasRealImage } from "../utils/productImage";

// Main product image + thumbnail strip + full-screen zoom.
// `product.image_url` may hold several whitespace/comma-separated URLs.
export default function ProductGallery({ product, zoomHint }) {
  const images = productImages(product);
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const real = hasRealImage(product);

  // Reset when navigating between products.
  useEffect(() => {
    setActive(0);
    setZoom(false);
  }, [product?.ID]);

  const nav = (delta) =>
    setActive((i) => (i + delta + images.length) % images.length);

  return (
    <div className="kb-gallery">
      <div
        className="kb-gallery-main"
        onClick={() => real && setZoom(true)}
        title={real ? zoomHint : undefined}
        style={{ cursor: real ? "zoom-in" : "default" }}
      >
        <img
          src={images[active]}
          alt={product.name}
          className="kb-pimg"
          draggable={false}
        />
      </div>

      {images.length > 1 && (
        <div className="kb-gallery-thumbs">
          {images.map((src, i) => (
            <button
              key={src + i}
              className={`kb-gallery-thumb ${i === active ? "is-active" : ""}`}
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
            >
              <img src={src} alt="" draggable={false} />
            </button>
          ))}
        </div>
      )}

      {zoom && (
        <Lightbox
          images={images}
          index={active}
          alt={product.name}
          onNav={nav}
          onClose={() => setZoom(false)}
        />
      )}
    </div>
  );
}
