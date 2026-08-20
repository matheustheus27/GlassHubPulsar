import { useState, useEffect } from 'react';
import { Locale } from '../types/translationType';
import { TemplateType } from '../components/molecules/TemplateSelector';

export function usePreferences() {
  const [locale, setLocale] = useState<Locale>(() => {
    return (localStorage.getItem('glass_lang') as Locale) || 'pt-BR';
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('glass_theme') as 'light' | 'dark') || 'dark';
  });

  const [template, setTemplate] = useState<TemplateType>(() => {
    return (localStorage.getItem('glass_template') as TemplateType) || 'GlassModern';
  });

  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem('glass_tab') || 'resume';
  });

  useEffect(() => {
    localStorage.setItem('glass_lang', locale);
  }, [locale]);

  useEffect(() => {
    localStorage.setItem('glass_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('glass_template', template);
  }, [template]);

  useEffect(() => {
    localStorage.setItem('glass_tab', activeTab);
  }, [activeTab]);

  return {
    locale,
    setLocale,
    theme,
    setTheme,
    template,
    setTemplate,
    activeTab,
    setActiveTab
  };
}