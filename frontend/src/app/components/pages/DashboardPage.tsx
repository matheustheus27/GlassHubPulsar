import React, { useState, useEffect, useRef } from 'react';
import { GroupedNavbarHeader } from '../organisms/GroupedNavbarHeader';
import { UserMetricsCard } from '../organisms/UserMetricsCard';
import { DocumentFormEditor } from '../organisms/DocumentFormEditor';
import { ResumeLayout } from '../templates/ResumeLayout';
import { CoverLetterLayout } from '../templates/CoverLetterLayout';
import { AIChatDrawer } from '../AIChatDrawer';
import { ATSScoreModal, ATSReportData } from '../organisms/ATSScoreModal';
import { BottomFloatingActions } from '../organisms/BottomFloatingActions';
import { InternationalVersionModal } from '../organisms/InternationalVersionModal';
import { CustomerHelpModal } from '../organisms/CustomerHelpModal';
import { TranslationProgressCard } from '../molecules/TranslationProgressCard';
import { PDFProgressCard } from '../molecules/PDFProgressCard';
import { Toast } from '../Toast';
import { GlassSurface } from '../atoms/GlassSurface';
import { TemplateType } from '../molecules/TemplateSelector';
import { defaultDocumentData, createCleanDocumentData } from '../../utils/documentSchema';
import { buildResumePayload } from '../../export/buildResumePayload';
import { buildCoverPayload } from '../../export/buildCoverPayload';
import { generateColorPalette } from '../../utils/colorEngine';
import { defaultSettings } from '../../utils/themeDefaults';
import { Settings, LanguageCode } from '../../types/settingsType';
import { useAuth } from '../../hooks/useAuth';
import { useSSE } from '../../hooks/useSSE';

interface DashboardPageProps {
  onOpenAdminCockpit?: () => void;
  onOpenSupport?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onOpenAdminCockpit, onOpenSupport }) => {
  const { user, accessToken, isAdmin, logoutUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'resume' | 'cover'>('resume');
  const [template, setTemplate] = useState<TemplateType>('GlassModern');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // SSE background notifications & workers state
  const {
    notifications,
    unreadCount,
    translationState,
    pdfExportState,
    markAllNotificationsAsRead,
    clearAllNotifications,
    removeNotification,
    resetTranslation,
    resetPdfExport,
    setPdfExportState
  } = useSSE();

  // Document language & state
  const [docLanguage, setDocLanguage] = useState<LanguageCode>('pt-BR');
  const [docData, setDocData] = useState<any>(() => JSON.parse(JSON.stringify(defaultDocumentData)));
  const [primaryColor, setPrimaryColor] = useState('#06b6d4');
  const [viewMode, setViewMode] = useState<'split' | 'formOnly' | 'previewOnly'>('split');
  const [zoomScale, setZoomScale] = useState(1);

  // Modals state
  const [openAIChat, setOpenAIChat] = useState(false);
  const [openATSScore, setOpenATSScore] = useState(false);
  const [openVersionModal, setOpenVersionModal] = useState(false);
  const [openHelpModal, setOpenHelpModal] = useState(false);

  // Export & ATS states
  const [atsReport, setAtsReport] = useState<ATSReportData | null>(null);
  const [isAtsLoading, setIsAtsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSavingResume, setIsSavingResume] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const saveTimeoutRef = useRef<any>(null);
  const settingsSaveTimeoutRef = useRef<any>(null);

  // Apply theme data attribute to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Fetch user settings from backend API on mount
  useEffect(() => {
    if (!accessToken) return;
    fetch('/api/user/settings', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      credentials: 'include'
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.settings) {
          const s = data.settings;
          if (s.viewMode) setViewMode(s.viewMode as any);
          if (s.activeTheme) setTheme(s.activeTheme as any);
          if (s.activeTemplate) setTemplate(s.activeTemplate as any);
          if (s.primaryColor) setPrimaryColor(s.primaryColor);
          if (s.defaultLanguage) setDocLanguage(s.defaultLanguage as any);
          if (s.atsReport) setAtsReport(s.atsReport);
        }
      })
      .catch(() => {});
  }, [accessToken]);

  // Auto-save user settings on change (debounced 1.2s)
  useEffect(() => {
    if (!accessToken) return;
    if (settingsSaveTimeoutRef.current) clearTimeout(settingsSaveTimeoutRef.current);
    settingsSaveTimeoutRef.current = setTimeout(() => {
      fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        credentials: 'include',
        body: JSON.stringify({
          viewMode,
          activeTheme: theme,
          activeTemplate: template,
          primaryColor,
          defaultLanguage: docLanguage,
          atsScore: atsReport?.overallScore || 0,
          atsReport
        })
      }).catch(() => {});
    }, 1200);
    return () => clearTimeout(settingsSaveTimeoutRef.current);
  }, [viewMode, theme, template, primaryColor, docLanguage, atsReport, accessToken]);

  // Fetch user resume data from backend API on mount
  useEffect(() => {
    fetch('/api/resume', {
      headers: {
        'Authorization': accessToken ? `Bearer ${accessToken}` : ''
      },
      credentials: 'include'
    })
      .then(async res => {
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          return await res.json();
        }
        return null;
      })
      .then(data => {
        if (data?.data && (data.data.personalDetails?.name || data.data.summaryDetails?.summary)) {
          setDocData(data.data);
        } else if (user?.email) {
          // Initialize clean structure for new user without pre-existing mock data
          setDocData(createCleanDocumentData(user));
        }
      })
      .catch(() => { });
  }, [accessToken, user]);

  // Save resume helper
  const saveResumeData = async (dataToSave: any) => {
    if (!dataToSave) return;
    try {
      localStorage.setItem('glasshub_resume_draft', JSON.stringify(dataToSave));
    } catch (e) {}

    if (!accessToken) return;
    setIsSavingResume(true);
    try {
      await fetch('/api/resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          document: dataToSave,
          language: docLanguage
        }),
        credentials: 'include'
      });
    } catch (e) {
      console.error('Failed to save resume data:', e);
    } finally {
      setIsSavingResume(false);
    }
  };

  // Manual save trigger from form button
  const handleManualSave = async () => {
    await saveResumeData(docData);
    setToast({ message: '✓ Currículo salvo com sucesso no banco de dados!', type: 'success' });
  };

  // Debounced auto-save on document edits
  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveResumeData(docData);
    }, 2500);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [docData, docLanguage, accessToken]);

  const isLight = theme === 'light';
  const palette = generateColorPalette(primaryColor, isLight);

  const baseThemeSettings = defaultSettings[theme] || defaultSettings.dark;
  const styles: Settings = {
    ...baseThemeSettings,
    language: docLanguage,
    theme: isLight ? 'light' : 'dark',
    template,
    activeTemplate: template,
    backgroundColor: isLight ? '#f4f8fa' : '#030712',
    card: {
      ...baseThemeSettings.card,
      borderColor: isLight ? 'rgba(15, 23, 42, 0.15)' : palette.cardBorder,
      backgroundColor: isLight ? 'rgba(255, 255, 255, 0.88)' : palette.cardBg
    },
    title: {
      primary: {
        ...baseThemeSettings.title.primary,
        fontColor: palette.primary
      },
      secondary: {
        ...baseThemeSettings.title.secondary,
        fontColor: palette.primary
      }
    },
    subtitle: {
      primary: {
        ...baseThemeSettings.subtitle.primary,
        fontColor: isLight ? '#0f172a' : '#38bdf8'
      },
      secondary: {
        ...baseThemeSettings.subtitle.secondary,
        fontColor: palette.primary
      }
    },
    caption: {
      primary: {
        ...baseThemeSettings.caption.primary,
        fontColor: isLight ? '#0f172a' : '#f8fafc'
      },
      secondary: {
        ...baseThemeSettings.caption.secondary,
        fontColor: isLight ? '#334155' : '#cbd5e1'
      }
    },
    meta: {
      ...baseThemeSettings.meta,
      fontColor: isLight ? '#0f172a' : '#f8fafc'
    },
    chip: {
      ...baseThemeSettings.chip,
      backgroundColor: isLight ? '#f1f5f9' : 'rgba(15, 23, 42, 0.8)',
      fontColor: isLight ? '#0f172a' : '#e0f2fe',
      borderColor: isLight ? 'rgba(15, 23, 42, 0.15)' : 'rgba(56, 189, 248, 0.3)'
    }
  };

  // Execute ATS Evaluation
  const handleRunATSAnalysis = async () => {
    setIsAtsLoading(true);
    setOpenATSScore(true);

    try {
      const payload = buildResumePayload(docLanguage, isLight, styles, docData);
      const res = await fetch('/api/ai/ats-analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': accessToken ? `Bearer ${accessToken}` : ''
        },
        body: JSON.stringify({
          document: payload,
          language: docLanguage
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Falha na análise ATS');

      setAtsReport(json.report);
    } catch (err: any) {
      setToast({ message: err.message || 'Erro ao avaliar score ATS', type: 'error' });
    } finally {
      setIsAtsLoading(false);
    }
  };

  // Auto-reset isExporting when PDF worker completes or stops being active
  useEffect(() => {
    if (!pdfExportState.isActive) {
      setIsExporting(false);
    }
  }, [pdfExportState.isActive]);

  // Export PDF via Worker
  const handleExportPDF = async () => {
    setIsExporting(true);

    // Safety fallback timer to prevent button stuck state
    const safetyTimer = setTimeout(() => {
      setIsExporting(false);
    }, 20000);

    try {
      const isResume = activeTab === 'resume';
      const payload = isResume
        ? buildResumePayload(docLanguage, isLight, styles, docData)
        : buildCoverPayload(docLanguage, isLight, styles, docData);

      const candidateName = docData.personalDetails?.name || user?.name || "Curriculo";

      const res = await fetch(`/api/builder/export-async?type=${isResume ? 'resume' : 'cover'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': accessToken ? `Bearer ${accessToken}` : ''
        },
        body: JSON.stringify({
          document: payload,
          candidateName
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Falha ao despachar exportação');

      setPdfExportState({
        isActive: true,
        progress: 10,
        step: 'Tarefa enfileirada no worker-pdf...'
      });

      setToast({ message: 'Processamento de PDF iniciado no worker!', type: 'success' });
    } catch (err: any) {
      clearTimeout(safetyTimer);
      setToast({ message: err.message || 'Erro na exportação de PDF', type: 'error' });
      setIsExporting(false);
    }
  };

  // Quick fill applied to form
  const handleApplyQuickFill = (structuredData: any) => {
    setDocData((prev: any) => ({
      ...prev,
      personalDetails: {
        ...prev.personalDetails,
        name: structuredData.name || structuredData.personalDetails?.name || prev.personalDetails.name,
        title: structuredData.title || structuredData.personalDetails?.title || prev.personalDetails.title,
        contact: structuredData.personalDetails?.contact || prev.personalDetails.contact,
        location: structuredData.personalDetails?.location || prev.personalDetails.location
      },
      summaryDetails: {
        ...prev.summaryDetails,
        summary: structuredData.summary || structuredData.summaryDetails?.summary || prev.summaryDetails.summary
      },
      skillsDetails: {
        ...prev.skillsDetails,
        skills: structuredData.skills || structuredData.skillsDetails?.skills || prev.skillsDetails.skills
      },
      experienceDetails: {
        ...prev.experienceDetails,
        experiences: structuredData.experiences || structuredData.experienceDetails?.experiences || prev.experienceDetails.experiences
      },
      educationDetails: {
        ...prev.educationDetails,
        educations: structuredData.education || structuredData.educationDetails?.educations || prev.educationDetails.educations
      },
      projectDetails: {
        ...prev.projectDetails,
        projects: structuredData.projects || structuredData.projectDetails?.projects || prev.projectDetails.projects
      }
    }));
  };

  // International version creation handler
  const handleCreateVersion = (targetLang: string, mode: 'AI' | 'MANUAL') => {
    setDocLanguage(targetLang as LanguageCode);
    setToast({
      message: mode === 'AI'
        ? `Versão em ${targetLang} gerada!`
        : `Nova versão em ${targetLang} iniciada.`,
      type: 'success'
    });
  };

  return (
      <div className={`min-h-screen ${isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#030712] text-slate-100'} p-3 md:p-6 transition-colors duration-300 relative`}>
        <div className="max-w-[1680px] mx-auto space-y-4">
          {/* TOP GROUPED NAVBAR */}
          <GroupedNavbarHeader
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            viewMode={viewMode}
            onSelectViewMode={setViewMode}
            theme={theme}
            onToggleTheme={() => setTheme(isLight ? 'dark' : 'light')}
            primaryColor={primaryColor}
            onSelectColor={setPrimaryColor}
            selectedTemplate={template}
            onSelectTemplate={setTemplate}
            user={user}
            isAdmin={isAdmin}
            onOpenAdminCockpit={onOpenAdminCockpit}
            onOpenInternationalModal={() => setOpenVersionModal(true)}
            onOpenHelp={() => onOpenSupport ? onOpenSupport() : setOpenHelpModal(true)}
            onExportPDF={handleExportPDF}
            isExporting={isExporting || pdfExportState.isActive}
            onLogout={logoutUser}
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkNotificationsRead={markAllNotificationsAsRead}
            onClearNotifications={clearAllNotifications}
            onRemoveNotification={removeNotification}
          />

          {/* METRICS BAR */}
          <UserMetricsCard
            documentData={docData}
            candidateName={docData.personalDetails?.name || user?.name || 'Candidato'}
            atsScore={atsReport?.overallScore || 88}
            estimatedScore={atsReport?.overallScore || 88}
            onOpenATS={() => setOpenATSScore(true)}
            onRunAnalysis={handleRunATSAnalysis}
            template={template}
            activeTemplate={template}
            primaryColor={primaryColor}
            onSelectColor={setPrimaryColor}
          />

          {/* MAIN WORKSPACE GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* FORM EDITOR COLUMN (STICKY SCROLL-FOLLOWING) */}
            {(viewMode === 'split' || viewMode === 'formOnly') && (
              <div className={`${viewMode === 'split' ? 'lg:col-span-6 xl:col-span-5' : 'lg:col-span-12 max-w-4xl mx-auto w-full'} sticky top-20 self-start max-h-[calc(100vh-100px)] overflow-y-auto pr-1`}>
                <DocumentFormEditor
                  documentData={docData}
                  onChange={setDocData}
                  activeTab={activeTab}
                  onSaveManual={handleManualSave}
                  isSaving={isSavingResume}
                />
              </div>
            )}

            {/* LIVE PREVIEW COLUMN ENCLOSED IN GLASS CARD */}
            {(viewMode === 'split' || viewMode === 'previewOnly') && (
              <div className={viewMode === 'split' ? 'lg:col-span-6 xl:col-span-7' : 'lg:col-span-12 max-w-4xl mx-auto w-full'}>
                <GlassSurface
                  glow="cyan"
                  className={`p-4 md:p-6 rounded-2xl border shadow-2xl backdrop-blur-2xl transition-all ${isLight
                    ? 'bg-white/95 border-slate-300/80 shadow-[0_10px_35px_rgba(0,0,0,0.08)]'
                    : 'bg-slate-950/85 border-white/10'
                    }`}
                >
                  {/* PREVIEW HEADER TOOLBAR */}
                  <div className={`flex items-center justify-between pb-3 mb-4 border-b ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                        👁️ Visualização Vetorial em Tempo Real
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold">
                        A4 Standard
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setZoomScale(s => Math.max(0.7, s - 0.1))}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition cursor-pointer"
                        title="Reduzir Zoom"
                      >
                        −
                      </button>
                      <span className="text-xs font-mono text-slate-400 px-1">
                        {Math.round(zoomScale * 100)}%
                      </span>
                      <button
                        type="button"
                        onClick={() => setZoomScale(s => Math.min(1.3, s + 0.1))}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition cursor-pointer"
                        title="Aumentar Zoom"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* ZOOMABLE CONTAINER */}
                  <div
                    className="transition-transform duration-200 origin-top"
                    style={{ transform: `scale(${zoomScale})` }}
                  >
                    {activeTab === 'resume' ? (
                      <ResumeLayout
                        template={template}
                        personal={docData.personalDetails}
                        summary={docData.summaryDetails}
                        skills={docData.skillsDetails}
                        experiences={docData.experienceDetails}
                        education={docData.educationDetails}
                        projects={docData.projectDetails}
                        styles={styles}
                      />
                    ) : (
                      <CoverLetterLayout
                        personal={docData.personalDetails}
                        coverLetter={docData.coverLetterDetails}
                        styles={styles}
                      />
                    )}
                  </div>
                </GlassSurface>
              </div>
            )}
          </div>

          {/* FLOATING ASYNC WORKER PROGRESS NOTIFICATIONS (TOP RIGHT STACKED) */}
          <div className="fixed top-24 right-6 z-50 flex flex-col gap-3 max-w-sm pointer-events-auto">
            {translationState.isActive && (
              <TranslationProgressCard state={translationState} onDismiss={resetTranslation} />
            )}

            {pdfExportState.isActive && (
              <PDFProgressCard state={pdfExportState} onDismiss={resetPdfExport} />
            )}
          </div>

          {/* BOTTOM FLOATING ACTION TRIGGERS */}
          <BottomFloatingActions
            onOpenATS={() => setOpenATSScore(true)}
            onOpenAI={() => setOpenAIChat(true)}
            onOpenAIChat={() => setOpenAIChat(true)}
            atsScore={atsReport?.overallScore}
            estimatedScore={atsReport?.overallScore}
          />

          {/* ATS SCORE MODAL */}
          <ATSScoreModal
            isOpen={openATSScore}
            onClose={() => setOpenATSScore(false)}
            report={atsReport}
            isLoading={isAtsLoading}
            onRunAnalysis={handleRunATSAnalysis}
            onReanalyze={handleRunATSAnalysis}
          />

          {/* INTERNATIONAL RESUME VERSION MODAL */}
          <InternationalVersionModal
            isOpen={openVersionModal}
            onClose={() => setOpenVersionModal(false)}
            onConfirm={handleCreateVersion}
          />

          {/* CUSTOMER HELP & SUPPORT DESK MODAL */}
          <CustomerHelpModal
            isOpen={openHelpModal}
            onClose={() => setOpenHelpModal(false)}
          />

          {/* AI RECRUITER & QUICK FILL DRAWER */}
          <AIChatDrawer
            isOpen={openAIChat}
            onClose={() => setOpenAIChat(false)}
            documentData={buildResumePayload(docLanguage, isLight, styles, docData)}
            onApplyStructuredData={handleApplyQuickFill}
          />

          {/* TOAST NOTIFICATIONS */}
          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          )}
        </div>
      </div>
    );
};
