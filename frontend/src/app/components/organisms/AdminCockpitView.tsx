import React, { useEffect, useState, useRef } from 'react';
import { GlassSurface } from '../atoms/GlassSurface';
import { Heading, GradientText } from '../atoms/Typography';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { ProgressBar } from '../atoms/ProgressBar';
import { GlassHubLogo } from '../atoms/GlassHubLogo';
import { useI18n } from '../../hooks/useI18n';
import { useAuth } from '../../hooks/useAuth';

interface AdminCockpitViewProps {
  onBackToWorkspace?: () => void;
}

export const AdminCockpitView: React.FC<AdminCockpitViewProps> = ({ onBackToWorkspace }) => {
  const { t } = useI18n();
  const { user, accessToken, logoutUser } = useAuth();
  const [data, setData] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [ticketsList, setTicketsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [reportDownloadUrl, setReportDownloadUrl] = useState<string | null>(null);
  const [reportFileName, setReportFileName] = useState<string | null>(null);

  // Admin Profile form state
  const [adminName, setAdminName] = useState(user?.name || 'Administrador');
  const [adminEmail, setAdminEmail] = useState(user?.email || 'admin@glasshub.com');
  const [adminPassword, setAdminPassword] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // New user modal/form state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'USER' | 'ADMIN'>('USER');
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Ticket Chat & Deletion Modal state
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [adminChatMessages, setAdminChatMessages] = useState<any[]>([]);
  const [adminChatInput, setAdminChatInput] = useState('');
  const [isSendingAdminMsg, setIsSendingAdminMsg] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [isExecutingDeletion, setIsExecutingDeletion] = useState(false);
  const adminChatBottomRef = useRef<HTMLDivElement>(null);

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': accessToken ? `Bearer ${accessToken}` : ''
  };

  const fetchHealth = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/health', {
        headers: authHeaders,
        credentials: 'include'
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Failed to fetch admin telemetry:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', {
        headers: authHeaders,
        credentials: 'include'
      });
      if (res.ok) {
        const json = await res.json();
        setUsersList(json.users || []);
      }
    } catch (e) {
      console.error('Failed to fetch users list:', e);
    }
  };

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/support/tickets', {
        headers: authHeaders,
        credentials: 'include'
      });
      if (res.ok) {
        const json = await res.json();
        setTicketsList(json.tickets || []);
      }
    } catch (e) {
      console.error('Failed to fetch support tickets:', e);
    }
  };

  useEffect(() => {
    fetchHealth();
    fetchUsers();
    fetchTickets();
    const interval = setInterval(() => {
      fetchHealth();
      fetchTickets();
    }, 8000);
    return () => clearInterval(interval);
  }, [accessToken]);

  // Real-time SSE stream for selected ticket
  useEffect(() => {
    if (!selectedTicket) return;

    setAdminChatMessages(Array.isArray(selectedTicket.messages) ? selectedTicket.messages : []);

    const eventSource = new EventSource(`/api/support/tickets/${selectedTicket.id}/stream`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'new_message' && data.message) {
          setAdminChatMessages(prev => {
            if (prev.some(m => m.id === data.message.id)) return prev;
            return [...prev, data.message];
          });
        }
      } catch (e) {}
    };

    return () => {
      eventSource.close();
    };
  }, [selectedTicket?.id]);

  useEffect(() => {
    adminChatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [adminChatMessages]);

  const handleUpdateAdminProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          name: adminName,
          email: adminEmail,
          password: adminPassword || undefined
        }),
        credentials: 'include'
      });
      const json = await res.json();
      if (res.ok) {
        setActionMessage('✓ Dados do Administrador atualizados com sucesso!');
        setAdminPassword('');
        setTimeout(() => setActionMessage(null), 5000);
      } else {
        setActionMessage(`Erro: ${json.error || 'Falha ao atualizar perfil'}`);
      }
    } catch (e: any) {
      setActionMessage(`Erro: ${e.message}`);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingUser(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole
        }),
        credentials: 'include'
      });
      const json = await res.json();
      if (res.ok) {
        setActionMessage(`✓ Conta para ${newUserEmail} (${newUserRole}) criada com sucesso!`);
        setShowAddUserModal(false);
        setNewUserName('');
        setNewUserEmail('');
        setNewUserPassword('');
        fetchUsers();
        setTimeout(() => setActionMessage(null), 5000);
      } else {
        setActionMessage(`Erro: ${json.error || 'Falha ao criar usuário'}`);
      }
    } catch (e: any) {
      setActionMessage(`Erro: ${e.message}`);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleAcceptTicket = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}/accept`, {
        method: 'POST',
        headers: authHeaders,
        credentials: 'include'
      });
      if (res.ok) {
        const json = await res.json();
        setSelectedTicket(json.ticket);
        fetchTickets();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolveTicket = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}/resolve`, {
        method: 'POST',
        headers: authHeaders,
        credentials: 'include'
      });
      if (res.ok) {
        setActionMessage('✓ Chamado marcado como resolvido!');
        setSelectedTicket(null);
        fetchTickets();
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendAdminMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminChatInput.trim() || !selectedTicket) return;

    setIsSendingAdminMsg(true);
    const text = adminChatInput;
    setAdminChatInput('');

    try {
      await fetch(`/api/support/tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ text }),
        credentials: 'include'
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsSendingAdminMsg(false);
    }
  };

  const handleExecuteAccountDeletion = async () => {
    if (!selectedTicket) return;
    setIsExecutingDeletion(true);
    try {
      const res = await fetch('/api/support/account-deletion/execute', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          userId: selectedTicket.userId
        }),
        credentials: 'include'
      });
      const json = await res.json();
      if (res.ok) {
        setActionMessage(`✓ ${json.message}`);
        setShowDeleteConfirmModal(false);
        setSelectedTicket(null);
        fetchTickets();
        fetchUsers();
        setTimeout(() => setActionMessage(null), 6000);
      } else {
        setActionMessage(`Erro: ${json.error}`);
      }
    } catch (e: any) {
      setActionMessage(`Erro: ${e.message}`);
    } finally {
      setIsExecutingDeletion(false);
    }
  };

  const handleQueueAction = async (queueName: string, action: 'pause' | 'resume' | 'clean') => {
    try {
      const res = await fetch(`/api/admin/queues/${queueName}/${action}`, {
        method: 'POST',
        headers: authHeaders,
        credentials: 'include'
      });
      if (res.ok) {
        const json = await res.json();
        setActionMessage(json.message);
        setTimeout(() => setActionMessage(null), 4000);
        fetchHealth();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateExecutiveReport = async () => {
    setIsGeneratingReport(true);
    setReportDownloadUrl(null);
    try {
      const res = await fetch('/api/admin/report/pdf', {
        method: 'POST',
        headers: authHeaders,
        credentials: 'include'
      });
      if (res.ok) {
        const json = await res.json();
        setReportDownloadUrl(json.downloadUrl);
        setReportFileName(json.fileName || 'GlassHub_Executive_Report.pdf');
        setActionMessage('✓ Relatório Executivo Híbrido gerado com sucesso! Clique no botão de download abaixo.');

        if (json.downloadUrl) {
          const a = document.createElement('a');
          a.href = json.downloadUrl;
          a.download = json.fileName || 'GlassHub_Executive_Report.pdf';
          a.click();
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const telemetry = data?.telemetry;
  const queues = data?.queues || {};
  const databaseLogs = data?.databaseLogs;
  const compositeScore = data?.compositeHealthScore || 98;

  return (
    <div className="min-h-screen p-4 md:p-8 bg-[#030712] relative overflow-hidden font-sans text-slate-100">
      {/* AMBIENT BACKGROUND GLOWS */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-6 relative z-10">
        {/* TOP BAR */}
        <header className="flex flex-wrap justify-between items-center gap-4 p-4 rounded-2xl bg-slate-950/85 border border-white/10 backdrop-blur-2xl shadow-2xl">
          <div className="flex items-center gap-3">
            <GlassHubLogo size={32} />
            <div>
              <Heading level={1} className="text-xl md:text-2xl text-slate-100 font-black">
                GlassHub <GradientText from="from-violet-400" to="to-cyan-400">Admin Command Center</GradientText>
              </Heading>
              <p className="text-xs text-slate-400">
                Painel Administrativo Exclusivo • Gestão de Usuários, Chamados de Suporte & Telemetria
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {onBackToWorkspace && (
              <Button variant="glass" size="sm" onClick={onBackToWorkspace} leftIcon="💻" className="text-xs font-bold">
                Ir ao Workspace
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={fetchHealth} isLoading={isLoading} leftIcon="🔄" className="text-xs">
              Atualizar
            </Button>
            <Button variant="danger" size="sm" onClick={logoutUser} leftIcon="🚪" className="text-xs">
              Sair da Conta
            </Button>
          </div>
        </header>

        {actionMessage && (
          <div className="relative z-30 p-4 rounded-2xl bg-slate-900/95 border border-emerald-500/40 text-xs font-semibold text-emerald-300 shadow-2xl backdrop-blur-xl animate-in fade-in flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-base">🔔</span>
              <span>{actionMessage}</span>
            </div>
            <div className="flex items-center gap-2">
              {reportDownloadUrl && (
                <a
                  href={reportDownloadUrl}
                  download={reportFileName || 'GlassHub_Executive_Report.pdf'}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 shadow-lg transition"
                >
                  📥 Baixar PDF Agora
                </a>
              )}
              <button
                type="button"
                onClick={() => setActionMessage(null)}
                className="text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition cursor-pointer ml-1"
                title="Fechar notificação"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* 1. GESTÃO DE DADOS PESSOAIS DO ADMIN & CRIAÇÃO DE CONTAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Form: Editar Dados Pessoais do Admin */}
          <GlassSurface glow="violet" className="bg-slate-950/85 p-6 space-y-4 shadow-2xl">
            <div className="border-b border-white/10 pb-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-violet-300">
                👤 Meus Dados de Administrador
              </h2>
              <p className="text-xs text-slate-400">Atualize seu nome, e-mail e senha de acesso administrativo.</p>
            </div>

            <form onSubmit={handleUpdateAdminProfile} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Nome do Administrador</label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={e => setAdminName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-violet-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">E-mail Administrativo</label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={e => setAdminEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-violet-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Nova Senha (opcional)</label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  placeholder="Deixe em branco para manter a atual"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-violet-400"
                />
              </div>

              <Button
                variant="neon"
                size="sm"
                type="submit"
                isLoading={isUpdatingProfile}
                className="w-full bg-violet-500 hover:bg-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.3)] font-bold min-h-[38px]"
              >
                Salvar Meus Dados
              </Button>
            </form>
          </GlassSurface>

          {/* User Accounts Management */}
          <GlassSurface glow="cyan" className="bg-slate-950/85 p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-300">
                  👥 Gestão de Contas do Sistema
                </h2>
                <p className="text-xs text-slate-400">{usersList.length} contas registradas no banco</p>
              </div>

              <Button
                variant="neon"
                size="sm"
                onClick={() => setShowAddUserModal(true)}
                leftIcon="+"
                className="text-xs font-bold"
              >
                Nova Conta
              </Button>
            </div>

            {/* Users List */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {usersList.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">Nenhuma conta cadastrada.</p>
              ) : (
                usersList.map((u: any) => (
                  <div
                    key={u.id}
                    className="p-2.5 rounded-xl bg-slate-900/80 border border-white/5 flex justify-between items-center text-xs"
                  >
                    <div className="truncate max-w-[200px]">
                      <span className="font-bold text-slate-100 block truncate">{u.name}</span>
                      <span className="text-[11px] text-slate-400 block truncate">{u.email}</span>
                    </div>
                    <Badge variant={u.role === 'ADMIN' ? 'violet' : 'cyan'}>
                      {u.role}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </GlassSurface>
        </div>

        {/* 2. CENTRAL DE ATENDIMENTO & CHAMADOS DE SUPORTE (NOVO) */}
        <GlassSurface glow="cyan" className="bg-slate-950/85 p-6 space-y-4 shadow-2xl">
          <div className="flex justify-between items-center border-b border-white/10 pb-2">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-300">
                🎫 Central de Atendimento & Chamados de Suporte
              </h2>
              <p className="text-xs text-slate-400">Atenda solicitações de clientes e gerencie exclusões de conta com prazo de 30 dias</p>
            </div>
            <span className="text-xs font-bold text-cyan-400">{ticketsList.length} Chamados</span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {ticketsList.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">Nenhum chamado de suporte aberto.</p>
            ) : (
              ticketsList.map((ticket: any) => (
                <div
                  key={ticket.id}
                  className="p-3 rounded-xl bg-slate-900/80 border border-white/5 flex flex-wrap justify-between items-center gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100">{ticket.subject}</span>
                      <Badge variant={ticket.type === 'ACCOUNT_DELETION' ? 'red' : 'cyan'} className="text-[9px]">
                        {ticket.type}
                      </Badge>
                      <Badge variant={ticket.status === 'RESOLVED' ? 'emerald' : ticket.status === 'IN_PROGRESS' ? 'amber' : 'violet'} className="text-[9px]">
                        {ticket.status}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Cliente: <strong>{ticket.userName}</strong> ({ticket.userEmail}) • Atendente: {ticket.assignedTo || 'Não atribuído'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="glass"
                      size="sm"
                      onClick={() => { setSelectedTicket(ticket); }}
                    >
                      💬 Abrir Chat
                    </Button>

                    {ticket.status === 'OPEN' && (
                      <Button
                        variant="neon"
                        size="sm"
                        onClick={() => handleAcceptTicket(ticket.id)}
                      >
                        Aceitar
                      </Button>
                    )}

                    {ticket.type === 'ACCOUNT_DELETION' && ticket.status !== 'RESOLVED' && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => { setSelectedTicket(ticket); setShowDeleteConfirmModal(true); }}
                      >
                        🗑️ Excluir Conta (30d)
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassSurface>

        {/* 3. UNIFIED COMPOSITE HEALTH METRIC & APM TELEMETRY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GlassSurface glow="cyan" className="bg-slate-950/85 p-5 space-y-3 md:col-span-1 shadow-2xl">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                {t('compositeHealthTitle')}
              </span>
              <Badge variant="emerald" className="font-bold text-xs">
                ● 100% OK
              </Badge>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-cyan-300">{compositeScore}%</span>
              <span className="text-xs text-slate-400">Health Index</span>
            </div>
            <ProgressBar progress={compositeScore} color="cyan" />
            <span className="text-[11px] text-slate-400 block pt-1">
              Calculado combinando métricas APM Datadog + taxa de erro do PostgreSQL.
            </span>
          </GlassSurface>

          <GlassSurface glow="violet" className="bg-slate-950/85 p-5 space-y-3 md:col-span-2 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">🐶</span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  {t('datadogStatus')}
                </span>
              </div>
              <span className="text-xs font-bold text-emerald-400">
                {t('datadogConnected')}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Uptime</span>
                <span className="text-sm font-black text-slate-100">{telemetry?.uptimeSeconds || 0}s</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Heap Memory</span>
                <span className="text-sm font-black text-violet-300">{telemetry?.memory?.heapUsedMb || 0} MB</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">PDF Exports</span>
                <span className="text-sm font-black text-emerald-300">{telemetry?.counters?.pdfExports || 0}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">AI Inferences</span>
                <span className="text-sm font-black text-amber-300">{telemetry?.counters?.atsAnalyses || 0}</span>
              </div>
            </div>
          </GlassSurface>
        </div>

        {/* 4. SRE TELEMETRY: REDIS CACHE & CDC SYNC */}
        <GlassSurface glow="cyan" className="bg-slate-950/85 p-5 space-y-3 shadow-2xl">
          <div className="flex justify-between items-center border-b border-white/10 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
              ⚡ Telemetria SRE: Redis Cache & CDC (Change Data Capture)
            </h3>
            <Badge variant="emerald" className="text-[10px]">
              CDC Reativo Ativo
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Cache Hit Ratio</span>
              <span className="text-base font-black text-emerald-400">{data?.cache?.hitRatioPercent || 100}%</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Cache Hits / Misses</span>
              <span className="text-base font-black text-cyan-300">{data?.cache?.hits || 0} / {data?.cache?.misses || 0}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">CDC Sync Latency</span>
              <span className="text-base font-black text-amber-300">&lt; 3 ms</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">RAG Indexed Users</span>
              <span className="text-base font-black text-violet-300">{data?.rag?.indexedUsersCount || 0}</span>
            </div>
          </div>
        </GlassSurface>

        {/* 5. WORKER QUEUES MONITOR (BULLMQ / REDIS) */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              {t('workerQueuesTitle')} (6 Microsserviços Desacoplados)
            </h2>
            <span className="text-xs text-slate-400 font-mono">Broker: Redis 7</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { id: 'ocr', name: 'worker-ocr', desc: 'Extração OCR multimodal com Llama 3.2 Vision (11B)' },
              { id: 'cdc', name: 'worker-cdc', desc: 'Sincronização reativa de Cache Redis via CDC (PostgreSQL)' },
              { id: 'translation', name: 'worker-translation', desc: 'Tradução assíncrona (TranslateGemma / Llama)' },
              { id: 'notification', name: 'worker-notification', desc: 'Disparo multicanal (In-App, SSE, Email)' },
              { id: 'pdf', name: 'worker-pdf', desc: 'Renderização Puppeteer A4 e Relatórios Executivos' },
              { id: 'analytics', name: 'worker-analytics', desc: 'Avaliador ATS semântico & Busca Vetorial RAG' }
            ].map(w => {
              const stat = queues[w.id] || { waiting: 0, active: 0, completed: 0, failed: 0, paused: 0 };
              const isPaused = stat.paused > 0;

              return (
                <GlassSurface key={w.id} glow="cyan" className="bg-slate-950/80 p-5 space-y-4 shadow-xl">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">{w.name}</h3>
                      <p className="text-xs text-slate-400">{w.desc}</p>
                    </div>
                    <Badge variant={isPaused ? 'amber' : 'emerald'}>
                      {isPaused ? '⏸️ PAUSADO' : '● ATIVO'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-slate-900/80 border border-white/5">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Fila</span>
                      <span className="font-black text-slate-200 text-sm">{stat.waiting}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/30">
                      <span className="text-cyan-400 block text-[10px] uppercase font-bold">Ativos</span>
                      <span className="font-black text-cyan-300 text-sm">{stat.active}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
                      <span className="text-emerald-400 block text-[10px] uppercase font-bold">Concluídos</span>
                      <span className="font-black text-emerald-300 text-sm">{stat.completed}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-red-950/40 border border-red-500/30">
                      <span className="text-red-400 block text-[10px] uppercase font-bold">Falhas</span>
                      <span className="font-black text-red-300 text-sm">{stat.failed}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    {isPaused ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQueueAction(w.id, 'resume')}
                        className="flex-1"
                        leftIcon="▶️"
                      >
                        Retomar Fila
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleQueueAction(w.id, 'pause')}
                        className="flex-1"
                        leftIcon="⏸️"
                      >
                        Pausar Worker
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleQueueAction(w.id, 'clean')}
                      leftIcon="🧹"
                    >
                      Limpar
                    </Button>
                  </div>
                </GlassSurface>
              );
            })}
          </div>
        </div>

        {/* 5. RECENT POSTGRESQL LOGS TABLE */}
        <GlassSurface glow="violet" className="bg-slate-950/85 p-5 space-y-3 shadow-2xl">
          <div className="flex justify-between items-center border-b border-white/10 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              {t('localLogsTitle')} ({databaseLogs?.total || 0} Registros)
            </h3>
            <span className="text-xs text-slate-400">Tabela: system_execution_logs</span>
          </div>

          <div className="overflow-x-auto max-h-60 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase text-slate-400">
                  <th className="py-2 px-2">Data/Hora</th>
                  <th className="py-2 px-2">Nível</th>
                  <th className="py-2 px-2">Serviço / Rota</th>
                  <th className="py-2 px-2">Mensagem</th>
                  <th className="py-2 px-2">Duração</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {(databaseLogs?.recent || []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-slate-500 font-sans">
                      Nenhum trace recente registrado.
                    </td>
                  </tr>
                ) : (
                  databaseLogs.recent.map((l: any) => (
                    <tr key={l.id} className="hover:bg-white/5 transition">
                      <td className="py-2 px-2 text-slate-400">{new Date(l.timestamp).toLocaleTimeString()}</td>
                      <td className="py-2 px-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          l.level === 'ERROR' ? 'bg-red-500/20 text-red-400' : 'bg-cyan-500/20 text-cyan-300'
                        }`}>
                          {l.level}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-slate-200">{l.route || l.service}</td>
                      <td className="py-2 px-2 text-slate-300 truncate max-w-xs">{l.message}</td>
                      <td className="py-2 px-2 text-emerald-400">{l.durationMs ? `${l.durationMs}ms` : '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </GlassSurface>

        {/* 6. EXECUTIVE HYBRID REPORT GENERATOR */}
        <GlassSurface glow="violet" className="bg-slate-950/90 border-violet-500/40 p-6 flex flex-col md:flex-row justify-between items-center gap-4 shadow-2xl">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-violet-300 uppercase tracking-wider flex items-center gap-2">
              📑 {t('generateExecutiveReportBtn')}
            </h3>
            <p className="text-xs text-slate-400 max-w-xl">
              Dispara tarefa em segundo plano para o worker-pdf compilar e arquivar o relatório executivo híbrido com métricas do Datadog e traces do PostgreSQL.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {reportDownloadUrl && (
              <a
                href={reportDownloadUrl}
                download={reportFileName || 'GlassHub_Executive_Report.pdf'}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg flex items-center gap-1.5"
              >
                📥 Baixar Relatório
              </a>
            )}

            <Button
              variant="neon"
              size="md"
              onClick={handleGenerateExecutiveReport}
              isLoading={isGeneratingReport}
              leftIcon="📊"
              className="bg-violet-500 hover:bg-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.4)] font-bold min-h-[44px]"
            >
              {isGeneratingReport ? 'Gerando Relatório...' : 'Gerar Relatório Híbrido'}
            </Button>
          </div>
        </GlassSurface>
      </div>

      {/* ADMIN REAL-TIME LIVE CHAT MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl">
            <GlassSurface glow="cyan" className="bg-slate-950/95 border-white/15 p-6 space-y-4 shadow-2xl relative">
              <button
                onClick={() => setSelectedTicket(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>

              <div className="flex justify-between items-start border-b border-white/10 pb-3 pr-8">
                <div>
                  <h3 className="text-sm font-bold text-slate-100">{selectedTicket.subject}</h3>
                  <p className="text-xs text-slate-400">Cliente: {selectedTicket.userName} ({selectedTicket.userEmail})</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleResolveTicket(selectedTicket.id)}>
                    ✓ Finalizar Chamado
                  </Button>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="h-64 overflow-y-auto p-4 rounded-xl bg-slate-900/80 border border-white/5 space-y-2.5">
                {adminChatMessages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${m.sender === 'ADMIN' ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[10px] text-slate-400 mb-0.5">{m.senderName} • {m.timestamp}</span>
                    <div className={`p-3 rounded-2xl max-w-sm text-xs leading-relaxed ${
                      m.sender === 'ADMIN'
                        ? 'bg-violet-600 text-white font-medium rounded-tr-none'
                        : 'bg-slate-800 text-slate-100 border border-white/10 rounded-tl-none'
                    }`}>
                      {m.text}
                    </div>
                  </div>
                ))}
                <div ref={adminChatBottomRef} />
              </div>

              {/* Send Form */}
              <form onSubmit={handleSendAdminMessage} className="flex gap-2">
                <input
                  type="text"
                  value={adminChatInput}
                  onChange={e => setAdminChatInput(e.target.value)}
                  placeholder="Digite sua resposta em tempo real para o cliente..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                />
                <Button variant="neon" size="sm" type="submit" isLoading={isSendingAdminMsg} leftIcon="➤">
                  Enviar
                </Button>
              </form>
            </GlassSurface>
          </div>
        </div>
      )}

      {/* ACCOUNT DELETION CONFIRMATION MODAL */}
      {showDeleteConfirmModal && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md">
            <GlassSurface glow="violet" className="bg-slate-950/95 border-red-500/40 p-6 space-y-4 shadow-2xl relative">
              <h3 className="text-sm font-bold text-red-400 flex items-center gap-2">
                ⚠️ Confirmar Solicitação de Exclusão de Conta
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Você está prestes a processar a exclusão da conta de <strong>{selectedTicket.userName}</strong> ({selectedTicket.userEmail}).
              </p>
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 space-y-1">
                <p>• A conta será imediatamente desativada.</p>
                <p>• O usuário terá <strong>30 dias de carência</strong> para restaurar via token único de recuperação.</p>
                <p>• Após os 30 dias, a exclusão torna-se permanente e irreversível.</p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="glass"
                  size="sm"
                  onClick={() => setShowDeleteConfirmModal(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleExecuteAccountDeletion}
                  isLoading={isExecutingDeletion}
                  className="flex-1 font-bold"
                >
                  Confirmar Exclusão (30d)
                </Button>
              </div>
            </GlassSurface>
          </div>
        </div>
      )}

      {/* CREATE NEW USER MODAL */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md">
            <GlassSurface glow="cyan" className="bg-slate-950/95 border-white/15 p-6 space-y-4 shadow-2xl relative">
              <button
                onClick={() => setShowAddUserModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>

              <h3 className="text-base font-bold text-slate-100">Criar Nova Conta no Sistema</h3>

              <form onSubmit={handleCreateUser} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={newUserName}
                    onChange={e => setNewUserName(e.target.value)}
                    placeholder="Ex: João Silva"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-400 font-sans"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">E-mail de Acesso</label>
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={e => setNewUserEmail(e.target.value)}
                    placeholder="joao.silva@exemplo.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-400 font-sans"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Senha Inicial</label>
                  <input
                    type="password"
                    required
                    value={newUserPassword}
                    onChange={e => setNewUserPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Tipo de Permissão</label>
                  <select
                    value={newUserRole}
                    onChange={e => setNewUserRole(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="USER">Usuário Comum (Candidato / Workspace)</option>
                    <option value="ADMIN">Administrador (Admin Cockpit)</option>
                  </select>
                </div>

                <Button
                  variant="neon"
                  size="md"
                  type="submit"
                  isLoading={isCreatingUser}
                  className="w-full font-bold mt-2"
                >
                  Cadastrar Conta no Banco
                </Button>
              </form>
            </GlassSurface>
          </div>
        </div>
      )}
    </div>
  );
};
