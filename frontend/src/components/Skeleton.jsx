// Lightweight skeleton placeholders, pure CSS no JS animation hooks needed.

export function SkeletonCard() {
  return (
    <div className="skel-card" aria-hidden="true">
      <div className="skel img" />
      <div className="body">
        <div className="skel l1" />
        <div className="skel l2" />
        <div className="skel l3" />
        <div className="skel l4" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 8 }) {
  return (
    <div className="product-grid" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonDetail() {
  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }} aria-busy="true">
      <div className="skel" style={{ width: 90, height: 14, marginBottom: 16 }} />
      <div
        className="card card-pad-lg"
        style={{ display: "grid", gridTemplateColumns: "minmax(220px,320px) 1fr", gap: 32 }}
      >
        <div className="skel" style={{ aspectRatio: "1 / 1", borderRadius: "var(--radius-lg)" }} />
        <div className="stack gap-12">
          <div className="skel" style={{ width: "70%", height: 30 }} />
          <div className="skel" style={{ width: 120, height: 20 }} />
          <div className="skel" style={{ width: 100, height: 28, marginTop: 8 }} />
          <div className="skel" style={{ width: "100%", height: 12 }} />
          <div className="skel" style={{ width: "92%", height: 12 }} />
          <div className="skel" style={{ width: "80%", height: 12 }} />
          <div className="skel" style={{ width: 160, height: 44, borderRadius: "var(--radius)", marginTop: 12 }} />
        </div>
      </div>
    </div>
  );
}

export function SkeletonCartRow() {
  return (
    <div className="skel-row cart-item" aria-hidden="true">
      <div className="skel ico" />
      <div className="skel bar" style={{ width: "60%" }} />
      <div className="skel" style={{ width: 80, height: 28, borderRadius: 999 }} />
    </div>
  );
}

export function SkeletonCartList({ count = 3 }) {
  return (
    <div className="stack gap-12 cart-items">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCartRow key={i} />
      ))}
    </div>
  );
}
