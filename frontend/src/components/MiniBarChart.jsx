// Dependency-free responsive bar chart (inline SVG). Used by the admin
// analytics dashboard for daily revenue / order-count trends.
//
// data: [{ label: string, value: number, sub?: string }]
export default function MiniBarChart({
  data = [],
  height = 160,
  color = "var(--leaf-600, #5e8b56)",
  format = (v) => v,
}) {
  if (!data.length) {
    return <p className="muted">No data for this window yet.</p>;
  }

  const max = Math.max(1, ...data.map((d) => Number(d.value) || 0));
  const w = 100;
  const gap = data.length > 40 ? 0.4 : data.length > 20 ? 1 : 2;
  const barW = (w - gap * (data.length - 1)) / data.length;

  // horizontal guide lines at 0 / 50 / 100 %
  const guides = [0.25, 0.5, 0.75, 1];

  return (
    <div className="kb-barchart">
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${w} ${height}`}
        preserveAspectRatio="none"
        role="img"
      >
        {guides.map((g) => (
          <line
            key={g}
            x1="0"
            x2={w}
            y1={height - g * height}
            y2={height - g * height}
            stroke="var(--border, #e5e7eb)"
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {data.map((d, i) => {
          const v = Number(d.value) || 0;
          const h = (v / max) * (height - 4);
          const x = i * (barW + gap);
          return (
            <rect
              key={d.label + i}
              x={x}
              y={height - h}
              width={barW}
              height={h}
              rx={barW > 3 ? 1 : 0}
              fill={color}
            >
              <title>{`${d.label}: ${format(v)}${d.sub ? ` · ${d.sub}` : ""}`}</title>
            </rect>
          );
        })}
      </svg>
      <div className="kb-barchart-axis">
        <span>{data[0].label}</span>
        {data.length > 2 && <span>{data[Math.floor(data.length / 2)].label}</span>}
        <span>{data[data.length - 1].label}</span>
      </div>
    </div>
  );
}
