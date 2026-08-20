import React from 'react';
import { GlassSurface } from '../atoms/GlassSurface';
import { Heading } from '../atoms/Typography';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { ProgressBar } from '../atoms/ProgressBar';

export interface ATSReportData {
  overallScore: number;
  summary: string;
  missingKeywords: string[];
  actionVerbsDensity: {
    score: number;
    strongVerbsFound: string[];
    weakPhrasesToReplace: string[];
  };
  structuralClarity: {
    score: number;
    feedback: string;
  };
  layoutConsistency: {
    score: number;
    feedback: string;
  };
  actionableRecommendations: Array<{
    priority: string;
    category: string;
    recommendation: string;
  }>;
}

interface ATSScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ATSReportData | null;
  isLoading: boolean;
  onRunAnalysis?: () => void;
  onReanalyze?: () => void;
}

export const ATSScoreModal: React.FC<ATSScoreModalProps> = ({
  isOpen,
  onClose,
  report,
  isLoading,
  onRunAnalysis,
  onReanalyze
}) => {
  if (!isOpen) return null;

  const triggerAnalysis = onRunAnalysis || onReanalyze || (() => {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-3xl my-8">
        <GlassSurface glow="cyan" className="bg-slate-950/90 border-cyan-500/30 p-6 md:p-8 space-y-6">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">📊</span>
              <div>
                <Heading level={2} className="text-lg text-slate-100 font-bold">
                  Avaliação Empresarial ATS & Inteligência HR (Llama 3.2)
                </Heading>
                <p className="text-xs text-slate-400">
                  Análise preditiva de aprovação em filtros automáticos de grandes empresas
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-lg p-1 rounded hover:bg-white/10 transition cursor-pointer"
            >
              ✕
            </button>
          </div>

          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-semibold text-cyan-300">
                O Llama 3.2 está avaliando o currículo contra o padrão ATS...
              </p>
              <p className="text-xs text-slate-400">
                Calculando densidade de verbos de ação, palavras-chave e legibilidade
              </p>
            </div>
          ) : report ? (
            <div className="space-y-6">
              {/* SCORE CARD */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 rounded-2xl bg-slate-900/80 border border-cyan-500/30 items-center">
                <div className="flex flex-col items-center justify-center p-3 text-center border-b md:border-b-0 md:border-r border-white/10">
                  <div className="relative flex items-center justify-center w-24 h-24 rounded-full border-4 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.4)]">
                    <span className="text-3xl font-black text-cyan-300">{report.overallScore}</span>
                    <span className="text-[10px] text-slate-400 absolute bottom-3">/ 100</span>
                  </div>
                  <span className="text-xs font-bold text-slate-200 mt-2 uppercase tracking-wider">
                    ATS Score Geral
                  </span>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                    Veredito do Especialista
                  </h4>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {report.summary}
                  </p>
                </div>
              </div>

              {/* METRICS BREAKDOWN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/50 border border-white/10 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-200">Densidade de Verbos de Ação</span>
                    <span className="text-xs font-bold text-cyan-400">{report.actionVerbsDensity.score}%</span>
                  </div>
                  <ProgressBar progress={report.actionVerbsDensity.score} color="cyan" />
                  <div className="pt-2 text-[11px] text-slate-400">
                    <strong className="text-emerald-400">Verbos fortes: </strong>
                    {report.actionVerbsDensity.strongVerbsFound.join(', ')}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/50 border border-white/10 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-200">Clareza Estrutural</span>
                    <span className="text-xs font-bold text-emerald-400">{report.structuralClarity.score}%</span>
                  </div>
                  <ProgressBar progress={report.structuralClarity.score} color="emerald" />
                  <p className="text-[11px] text-slate-400 pt-1">
                    {report.structuralClarity.feedback}
                  </p>
                </div>
              </div>

              {/* MISSING KEYWORDS */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  ⚠️ Keywords Essenciais em Falta no Mercado
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {report.missingKeywords.map(kw => (
                    <Badge key={kw} variant="amber">
                      + {kw}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* ACTIONABLE RECOMMENDATIONS */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  🎯 Recomendações Priorizadas
                </h4>
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {report.actionableRecommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg bg-slate-900/60 border border-white/5 flex items-start gap-2.5 text-xs text-slate-300"
                    >
                      <Badge variant={rec.priority === 'HIGH' ? 'amber' : 'cyan'}>
                        {rec.priority}
                      </Badge>
                      <div>
                        <strong className="text-slate-200">{rec.category}: </strong>
                        {rec.recommendation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center space-y-4">
              <p className="text-sm text-slate-400">
                Nenhuma avaliação executada nesta sessão. Clique no botão abaixo para avaliar.
              </p>
              <Button variant="neon" size="md" onClick={triggerAnalysis} leftIcon="⚡">
                Executar Análise ATS com IA
              </Button>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-white/10">
            <Button variant="ghost" size="sm" onClick={triggerAnalysis} leftIcon="🔄" disabled={isLoading}>
              Reanalisar
            </Button>
            <Button variant="glass" size="sm" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </GlassSurface>
      </div>
    </div>
  );
};
