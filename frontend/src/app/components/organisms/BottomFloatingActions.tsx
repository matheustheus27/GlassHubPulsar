import React from 'react';

interface BottomFloatingActionsProps {
  onOpenATS: () => void;
  onOpenAI?: () => void;
  onOpenAIChat?: () => void;
  atsScore?: number;
  estimatedScore?: number;
}

export const BottomFloatingActions: React.FC<BottomFloatingActionsProps> = ({
  onOpenATS,
  onOpenAI,
  onOpenAIChat,
  atsScore,
  estimatedScore
}) => {
  const score = atsScore ?? estimatedScore ?? 88;
  const handleAI = onOpenAI || onOpenAIChat || (() => {});

  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3 print:hidden animate-in fade-in slide-in-from-bottom-5">
      {/* ATS SCORE FLOATING TRIGGER */}
      <button
        type="button"
        onClick={onOpenATS}
        className="group flex items-center gap-2 px-4 py-3 rounded-full bg-slate-950/90 border border-cyan-500/40 text-slate-100 backdrop-blur-2xl shadow-[0_10px_30px_rgba(6,182,212,0.35)] hover:shadow-[0_10px_40px_rgba(6,182,212,0.6)] hover:border-cyan-400 hover:scale-105 transition-all cursor-pointer"
        title="Ver Análise de Compatibilidade ATS"
      >
        <span className="text-base">📊</span>
        <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
          ATS: <strong className="text-white text-sm">{score}</strong>/100
        </span>
      </button>

      {/* AI ASSISTANT & QUICK FILL FLOATING TRIGGER */}
      <button
        type="button"
        onClick={handleAI}
        className="group flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_10px_30px_rgba(139,92,246,0.45)] hover:shadow-[0_10px_40px_rgba(139,92,246,0.7)] hover:scale-105 transition-all cursor-pointer"
        title="Assistente IA & Preenchimento Rápido"
      >
        <span className="text-base animate-bounce">✨</span>
        <span className="font-extrabold text-slate-950">Assistente IA & Quick Fill</span>
      </button>
    </div>
  );
};
