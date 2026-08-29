/**
 * Default Settings and Styles Generator
 * Replaces static data files with dynamic, theme-calibrated defaults.
 */
import { Settings } from '../types/settingsType';

export type LanguageCode = 'pt-BR' | 'en-US' | 'es-ES' | 'fr-FR' | 'de-DE';

export const defaultSettings: Record<'light' | 'dark', Settings> = {
  dark: {
    language: 'pt-BR',
    theme: 'dark',
    template: 'GlassModern',
    activeTemplate: 'GlassModern',
    backgroundColor: '#030712',
    card: {
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      borderColor: 'rgba(255, 255, 255, 0.12)'
    },
    title: {
      primary: {
        fontSize: '28px',
        fontColor: '#38bdf8',
        fontWeight: '800',
        fontType: "'Roboto', sans-serif"
      },
      secondary: {
        fontSize: '18px',
        fontColor: '#38bdf8',
        fontWeight: '700',
        fontType: "'Roboto', sans-serif"
      }
    },
    subtitle: {
      primary: {
        fontSize: '14px',
        fontColor: '#cbd5e1',
        fontWeight: '600',
        fontType: "'Roboto', sans-serif"
      },
      secondary: {
        fontSize: '13px',
        fontColor: '#38bdf8',
        fontWeight: '600',
        fontType: "'Roboto', sans-serif"
      }
    },
    caption: {
      primary: {
        fontSize: '14px',
        fontColor: '#f8fafc',
        fontWeight: '600',
        fontType: "'Roboto', sans-serif"
      },
      secondary: {
        fontSize: '13px',
        fontColor: '#cbd5e1',
        fontWeight: '400',
        fontType: "'Roboto', sans-serif"
      }
    },
    meta: {
      fontSize: '12px',
      fontColor: '#94a3b8',
      fontWeight: '500',
      fontType: "'Roboto', sans-serif"
    },
    chip: {
      fontSize: '11px',
      fontColor: '#e0f2fe',
      fontWeight: '500',
      fontType: "'Roboto', sans-serif",
      backgroundColor: 'rgba(15, 23, 42, 0.8)',
      borderColor: 'rgba(56, 189, 248, 0.25)'
    },
    cover: {
      common: {
        fontSize: '14px',
        fontColor: '#f8fafc',
        fontWeight: '400',
        fontType: "'Roboto', sans-serif"
      },
      signature: {
        fontSize: '14px',
        fontColor: '#38bdf8',
        fontWeight: '700',
        fontType: "'Roboto', sans-serif"
      }
    }
  },
  light: {
    language: 'pt-BR',
    theme: 'light',
    template: 'GlassModern',
    activeTemplate: 'GlassModern',
    backgroundColor: '#f4f8fa',
    card: {
      backgroundColor: 'rgba(255, 255, 255, 0.88)',
      borderColor: 'rgba(15, 23, 42, 0.12)'
    },
    title: {
      primary: {
        fontSize: '28px',
        fontColor: '#0f172a',
        fontWeight: '800',
        fontType: "'Roboto', sans-serif"
      },
      secondary: {
        fontSize: '18px',
        fontColor: '#0f172a',
        fontWeight: '700',
        fontType: "'Roboto', sans-serif"
      }
    },
    subtitle: {
      primary: {
        fontSize: '14px',
        fontColor: '#334155',
        fontWeight: '600',
        fontType: "'Roboto', sans-serif"
      },
      secondary: {
        fontSize: '13px',
        fontColor: '#0284c7',
        fontWeight: '600',
        fontType: "'Roboto', sans-serif"
      }
    },
    caption: {
      primary: {
        fontSize: '14px',
        fontColor: '#1e293b',
        fontWeight: '600',
        fontType: "'Roboto', sans-serif"
      },
      secondary: {
        fontSize: '13px',
        fontColor: '#334155',
        fontWeight: '400',
        fontType: "'Roboto', sans-serif"
      }
    },
    meta: {
      fontSize: '12px',
      fontColor: '#475569',
      fontWeight: '500',
      fontType: "'Roboto', sans-serif"
    },
    chip: {
      fontSize: '11px',
      fontColor: '#0f172a',
      fontWeight: '500',
      fontType: "'Roboto', sans-serif",
      backgroundColor: 'rgba(241, 245, 249, 0.9)',
      borderColor: 'rgba(15, 23, 42, 0.12)'
    },
    cover: {
      common: {
        fontSize: '14px',
        fontColor: '#1e293b',
        fontWeight: '400',
        fontType: "'Roboto', sans-serif"
      },
      signature: {
        fontSize: '14px',
        fontColor: '#0f172a',
        fontWeight: '700',
        fontType: "'Roboto', sans-serif"
      }
    }
  }
};
