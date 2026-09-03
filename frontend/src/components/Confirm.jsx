import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const ConfirmContext = createContext(null);

// App-wide replacement for window.confirm(). Renders a real modal instead of
// a native browser dialog and resolves to a boolean, so call sites just do:
//   const ok = await confirm({ title: "...", body: "...", danger: true });
export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const resolver = useRef(null);

  const confirm = useCallback((opts = {}) => {
    return new Promise((resolve) => {
      resolver.current = resolve;
      setState({
        title: opts.title || "Are you sure?",
        body: opts.body || "",
        confirmText: opts.confirmText || "Confirm",
        cancelText: opts.cancelText || "Cancel",
        danger: !!opts.danger,
      });
    });
  }, []);

  const close = useCallback((result) => {
    setState(null);
    resolver.current?.(result);
    resolver.current = null;
  }, []);

  useEffect(() => {
    if (!state) return;
    const onKey = (e) => {
      if (e.key === "Escape") close(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [state, close]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className="kb-confirm-backdrop" onClick={() => close(false)}>
          <div
            className="kb-confirm"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-label={state.title}
          >
            <h3 className="kb-confirm-title">{state.title}</h3>
            {state.body && <p className="kb-confirm-body">{state.body}</p>}
            <div className="kb-confirm-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => close(false)}>
                {state.cancelText}
              </button>
              <button
                className={"btn btn-sm " + (state.danger ? "btn-danger" : "btn-primary")}
                onClick={() => close(true)}
                autoFocus
              >
                {state.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    // Fallback so it never crashes if used outside the provider.
    return async () => true;
  }
  return ctx;
}
