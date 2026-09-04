/**
 * Pill segmented control — replaces the repeated
 *   className={"btn btn-sm " + (tab === x ? "btn-primary" : "btn-secondary")}
 * pattern. Styled by `.tabs` / `.tab` in index.css.
 *
 *   <Segmented
 *     value={tab}
 *     onChange={setTab}
 *     options={[{ value: "redeem", label: "Redeem" }, { value: "buy", label: "Buy" }]}
 *   />
 */
export default function Segmented({ value, onChange, options, className = "", ariaLabel }) {
  return (
    <div className={"tabs " + className} role="tablist" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          className={"tab" + (value === o.value ? " is-active" : "")}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
