/**
 * Standard page header — title + optional subtitle, with an optional
 * right-aligned actions slot. Wrap page bodies in <PageHeader>…</PageHeader>?
 * No — render it as the first child of a `.page-shell` wrapper:
 *
 *   <div className="page-shell">
 *     <PageHeader title="Wishlist" sub="Plants you're saving for later." />
 *     …
 *   </div>
 */
export default function PageHeader({ title, sub, actions, className = "" }) {
  return (
    <header className={"page-header " + className}>
      <div className="page-header-text">
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </header>
  );
}
