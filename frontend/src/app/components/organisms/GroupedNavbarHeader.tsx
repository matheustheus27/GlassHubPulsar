import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { GradientText } from '../atoms/Typography';
import { GlassHubLogo } from '../atoms/GlassHubLogo';
import { PRESET_THEME_COLORS } from '../../utils/colorEngine';
import { TemplateType } from '../molecules/TemplateSelector';
import { useI18n } from '../../hooks/useI18n';
import { SystemNotification } from '../../hooks/useSSE';

interface GroupedNavbarHeaderProps {
  activeTab: 'resume' | 'cover';
  onSelectTab: (tab: 'resume' | 'cover') => void;
  viewMode: 'split' | 'formOnly' | 'previewOnly';
  onSelectViewMode: (mode: 'split' | 'formOnly' | 'previewOnly') => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  primaryColor: string;
  onSelectColor: (hex: string) => void;
  selectedTemplate: TemplateType;
  onSelectTemplate: (tpl: TemplateType) => void;
  user: any;
  isAdmin?: boolean;
  onOpenAdminCockpit?: () => void;
  onOpenInternationalModal: () => void;
  onExportPDF: () => void;
  isExporting: boolean;
  onLogout: () => void;
  notifications?: SystemNotification[];
  unreadCount?: number;
  onMarkNotificationsRead?: () => void;
  onClearNotifications?: () => void;
  onRemoveNotification?: (id: string) => void;
  onOpenHelp?: () => void;
}

export const GroupedNavbarHeader: React.FC<GroupedNavbarHeaderProps> = ({
  activeTab,
  onSelectTab,
  viewMode,
  onSelectViewMode,
  theme,
  onToggleTheme,
  primaryColor,
  onSelectColor,
  selectedTemplate,
  onSelectTemplate,
  user,
  isAdmin,
  onOpenAdminCockpit,
  onOpenInternationalModal,
  onExportPDF,
  isExporting,
  onLogout,
  notifications = [],
  unreadCount = 0,
  onMarkNotificationsRead,
  onClearNotifications,
  onRemoveNotification,
  onOpenHelp
}) => {
  const { locale, setLocale, t } = useI18n();
  const [openDropdown, setOpenDropdown] = useState<'appearance' | 'document' | 'account' | 'notifications' | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (name: 'appearance' | 'document' | 'account' | 'notifications') => {
    if (name === 'notifications' && onMarkNotificationsRead) {
      onMarkNotificationsRead();
    }
    setOpenDropdown(openDropdown === name ? null : name);
  };

  return (
    <header
      ref={headerRef}
      className="relative z-40 flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-950/85 border border-white/10 backdrop-blur-2xl shadow-2xl mb-4 print:hidden transition-colors"
    >
      {/* BRAND & TABS */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <GlassHubLogo size={26} />
          <span className="font-extrabold text-base md:text-lg tracking-tight text-slate-100 hidden sm:inline">
            GlassHub <GradientText from="from-cyan-400" to="to-violet-400">Pulsar</GradientText>
          </span>
        </div>

        {/* TAB SWITCHER */}
        <div className="flex bg-slate-900/90 rounded-xl p-1 border border-white/10 shadow-inner">
          <button
            type="button"
            onClick={() => onSelectTab('resume')}
            className={`min-h-[38px] px-3.5 py-1 text-xs md:text-sm font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'resume'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.45)]'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            📄 {t('tabResume')}
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('cover')}
            className={`min-h-[38px] px-3.5 py-1 text-xs md:text-sm font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'cover'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.45)]'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            ✉️ {t('tabCover')}
          </button>
        </div>
      </div>

      {/* GROUPED CONTROLS & ACTIONS */}
      <div className="flex flex-wrap items-center gap-2">
        {/* VIEW DOCKING SELECTOR */}
        <div className="hidden xl:flex bg-slate-900/90 rounded-xl p-1 border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => onSelectViewMode('split')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              viewMode === 'split' ? 'bg-slate-800 text-cyan-300 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            ◫ {t('viewSplit')}
          </button>
          <button
            type="button"
            onClick={() => onSelectViewMode('formOnly')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              viewMode === 'formOnly' ? 'bg-slate-800 text-cyan-300 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            📝 {t('viewEditor')}
          </button>
          <button
            type="button"
            onClick={() => onSelectViewMode('previewOnly')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              viewMode === 'previewOnly' ? 'bg-slate-800 text-cyan-300 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            👁️ {t('viewPreview')}
          </button>
        </div>

        {/* 1. APARÊNCIA DROPDOWN */}
        <div className="relative">
          <Button
            variant="glass"
            size="sm"
            onClick={() => toggleDropdown('appearance')}
            leftIcon="🎨"
            className="min-h-[44px] px-3.5 text-xs font-bold"
          >
            {t('menuAppearance')} ▾
          </Button>

          {openDropdown === 'appearance' && (
            <div className="absolute right-0 mt-2 w-64 p-4 rounded-2xl bg-slate-950/95 border border-white/15 shadow-2xl backdrop-blur-2xl space-y-4 animate-in fade-in z-50">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  {t('themeLabel')}
                </span>
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-white/10 hover:border-cyan-500/40 text-xs font-bold text-slate-200 transition cursor-pointer"
                >
                  <span>{theme === 'light' ? `☀️ ${t('themeLight')}` : `🌙 ${t('themeDark')}`}</span>
                  <span className="text-cyan-400 text-xs font-bold">Alternar</span>
                </button>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  {t('colorPaletteLabel')}
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_THEME_COLORS.map(c => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => onSelectColor(c.hex)}
                      className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-[11px] font-semibold transition cursor-pointer ${
                        primaryColor === c.hex
                          ? 'border-cyan-400 bg-cyan-950/40 text-white'
                          : 'border-white/5 bg-slate-900/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.hex }} />
                      <span className="truncate">{c.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2. DOCUMENTO & VERSÕES DROPDOWN */}
        <div className="relative">
          <Button
            variant="glass"
            size="sm"
            onClick={() => toggleDropdown('document')}
            leftIcon="📄"
            className="min-h-[44px] px-3.5 text-xs font-bold"
          >
            {t('menuDocument')} ▾
          </Button>

          {openDropdown === 'document' && (
            <div className="absolute right-0 mt-2 w-72 p-4 rounded-2xl bg-slate-950/95 border border-white/15 shadow-2xl backdrop-blur-2xl space-y-4 animate-in fade-in z-50">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  {t('templatesLabel')}
                </span>
                <div className="space-y-1.5">
                  {(['GlassModern', 'GlassMinimalist', 'GlassExecutive', 'GlassCompact'] as TemplateType[]).map(tpl => (
                    <button
                      key={tpl}
                      type="button"
                      onClick={() => onSelectTemplate(tpl)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                        selectedTemplate === tpl
                          ? 'bg-cyan-950/50 border-cyan-500/50 text-cyan-300'
                          : 'bg-slate-900/60 border-white/5 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>{tpl}</span>
                      {selectedTemplate === tpl && <span>✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* INTERFACE LANGUAGE SWITCHER */}
              <div className="border-t border-white/10 pt-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  {t('languageLabel')}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLocale('pt-BR')}
                    className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      locale === 'pt-BR'
                        ? 'bg-cyan-950/50 border-cyan-500/50 text-cyan-300'
                        : 'bg-slate-900/60 border-white/5 text-slate-400'
                    }`}
                  >
                    🇧🇷 Português
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocale('en-US')}
                    className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      locale === 'en-US'
                        ? 'bg-cyan-950/50 border-cyan-500/50 text-cyan-300'
                        : 'bg-slate-900/60 border-white/5 text-slate-400'
                    }`}
                  >
                    🇺🇸 English
                  </button>
                </div>
              </div>

              {/* ADD INTERNATIONAL RESUME VERSION BUTTON */}
              <div className="border-t border-white/10 pt-3">
                <button
                  type="button"
                  onClick={() => { setOpenDropdown(null); onOpenInternationalModal(); }}
                  className="w-full p-2.5 rounded-xl bg-gradient-to-r from-cyan-950/60 to-violet-950/60 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 text-xs font-bold text-left transition cursor-pointer flex items-center justify-between"
                >
                  <span>{t('addInternationalVersion')}</span>
                  <span className="text-sm">→</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 3. NOTIFICAÇÕES BELL BUTTON & DROPDOWN */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown('notifications')}
            className="relative min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-900/80 border border-white/10 text-slate-300 hover:text-white hover:border-cyan-500/40 transition cursor-pointer"
            title={t('notificationsLabel')}
          >
            <span className="text-base">🔔</span>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-black flex items-center justify-center shadow-[0_0_8px_rgba(6,182,212,0.8)]">
                {unreadCount}
              </span>
            )}
          </button>

          {openDropdown === 'notifications' && (
            <div className="absolute right-0 mt-2 w-84 max-h-96 overflow-y-auto p-4 rounded-2xl bg-slate-950/95 border border-white/15 shadow-2xl backdrop-blur-2xl space-y-3 animate-in fade-in z-50">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  🔔 {t('notificationsLabel')}
                </span>
                <div className="flex items-center gap-2">
                  {notifications.length > 0 && onMarkNotificationsRead && (
                    <button
                      type="button"
                      onClick={onMarkNotificationsRead}
                      className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 cursor-pointer"
                    >
                      {t('markAllReadBtn')}
                    </button>
                  )}
                  {notifications.length > 0 && onClearNotifications && (
                    <button
                      type="button"
                      onClick={onClearNotifications}
                      className="text-[10px] font-bold text-red-400 hover:text-red-300 cursor-pointer"
                    >
                      {t('clearAllNotifsBtn')}
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3 text-center">
                    {t('noNotifications')}
                  </p>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-xl border transition relative group ${
                        n.variant === 'emerald'
                          ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                          : n.variant === 'cyan'
                          ? 'bg-cyan-950/30 border-cyan-500/30 text-cyan-200'
                          : 'bg-slate-900/80 border-white/5 text-slate-300'
                      }`}
                    >
                      {onRemoveNotification && (
                        <button
                          type="button"
                          onClick={() => onRemoveNotification(n.id)}
                          className="absolute top-2 right-2 text-slate-500 hover:text-red-400 text-xs font-bold cursor-pointer"
                          title="Remover notificação"
                        >
                          ✕
                        </button>
                      )}
                      <div className="flex justify-between items-start gap-1 pr-4">
                        <span className="font-bold text-xs text-slate-100">{n.title}</span>
                        <span className="text-[9px] text-slate-400 shrink-0">{n.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug mt-1">{n.message}</p>
                      {n.downloadUrl && (
                        <a
                          href={n.downloadUrl}
                          className="inline-block mt-2 text-[10px] font-bold text-cyan-400 hover:underline"
                        >
                          📥 Baixar Arquivo
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* 4. CONTA DROPDOWN */}
        <div className="relative">
          <Button
            variant="glass"
            size="sm"
            onClick={() => toggleDropdown('account')}
            leftIcon="👤"
            className="min-h-[44px] px-3.5 text-xs font-bold"
          >
            {user?.name ? user.name.split(' ')[0] : t('menuAccount')} ▾
          </Button>

          {openDropdown === 'account' && (
            <div className="absolute right-0 mt-2 w-64 p-4 rounded-2xl bg-slate-950/95 border border-white/15 shadow-2xl backdrop-blur-2xl space-y-3 animate-in fade-in z-50">
              <div className="pb-2 border-b border-white/10">
                <span className="text-xs font-bold text-slate-100 block truncate">{user?.name || 'Usuário'}</span>
                <span className="text-[11px] text-slate-400 block truncate">{user?.email || 'test@glasshub.com'}</span>
                <Badge variant={isAdmin ? 'violet' : 'cyan'} className="mt-1.5 text-[9px]">
                  {user?.role === 'ADMIN' ? t('roleAdmin') : t('roleUser')}
                </Badge>
              </div>

              {isAdmin && onOpenAdminCockpit && (
                <button
                  type="button"
                  onClick={() => { setOpenDropdown(null); onOpenAdminCockpit(); }}
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-violet-950/50 border border-violet-500/40 text-violet-300 text-xs font-bold hover:bg-violet-900/50 transition cursor-pointer"
                >
                  <span>👑 {t('adminCockpitBtn')}</span>
                  <span>→</span>
                </button>
              )}

              {onOpenHelp && (
                <button
                  type="button"
                  onClick={() => { setOpenDropdown(null); onOpenHelp(); }}
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs font-bold hover:bg-cyan-900/50 transition cursor-pointer"
                >
                  <span>❓ Ajuda & Suporte</span>
                  <span>→</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => { setOpenDropdown(null); onLogout(); }}
                className="w-full flex items-center justify-between p-2 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs font-bold hover:bg-red-900/50 transition cursor-pointer"
              >
                <span>🚪 {t('logoutBtn')}</span>
                <span>✕</span>
              </button>
            </div>
          )}
        </div>

        {/* HELP BUTTON DIRECT */}
        {onOpenHelp && (
          <Button
            variant="glass"
            size="sm"
            onClick={onOpenHelp}
            leftIcon="❓"
            className="min-h-[44px] px-3.5 text-xs font-bold hidden sm:inline-flex"
          >
            Ajuda
          </Button>
        )}

        {/* EXPORT PDF BUTTON */}
        <Button
          variant="neon"
          size="md"
          onClick={onExportPDF}
          isLoading={isExporting}
          leftIcon="📥"
          className="min-h-[44px] px-4 font-bold shadow-[0_0_20px_rgba(6,182,212,0.45)]"
        >
          {isExporting ? t('exportingPdf') : t('exportPdfBtn')}
        </Button>
      </div>
    </header>
  );
};
