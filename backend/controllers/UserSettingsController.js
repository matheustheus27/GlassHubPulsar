/**
 * User Settings Controller
 * Handles persistent user preferences (viewMode, theme, template, primaryColor, language, atsScore, atsReport).
 */
const prisma = require('../prisma/client');
const logger = require('../utils/logger');

class UserSettingsController {
  async getSettings(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.json({
          success: true,
          settings: {
            viewMode: 'split',
            activeTheme: 'dark',
            activeTemplate: 'GlassModern',
            primaryColor: '#06b6d4',
            defaultLanguage: 'pt-BR',
            atsScore: 0,
            atsReport: null
          }
        });
      }

      let settings = null;
      try {
        if (prisma.userSettings) {
          settings = await prisma.userSettings.findUnique({
            where: { userId }
          });
        }
      } catch (dbErr) {
        logger.warn('[UserSettings] DB read warning:', dbErr.message);
      }

      if (!settings) {
        settings = {
          viewMode: 'split',
          activeTheme: 'dark',
          activeTemplate: 'GlassModern',
          primaryColor: '#06b6d4',
          defaultLanguage: 'pt-BR',
          atsScore: 0,
          atsReport: null
        };
      }

      return res.json({ success: true, settings });
    } catch (err) {
      logger.error('Error fetching user settings:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async saveSettings(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Usuário não autenticado' });
      }

      const {
        viewMode = 'split',
        activeTheme = 'dark',
        activeTemplate = 'GlassModern',
        primaryColor = '#06b6d4',
        defaultLanguage = 'pt-BR',
        atsScore = 0,
        atsReport = null,
        customStyles = null
      } = req.body;

      const saved = await prisma.userSettings.upsert({
        where: { userId },
        create: {
          userId,
          viewMode,
          activeTheme,
          activeTemplate,
          primaryColor,
          defaultLanguage,
          atsScore: atsScore ? parseInt(atsScore, 10) : 0,
          atsReport,
          customStyles
        },
        update: {
          viewMode,
          activeTheme,
          activeTemplate,
          primaryColor,
          defaultLanguage,
          atsScore: atsScore ? parseInt(atsScore, 10) : 0,
          atsReport,
          customStyles
        }
      });

      logger.info(`[UserSettings] Settings auto-saved for user ${userId} (${activeTemplate}, ${activeTheme}, ${primaryColor})`);
      return res.json({ success: true, settings: saved });
    } catch (err) {
      logger.error('Error saving user settings:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async updateSettings(req, res) {
    return this.saveSettings(req, res);
  }
}

module.exports = new UserSettingsController();
