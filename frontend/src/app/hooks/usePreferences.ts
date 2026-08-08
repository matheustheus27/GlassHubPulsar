import { useState, useEffect } from 'react';
import { Locale } from '../types/translationType';

export function usePreferences() {
  const [locale, setLocale] = useState<Locale>('pt-BR');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [activeTab, setActiveTab] = useState<string>('resume');

  useEffect(() => {
    const savedLocale = localStorage.getItem('glass_lang') as Locale;
    const savedTheme = localStorage.getItem('glass_theme') as 'light' | 'dark';
    const savedActiveTab = localStorage.getItem('glass_tab') as 'resume' || 'cover';

    if (savedLocale) setLocale(savedLocale);
    if (savedTheme) setTheme(savedTheme);
    if (savedActiveTab) setActiveTab(savedActiveTab);
  }, []);

  useEffect(() => {
    localStorage.setItem('glass_lang', locale);
  }, [locale]);

  useEffect(() => {
    localStorage.setItem('glass_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('glass_tab', activeTab);
  }, [activeTab]);

  return {
    locale,
    setLocale,
    theme,
    setTheme,
    activeTab,
    setActiveTab
  };
}