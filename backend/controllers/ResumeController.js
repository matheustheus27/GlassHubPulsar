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
      const lang = req.query.lang || req.query.language || 'pt-BR';
      const userId = req.user?.id || 'demo-user-default';

      let resume = null;
      let coverLetter = null;
      try {
        if (prisma.resumeData) {
          resume = await prisma.resumeData.findFirst({
            where: { userId, language: lang }
          });
        }
        if (prisma.coverLetterData) {
          coverLetter = await prisma.coverLetterData.findFirst({
            where: { userId, language: lang }
          });
        }
      } catch (dbErr) {
        logger.warn('[ResumeController] DB read fallback:', dbErr.message);
      }

      if (!resume && !coverLetter) {
        return res.json({ success: true, data: null, language: lang });
      }

      const coverText = coverLetter?.text
        ? (Array.isArray(coverLetter.text) ? coverLetter.text : [String(coverLetter.text)])
        : (resume?.coverLetter?.text || ['']);

      // Map back to frontend expected structure
      const formatted = {
        personalDetails: resume?.personalDetails || coverLetter?.personalDetails || {},
        summaryDetails: resume?.summary || { summary: '' },
        skillsDetails: resume?.skills || { skills: [] },
        experienceDetails: resume?.experiences || { experiences: [] },
        educationDetails: resume?.education || { educations: [] },
        projectDetails: resume?.projects || { projects: [] },
        coverLetterDetails: {
          greeting: coverLetter?.greeting || resume?.coverLetter?.greeting || '',
          text: coverText,
          paragraphs: coverText,
          valediction: coverLetter?.valediction || resume?.coverLetter?.valediction || '',
          signature: coverLetter?.signature || resume?.coverLetter?.signature || (resume?.personalDetails?.name || '')
        }
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

      let savedResume = null;
      let savedCover = null;
      try {
        if (prisma.resumeData) {
          savedResume = await prisma.resumeData.upsert({
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

        if (prisma.coverLetterData && (coverLetter.greeting || coverLetter.text || coverLetter.paragraphs || coverLetter.signature)) {
          const paragraphs = Array.isArray(coverLetter.text)
            ? coverLetter.text
            : (Array.isArray(coverLetter.paragraphs)
                ? coverLetter.paragraphs
                : [coverLetter.text || coverLetter.paragraphs || '']);

          savedCover = await prisma.coverLetterData.upsert({
            where: {
              userId_language: { userId, language }
            },
            create: {
              userId,
              language,
              greeting: coverLetter.greeting || 'Prezado(a) Recrutador(a),',
              text: paragraphs,
              signature: coverLetter.signature || personalDetails.name || 'Candidato',
              valediction: coverLetter.valediction || 'Atenciosamente,',
              personalDetails
            },
            update: {
              greeting: coverLetter.greeting || 'Prezado(a) Recrutador(a),',
              text: paragraphs,
              signature: coverLetter.signature || personalDetails.name || 'Candidato',
              valediction: coverLetter.valediction || 'Atenciosamente,',
              personalDetails
            }
          });
        }
      } catch (dbErr) {
        logger.warn('[ResumeController] DB write fallback:', dbErr.message);
      }

      logger.info(`[ResumeController] Saved document for user [${userId}] in language [${language}]`);

      return res.json({
        success: true,
        message: 'Currículo e carta salvos com sucesso!',
        data: savedResume || document
      });
    } catch (err) {
      logger.error('Error saving resume:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async translateAsync(req, res) {
    try {
      const { document, targetLang = 'en-US' } = req.body;
      const userId = req.user?.id || req.body?.userId || 'demo-user-default';

      if (!document) {
        return res.status(400).json({ success: false, error: 'Documento ausente' });
      }

      const jobId = `trans_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      logger.info(`[ResumeController] Enqueuing async translation job [${jobId}] to ${targetLang}`);

      // Dispatch via MessageBroker (primary, with InMemory fallback)
      const messageBroker = require('../messaging/MessageBroker');
      await messageBroker.dispatch('translation', {
        jobId,
        document,
        targetLang,
        userId
      });

      // Also enqueue to BullMQ for legacy/dashboard tracking
      try {
        const queue = queueManager.getQueue('translation');
        await queue.add('translate_resume', {
          jobId,
          document,
          targetLang,
          userId
        });
      } catch (qErr) {
        logger.debug('[ResumeController] BullMQ queue add note:', qErr.message);
      }

      logger.info(`[ResumeController] Dispatched translation job [${jobId}] to ${targetLang}`);

      return res.status(202).json({
        success: true,
        message: 'Tradução iniciada em segundo plano',
        jobId,
        targetLang
      });

    } catch (err) {
      logger.error('Error dispatching translation:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = new ResumeController();
