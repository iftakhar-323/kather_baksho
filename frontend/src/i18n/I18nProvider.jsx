import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { LangStore } from "./LangStore";
import en from "./en.json";

// English ships in the main bundle (it's also the fallback for every other
// language). Non-default dictionaries are code-split and fetched on demand
// the first time the user switches to them — keeps ~85 KB of bn.json out of
// the initial download for the common English visit.
const LOADERS = {
  bn: () => import("./bn.json").then((m) => m.default),
};

const DICT_CACHE = { en };

const I18nCtx = createContext({
  lang: "en",
  setLang: () => {},
  toggle: () => {},
  t: (k) => k,
  has: (_k) => false,
});

function lookup(dict, path) {
  return path.split(".").reduce((acc, seg) => {
    if (acc && Object.prototype.hasOwnProperty.call(acc, seg)) return acc[seg];
    return undefined;
  }, dict);
}

function format(template, vars) {
  if (!template || !vars) return template || "";
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) =>
    vars[key] != null ? String(vars[key]) : ""
  );
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => LangStore.get());
  // Bumped when an async dictionary finishes loading so `t` re-derives.
  const [dictVersion, setDictVersion] = useState(0);

  // apply language attribute to <html> on mount and whenever it changes
  useEffect(() => {
    try {
      document.documentElement.setAttribute("lang", lang);
    } catch {
      /* SSR / non-DOM env */
    }
  }, [lang]);

  // Lazy-load the active dictionary if we don't have it yet.
  useEffect(() => {
    if (DICT_CACHE[lang] || !LOADERS[lang]) return;
    let alive = true;
    LOADERS[lang]()
      .then((dict) => {
        if (!alive) return;
        DICT_CACHE[lang] = dict;
        setDictVersion((v) => v + 1);
      })
      .catch(() => {
        /* stay on English fallback */
      });
    return () => {
      alive = false;
    };
  }, [lang]);

  const setLang = useCallback((next) => {
    if (next !== "en" && !LOADERS[next]) return;
    LangStore.set(next);
    setLangState(next);
  }, []);

  const toggle = useCallback(() => {
    setLangState((cur) => {
      const next = cur === "en" ? "bn" : "en";
      LangStore.set(next);
      return next;
    });
  }, []);

  // Core translator: tries requested lang first (if loaded), falls back to
  // English, and finally returns the key itself so gaps are visible.
  const t = useCallback(
    (key, vars) => {
      const active = DICT_CACHE[lang] || DICT_CACHE.en;
      let val = lookup(active, key);
      if (val === undefined) val = lookup(DICT_CACHE.en, key);
      if (val === undefined) return key;
      if (typeof val === "string") return format(val, vars);
      return val;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lang, dictVersion]
  );

  const has = useCallback(
    (key) => {
      const active = DICT_CACHE[lang] || DICT_CACHE.en;
      return lookup(active, key) !== undefined || lookup(DICT_CACHE.en, key) !== undefined;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lang, dictVersion]
  );

  const value = useMemo(
    () => ({ lang, setLang, toggle, t, has }),
    [lang, setLang, toggle, t, has]
  );

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTranslation() {
  return useContext(I18nCtx);
}
