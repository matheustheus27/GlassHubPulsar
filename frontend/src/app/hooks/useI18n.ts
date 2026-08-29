import { useState, useEffect, useCallback } from 'react';
import { uiTranslations, UILanguage, SUPPORTED_LANGUAGES } from '../i18n/uiTranslations';

function detectInitialLocale(): UILanguage {
  if (typeof window === 'undefined') return 'pt-BR';

  // 1. Check user explicit setting in localStorage
  const saved = localStorage.getItem('glasshub_ui_lang') as UILanguage;
  if (saved && ['pt-BR', 'en-US', 'es-ES', 'fr-FR', 'de-DE'].includes(saved)) {
    return saved;
  }

  // 2. Auto-detect browser language transmitted by navigator
  const navLang = (navigator.language || (navigator.languages && navigator.languages[0]) || '').toLowerCase();
  if (navLang.startsWith('pt')) return 'pt-BR';
  if (navLang.startsWith('es')) return 'es-ES';
  if (navLang.startsWith('fr')) return 'fr-FR';
  if (navLang.startsWith('de')) return 'de-DE';
  if (navLang.startsWith('en')) return 'en-US';

  return 'pt-BR';
}

let globalLocale: UILanguage = detectInitialLocale();
const listeners = new Set<(l: UILanguage) => void>();

export function setGlobalLocale(newLocale: UILanguage) {
  globalLocale = newLocale;
  if (typeof window !== 'undefined') {
    localStorage.setItem('glasshub_ui_lang', newLocale);
  }
  listeners.forEach(fn => fn(newLocale));
}

export function useI18n() {
  const [locale, setLocal] = useState<UILanguage>(globalLocale);

  useEffect(() => {
    const handler = (l: UILanguage) => setLocal(l);
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  const setLocale = useCallback((newLocale: UILanguage) => {
    setGlobalLocale(newLocale);
  }, []);

  const t = useCallback((key: keyof typeof uiTranslations['pt-BR']): string => {
    const dict = uiTranslations[locale] || uiTranslations['pt-BR'];
    return dict[key] || uiTranslations['pt-BR'][key] || String(key);
  }, [locale]);

  return {
    locale,
    setLocale,
    t,
    supportedLanguages: SUPPORTED_LANGUAGES
  };
}
