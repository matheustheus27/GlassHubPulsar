import React from 'react';
import { GlassSurface } from '../atoms/GlassSurface';
import { ProgressBar } from '../atoms/ProgressBar';
import { PDFExportState } from '../../hooks/useSSE';

interface PDFProgressCardProps {
  state: PDFExportState;
  onDismiss: () => void;
}

export const PDFProgressCard: React.FC<PDFProgressCardProps> = ({ state, onDismiss }) => {
  if (!state.isActive && state.progress === 0) return null;

  const isComplete = state.progress === 100;

  return (
    <div className="w-full select-none">
      <GlassSurface
        glow={isComplete ? 'emerald' : 'cyan'}
        className="bg-slate-950/95 border-cyan-500/40 p-4 space-y-3 shadow-2xl backdrop-blur-2xl rounded-2xl"
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-base">{isComplete ? '✓' : '⚙️'}</span>
            <span className="text-xs font-black text-slate-100 uppercase tracking-wider">
              {isComplete ? 'PDF Concluído' : 'Renderizando PDF no Worker'}
            </span>
          </div>
          <button
            onClick={onDismiss}
            className="text-slate-400 hover:text-white text-xs p-1 rounded hover:bg-white/10 transition cursor-pointer"
            aria-label="Fechar card de progresso"
          >
            ✕
          </button>
        </div>

        <p className="text-[11px] text-slate-300 leading-snug">
          {state.step || 'Processando layout A4 no Chromium...'}
        </p>

        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Progresso</span>
            <span className="font-bold text-cyan-400">{state.progress}%</span>
          </div>
          <ProgressBar progress={state.progress} color={isComplete ? 'emerald' : 'cyan'} />
        </div>

        {isComplete && state.downloadUrl && (
          <a
            href={state.downloadUrl}
            download={state.fileName || 'Curriculo_GlassHub.pdf'}
            className="block text-center py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition shadow-[0_0_15px_rgba(16,185,129,0.4)]"
          >
            📥 Baixar Arquivo PDF
          </a>
        )}
      </GlassSurface>
    </div>
  );
};
