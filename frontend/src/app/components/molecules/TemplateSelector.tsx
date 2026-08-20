import React from 'react';

export type TemplateType = 'GlassModern' | 'GlassMinimalist' | 'GlassExecutive' | 'GlassCompact';

interface TemplateSelectorProps {
  selectedTemplate: TemplateType;
  onSelectTemplate: (template: TemplateType) => void;
  className?: string;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplate,
  onSelectTemplate,
  className = ''
}) => {
  const templates: { id: TemplateType; name: string; desc: string; badge: string; color: string }[] = [
    {
      id: 'GlassModern',
      name: 'Glass Modern',
      desc: 'Ciano neon, brilho vibrante e tecnologia de ponta',
      badge: '✨ Neon Tech',
      color: 'border-cyan-500 text-cyan-400'
    },
    {
      id: 'GlassMinimalist',
      name: 'Glass Minimalist',
      desc: 'Vidro fosco limpo, tipografia monocromática e leveza',
      badge: '🌿 Clean Frosted',
      color: 'border-slate-400 text-slate-300'
    },
    {
      id: 'GlassExecutive',
      name: 'Glass Executive',
      desc: 'Grafite/safira profundo com elegantes detalhes dourados',
      badge: '👑 Executive Gold',
      color: 'border-amber-500 text-amber-400'
    },
    {
      id: 'GlassCompact',
      name: 'Glass Compact',
      desc: 'Layout ultra-denso otimizado para currículos de 1 página',
      badge: '⚡ High Density',
      color: 'border-blue-500 text-blue-400'
    }
  ];

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-2.5 ${className}`}>
      {templates.map(t => {
        const isSelected = selectedTemplate === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelectTemplate(t.id)}
            className={`flex flex-col text-left p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
              isSelected
                ? `bg-slate-800/90 border-2 ${t.color} shadow-[0_0_15px_rgba(6,182,212,0.25)]`
                : 'bg-slate-900/40 border-white/10 hover:border-white/20 hover:bg-slate-900/70 text-slate-400'
            }`}
          >
            <div className="flex justify-between items-center w-full mb-1">
              <span className="text-xs font-bold text-slate-200">{t.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 font-mono">
                {t.badge}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-2 leading-tight">
              {t.desc}
            </p>
          </button>
        );
      })}
    </div>
  );
};
