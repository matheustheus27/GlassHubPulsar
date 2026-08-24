import React, { useState } from 'react';
import { GlassSurface } from '../atoms/GlassSurface';
import { Heading, GradientText } from '../atoms/Typography';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { GlassHubLogo } from '../atoms/GlassHubLogo';
import { AuthModal } from '../organisms/AuthModal';
import { CustomerHelpModal } from '../organisms/CustomerHelpModal';

interface LandingPageProps {
  onLoginSuccess: (user: any, token: string) => void;
  onNavigateSupport?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginSuccess, onNavigateSupport }) => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [previewTemplate, setPreviewTemplate] = useState<'GlassModern' | 'GlassMinimalist' | 'GlassExecutive' | 'GlassCompact'>('GlassModern');

  const openLogin = () => {
    setAuthInitialTab('LOGIN');
    setAuthModalOpen(true);
  };

  const openRegister = () => {
    setAuthInitialTab('REGISTER');
    setAuthModalOpen(true);
  };

  const handleOpenHelp = () => {
    if (onNavigateSupport) {
      onNavigateSupport();
    } else {
      setHelpModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans relative overflow-x-hidden selection:bg-cyan-500 selection:text-black">
      {/* AMBIENT BACKGROUND GLOWS */}
      <div className="fixed top-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-600/15 rounded-full blur-[160px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-violet-600/15 rounded-full blur-[160px] pointer-events-none" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-sky-900/10 rounded-full blur-[200px] pointer-events-none" />

      {/* FLOATING TOP NAVBAR */}
      <header className="sticky top-4 z-40 max-w-6xl mx-auto px-4">
        <nav className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/85 border border-white/10 backdrop-blur-2xl shadow-2xl">
          <div className="flex items-center gap-2.5 pl-2">
            <GlassHubLogo size={28} />
            <span className="font-black text-lg tracking-tight text-slate-100">
              GlassHub <GradientText from="from-cyan-400" to="to-violet-400">Pulsar</GradientText>
            </span>
            <Badge variant="cyan" className="hidden sm:inline-flex ml-2 text-[10px] uppercase font-bold">
              v2.0 Enterprise
            </Badge>
          </div>

          <div className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-300">
            <a href="#features" className="hover:text-cyan-400 transition">Recursos</a>
            <a href="#templates" className="hover:text-cyan-400 transition">Modelos</a>
            <a href="#ats" className="hover:text-cyan-400 transition">Inteligência ATS</a>
            <a href="#architecture" className="hover:text-cyan-400 transition">Tecnologia</a>
            <button
              type="button"
              onClick={handleOpenHelp}
              className="hover:text-cyan-400 transition cursor-pointer text-cyan-300 flex items-center gap-1"
            >
              <span>❓</span> Ajuda & Suporte
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <Button variant="ghost" size="sm" onClick={handleOpenHelp} className="text-xs font-bold md:hidden">
              ❓
            </Button>
            <Button variant="ghost" size="sm" onClick={openLogin} className="text-xs font-bold">
              Entrar
            </Button>
            <Button variant="neon" size="sm" onClick={openRegister} className="text-xs font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              Criar Conta
            </Button>
          </div>
        </nav>
      </header>

      {/* HERO SECTION */}
      <section className="max-w-6xl mx-auto px-4 pt-16 pb-20 text-center relative z-10 space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-bold shadow-[0_0_20px_rgba(6,182,212,0.2)] animate-pulse">
          <span>✨</span> Design System GlassHub & Inteligência ATS
        </div>

        <Heading level={1} className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-100 max-w-4xl mx-auto leading-tight sm:leading-none tracking-tight">
          Currículos de Alto Impacto com <GradientText from="from-cyan-400 via-sky-300" to="to-violet-400">Estética Glassmorphic</GradientText>
        </Heading>

        <p className="text-sm sm:text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed font-normal">
          A plataforma corporativa completa para criar, calibrar e exportar currículos executivos e cartas de apresentação. Avaliação ATS em tempo real, suporte internacional com IA e exportação Linux Puppeteer pixel-perfect.
        </p>

        {/* HERO CTA BUTTONS */}
        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <Button
            variant="neon"
            size="lg"
            onClick={openRegister}
            leftIcon="⚡"
            className="text-sm font-black px-8 py-4 shadow-[0_0_30px_rgba(6,182,212,0.5)] min-h-[50px]"
          >
            Criar Meu Currículo Grátis
          </Button>
          <Button
            variant="glass"
            size="lg"
            onClick={openLogin}
            leftIcon="🔑"
            className="text-sm font-black px-8 py-4 min-h-[50px]"
          >
            Acessar Minha Conta
          </Button>
        </div>

        {/* INTERACTIVE LIVE PREVIEW SHOWCASE */}
        <div className="pt-10 max-w-4xl mx-auto">
          <GlassSurface glow="cyan" className="bg-slate-950/80 border-cyan-500/30 p-6 md:p-8 rounded-3xl shadow-2xl relative overflow-hidden text-left">
            {/* Top Mockup Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs font-bold text-slate-400 ml-2">preview.glasshub.resume</span>
              </div>

              {/* Template Switcher */}
              <div className="flex bg-slate-900 rounded-xl p-1 border border-white/10 text-xs font-bold">
                {(['GlassModern', 'GlassMinimalist', 'GlassExecutive', 'GlassCompact'] as const).map(tpl => (
                  <button
                    key={tpl}
                    onClick={() => setPreviewTemplate(tpl)}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                      previewTemplate === tpl ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tpl.replace('Glass', '')}
                  </button>
                ))}
              </div>
            </div>

            {/* Resume Mock Body */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              <div className="md:col-span-8 space-y-4">
                <div className="space-y-1">
                  <h2 className="text-xl md:text-2xl font-black text-cyan-300">Alexandre Silva Oliveira</h2>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-300">Engenheiro de Software Full-Stack Sênior</p>
                  <p className="text-[11px] text-slate-400">São Paulo, SP • test@glasshub.com • +55 (11) 98765-4321 • github.com/alexandre</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">Resumo Profissional</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Especialista em microsserviços escaláveis, Node.js, TypeScript e ecossistemas reativos. Liderança técnica com foco em resiliência e acessibilidade WCAG AAA.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-200">TechNova Enterprise • Tech Lead</span>
                    <span className="text-[11px] text-slate-400">2022 - Presente</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                    <li>Redução de latência de resposta em 42% com arquitetura distribuída.</li>
                    <li>Processamento assíncrono com Redis e BullMQ gerenciando 500k eventos/dia.</li>
                  </ul>
                </div>
              </div>

              {/* Mockup Floating ATS Widget */}
              <div className="md:col-span-4 space-y-3">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/80 to-slate-900 border border-cyan-500/40 space-y-2 shadow-xl">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">Score ATS</span>
                    <Badge variant="emerald">98/100</Badge>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 w-[98%]" />
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    ✓ Palavras-chave corporativas identificadas com densidade ideal para recrutadores.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Competências</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'Redis', 'Datadog'].map(s => (
                      <span key={s} className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[10px] font-semibold text-slate-200">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </GlassSurface>
        </div>
      </section>

      {/* 1. SEÇÃO DE RECURSOS (FEATURES) */}
      <section id="features" className="max-w-6xl mx-auto px-4 py-20 space-y-12 relative z-10 border-t border-white/10">
        <div className="text-center space-y-3">
          <Badge variant="violet" className="text-xs uppercase font-bold">Recursos & Benefícios</Badge>
          <Heading level={2} className="text-2xl sm:text-4xl font-black text-slate-100">
            Construído para Excelência Executiva
          </Heading>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Recursos projetados especificamente para destacar seu perfil em processos seletivos concorridos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassSurface glow="cyan" className="bg-slate-950/80 p-6 space-y-3 shadow-xl">
            <span className="text-3xl">⚡</span>
            <h3 className="text-base font-bold text-slate-100">Inteligência ATS & IA</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Auditoria em tempo real com Llama 3.2. Avalie compatibilidade com vagas, densidade de verbos de ação e palavras-chave.
            </p>
          </GlassSurface>

          <GlassSurface glow="violet" className="bg-slate-950/80 p-6 space-y-3 shadow-xl">
            <span className="text-3xl">📐</span>
            <h3 className="text-base font-bold text-slate-100">Link Optimizer Simétrico</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Algoritmo geométrico de distribuição de contatos. Elimina links órfãos e mantém harmonia visual 2x2 ou 3x2.
            </p>
          </GlassSurface>

          <GlassSurface glow="cyan" className="bg-slate-950/80 p-6 space-y-3 shadow-xl">
            <span className="text-3xl">📥</span>
            <h3 className="text-base font-bold text-slate-100">PDF Puppeteer Linux</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Renderização server-side em contêiner Linux. Garante saída idêntica ao preview sem distorções de drivers locais.
            </p>
          </GlassSurface>

          <GlassSurface glow="violet" className="bg-slate-950/80 p-6 space-y-3 shadow-xl">
            <span className="text-3xl">🌐</span>
            <h3 className="text-base font-bold text-slate-100">Versões Internacionais</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Crie variantes em múltiplos idiomas com tradução assíncrona TranslateGemma sob demanda ou edição manual.
            </p>
          </GlassSurface>
        </div>
      </section>

      {/* 2. SEÇÃO DE MODELOS (TEMPLATES) */}
      <section id="templates" className="max-w-6xl mx-auto px-4 py-20 space-y-12 relative z-10 border-t border-white/10">
        <div className="text-center space-y-3">
          <Badge variant="cyan" className="text-xs uppercase font-bold">Modelos Executivos</Badge>
          <Heading level={2} className="text-2xl sm:text-4xl font-black text-slate-100">
            4 Padrões de Design Calibrados para Cada Carreira
          </Heading>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Cada template foi desenvolvido com micro-animações, paginação inteligente A4 e rigoroso contraste WCAG AAA.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassSurface glow="cyan" className="bg-slate-950/80 p-6 space-y-3 shadow-xl border border-cyan-500/30">
            <div className="flex justify-between items-center">
              <span className="text-2xl">💎</span>
              <Badge variant="cyan">Popular</Badge>
            </div>
            <h3 className="text-lg font-black text-cyan-300">GlassModern</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Estética futurista com reflexos vívidos em ciano, tipografia arrojada e cartões translúcidos balanceados.
            </p>
            <div className="pt-2 text-[11px] font-bold text-cyan-400">Ideal para: Tech Leads, Full-Stacks e Designers</div>
          </GlassSurface>

          <GlassSurface glow="violet" className="bg-slate-950/80 p-6 space-y-3 shadow-xl border border-white/10">
            <div className="flex justify-between items-center">
              <span className="text-2xl">🏛️</span>
              <Badge variant="violet">Luxo</Badge>
            </div>
            <h3 className="text-lg font-black text-violet-300">GlassMinimalist</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Monocromático, sóbrio e elegante. Foco cirúrgico no conteúdo textual e legibilidade absoluta.
            </p>
            <div className="pt-2 text-[11px] font-bold text-violet-400">Ideal para: Engenheiros Sênior e Pesquisadores</div>
          </GlassSurface>

          <GlassSurface glow="amber" className="bg-slate-950/80 p-6 space-y-3 shadow-xl border border-amber-500/30">
            <div className="flex justify-between items-center">
              <span className="text-2xl">👑</span>
              <Badge variant="amber">Executive</Badge>
            </div>
            <h3 className="text-lg font-black text-amber-300">GlassExecutive</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Detalhes sofisticados em dourado/âmbar, espaçamentos nobres e estrutura sólida para posições de liderança.
            </p>
            <div className="pt-2 text-[11px] font-bold text-amber-400">Ideal para: Diretores, CTOs e Gerentes</div>
          </GlassSurface>

          <GlassSurface glow="cyan" className="bg-slate-950/80 p-6 space-y-3 shadow-xl border border-sky-500/30">
            <div className="flex justify-between items-center">
              <span className="text-2xl">⚡</span>
              <Badge variant="cyan">1 Página</Badge>
            </div>
            <h3 className="text-lg font-black text-sky-300">GlassCompact</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Alta densidade de dados projetada para consolidar trajetórias complexas em exatamente 1 página sem poluição.
            </p>
            <div className="pt-2 text-[11px] font-bold text-sky-400">Ideal para: Candidaturas Internacionais e ATS</div>
          </GlassSurface>
        </div>
      </section>

      {/* 3. SEÇÃO DE INTELIGÊNCIA ATS */}
      <section id="ats" className="max-w-6xl mx-auto px-4 py-20 space-y-12 relative z-10 border-t border-white/10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-5">
            <Badge variant="emerald" className="text-xs uppercase font-bold">Inteligência Artificial & ATS</Badge>
            <Heading level={2} className="text-2xl sm:text-4xl font-black text-slate-100 leading-tight">
              Passe pelos Robôs de Triagem e Chegue à Entrevista
            </Heading>
            <p className="text-sm text-slate-400 leading-relaxed">
              Mais de 75% dos currículos são descartados por sistemas ATS antes mesmo de serem lidos por um recrutador humano. O GlassHub integra um motor de auditoria heurística e IA que analisa:
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">✓</span>
                <div>
                  <h4 className="text-sm font-bold text-slate-200">Densidade de Palavras-Chave Técnicas</h4>
                  <p className="text-xs text-slate-400">Identificação de frameworks, linguagens e ferramentas alinhadas ao cargo pretendido.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">✓</span>
                <div>
                  <h4 className="text-sm font-bold text-slate-200">Fórmula de Impacto & Verbos de Ação</h4>
                  <p className="text-xs text-slate-400">Garantia de que cada experiência apresente conquistas com porcentagens e métricas mensuráveis.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">✓</span>
                <div>
                  <h4 className="text-sm font-bold text-slate-200">Chat Especialista em Tempo Real</h4>
                  <p className="text-xs text-slate-400">Tire dúvidas, peça sugestões de reescrita de bullets e descubra pontos cegos no seu currículo.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <GlassSurface glow="cyan" className="bg-slate-950/90 border-emerald-500/30 p-6 md:p-8 space-y-5 shadow-2xl">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">🎯 Auditoria ATS em Execução</span>
                <Badge variant="emerald">Score 94 / 100</Badge>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-300">Compatibilidade Estrutural:</span>
                  <span className="text-emerald-400 font-bold">100% (Linear A4)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Verbos de Ação Fortes:</span>
                  <span className="text-cyan-400 font-bold">92% Identificados</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Métricas Quantitativas:</span>
                  <span className="text-emerald-400 font-bold">88% Presentes</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 text-xs leading-relaxed">
                💡 <strong className="font-bold">Recomendação da IA:</strong> Seu histórico profissional possui excelente densidade técnica! Para atingir 98+, quantifique a economia de custos nas experiências mais recentes.
              </div>
            </GlassSurface>
          </div>
        </div>
      </section>

      {/* 4. SEÇÃO DE TECNOLOGIA & ARQUITETURA */}
      <section id="architecture" className="max-w-6xl mx-auto px-4 py-20 space-y-12 relative z-10 border-t border-white/10">
        <div className="text-center space-y-3">
          <Badge variant="cyan" className="text-xs uppercase font-bold">Arquitetura Enterprise</Badge>
          <Heading level={2} className="text-2xl sm:text-4xl font-black text-slate-100">
            Ecossistema Desacoplado & Alta Performance
          </Heading>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Infraestrutura resiliente baseada em microsserviços, mensageria assíncrona e monitoramento Datadog APM.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassSurface glow="cyan" className="bg-slate-950/80 p-6 space-y-3 shadow-xl">
            <span className="text-2xl">🐳</span>
            <h3 className="text-base font-bold text-slate-100">Docker & Microservices</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Gateway Nginx, API Node.js, Banco PostgreSQL 16 e Workers especializados de PDF, IA e Tradução rodando em contêineres isolados.
            </p>
          </GlassSurface>

          <GlassSurface glow="violet" className="bg-slate-950/80 p-6 space-y-3 shadow-xl">
            <span className="text-2xl">⚡</span>
            <h3 className="text-base font-bold text-slate-100">Redis & BullMQ</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Filas de mensageria assíncronas com atualização em tempo real via Server-Sent Events (SSE) para renderização de PDFs sem travamentos.
            </p>
          </GlassSurface>

          <GlassSurface glow="cyan" className="bg-slate-950/80 p-6 space-y-3 shadow-xl">
            <span className="text-2xl">📊</span>
            <h3 className="text-base font-bold text-slate-100">Datadog APM & Logs</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Telemetria com métricas de DogStatsD, monitoramento de latência e persistência de auditoria em banco de dados relacional.
            </p>
          </GlassSurface>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-slate-950/90 py-10 px-4 text-xs text-slate-400 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <GlassHubLogo size={20} />
            <span className="font-bold text-slate-200">GlassHub Pulsar</span>
            <span className="text-slate-600">|</span>
            <span className="text-[11px] text-emerald-400">● Sistema Operacional</span>
          </div>

          <p>
            Desenvolvido por <a href="https://matheustheus27.github.io/" target="_blank" rel="noreferrer" className="font-bold text-slate-100 no-underline hover:text-cyan-300 transition">Matheus</a>
          </p>

          <Button variant="ghost" size="sm" onClick={openLogin} className="text-xs font-semibold">
            Acessar Sistema →
          </Button>
        </div>
      </footer>

      {/* AUTH MODAL */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab={authInitialTab}
        onLoginSuccess={onLoginSuccess}
      />

      {/* CUSTOMER HELP & SUPPORT MODAL */}
      <CustomerHelpModal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
      />
    </div>
  );
};
