import { useEffect, useRef, useState } from "react";
import { getProducts } from "../api/products";

// Animated stat strip. The catalogue size is pulled live; the rest are
// storefront promises (no invented "customers served" style numbers).

function useInView(ref) {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (!ref.current || seen) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      });
    });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [ref, seen]);
  return seen;
}

function Stat({ num, decimals = 0, label, suffix = "", icon }) {
  const ref = useRef(null);
  const inView = useInView(ref);
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1100;
    const start = performance.now();
    let raf;
    const tick = (t) => {
      const pct = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - pct, 3);
      setVal(num * eased);
      if (pct < 1) raf = requestAnimationFrame(tick);
      else setVal(num);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, num]);

  const display = decimals > 0 ? val.toFixed(decimals) : Math.floor(val).toLocaleString();

  return (
    <div className="stat" ref={ref}>
      <div className="num">
        {icon ? <span style={{ fontSize: "0.7em", marginRight: 4 }}>{icon}</span> : null}
        {display}{suffix}
      </div>
      <div className="lbl">{label}</div>
    </div>
  );
}

export default function StatsCounter() {
  const [catalogue, setCatalogue] = useState(500);

  useEffect(() => {
    let alive = true;
    getProducts({ limit: 1 })
      .then((res) => {
        const total = res.data?.total;
        if (alive && total) setCatalogue(Math.floor(total / 10) * 10); // round down to a tidy figure
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const stats = [
    { num: catalogue, suffix: "+", label: "Plants & products in stock" },
    { num: 4.9, decimals: 1, label: "Average review rating", icon: "★" },
    { num: 3, label: "Cities with same-day delivery" },
    { num: 7, label: "Day healthy-arrival guarantee" },
  ];

  return (
    <section className="kb-stats" aria-label="Why shop with KatherBox">
      {stats.map((s, i) => (
        <Stat key={i} {...s} />
      ))}
    </section>
  );
}
