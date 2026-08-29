import React, { useState } from 'react';
import { ProgressBar } from '../atoms/ProgressBar';
import { GlassSurface } from '../atoms/GlassSurface';

export interface TranslationState {
  isActive: boolean;
  progress: number;
  step: string;
  targetLang: string;
}

interface TranslationProgressCardProps {
  state: TranslationState;
  onDismiss?: () => void;
}

export const TranslationProgressCard: React.FC<TranslationProgressCardProps> = ({
  state,
  onDismiss
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  if (!state.isActive) return null;

  const isCompleted = state.progress >= 100;

  if (isMinimized) {
    return (
      <div
        onClick={() => setIsMinimized(false)}
        className="cursor-pointer animate-bounce select-none pointer-events-auto"
      >
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.4)] backdrop-blur-xl text-xs font-bold text-cyan-300">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>🌍 {state.targetLang}: {state.progress}%</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full select-none">
      <GlassSurface
        glow={isCompleted ? 'emerald' : 'cyan'}
        className="bg-slate-950/85 border-cyan-500/40 shadow-2xl p-4 rounded-2xl backdrop-blur-2xl"
      >
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <span className="text-base">{isCompleted ? '🎉' : '🌍'}</span>
            <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
              {isCompleted ? 'Tradução Concluída' : `Traduzindo para ${state.targetLang}`}
            </h4>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsMinimized(true)}
              className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-white/10 transition cursor-pointer"
              title="Minimizar para badge"
            >
              _
            </button>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-white/10 transition cursor-pointer"
                title="Fechar"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <p className="text-[11px] text-slate-300 mb-3 truncate">
          {state.step}
        </p>

        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Progresso</span>
            <span className="font-bold text-cyan-400">{state.progress}%</span>
          </div>
          <ProgressBar progress={state.progress} color={isCompleted ? 'emerald' : 'cyan'} />
        </div>
      </GlassSurface>
    </div>
  );
};
