import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { translations, type Lang } from "@/i18n/translations";

const LANG_KEY = "mc_lang";

interface LocaleContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** Traduction d'une clé pointée type "hero.title" — fallback français. */
  t: (path: string) => string;
}

const LocaleContext = createContext<LocaleContextValue>({
  lang: "fr",
  setLang: () => undefined,
  t: () => "",
});

function lookup(dict: Record<string, unknown>, path: string): string | undefined {
  let node: unknown = dict;
  for (const part of path.split(".")) {
    if (node && typeof node === "object" && part in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof node === "string" ? node : undefined;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem(LANG_KEY);
    return stored === "en" || stored === "fr" ? stored : "fr";
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem(LANG_KEY, l);
    document.documentElement.lang = l;
  };

  const t = useCallback(
    (path: string): string => {
      if (translations[lang] && lookup(translations[lang], path) !== undefined) {
        return lookup(translations[lang], path) as string;
      }
      const fallback = lookup(translations.fr, path);
      return typeof fallback === "string" ? fallback : path;
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext);
}