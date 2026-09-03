import { Link } from "react-router-dom";

// items: [{ label, to? }] — `to` is a real route path (e.g. "/"). The last
// item always renders as plain text (current page), even if it has a `to`.
export default function Breadcrumbs({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      {items.map((it, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="breadcrumb-item">
            {it.to && !isLast ? (
              <Link to={it.to}>{it.label}</Link>
            ) : (
              <span aria-current={isLast ? "page" : undefined} className={isLast ? "is-current" : ""}>
                {it.label}
              </span>
            )}
            {!isLast && <span className="breadcrumb-sep" aria-hidden="true">/</span>}
          </span>
        );
      })}
    </nav>
  );
}
