import React, { useState, useEffect, useRef } from 'react';
import { GlassSurface } from '../atoms/GlassSurface';
import { Heading, GradientText } from '../atoms/Typography';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { GlassHubLogo } from '../atoms/GlassHubLogo';
import { AuthModal } from '../organisms/AuthModal';
import { useAuth } from '../../hooks/useAuth';

interface SupportPageProps {
  onNavigateHome?: () => void;
  onNavigateDashboard?: () => void;
}

export const SupportPage: React.FC<SupportPageProps> = ({
  onNavigateHome,
  onNavigateDashboard
}) => {
  const { user, accessToken, loginUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'FAQ' | 'GUIDES' | 'TICKETS' | 'NEW_TICKET' | 'LIVE_CHAT' | 'RECOVERY'>('FAQ');
  const [faqSearch, setFaqSearch] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Tickets state
  const [tickets, setTickets] = useState<any[]>([]);
  const [activeTicket, setActiveTicket] = useState<any | null>(null);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);

  // New ticket form
  const [ticketType, setTicketType] = useState<string>('TECHNICAL_ISSUE');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Live Chat state
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Recovery form state
  const [recoveryToken, setRecoveryToken] = useState('');
  const [recoveryStatus, setRecoveryStatus] = useState<string | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': accessToken ? `Bearer ${accessToken}` : ''
  };

  // Fetch tickets for authenticated user
  const fetchTickets = async () => {
    if (!accessToken) return;
    setIsLoadingTickets(true);
    try {
      const res = await fetch('/api/support/tickets', {
        headers: authHeaders,
        credentials: 'include'
      });
      if (res.ok) {
        const json = await res.json();
        setTickets(json.tickets || []);
      }
    } catch (e) {
      console.error('Failed to fetch support tickets:', e);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchTickets();
    }
  }, [accessToken]);

  // Connect to live chat SSE stream when a ticket is selected
  useEffect(() => {
    if (!activeTicket || activeTab !== 'LIVE_CHAT') return;

    setChatMessages(Array.isArray(activeTicket.messages) ? activeTicket.messages : []);

    const eventSource = new EventSource(`/api/support/tickets/${activeTicket.id}/stream`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'new_message' && data.message) {
          setChatMessages(prev => {
            if (prev.some(m => m.id === data.message.id)) return prev;
            return [...prev, data.message];
          });
        } else if (data.type === 'agent_joined' && data.message) {
          setChatMessages(prev => [...prev, data.message]);
        }
      } catch (e) {}
    };

    return () => {
      eventSource.close();
    };
  }, [activeTicket?.id, activeTab]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !accessToken) {
      setAuthModalOpen(true);
      return;
    }

    setIsSubmittingTicket(true);
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          type: ticketType,
          subject: ticketSubject,
          description: ticketDescription
        }),
        credentials: 'include'
      });
      const json = await res.json();
      if (res.ok) {
        setFeedbackMsg({ text: '✓ Chamado aberto com sucesso! Nossa equipe técnica responderá em breve.', type: 'success' });
        setTicketSubject('');
        setTicketDescription('');
        fetchTickets();
        if (json.ticket) {
          setActiveTicket(json.ticket);
          setActiveTab('LIVE_CHAT');
        } else {
          setActiveTab('TICKETS');
        }
      } else {
        setFeedbackMsg({ text: `Erro: ${json.error}`, type: 'error' });
      }
    } catch (e: any) {
      setFeedbackMsg({ text: `Erro: ${e.message}`, type: 'error' });
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeTicket || !accessToken) return;

    setIsSendingMsg(true);
    const text = chatInput;
    setChatInput('');

    try {
      await fetch(`/api/support/tickets/${activeTicket.id}/messages`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ text }),
        credentials: 'include'
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsSendingMsg(false);
    }
  };

  const handleRecoverAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRecovering(true);
    setRecoveryStatus(null);
    try {
      const res = await fetch('/api/support/recover-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: recoveryToken })
      });
      const json = await res.json();
      if (res.ok) {
        setRecoveryStatus(`✓ ${json.message} (Conta: ${json.userEmail})`);
        setRecoveryToken('');
      } else {
        setRecoveryStatus(`Erro: ${json.error}`);
      }
    } catch (e: any) {
      setRecoveryStatus(`Erro: ${e.message}`);
    } finally {
      setIsRecovering(false);
    }
  };

  const faqs = [
    {
      q: 'Como funciona a avaliação de compatibilidade ATS?',
      a: 'O sistema avalia a densidade de verbos de ação, palavras-chave tecnológicas essenciais e a clareza estrutural com base nos padrões utilizados por plataformas de triagem empresarial (Llama 3.2 ATS Engine).'
    },
    {
      q: 'Como funciona a exclusão de conta e o prazo de 30 dias?',
      a: 'Ao solicitar a exclusão de sua conta, ela é colocada em status de desativação temporária. Você recebe um e-mail com um token único de recuperação e tem até 30 dias para reativá-la. Após os 30 dias, todos os seus dados são excluídos definitivamente de forma irreversível.'
    },
    {
      q: 'Posso importar um currículo antigo em PDF ou DOCX?',
      a: 'Sim! Na gaveta do Assistente IA (Quick Fill), utilize a opção "Importar Currículo Antigo" para fazer upload de arquivos .pdf ou .docx. O motor extrai e preenche automaticamente cada campo do seu currículo.'
    },
    {
      q: 'Como gerar meu currículo em outros idiomas?',
      a: 'Acesse o menu "Documento" e clique em "Adicionar Versão Internacional". Você pode escolher preenchimento manual ou tradução automática instantânea via worker com Llama 3.2 / TranslateGemma.'
    },
    {
      q: 'Como funciona a exportação de PDF calibrada?',
      a: 'A exportação é processada em segundo plano por um worker Puppeteer Linux dedicado com resolução de 300 DPI, garantindo proporções milimétricas A4 e quebra de páginas sem corte de linhas.'
    },
    {
      q: 'Meus dados são persistidos ao recriar ou atualizar a página?',
      a: 'Sim! Todas as alterações no currículo e nas configurações são salvas em tempo real no banco de dados PostgreSQL com persistência em volumes permanentes do Docker.'
    }
  ];

  const filteredFaqs = faqs.filter(f =>
    f.q.toLowerCase().includes(faqSearch.toLowerCase()) || f.a.toLowerCase().includes(faqSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans relative overflow-x-hidden selection:bg-cyan-500 selection:text-black">
      {/* AMBIENT BACKGROUND GLOWS */}
      <div className="fixed top-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-600/15 rounded-full blur-[160px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-violet-600/15 rounded-full blur-[160px] pointer-events-none" />

      {/* TOP NAVBAR */}
      <header className="sticky top-4 z-40 max-w-6xl mx-auto px-4">
        <nav className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/85 border border-white/10 backdrop-blur-2xl shadow-2xl">
          <div className="flex items-center gap-2.5 pl-2 cursor-pointer" onClick={user ? onNavigateDashboard : onNavigateHome}>
            <GlassHubLogo size={28} />
            <span className="font-black text-lg tracking-tight text-slate-100">
              GlassHub <GradientText from="from-cyan-400" to="to-violet-400">Support</GradientText>
            </span>
            <Badge variant="cyan" className="hidden sm:inline-flex ml-2 text-[10px] uppercase font-bold">
              Central de Ajuda
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <Button
                variant="glass"
                size="sm"
                onClick={onNavigateDashboard}
                leftIcon="💻"
                className="text-xs font-bold"
              >
                Voltar ao Workspace
              </Button>
            ) : (
              <Button
                variant="glass"
                size="sm"
                onClick={onNavigateHome}
                leftIcon="🏠"
                className="text-xs font-bold"
              >
                Página Inicial
              </Button>
            )}

            {!user && (
              <Button
                variant="neon"
                size="sm"
                onClick={() => {
                  setAuthInitialTab('LOGIN');
                  setAuthModalOpen(true);
                }}
                className="text-xs font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)]"
              >
                Entrar / Cadastrar
              </Button>
            )}
          </div>
        </nav>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-6xl mx-auto px-4 pt-8 pb-20 relative z-10 space-y-6">
        {/* HERO HEADER */}
        <div className="text-center space-y-3 pt-4 pb-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
            <span>🛡️</span> Atendimento Especializado & Central de Conhecimento
          </div>
          <Heading level={1} className="text-2xl sm:text-4xl font-black text-slate-100">
            Como podemos <GradientText from="from-cyan-400" to="to-violet-400">ajudar você hoje?</GradientText>
          </Heading>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Consulte respostas rápidas, explore os tutoriais da plataforma ou abra um chamado direto com nossa equipe de engenharia e suporte.
          </p>
        </div>

        {/* MAIN GLASS SURFACE */}
        <GlassSurface glow="cyan" className="bg-slate-950/90 border-white/10 p-6 md:p-8 rounded-3xl shadow-2xl space-y-6">
          {/* TABS NAVIGATION */}
          <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
            {[
              { id: 'FAQ', label: '❓ Dúvidas Frequentes (FAQ)' },
              { id: 'GUIDES', label: '📖 Manuais & Tutoriais' },
              { id: 'NEW_TICKET', label: '➕ Abrir Chamado' },
              { id: 'TICKETS', label: `🎫 Meus Chamados (${tickets.length})` },
              { id: 'LIVE_CHAT', label: '💬 Chat de Atendimento' },
              { id: 'RECOVERY', label: '🔄 Recuperar Conta' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setFeedbackMsg(null);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB: FAQ */}
          {activeTab === 'FAQ' && (
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Pesquisar dúvidas, palavras-chave ou recursos..."
                  value={faqSearch}
                  onChange={e => setFaqSearch(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-white/10 text-slate-100 placeholder-slate-500 text-sm focus:border-cyan-400 focus:outline-none transition pl-10"
                />
                <span className="absolute left-3.5 top-3.5 text-slate-400 text-sm">🔍</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {filteredFaqs.map((faq, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-cyan-500/30 transition space-y-2">
                    <h4 className="font-bold text-sm text-cyan-300 flex items-start gap-2">
                      <span className="text-cyan-400 font-mono">Q.</span> {faq.q}
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed pl-5">
                      {faq.a}
                    </p>
                  </div>
                ))}
              </div>

              {filteredFaqs.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Nenhuma resposta encontrada para "{faqSearch}". Tente abrir um chamado na aba "Abrir Chamado".
                </div>
              )}
            </div>
          )}

          {/* TAB: GUIDES */}
          {activeTab === 'GUIDES' && (
            <div className="space-y-4 text-xs text-slate-300">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                <h4 className="font-bold text-sm text-cyan-400">🚀 Guia Rápido: Criando seu primeiro currículo</h4>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
                  <li>Preencha seus <strong>Dados Pessoais</strong> (Nome, Título, E-mail, Telefone com WhatsApp e Redes).</li>
                  <li>Insira um <strong>Resumo Profissional</strong> forte destacando anos de experiência e impacto.</li>
                  <li>Organize suas <strong>Competências</strong> agrupadas por categorias (Linguagens, Frameworks, etc.).</li>
                  <li>Adicione suas <strong>Experiências Profissionais</strong> usando a fórmula: <em>Verbo de Ação + Desafio + Métrica (%)</em>.</li>
                  <li>Escolha entre os <strong>4 temas Glassmorphic</strong> e clique em <strong>Exportar PDF</strong> para gerar o documento A4 vetorial.</li>
                </ol>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                <h4 className="font-bold text-sm text-cyan-400">🤖 Assistente IA & Calibração ATS</h4>
                <p className="leading-relaxed">
                  Clique no botão flutuante <strong>Score ATS</strong> no canto inferior da tela para analisar a pontuação de palavras-chave do seu currículo. O modelo Llama 3.2 sugere correções instantâneas para maximizar sua taxa de aprovação em vagas corporativas.
                </p>
              </div>
            </div>
          )}

          {/* TAB: NEW TICKET */}
          {activeTab === 'NEW_TICKET' && (
            <div className="space-y-4">
              {!user ? (
                /* AUTH GATE CARD */
                <div className="p-8 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 text-center space-y-4 max-w-lg mx-auto">
                  <div className="text-3xl">🔒</div>
                  <Heading level={3} className="text-lg font-bold text-slate-100">
                    Login Necessário para Abrir Chamado
                  </Heading>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Para registrar solicitações de suporte técnico, relatar problemas ou sugerir novos recursos, você deve estar conectado à sua conta GlassHub.
                  </p>
                  <div className="flex justify-center gap-3 pt-2">
                    <Button
                      variant="neon"
                      size="sm"
                      onClick={() => {
                        setAuthInitialTab('LOGIN');
                        setAuthModalOpen(true);
                      }}
                      className="text-xs font-bold"
                    >
                      Fazer Login
                    </Button>
                    <Button
                      variant="glass"
                      size="sm"
                      onClick={() => {
                        setAuthInitialTab('REGISTER');
                        setAuthModalOpen(true);
                      }}
                      className="text-xs font-bold"
                    >
                      Criar Conta
                    </Button>
                  </div>
                </div>
              ) : (
                /* AUTHENTICATED TICKET FORM */
                <form onSubmit={handleCreateTicket} className="space-y-4 max-w-2xl mx-auto">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs">
                    <span className="text-slate-400">Solicitante: <strong className="text-cyan-300">{user.name}</strong> ({user.email})</span>
                    <Badge variant="cyan" className="text-[10px]">Autenticado</Badge>
                  </div>

                  {feedbackMsg && (
                    <div className={`p-3 rounded-xl text-xs font-bold ${
                      feedbackMsg.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}>
                      {feedbackMsg.text}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">Tipo de Solicitação</label>
                      <select
                        value={ticketType}
                        onChange={e => setTicketType(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-100 text-xs focus:border-cyan-400 focus:outline-none transition cursor-pointer"
                      >
                        <option value="TECHNICAL_ISSUE">🐛 Problema Técnico / Bug</option>
                        <option value="FEATURE_REQUEST">✨ Sugestão de Novo Recurso</option>
                        <option value="GENERAL">💬 Dúvida Geral de Uso</option>
                        <option value="BILLING">💳 Planos & Pagamentos</option>
                        <option value="ACCOUNT_DELETION">⚠️ Solicitação de Exclusão de Conta</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">Assunto Resumido</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Dificuldade na exportação de PDF"
                        value={ticketSubject}
                        onChange={e => setTicketSubject(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-100 placeholder-slate-500 text-xs focus:border-cyan-400 focus:outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Descrição Detalhada do Chamado</label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Descreva o que aconteceu, passos para reproduzir ou detalhes da sua sugestão..."
                      value={ticketDescription}
                      onChange={e => setTicketDescription(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-100 placeholder-slate-500 text-xs focus:border-cyan-400 focus:outline-none transition"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="neon"
                    size="md"
                    isLoading={isSubmittingTicket}
                    leftIcon="🚀"
                    className="w-full text-xs font-bold shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                  >
                    Registrar Chamado Técnico
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* TAB: TICKETS LIST */}
          {activeTab === 'TICKETS' && (
            <div className="space-y-4">
              {!user ? (
                <div className="p-8 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 text-center space-y-4 max-w-lg mx-auto">
                  <div className="text-3xl">🔒</div>
                  <Heading level={3} className="text-lg font-bold text-slate-100">
                    Acesse sua conta para ver seus chamados
                  </Heading>
                  <Button
                    variant="neon"
                    size="sm"
                    onClick={() => {
                      setAuthInitialTab('LOGIN');
                      setAuthModalOpen(true);
                    }}
                    className="text-xs font-bold"
                  >
                    Fazer Login
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="text-xs text-slate-400">Total de chamados registrados: <strong>{tickets.length}</strong></span>
                    <Button variant="glass" size="sm" onClick={fetchTickets} isLoading={isLoadingTickets} className="text-xs">
                      🔄 Atualizar
                    </Button>
                  </div>

                  {tickets.length === 0 ? (
                    <div className="text-center py-10 space-y-3">
                      <p className="text-xs text-slate-400">Você não possui nenhum chamado aberto no momento.</p>
                      <Button variant="neon" size="sm" onClick={() => setActiveTab('NEW_TICKET')} className="text-xs">
                        Abrir Meu Primeiro Chamado
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {tickets.map(t => (
                        <div
                          key={t.id}
                          onClick={() => {
                            setActiveTicket(t);
                            setActiveTab('LIVE_CHAT');
                          }}
                          className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/40 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant={t.status === 'OPEN' ? 'cyan' : t.status === 'RESOLVED' ? 'green' : 'amber'} className="text-[10px]">
                                {t.status === 'OPEN' ? 'ABERTO' : t.status === 'RESOLVED' ? 'RESOLVIDO' : 'EM ATENDIMENTO'}
                              </Badge>
                              <span className="font-bold text-xs text-slate-200">{t.subject}</span>
                            </div>
                            <p className="text-xs text-slate-400 line-clamp-1">{t.description}</p>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                            <span className="text-cyan-400 font-bold">💬 Ver Conversa &rarr;</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB: LIVE CHAT */}
          {activeTab === 'LIVE_CHAT' && (
            <div className="space-y-4">
              {!user ? (
                <div className="p-8 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 text-center space-y-4 max-w-lg mx-auto">
                  <div className="text-3xl">🔒</div>
                  <p className="text-xs text-slate-300">Faça login para conversar em tempo real com os atendentes.</p>
                  <Button variant="neon" size="sm" onClick={() => setAuthModalOpen(true)} className="text-xs">
                    Entrar
                  </Button>
                </div>
              ) : !activeTicket ? (
                <div className="text-center py-10 space-y-3">
                  <p className="text-xs text-slate-400">Selecione um chamado na aba "Meus Chamados" para abrir a sala de atendimento.</p>
                  <Button variant="glass" size="sm" onClick={() => setActiveTab('TICKETS')} className="text-xs">
                    Ver Meus Chamados
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-white/10 text-xs">
                    <div>
                      <span className="text-slate-400">Chamado:</span> <strong className="text-slate-100">{activeTicket.subject}</strong>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('TICKETS')} className="text-xs">
                      &larr; Voltar aos Chamados
                    </Button>
                  </div>

                  <div className="h-80 overflow-y-auto p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3">
                    {chatMessages.length === 0 ? (
                      <div className="text-center py-12 text-slate-500 text-xs">
                        Aguardando primeira mensagem do atendimento...
                      </div>
                    ) : (
                      chatMessages.map((m, i) => {
                        const isMe = m.sender === user.id || m.senderName === user.name || m.sender === 'user';
                        return (
                          <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className="flex items-center gap-1.5 mb-0.5 text-[10px] text-slate-400">
                              <span>{m.senderName || (isMe ? 'Você' : 'Suporte')}</span>
                              <span>•</span>
                              <span>{new Date(m.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className={`p-3 rounded-2xl text-xs max-w-md ${
                              isMe ? 'bg-cyan-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-100 rounded-bl-none border border-white/10'
                            }`}>
                              {m.text}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Digite sua mensagem para o suporte..."
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-100 text-xs focus:border-cyan-400 focus:outline-none transition"
                    />
                    <Button type="submit" variant="neon" size="sm" isLoading={isSendingMsg} className="text-xs font-bold px-5">
                      Enviar
                    </Button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB: RECOVERY (PUBLIC TO ALL) */}
          {activeTab === 'RECOVERY' && (
            <div className="space-y-4 max-w-lg mx-auto">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1.5">
                <h4 className="font-bold text-amber-300">🔄 Recuperação de Conta (30 Dias)</h4>
                <p>
                  Se você solicitou a exclusão de sua conta, ela pode ser recuperada a qualquer momento durante o período de carência de 30 dias inserindo o token de recuperação único enviado ao seu e-mail.
                </p>
              </div>

              {recoveryStatus && (
                <div className={`p-3 rounded-xl text-xs font-bold ${
                  recoveryStatus.startsWith('✓') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}>
                  {recoveryStatus}
                </div>
              )}

              <form onSubmit={handleRecoverAccount} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Token de Recuperação</label>
                  <input
                    type="text"
                    required
                    placeholder="del_tok_..."
                    value={recoveryToken}
                    onChange={e => setRecoveryToken(e.target.value.trim())}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-100 font-mono text-xs focus:border-cyan-400 focus:outline-none transition"
                  />
                </div>

                <Button
                  type="submit"
                  variant="neon"
                  size="md"
                  isLoading={isRecovering}
                  leftIcon="🔓"
                  className="w-full text-xs font-bold shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                >
                  Reativar Minha Conta Imediatamente
                </Button>
              </form>
            </div>
          )}
        </GlassSurface>
      </main>

      {/* AUTH MODAL FOR UNLOGGED USERS */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab={authInitialTab}
        onLoginSuccess={(loggedUser, token) => {
          loginUser(loggedUser, token);
          setAuthModalOpen(false);
        }}
      />
    </div>
  );
};
