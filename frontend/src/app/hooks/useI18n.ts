import { useState, useEffect } from 'react';
import { uiTranslations, UILanguage } from '../i18n/uiTranslations';

export function useI18n() {
  const [locale, setLocale] = useState<UILanguage>(() => {
    return (localStorage.getItem('glasshub_ui_lang') as UILanguage) || 'pt-BR';
  });

  useEffect(() => {
    localStorage.setItem('glasshub_ui_lang', locale);
  }, [locale]);

  const t = (key: keyof typeof uiTranslations['pt-BR']): string => {
    const dict = uiTranslations[locale] || uiTranslations['pt-BR'];
    return dict[key] || uiTranslations['pt-BR'][key] || String(key);
  };

  return {
    locale,
    setLocale,
    t
  };
}
