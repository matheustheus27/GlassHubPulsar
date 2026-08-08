import { useState } from 'react';
import { Languages, LanguageOption, LanguageCode } from '../data/LanguagesData';

interface Props {
  value: LanguageCode;
  onChange: (lang: LanguageCode) => void;
}

export function LanguageSelector({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const current = Languages.find(l => l.code === value)!;

  const handleSelect = (lang: LanguageOption) => {
    onChange(lang.code);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-100 text-xs hover:bg-slate-700 transition"
      >
        <span>{current.flag}</span>
        <span>{current.label}</span>
        <span className="ml-1">▾</span>
      </button>

      {open && (
        <div className="absolute mt-2 w-56 bg-slate-900 border border-slate-700 rounded-lg shadow-lg z-50 overflow-hidden">
          {Languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang)}
              className="flex items-center gap-2 w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-slate-800 transition"
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
  const lang = Languages.find(l => l.code === langCode);
  return lang ? lang.resume : "Resume";
}

export function GetCoverLabel(langCode: LanguageCode): string {
  const lang = Languages.find(l => l.code === langCode);
  return lang ? lang.cover : "Cover_Letter";
}