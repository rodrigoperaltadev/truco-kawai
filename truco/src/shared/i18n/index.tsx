import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { en } from "./locales/en";
import { es } from "./locales/es";

export type Locale = "es" | "en";

const LOCALE_STORAGE_KEY = "@truco/locale";

const translations = { es, en };

const i18n = new I18n(translations);
i18n.enableFallback = true;
i18n.defaultLocale = "es";

function resolveDeviceLocale(): Locale {
  const deviceLocale = Localization.getLocales()[0]?.languageCode ?? "es";
  return deviceLocale.startsWith("en") ? "en" : "es";
}

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
  t: (scope: string, options?: Record<string, unknown>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

type I18nProviderProps = {
  children: ReactNode;
};

export function I18nProvider({ children }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(resolveDeviceLocale);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function loadStoredLocale() {
      const stored = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
      if (stored === "es" || stored === "en") {
        setLocaleState(stored);
      }
      setIsReady(true);
    }
    void loadStoredLocale();
  }, []);

  useEffect(() => {
    i18n.locale = locale;
  }, [locale]);

  const setLocale = useCallback(async (nextLocale: Locale) => {
    setLocaleState(nextLocale);
    await AsyncStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
  }, []);

  const t = useCallback((scope: string, options?: Record<string, unknown>) => {
    return i18n.t(scope, options);
  }, []);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  if (!isReady) {
    return null;
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}

export function useTranslations() {
  const { t, locale } = useI18n();
  return { t, locale };
}
