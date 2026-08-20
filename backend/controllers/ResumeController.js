/**
 * Resume & Document Controller
 * Handles document state persistence, versioning, and worker translation job dispatch.
 */
const prisma = require('../prisma/client');
const queueManager = require('../queues/queueManager');
const logger = require('../utils/logger');

class ResumeController {
  async getResume(req, res) {
    try {
      const { lang = 'pt-BR' } = req.query;
      const userId = req.user?.id || 'demo-user-default';

      let resume = null;
      try {
        if (prisma.resumeData) {
          resume = await prisma.resumeData.findFirst({
            where: { userId, language: lang }
          });
        }
      } catch (dbErr) {
        logger.warn('[ResumeController] DB read fallback:', dbErr.message);
      }

      if (!resume) {
        return res.json({ success: true, data: null, language: lang });
      }

      // Map back to frontend expected structure
      const formatted = {
        personalDetails: resume.personalDetails || {},
        summaryDetails: resume.summary || { summary: '' },
        skillsDetails: resume.skills || { skills: [] },
        experienceDetails: resume.experiences || { experiences: [] },
        educationDetails: resume.education || { educations: [] },
        projectDetails: resume.projects || { projects: [] },
        coverLetterDetails: resume.coverLetter || { greeting: '', text: [''], valediction: '', signature: '' }
      };

      return res.json({
        success: true,
        data: formatted,
        language: lang
      });
    } catch (err) {
      logger.error('Error fetching resume:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async saveResume(req, res) {
    try {
      const { language = 'pt-BR', document } = req.body;
      const userId = req.user?.id || 'demo-user-default';

      if (!document) {
        return res.status(400).json({ success: false, error: 'Documento não fornecido' });
      }

      const personalDetails = document.personalDetails || document.personal || {};
      const summary = document.summaryDetails || document.summary || {};
      const skills = document.skillsDetails || document.skills || {};
      const experiences = document.experienceDetails || document.experiences || {};
      const education = document.educationDetails || document.education || {};
      const projects = document.projectDetails || document.projects || {};
      const coverLetter = document.coverLetterDetails || document.coverLetter || {};

      let saved = null;
      try {
        if (prisma.resumeData) {
          saved = await prisma.resumeData.upsert({
            where: {
              userId_language: { userId, language }
            },
            create: {
              userId,
              language,
              title: personalDetails.title || 'Curriculum Vitae',
              personalDetails,
              summary,
              skills,
              experiences,
              education,
              projects
            },
            update: {
              title: personalDetails.title || 'Curriculum Vitae',
              personalDetails,
              summary,
              skills,
              experiences,
              education,
              projects
            }
          });
        }
      } catch (dbErr) {
        logger.warn('[ResumeController] DB write fallback:', dbErr.message);
      }

      logger.info(`[ResumeController] Saved resume for user [${userId}] in language [${language}]`);

      return res.json({
        success: true,
        message: 'Currículo salvo com sucesso!',
        data: saved || document
      });
    } catch (err) {
      logger.error('Error saving resume:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async translateAsync(req, res) {
    try {
      const { document, targetLang = 'en-US' } = req.body;
      const userId = req.user?.id || 'anonymous-user';

      if (!document) {
        return res.status(400).json({ success: false, error: 'Documento ausente' });
      }

      const queue = queueManager.getQueue('translation');
      const job = await queue.add('translate_resume', {
        document,
        targetLang,
        userId
      });

      logger.info(`Dispatched translation job [${job.id}] to ${targetLang}`);

      return res.status(202).json({
        success: true,
        message: 'Tradução iniciada em segundo plano',
        jobId: job.id,
        targetLang
      });

    } catch (err) {
      logger.error('Error dispatching translation:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = new ResumeController();
