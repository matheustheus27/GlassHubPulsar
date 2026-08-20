import React from 'react';
import { Button } from '../atoms/Button';
import { TemplateType } from '../molecules/TemplateSelector';

interface TopActionBarProps {
  onOpenSettings: () => void;
  onOpenAIChat: () => void;
  onOpenATSScore: () => void;
  onExportPDF: () => void;
  onOpenAuth: () => void;
  onOpenAdmin?: () => void;
  isExporting: boolean;
  isAdmin: boolean;
  user: { name: string; email: string; role: string } | null;
  locale: string;
}

export const TopActionBar: React.FC<TopActionBarProps> = ({
  onOpenSettings,
  onOpenAIChat,
  onOpenATSScore,
  onExportPDF,
  onOpenAuth,
  onOpenAdmin,
  isExporting,
  isAdmin,
  user,
  locale
}) => {
  const isPt = locale === 'pt-BR';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-2 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl shadow-lg print:hidden">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="glass"
          size="sm"
          onClick={onOpenSettings}
          leftIcon="⚙️"
        >
          {isPt ? 'Personalizar' : 'Customize'}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onOpenATSScore}
          leftIcon="📊"
        >
          {isPt ? 'Avaliação ATS' : 'ATS Score'}
        </Button>

        <Button
          variant="glass"
          size="sm"
          onClick={onOpenAIChat}
          leftIcon="✨"
        >
          {isPt ? 'Recrutador IA' : 'AI Recruiter'}
        </Button>

        {isAdmin && onOpenAdmin && (
          <Button
            variant="danger"
            size="sm"
            onClick={onOpenAdmin}
            leftIcon="🛡️"
            className="animate-pulse"
          >
            {isPt ? 'Central Admin' : 'Admin Hub'}
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenAuth}
          leftIcon={user ? '👤' : '🔑'}
        >
          {user ? user.name.split(' ')[0] : (isPt ? 'Entrar' : 'Login')}
        </Button>

        <Button
          variant="neon"
          size="sm"
          onClick={onExportPDF}
          isLoading={isExporting}
          leftIcon="📥"
        >
          {isExporting ? (isPt ? 'Gerando PDF...' : 'Generating PDF...') : (isPt ? 'Exportar PDF' : 'Export PDF')}
        </Button>
      </div>
    </div>
  );
};
