import React, { useState, useEffect, useRef } from 'react';
import { GlassSurface } from '../atoms/GlassSurface';
import { Heading, GradientText } from '../atoms/Typography';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { GlassHubLogo } from '../atoms/GlassHubLogo';
import { useAuth } from '../../hooks/useAuth';

interface CustomerHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomerHelpModal: React.FC<CustomerHelpModalProps> = ({ isOpen, onClose }) => {
  const { user, accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState<'FAQ' | 'GUIDES' | 'TICKETS' | 'NEW_TICKET' | 'LIVE_CHAT' | 'RECOVERY'>('FAQ');
  const [faqSearch, setFaqSearch] = useState('');

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

  // Fetch tickets
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
    if (isOpen && accessToken) {
      fetchTickets();
    }
  }, [isOpen, accessToken]);

  // Connect to live chat SSE stream when a ticket is opened
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
        } else if (data.type === 'account_deleted') {
          setFeedbackMsg({ text: 'Sua conta foi marcada para exclusão definitiva em 30 dias.', type: 'success' });
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
        setFeedbackMsg({ text: '✓ Chamado aberto com sucesso! Nossa equipe responderá em breve.', type: 'success' });
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
    if (!chatInput.trim() || !activeTicket) return;

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
    }
  ];

  const filteredFaqs = faqs.filter(f =>
    f.q.toLowerCase().includes(faqSearch.toLowerCase()) || f.a.toLowerCase().includes(faqSearch.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-4xl my-8">
        <GlassSurface glow="cyan" className="bg-slate-950/95 border-white/15 p-6 md:p-8 space-y-5 shadow-2xl relative">
          {/* CLOSE BUTTON */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            ✕
          </button>

          {/* HEADER */}
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <GlassHubLogo size={32} />
            <div>
              <Heading level={2} className="text-xl font-black text-slate-100">
                Central de <GradientText from="from-cyan-400" to="to-violet-400">Ajuda & Suporte ao Cliente</GradientText>
              </Heading>
              <p className="text-xs text-slate-400">
                Perguntas frequentes, manuais de uso, abertura de chamados e atendimento em tempo real
              </p>
            </div>
          </div>

          {/* TABS NAVIGATION */}
          <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
            {[
              { id: 'FAQ', label: '❓ Dúvidas Frequentes (FAQ)' },
              { id: 'GUIDES', label: '📖 Manuais & Tutoriais' },
              { id: 'TICKETS', label: `🎫 Meus Chamados (${tickets.length})` },
              { id: 'NEW_TICKET', label: '➕ Abrir Chamado' },
              { id: 'LIVE_CHAT', label: '💬 Chat de Atendimento' },
              { id: 'RECOVERY', label: '🔄 Recuperar Conta' }
            ].map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === t.id
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {feedbackMsg && (
            <div className={`p-3 rounded-xl text-xs font-semibold ${
              feedbackMsg.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
            }`}>
              {feedbackMsg.text}
            </div>
          )}

          {/* 1. FAQ TAB */}
          {activeTab === 'FAQ' && (
            <div className="space-y-4 animate-in fade-in">
              <input
                type="text"
                value={faqSearch}
                onChange={e => setFaqSearch(e.target.value)}
                placeholder="Buscar dúvida ou tópico de ajuda..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />

              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {filteredFaqs.map((faq, i) => (
                  <div key={i} className="p-4 rounded-xl bg-slate-900/70 border border-white/5 space-y-1.5">
                    <h4 className="text-xs md:text-sm font-bold text-cyan-300">{faq.q}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. GUIDES TAB */}
          {activeTab === 'GUIDES' && (
            <div className="space-y-4 animate-in fade-in max-h-96 overflow-y-auto pr-1 text-xs text-slate-300 space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/70 border border-white/5 space-y-2">
                <h4 className="text-sm font-bold text-violet-300">1. Construção & Edição do Currículo</h4>
                <p>Navegue pelas abas (Dados Pessoais, Resumo, Experiência, Habilidades, Educação e Projetos). Suas informações são salvas automaticamente a cada edição no banco de dados.</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/70 border border-white/5 space-y-2">
                <h4 className="text-sm font-bold text-cyan-300">2. Importação Automática de PDF ou DOCX</h4>
                <p>Abra o <strong>Assistente IA</strong> e na aba <strong>Importar Arquivo</strong>, envie seu arquivo .pdf ou .docx antigo para que a inteligência artificial preencha o currículo para você.</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/70 border border-white/5 space-y-2">
                <h4 className="text-sm font-bold text-emerald-300">3. Auditoria ATS em Tempo Real</h4>
                <p>Clique no botão flutuante <strong>ATS: XX/100</strong> para ver palavras-chave em falta no mercado e recomendações personalizadas do recrutador inteligente.</p>
              </div>
            </div>
          )}

          {/* 3. MEUS CHAMADOS TAB */}
          {activeTab === 'TICKETS' && (
            <div className="space-y-3 animate-in fade-in">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Seus Chamados de Suporte</h3>
                <Button variant="neon" size="sm" onClick={() => setActiveTab('NEW_TICKET')} leftIcon="+">
                  Novo Chamado
                </Button>
              </div>

              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {tickets.length === 0 ? (
                  <p className="text-xs text-slate-500 py-8 text-center">Você não possui nenhum chamado aberto.</p>
                ) : (
                  tickets.map(t => (
                    <div
                      key={t.id}
                      onClick={() => { setActiveTicket(t); setActiveTab('LIVE_CHAT'); }}
                      className="p-3.5 rounded-xl bg-slate-900/80 border border-white/5 hover:border-cyan-500/40 transition cursor-pointer flex justify-between items-center"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-100">{t.subject}</span>
                          <Badge variant={t.type === 'ACCOUNT_DELETION' ? 'red' : 'cyan'} className="text-[9px]">
                            {t.type}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate max-w-md">{t.description}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge variant={t.status === 'RESOLVED' ? 'emerald' : t.status === 'IN_PROGRESS' ? 'amber' : 'violet'}>
                          {t.status}
                        </Badge>
                        <span className="text-cyan-400 text-xs font-bold">Abrir Chat →</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 4. NOVO CHAMADO TAB */}
          {activeTab === 'NEW_TICKET' && (
            <form onSubmit={handleCreateTicket} className="space-y-3.5 animate-in fade-in">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Tipo de Solicitação</label>
                <select
                  value={ticketType}
                  onChange={e => setTicketType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                >
                  <option value="TECHNICAL_ISSUE">Problema Técnico / Bug no Sistema</option>
                  <option value="FEATURE_REQUEST">Sugestão de Recurso / Novo Modelo</option>
                  <option value="BILLING">Dúvidas sobre Exportação / Documentos</option>
                  <option value="ACCOUNT_DELETION">⚠️ Solicitação de Exclusão de Conta (Prazo de 30 dias)</option>
                  <option value="GENERAL">Outros Assuntos</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Assunto</label>
                <input
                  type="text"
                  required
                  value={ticketSubject}
                  onChange={e => setTicketSubject(e.target.value)}
                  placeholder="Resumo do problema ou solicitação..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Descrição Detalhada</label>
                <textarea
                  rows={4}
                  required
                  value={ticketDescription}
                  onChange={e => setTicketDescription(e.target.value)}
                  placeholder="Descreva detalhadamente o que ocorreu..."
                  className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <Button
                variant="neon"
                size="md"
                type="submit"
                isLoading={isSubmittingTicket}
                className="w-full font-bold min-h-[42px]"
              >
                Enviar Chamado para o Atendimento
              </Button>
            </form>
          )}

          {/* 5. LIVE CHAT TAB */}
          {activeTab === 'LIVE_CHAT' && (
            <div className="space-y-3 animate-in fade-in">
              {activeTicket ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-900/80 border border-white/5">
                    <div>
                      <span className="text-xs font-bold text-slate-100">Chamado: {activeTicket.subject}</span>
                      <span className="text-[10px] text-slate-400 block">Status: {activeTicket.status} • Atendente: {activeTicket.assignedTo || 'Aguardando atendente...'}</span>
                    </div>
                    <Badge variant={activeTicket.status === 'RESOLVED' ? 'emerald' : 'amber'}>
                      {activeTicket.status}
                    </Badge>
                  </div>

                  {/* Messages Area */}
                  <div className="h-64 overflow-y-auto p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-2.5">
                    {chatMessages.map((m, idx) => (
                      <div
                        key={idx}
                        className={`flex flex-col ${m.sender === 'USER' ? 'items-end' : 'items-start'}`}
                      >
                        <span className="text-[10px] text-slate-400 mb-0.5">{m.senderName} • {m.timestamp}</span>
                        <div className={`p-3 rounded-2xl max-w-sm text-xs leading-relaxed ${
                          m.sender === 'USER'
                            ? 'bg-cyan-600 text-slate-950 font-medium rounded-tr-none'
                            : 'bg-slate-800 text-slate-100 border border-white/10 rounded-tl-none'
                        }`}>
                          {m.text}
                        </div>
                      </div>
                    ))}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Send Input */}
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      placeholder="Digite sua mensagem em tempo real para o atendente..."
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                    />
                    <Button variant="neon" size="sm" type="submit" isLoading={isSendingMsg} leftIcon="➤">
                      Enviar
                    </Button>
                  </form>
                </div>
              ) : (
                <div className="py-12 text-center space-y-3">
                  <p className="text-xs text-slate-400">Nenhum chamado selecionado para o chat em tempo real.</p>
                  <Button variant="glass" size="sm" onClick={() => setActiveTab('TICKETS')}>
                    Ver Meus Chamados
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* 6. RECOVERY TAB */}
          {activeTab === 'RECOVERY' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 rounded-xl bg-slate-900/70 border border-amber-500/30 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  🛡️ Recuperação de Conta Excluída (Prazo de 30 Dias)
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Se você solicitou a exclusão da sua conta, ela permanece em período de carência por 30 dias. Insira o token de recuperação único enviado para o seu e-mail para restaurar imediatamente seu acesso.
                </p>
              </div>

              <form onSubmit={handleRecoverAccount} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Token de Recuperação</label>
                  <input
                    type="text"
                    required
                    value={recoveryToken}
                    onChange={e => setRecoveryToken(e.target.value)}
                    placeholder="Cole o token de 64 caracteres recebido no e-mail..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {recoveryStatus && (
                  <div className="p-3 rounded-xl bg-slate-900 border border-white/10 text-xs font-bold text-cyan-300">
                    {recoveryStatus}
                  </div>
                )}

                <Button
                  variant="neon"
                  size="md"
                  type="submit"
                  isLoading={isRecovering}
                  className="w-full font-bold min-h-[42px]"
                >
                  Restaurar Minha Conta Agora
                </Button>
              </form>
            </div>
          )}
        </GlassSurface>
      </div>
    </div>
  );
};
