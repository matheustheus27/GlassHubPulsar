import React, { useEffect, useState } from 'react';
import { GlassSurface } from '../atoms/GlassSurface';
import { Heading } from '../atoms/Typography';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';

interface QueueStat {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  paused: number;
}

interface AdminTelemetry {
  uptimeSeconds: number;
  memory: {
    heapUsedMb: number;
    heapTotalMb: number;
  };
  counters: {
    pdfExports: number;
    atsAnalyses: number;
    translations: number;
    totalRequests: number;
  };
  latencies: {
    avgPdfExportMs: number;
    avgAiInferenceMs: number;
  };
}

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose
}) => {
  const [telemetry, setTelemetry] = useState<AdminTelemetry | null>(null);
  const [queues, setQueues] = useState<Record<string, QueueStat>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchHealth = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/health');
      if (res.ok) {
        const data = await res.json();
        setTelemetry(data.telemetry);
        setQueues(data.queues || {});
      }
    } catch (e) {
      console.error('Failed to fetch admin health:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHealth();
      const interval = setInterval(fetchHealth, 10000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const handleQueueAction = async (queueName: string, action: 'pause' | 'resume' | 'clean') => {
    try {
      const res = await fetch(`/api/admin/queues/${queueName}/${action}`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setActionMessage(data.message);
        setTimeout(() => setActionMessage(null), 4000);
        fetchHealth();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateExecutiveReport = async () => {
    setIsGeneratingReport(true);
    try {
      const res = await fetch('/api/admin/report/pdf', { method: 'POST' });
      if (res.ok) {
        setActionMessage('Relatório Executivo gerado e arquivado pelo worker com sucesso!');
        setTimeout(() => setActionMessage(null), 5000);
      }
    } catch (e) {
      console.error('Error generating executive report:', e);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-4xl my-8">
        <GlassSurface glow="violet" className="bg-slate-950/95 border-violet-500/40 p-6 md:p-8 space-y-6">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl animate-spin">🛡️</span>
              <div>
                <Heading level={2} className="text-lg text-slate-100 flex items-center gap-2">
                  Central de Comando Administrativo Oculto
                  <Badge variant="violet">ADMIN ROLE ONLY</Badge>
                </Heading>
                <p className="text-xs text-slate-400">
                  Monitoramento em tempo real do ecossistema de microsserviços, workers e métricas APM
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

          {actionMessage && (
            <div className="p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-xs font-semibold text-emerald-300 animate-in fade-in">
              ✓ {actionMessage}
            </div>
          )}

          {/* TELEMETRY CARDS */}
          {telemetry && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/10">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Uptime</span>
                <p className="text-lg font-bold text-cyan-300 mt-1">{telemetry.uptimeSeconds}s</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/10">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Heap Memory</span>
                <p className="text-lg font-bold text-violet-300 mt-1">
                  {telemetry.memory.heapUsedMb} MB
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/10">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">PDFs Exportados</span>
                <p className="text-lg font-bold text-emerald-300 mt-1">{telemetry.counters.pdfExports}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/10">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Avaliações ATS</span>
                <p className="text-lg font-bold text-amber-300 mt-1">{telemetry.counters.atsAnalyses}</p>
              </div>
            </div>
          )}

          {/* WORKER QUEUES LIFECYCLE MANAGEMENT */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                ⚡ Gerenciamento de Filas & Workers Assíncronos (BullMQ / Redis)
              </h3>
              <Button variant="ghost" size="sm" onClick={fetchHealth} isLoading={isLoading} leftIcon="🔄">
                Atualizar Filas
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {['translation', 'notification', 'pdf', 'analytics'].map(qName => {
                const stat = queues[qName] || { waiting: 0, active: 0, completed: 0, failed: 0, paused: 0 };
                const isPaused = stat.paused > 0;

                return (
                  <div key={qName} className="p-4 rounded-xl bg-slate-900/70 border border-white/10 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        worker-{qName}
                      </span>
                      <Badge variant={isPaused ? 'amber' : 'emerald'}>
                        {isPaused ? 'PAUSADO' : 'ATIVO & ESCUTANDO'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-4 gap-1 text-center text-[11px]">
                      <div className="p-1.5 rounded bg-slate-800/60">
                        <span className="text-slate-400 block">Espera</span>
                        <span className="font-bold text-slate-200">{stat.waiting}</span>
                      </div>
                      <div className="p-1.5 rounded bg-cyan-950/40 border border-cyan-500/20">
                        <span className="text-cyan-400 block">Ativos</span>
                        <span className="font-bold text-cyan-300">{stat.active}</span>
                      </div>
                      <div className="p-1.5 rounded bg-emerald-950/40 border border-emerald-500/20">
                        <span className="text-emerald-400 block">Concluídos</span>
                        <span className="font-bold text-emerald-300">{stat.completed}</span>
                      </div>
                      <div className="p-1.5 rounded bg-red-950/40 border border-red-500/20">
                        <span className="text-red-400 block">Falhas</span>
                        <span className="font-bold text-red-300">{stat.failed}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      {isPaused ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQueueAction(qName, 'resume')}
                          className="flex-1 text-[11px]"
                        >
                          ▶️ Retomar
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleQueueAction(qName, 'pause')}
                          className="flex-1 text-[11px]"
                        >
                          ⏸️ Pausar
                        </Button>
                      )}
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleQueueAction(qName, 'clean')}
                        className="text-[11px]"
                      >
                        🧹 Limpar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* EXECUTIVE REPORT GENERATOR */}
          <div className="p-4 rounded-xl bg-violet-950/30 border border-violet-500/30 flex flex-col md:flex-row justify-between items-center gap-3">
            <div>
              <h4 className="text-xs font-bold text-violet-300">
                📑 Gerador de Relatório Executivo de Infraestrutura em PDF
              </h4>
              <p className="text-[11px] text-slate-400">
                Dispara job para o worker-pdf compilar o relatório completo de telemetria do cluster em segundo plano.
              </p>
            </div>

            <Button
              variant="neon"
              size="sm"
              onClick={handleGenerateExecutiveReport}
              isLoading={isGeneratingReport}
              leftIcon="📊"
              className="bg-violet-500 hover:bg-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.4)]"
            >
              Gerar Relatório PDF
            </Button>
          </div>

          <div className="flex justify-end pt-2 border-t border-white/10">
            <Button variant="glass" size="sm" onClick={onClose}>
              Fechar Central
            </Button>
          </div>
        </GlassSurface>
      </div>
    </div>
  );
};
