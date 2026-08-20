import { useState } from 'react';
import { LanguageCode } from '../utils/defaultSettings';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  flag: string;
  resume: string;
  cover: string;
}

export const AvailableLanguages: LanguageOption[] = [
  { code: 'pt-BR', label: 'Português (BR)', flag: '🇧🇷', resume: 'Curriculo', cover: 'Carta_Apresentacao' },
  { code: 'en-US', label: 'English (US)', flag: '🇺🇸', resume: 'Resume', cover: 'Cover_Letter' },
  { code: 'es-ES', label: 'Español', flag: '🇪🇸', resume: 'Curriculum', cover: 'Carta_Presentacion' },
  { code: 'fr-FR', label: 'Français', flag: '🇫🇷', resume: 'CV', cover: 'Lettre_Motivation' },
  { code: 'de-DE', label: 'Deutsch', flag: '🇩🇪', resume: 'Lebenslauf', cover: 'Anschreiben' }
];

interface Props {
  value: LanguageCode;
  onChange: (lang: LanguageCode) => void;
}

export function LanguageSelector({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const current = AvailableLanguages.find(l => l.code === value) || AvailableLanguages[0];

  const handleSelect = (lang: LanguageOption) => {
    onChange(lang.code);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-slate-900/90 text-slate-100 text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
      >
        <span>{current.flag}</span>
        <span>{current.label}</span>
        <span className="ml-1">▾</span>
      </button>

      {open && (
        <div className="absolute mt-2 w-56 bg-slate-950/95 border border-white/15 rounded-xl shadow-2xl backdrop-blur-2xl z-50 overflow-hidden animate-in fade-in">
          {AvailableLanguages.map(lang => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang)}
              className="flex items-center gap-2 w-full px-3.5 py-2.5 text-left text-xs font-semibold text-slate-200 hover:bg-white/10 transition cursor-pointer"
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function GetResumeLabel(langCode: LanguageCode): string {
  const lang = AvailableLanguages.find(l => l.code === langCode);
  return lang ? lang.resume : "Resume";
}

export function GetCoverLabel(langCode: LanguageCode): string {
  const lang = AvailableLanguages.find(l => l.code === langCode);
  return lang ? lang.cover : "Cover_Letter";
}