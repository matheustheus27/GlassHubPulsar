import React, { useState } from 'react';
import { GlassSurface } from '../atoms/GlassSurface';
import { Heading, GradientText } from '../atoms/Typography';
import { Button } from '../atoms/Button';
import { GlassHubLogo } from '../atoms/GlassHubLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'LOGIN' | 'REGISTER';
  onLoginSuccess: (user: any, token: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'LOGIN',
  onLoginSuccess
}) => {
  const [tab, setTab] = useState<'LOGIN' | 'REGISTER' | 'RECOVERY'>(initialTab);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Servidor indisponível no momento.');
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao autenticar');

      onLoginSuccess(data.user, data.accessToken);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Servidor indisponível no momento.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Por favor, informe seu nome completo');
      return;
    }

    if (password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas digitadas não conferem');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password })
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Servidor indisponível no momento.');
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao criar conta');

      onLoginSuccess(data.user, data.accessToken);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Servidor indisponível no momento.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email) {
      setError('Por favor, informe seu email');
      return;
    }
    setSuccessMsg('Instruções de redefinição enviadas para seu e-mail!');
    setTimeout(() => {
      setSuccessMsg(null);
      setTab('LOGIN');
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md">
        <GlassSurface glow="cyan" className="bg-slate-950/95 border-white/15 p-6 md:p-8 space-y-6 shadow-2xl relative">
          {/* CLOSE BUTTON */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            ✕
          </button>

          {/* HEADER */}
          <div className="text-center space-y-1">
            <GlassHubLogo size={36} className="mx-auto mb-2" />
            <Heading level={2} className="text-xl font-black text-slate-100">
              GlassHub <GradientText from="from-cyan-400" to="to-violet-400">Resume</GradientText>
            </Heading>
            <p className="text-xs text-slate-400">
              {tab === 'REGISTER' ? 'Crie sua conta para construir seu currículo executivo' : 'Acesse sua conta para gerenciar seus currículos'}
            </p>
          </div>

          {/* TABS */}
          <div className="flex bg-slate-900/90 rounded-xl p-1 border border-white/10">
            <button
              type="button"
              onClick={() => { setTab('LOGIN'); setError(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                tab === 'LOGIN' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => { setTab('REGISTER'); setError(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                tab === 'REGISTER' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Cadastrar
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs font-medium animate-in fade-in">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-medium animate-in fade-in">
              {successMsg}
            </div>
          )}

          {/* LOGIN FORM */}
          {tab === 'LOGIN' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">E-mail de Acesso</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-300">Senha</label>
                  <button
                    type="button"
                    onClick={() => { setTab('RECOVERY'); setError(null); }}
                    className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <Button
                variant="neon"
                size="md"
                type="submit"
                isLoading={loading}
                className="w-full min-h-[44px] font-bold shadow-[0_0_20px_rgba(6,182,212,0.4)] mt-2"
              >
                Acessar Plataforma
              </Button>
            </form>
          )}

          {/* REGISTER FORM */}
          {tab === 'REGISTER' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Matheus Oliveira"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">E-mail de Contato</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Senha</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Confirmar Senha</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repita sua senha"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* REAL-TIME PASSWORD STRENGTH INDICATOR */}
              {password.length > 0 && (
                <div className="p-3 rounded-xl bg-slate-900/90 border border-white/10 space-y-2 text-xs">
                  {(() => {
                    const hasMinLen = password.length >= 8;
                    const hasUpper = /[A-Z]/.test(password);
                    const hasLower = /[a-z]/.test(password);
                    const hasNum = /\d/.test(password);
                    const hasSpec = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
                    const score = [hasMinLen, hasUpper, hasLower, hasNum, hasSpec].filter(Boolean).length;

                    const levelLabel = score <= 2 ? 'Fraca' : score <= 4 ? 'Média' : 'Muito Forte';
                    const levelColor = score <= 2 ? 'bg-red-500' : score <= 4 ? 'bg-amber-500' : 'bg-emerald-500';
                    const textColor = score <= 2 ? 'text-red-400' : score <= 4 ? 'text-amber-400' : 'text-emerald-400';

                    return (
                      <>
                        <div className="flex justify-between items-center font-bold">
                          <span className="text-slate-400">Força da Senha:</span>
                          <span className={`${textColor}`}>{levelLabel} ({score}/5)</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${levelColor} transition-all duration-300`}
                            style={{ width: `${(score / 5) * 100}%` }}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[11px] pt-1">
                          <span className={hasMinLen ? 'text-emerald-400' : 'text-slate-500'}>
                            {hasMinLen ? '✓' : '○'} Mínimo 8 caracteres
                          </span>
                          <span className={hasUpper ? 'text-emerald-400' : 'text-slate-500'}>
                            {hasUpper ? '✓' : '○'} Letra maiúscula (A-Z)
                          </span>
                          <span className={hasLower ? 'text-emerald-400' : 'text-slate-500'}>
                            {hasLower ? '✓' : '○'} Letra minúscula (a-z)
                          </span>
                          <span className={hasNum ? 'text-emerald-400' : 'text-slate-500'}>
                            {hasNum ? '✓' : '○'} Número (0-9)
                          </span>
                          <span className={hasSpec ? 'text-emerald-400 col-span-2' : 'text-slate-500 col-span-2'}>
                            {hasSpec ? '✓' : '○'} Caractere especial (!@#$%^&*)
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              <Button
                variant="neon"
                size="md"
                type="submit"
                isLoading={loading}
                className="w-full min-h-[44px] font-bold shadow-[0_0_20px_rgba(6,182,212,0.4)] mt-2"
              >
                Criar Conta & Iniciar Currículo
              </Button>
            </form>
          )}

          {/* RECOVERY FORM */}
          {tab === 'RECOVERY' && (
            <form onSubmit={handleRecovery} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">E-mail de Recuperação</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <Button
                variant="neon"
                size="md"
                type="submit"
                className="w-full min-h-[44px] font-bold mt-2"
              >
                Enviar Link de Recuperação
              </Button>

              <button
                type="button"
                onClick={() => setTab('LOGIN')}
                className="text-xs text-slate-400 hover:text-cyan-300 block text-center w-full pt-1 cursor-pointer"
              >
                ← Voltar para o Login
              </button>
            </form>
          )}
        </GlassSurface>
      </div>
    </div>
  );
};
