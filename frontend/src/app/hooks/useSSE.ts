import { useEffect, useState } from 'react';
import { TranslationState } from '../components/molecules/TranslationProgressCard';

export interface PDFExportState {
  isActive: boolean;
  progress: number;
  step: string;
  downloadUrl?: string;
  fileName?: string;
  jobId?: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  variant?: 'cyan' | 'emerald' | 'violet' | 'amber' | 'red';
  downloadUrl?: string;
  isRead?: boolean;
}

export function useSSE() {
  const [translationState, setTranslationState] = useState<TranslationState>({
    isActive: false,
    progress: 0,
    step: '',
    targetLang: ''
  });

  const [pdfExportState, setPdfExportState] = useState<PDFExportState>({
    isActive: false,
    progress: 0,
    step: ''
  });

  const [notifications, setNotifications] = useState<SystemNotification[]>(() => {
    const hasShown = typeof window !== 'undefined' && sessionStorage.getItem('glasshub_cluster_connected_shown');
    if (!hasShown) {
      if (typeof window !== 'undefined') sessionStorage.setItem('glasshub_cluster_connected_shown', 'true');
      return [
        {
          id: 'notif-welcome',
          title: 'Cluster GlassHub Conectado',
          message: 'Motor de renderização A4, IA e telemetria inicializados com sucesso.',
          timestamp: new Date().toLocaleTimeString(),
          variant: 'emerald',
          isRead: false
        }
      ];
    }
    return [];
  });

  useEffect(() => {
    const eventSource = new EventSource('/api/events/stream');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // 1. Translation events
        if (data.type === 'TRANSLATION_PROGRESS') {
          setTranslationState({
            isActive: data.progress < 100,
            progress: data.progress,
            step: data.step,
            targetLang: data.data?.settings?.language || 'en-US'
          });

          if (data.progress === 10) {
            setNotifications(prev => [
              {
                id: `notif-trans-start-${Date.now()}`,
                title: 'Tradução Solicitada',
                message: `Tarefa enviada para o worker de tradução...`,
                timestamp: new Date().toLocaleTimeString(),
                variant: 'violet',
                isRead: false
              },
              ...prev.filter(n => !n.id.startsWith('notif-trans-start-'))
            ]);
          } else if (data.progress === 100) {
            setNotifications(prev => [
              {
                id: `notif-trans-${Date.now()}`,
                title: 'Tradução Concluída',
                message: `Versão internacional traduzida com sucesso pelo TranslateGemma!`,
                timestamp: new Date().toLocaleTimeString(),
                variant: 'cyan',
                isRead: false
              },
              ...prev
            ]);
          }
        }

        // 2. PDF Worker events
        if (data.type === 'PDF_PROGRESS') {
          setPdfExportState({
            isActive: data.progress < 100,
            progress: data.progress,
            step: data.step,
            downloadUrl: data.downloadUrl,
            fileName: data.fileName,
            jobId: data.jobId
          });

          if (data.progress === 10) {
            setNotifications(prev => [
              {
                id: `notif-pdf-start-${Date.now()}`,
                title: 'Geração de PDF Solicitada',
                message: `Tarefa enfileirada no worker-pdf...`,
                timestamp: new Date().toLocaleTimeString(),
                variant: 'amber',
                isRead: false
              },
              ...prev.filter(n => !n.id.startsWith('notif-pdf-start-'))
            ]);
          } else if (data.progress === 100) {
            setNotifications(prev => [
              {
                id: `notif-pdf-${Date.now()}`,
                title: 'PDF Pronto para Download',
                message: `O worker de PDF finalizou a compilação do seu documento.`,
                timestamp: new Date().toLocaleTimeString(),
                variant: 'emerald',
                downloadUrl: data.downloadUrl,
                isRead: false
              },
              ...prev
            ]);

            // Automatically trigger download if URL provided
            if (data.downloadUrl) {
              const link = document.createElement('a');
              link.href = data.downloadUrl;
              link.download = data.fileName || 'Curriculo_GlassHub.pdf';
              link.click();
            }
          }
        }

        // 3. In-App Notifications
        if (data.type === 'IN_APP_NOTIFICATION' && data.notification) {
          setNotifications(prev => [
            {
              id: `notif-${Date.now()}`,
              title: data.notification.title || 'Notificação do Sistema',
              message: data.notification.message || '',
              timestamp: new Date().toLocaleTimeString(),
              variant: data.notification.variant || 'cyan',
              isRead: false
            },
            ...prev
          ]);
        }
      } catch (err) {
        // Heartbeats
      }
    };

    eventSource.onerror = () => {
      // Reconnects automatically
    };

    return () => {
      eventSource.close();
    };
  }, []);

  useEffect(() => {
    // Fetch persistent notifications from DB on mount/login
    fetch('/api/notifications')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.notifications) && data.notifications.length > 0) {
          const loaded: SystemNotification[] = data.notifications.map((n: any) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            timestamp: new Date(n.createdAt).toLocaleTimeString(),
            variant: n.type === 'PDF_READY' ? 'emerald' : (n.type === 'ATS_ANALYSIS_COMPLETED' ? 'cyan' : 'violet'),
            downloadUrl: n.data?.downloadUrl,
            isRead: n.read
          }));
          setNotifications(prev => {
            const ids = new Set(loaded.map(l => l.id));
            const filteredPrev = prev.filter(p => !ids.has(p.id));
            return [...loaded, ...filteredPrev];
          });
        }
      })
      .catch(() => {});
  }, []);

  const resetTranslation = () => {
    setTranslationState(prev => ({ ...prev, isActive: false, progress: 0 }));
  };

  const resetPdfExport = () => {
    setPdfExportState(prev => ({ ...prev, isActive: false, progress: 0 }));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    fetch('/api/notifications/read-all', { method: 'PUT' }).catch(() => {});
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    fetch('/api/notifications/read-all', { method: 'PUT' }).catch(() => {});
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    fetch(`/api/notifications/${id}`, { method: 'DELETE' }).catch(() => {});
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return {
    translationState,
    setTranslationState,
    resetTranslation,
    pdfExportState,
    setPdfExportState,
    resetPdfExport,
    notifications,
    unreadCount,
    markAllNotificationsAsRead,
    clearAllNotifications,
    removeNotification
  };
}
