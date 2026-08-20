import React from 'react';
import { GlassSurface } from '../atoms/GlassSurface';
import { Heading } from '../atoms/Typography';
import { Button } from '../atoms/Button';
import { TemplateSelector, TemplateType } from '../molecules/TemplateSelector';
import { LanguageSelector } from '../LanguageSelector';
import { LanguageCode } from '../../utils/defaultSettings';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: LanguageCode;
  onSelectLocale: (lang: LanguageCode) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  selectedTemplate: TemplateType;
  onSelectTemplate: (template: TemplateType) => void;
  onTranslateDocument: (targetLang: LanguageCode) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  locale,
  onSelectLocale,
  theme,
  onToggleTheme,
  selectedTemplate,
  onSelectTemplate,
  onTranslateDocument
}) => {
  if (!isOpen) return null;

  const isPt = locale === 'pt-BR';
  const isLight = theme === 'light';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-2xl">
        <GlassSurface glow="cyan" className="bg-slate-950/90 border-cyan-500/30 p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚙️</span>
              <Heading level={2} className="text-lg text-slate-100">
                {isPt ? 'Painel de Configurações & Estilo' : 'Style & Settings Dashboard'}
              </Heading>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-lg p-1 rounded hover:bg-white/10 transition cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* TEMPLATE PICKER */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 block">
              {isPt ? '1. Escolha o Modelo de Currículo' : '1. Select Resume Template'}
            </label>
            <TemplateSelector
              selectedTemplate={selectedTemplate}
              onSelectTemplate={onSelectTemplate}
            />
          </div>

          {/* THEME & LOCALE CONTROLS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 block">
                {isPt ? '2. Idioma de Exibição' : '2. Display Language'}
              </label>
              <LanguageSelector value={locale} onChange={onSelectLocale} />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 block">
                {isPt ? '3. Modo Visual (Dark / Light)' : '3. Visual Mode (Dark / Light)'}
              </label>
              <button
                type="button"
                onClick={onToggleTheme}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg border border-white/10 transition cursor-pointer ${
                  isLight ? 'bg-slate-200 text-slate-900' : 'bg-slate-900 text-slate-100'
                }`}
              >
                <span className="text-xs font-semibold">
                  {isLight ? '☀️ Modo Claro Ativo' : '🌙 Modo Escuro Ativo'}
                </span>
                <div
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition ${
                    isLight ? 'bg-cyan-500 justify-end' : 'bg-slate-700 justify-start'
                  }`}
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                </div>
              </button>
            </div>
          </div>

          {/* ASYNC TRANSLATION TRIGGER */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-cyan-500/20 flex flex-col md:flex-row justify-between items-center gap-3">
            <div>
              <h4 className="text-xs font-bold text-cyan-300">
                {isPt ? 'Traduzir Currículo com IA (TranslateGemma / Llama)' : 'Translate Document with AI'}
              </h4>
              <p className="text-[11px] text-slate-400">
                {isPt
                  ? 'Gera versão completa em outro idioma via worker assíncrono com barra de progresso flutuante.'
                  : 'Generates full translated document version asynchronously with floating live progress.'}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const target = locale === 'pt-BR' ? 'en-US' : 'pt-BR';
                onTranslateDocument(target);
                onClose();
              }}
              leftIcon="🌍"
            >
              {isPt ? 'Traduzir para Inglês' : 'Translate to Portuguese'}
            </Button>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="neon" size="md" onClick={onClose}>
              {isPt ? 'Salvar & Fechar' : 'Save & Close'}
            </Button>
          </div>
        </GlassSurface>
      </div>
    </div>
  );
};
