import { useState, useEffect, useCallback } from 'react';
import { uiTranslations, UILanguage } from '../i18n/uiTranslations';

let globalLocale: UILanguage = (typeof window !== 'undefined' && (localStorage.getItem('glasshub_ui_lang') as UILanguage)) || 'pt-BR';
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
    t
  };
}
