import React, { useState } from 'react';
import { GlassSurface } from '../atoms/GlassSurface';
import { Heading } from '../atoms/Typography';
import { Button } from '../atoms/Button';
import { useI18n } from '../../hooks/useI18n';

interface InternationalVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (targetLang: string, mode: 'AI' | 'MANUAL') => void;
}

export const InternationalVersionModal: React.FC<InternationalVersionModalProps> = ({
  isOpen,
  onClose,
  onConfirm
}) => {
  const { t } = useI18n();
  const [targetLang, setTargetLang] = useState('en-US');
  const [mode, setMode] = useState<'AI' | 'MANUAL'>('AI');

  if (!isOpen) return null;

  const handleCreate = () => {
    onConfirm(targetLang, mode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-lg">
        <GlassSurface glow="cyan" className="bg-slate-950/95 border-cyan-500/30 p-6 md:p-8 space-y-6 shadow-2xl">
          {/* HEADER */}
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🌐</span>
              <Heading level={2} className="text-lg text-slate-100 font-black">
                {t('modalVersionTitle')}
              </Heading>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-lg p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
            >
              ✕
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {t('modalVersionDesc')}
          </p>

          {/* TARGET LANGUAGE SELECTOR */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-cyan-400 block">
              {t('targetLanguageLabel')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { code: 'en-US', label: '🇺🇸 English (US)' },
                { code: 'pt-BR', label: '🇧🇷 Português (BR)' },
                { code: 'es-ES', label: '🇪🇸 Español' },
                { code: 'fr-FR', label: '🇫🇷 Français' },
                { code: 'de-DE', label: '🇩🇪 Deutsch' }
              ].map(lang => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setTargetLang(lang.code)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    targetLang === lang.code
                      ? 'bg-cyan-950/60 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                      : 'bg-slate-900/60 border-white/5 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* MODE SELECTION */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-cyan-400 block">
              Modo de Criação:
            </label>

            <div
              onClick={() => setMode('AI')}
              className={`p-4 rounded-xl border transition cursor-pointer space-y-1 ${
                mode === 'AI'
                  ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                  : 'bg-slate-900/60 border-white/5 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-100">{t('optionAiTranslate')}</span>
                {mode === 'AI' && <span className="text-cyan-400 text-sm font-bold">✓</span>}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {t('optionAiTranslateDesc')}
              </p>
            </div>

            <div
              onClick={() => setMode('MANUAL')}
              className={`p-4 rounded-xl border transition cursor-pointer space-y-1 ${
                mode === 'MANUAL'
                  ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                  : 'bg-slate-900/60 border-white/5 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-100">{t('optionBlank')}</span>
                {mode === 'MANUAL' && <span className="text-cyan-400 text-sm font-bold">✓</span>}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {t('optionBlankDesc')}
              </p>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" size="md" onClick={onClose} className="flex-1">
              {t('cancelBtn')}
            </Button>
            <Button variant="neon" size="md" onClick={handleCreate} className="flex-1">
              {t('createVersionBtn')}
            </Button>
          </div>
        </GlassSurface>
      </div>
    </div>
  );
};
