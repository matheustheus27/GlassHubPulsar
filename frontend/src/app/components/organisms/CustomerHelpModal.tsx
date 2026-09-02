import React, { useState, useEffect, useRef } from 'react';
import { GlassSurface } from '../atoms/GlassSurface';
import { Heading, GradientText } from '../atoms/Typography';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { GlassHubLogo } from '../atoms/GlassHubLogo';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../hooks/useI18n';

interface CustomerHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomerHelpModal: React.FC<CustomerHelpModalProps> = ({ isOpen, onClose }) => {
  const { user, accessToken } = useAuth();
  const { t, locale } = useI18n();
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

  const isPt = locale.startsWith('pt');
  const faqs = isPt ? [
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
      a: 'Sim! Na gaveta do Assistente IA (Quick Fill), utilize a opção "Importar Arquivo" para fazer upload de arquivos .pdf ou .docx. O motor extrai e preenche automaticamente cada campo do seu currículo.'
    },
    {
      q: 'Como gerar meu currículo em outros idiomas?',
      a: 'Acesse o menu "Documento" e clique em "Adicionar Versão Internacional". Você pode escolher preenchimento manual ou tradução automática instantânea via worker com Llama 3.2 / TranslateGemma.'
    },
    {
      q: 'Como funciona a exportação de PDF calibrada?',
      a: 'A exportação é processada em segundo plano por um worker Puppeteer Linux dedicado com resolução de 300 DPI, garantindo proporções milimétricas A4 e quebra de páginas sem corte de linhas.'
    }
  ] : [
    {
      q: 'How does the ATS compatibility evaluation work?',
      a: 'The system evaluates action verb density, essential technology keywords, and structural clarity based on corporate applicant tracking benchmarks (Llama 3.2 ATS Engine).'
    },
    {
      q: 'How does account deletion and the 30-day grace period work?',
      a: 'When requesting account deletion, your account is placed into a temporary deactivation status. You receive an email with a unique recovery token and have 30 days to restore access. After 30 days, all data is permanently and irreversibly purged.'
    },
    {
      q: 'Can I import an existing PDF or DOCX resume?',
      a: 'Yes! In the AI Assistant drawer (Quick Fill), select "File Import" to upload your .pdf or .docx resume. The Llama 3.2 engine automatically extracts and populates each field.'
    },
    {
      q: 'How do I generate my resume in other languages?',
      a: 'Open the "Document" menu and click "Add International Version". You can choose manual authoring or instant AI translation via worker with Llama 3.2 / TranslateGemma.'
    },
    {
      q: 'How does the calibrated PDF export work?',
      a: 'Export is processed in the background by a dedicated Puppeteer worker at 300 DPI, ensuring millimeter-accurate A4 sizing and clean page breaks without splitting text.'
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
                <GradientText from="from-cyan-400" to="to-violet-400">{t('helpModalTitle')}</GradientText>
              </Heading>
              <p className="text-xs text-slate-400">
                {t('helpModalSubtitle')}
              </p>
            </div>
          </div>

          {/* TABS NAVIGATION */}
          <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
            {[
              { id: 'FAQ', label: `❓ ${t('tabFaq')}` },
              { id: 'GUIDES', label: `📖 ${t('tabGuides')}` },
              { id: 'TICKETS', label: `🎫 ${t('tabTickets')} (${tickets.length})` },
              { id: 'NEW_TICKET', label: `➕ ${t('tabNewTicket')}` },
              { id: 'LIVE_CHAT', label: `💬 ${t('tabLiveChat')}` },
              { id: 'RECOVERY', label: `🔄 ${t('tabRecovery')}` }
            ].map(tabItem => (
              <button
                key={tabItem.id}
                type="button"
                onClick={() => setActiveTab(tabItem.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === tabItem.id
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tabItem.label}
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
                placeholder={t('searchFaqPlaceholder')}
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
            <div className="space-y-4 animate-in fade-in max-h-96 overflow-y-auto pr-1 text-xs text-slate-300">
              <div className="p-4 rounded-xl bg-slate-900/70 border border-white/5 space-y-2">
                <h4 className="text-sm font-bold text-violet-300">
                  {isPt ? '1. Construção & Edição do Currículo' : '1. Resume Building & Editing'}
                </h4>
                <p>
                  {isPt 
                    ? 'Navegue pelas abas (Dados Pessoais, Resumo, Experiência, Habilidades, Educação, Projetos e Carta). Suas informações são salvas automaticamente a cada edição no banco de dados.'
                    : 'Navigate through tabs (Personal Info, Summary, Experience, Skills, Education, Projects, and Cover Letter). All changes auto-save instantly to the database.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/70 border border-white/5 space-y-2">
                <h4 className="text-sm font-bold text-cyan-300">
                  {isPt ? '2. Importação Automática de PDF ou DOCX' : '2. Automated PDF/DOCX Parsing'}
                </h4>
                <p>
                  {isPt
                    ? 'Abra o Assistente IA e na aba Importar Arquivo, envie seu arquivo .pdf ou .docx para que a inteligência artificial estruture os campos automaticamente.'
                    : 'Open the AI Assistant and select File Import to upload an existing .pdf or .docx resume for automated extraction.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/70 border border-white/5 space-y-2">
                <h4 className="text-sm font-bold text-emerald-300">
                  {isPt ? '3. Auditoria ATS em Tempo Real' : '3. Real-Time ATS Audit'}
                </h4>
                <p>
                  {isPt
                    ? 'Clique no botão flutuante ATS para visualizar palavras-chave em falta no mercado e recomendações personalizadas do recrutador inteligente.'
                    : 'Click the floating ATS button to inspect missing industry keywords and actionable suggestions from the AI recruiter.'}
                </p>
              </div>
            </div>
          )}

          {/* 3. MEUS CHAMADOS TAB */}
          {activeTab === 'TICKETS' && (
            <div className="space-y-3 animate-in fade-in">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">{t('tabTickets')}</h3>
                <Button variant="neon" size="sm" onClick={() => setActiveTab('NEW_TICKET')} leftIcon="+">
                  {t('tabNewTicket')}
                </Button>
              </div>

              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {tickets.length === 0 ? (
                  <p className="text-xs text-slate-500 py-8 text-center">{t('noTicketsFound')}</p>
                ) : (
                  tickets.map(tkt => (
                    <div
                      key={tkt.id}
                      onClick={() => { setActiveTicket(tkt); setActiveTab('LIVE_CHAT'); }}
                      className="p-3.5 rounded-xl bg-slate-900/80 border border-white/5 hover:border-cyan-500/40 transition cursor-pointer flex justify-between items-center"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-100">{tkt.subject}</span>
                          <Badge variant={tkt.type === 'ACCOUNT_DELETION' ? 'red' : 'cyan'} className="text-[9px]">
                            {tkt.type}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate max-w-md">{tkt.description}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge variant={tkt.status === 'RESOLVED' ? 'emerald' : tkt.status === 'IN_PROGRESS' ? 'amber' : 'violet'}>
                          {tkt.status}
                        </Badge>
                        <span className="text-cyan-400 text-xs font-bold">Chat →</span>
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
                <label className="text-xs font-bold text-slate-300 block mb-1">{t('ticketTypeLabel')}</label>
                <select
                  value={ticketType}
                  onChange={e => setTicketType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                >
                  <option value="TECHNICAL_ISSUE">{t('ticketTypeIssue')}</option>
                  <option value="FEATURE_REQUEST">{t('ticketTypeFeature')}</option>
                  <option value="BILLING">{t('ticketTypeBilling')}</option>
                  <option value="ACCOUNT_DELETION">{t('ticketTypeAccount')}</option>
                  <option value="GENERAL">General</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">{t('ticketSubjectLabel')}</label>
                <input
                  type="text"
                  required
                  value={ticketSubject}
                  onChange={e => setTicketSubject(e.target.value)}
                  placeholder={t('ticketSubjectPlaceholder')}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">{t('ticketDescLabel')}</label>
                <textarea
                  rows={4}
                  required
                  value={ticketDescription}
                  onChange={e => setTicketDescription(e.target.value)}
                  placeholder={t('ticketDescPlaceholder')}
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
                {t('openTicketBtn')}
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
                      <span className="text-xs font-bold text-slate-100">{t('tabTickets')}: {activeTicket.subject}</span>
                      <span className="text-[10px] text-slate-400 block">Status: {activeTicket.status} • {activeTicket.assignedTo || t('chatAgentWaiting')}</span>
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
                      placeholder={t('chatInputPlaceholder')}
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                    />
                    <Button variant="neon" size="sm" type="submit" isLoading={isSendingMsg} leftIcon="➤">
                      {t('chatSendBtn')}
                    </Button>
                  </form>
                </div>
              ) : (
                <div className="py-12 text-center space-y-3">
                  <p className="text-xs text-slate-400">{t('noTicketsFound')}</p>
                  <Button variant="glass" size="sm" onClick={() => setActiveTab('TICKETS')}>
                    {t('tabTickets')}
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
                  🛡️ {t('tabRecovery')}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {isPt
                    ? 'Se você solicitou a exclusão da sua conta, ela permanece em período de carência por 30 dias. Insira o token de recuperação único enviado para o seu e-mail para restaurar imediatamente seu acesso.'
                    : 'If you requested account deletion, your account remains in a 30-day grace period. Enter the unique recovery token sent to your email to restore access.'}
                </p>
              </div>

              <form onSubmit={handleRecoverAccount} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">{t('recoveryTokenLabel')}</label>
                  <input
                    type="text"
                    required
                    value={recoveryToken}
                    onChange={e => setRecoveryToken(e.target.value)}
                    placeholder={t('recoveryTokenPlaceholder')}
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
                  {t('restoreAccountBtn')}
                </Button>
              </form>
            </div>
          )}
        </GlassSurface>
      </div>
    </div>
  );
};
