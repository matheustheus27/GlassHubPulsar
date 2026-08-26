import { LanguageCode } from "../utils/defaultSettings";
import { ResumeDTO } from "../dto/ResumeDTO";
import { Settings } from "../types/settingsType";

export function buildResumePayload(
  lang: LanguageCode,
  isLight: boolean,
  styles: Settings,
  docData?: any
) {
  const data = docData || {};
  const personal = data.personalDetails || { name: 'Alexandre Oliveira', title: 'Engenheiro de Software' };
  const summary = data.summaryDetails || { summaryTitle: 'RESUMO', summary: '' };
  const skills = data.skillsDetails || { skillsTitle: 'HABILIDADES', skills: [] };
  const experiences = data.experienceDetails || { experienceTitle: 'EXPERIÊNCIAS', experiences: [] };
  const education = data.educationDetails || { educationTitle: 'EDUCAÇÃO', educations: [] };
  const projects = data.projectDetails || { projectTitle: 'PROJETOS', projects: [] };

  const networking = personal.contact?.networking || {};
  const networkContacts: Array<{ title: string; link: string; icon: string }> = [];

  const knownKeys = ['portfolio', 'linkedin', 'github', 'twitter', 'instagram', 'facebook'];
  if (networking.portfolio?.url) networkContacts.push({ title: networking.portfolio.name || 'Portfólio', link: networking.portfolio.url, icon: networking.portfolio.icon || '🌐' });
  if (networking.linkedin?.url) networkContacts.push({ title: networking.linkedin.name || 'LinkedIn', link: networking.linkedin.url, icon: networking.linkedin.icon || '💼' });
  if (networking.github?.url) networkContacts.push({ title: networking.github.name || 'GitHub', link: networking.github.url, icon: networking.github.icon || '🐙' });
  if (networking.twitter?.url) networkContacts.push({ title: networking.twitter.name || 'X', link: networking.twitter.url, icon: networking.twitter.icon || '𝕏' });
  if (networking.instagram?.url) networkContacts.push({ title: networking.instagram.name || 'Instagram', link: networking.instagram.url, icon: networking.instagram.icon || '📷' });
  if (networking.facebook?.url) networkContacts.push({ title: networking.facebook.name || 'Facebook', link: networking.facebook.url, icon: networking.facebook.icon || '📘' });

  // Custom networking keys
  for (const [key, val] of Object.entries(networking as Record<string, any>)) {
    if (val && (val.url || val.name || val.link) && !knownKeys.includes(key)) {
      networkContacts.push({
        title: val.name || val.title || key,
        link: val.url || val.link || '#',
        icon: val.icon || '🔗'
      });
    }
  }

  // Direct Array fallback if personal.contact is an array
  if (Array.isArray(personal.contact)) {
    personal.contact.forEach((c: any) => {
      networkContacts.push({
        title: c.title || c.name || c.email || c.phone || '',
        link: c.link || c.url || '#',
        icon: c.icon || '🔗'
      });
    });
  }

  const payload: ResumeDTO = {
    settings: {
      language: lang,
      theme: isLight ? "light" : "dark",
      template: styles.template || styles.activeTemplate || "GlassModern",
      card: styles.card,
      title: styles.title,
      subtitle: styles.subtitle,
      caption: styles.caption,
      meta: styles.meta,
      chip: styles.chip,
      backgroundColor: styles.backgroundColor
    } as any,
    personal: {
      title: personal.name || 'Candidate',
      personal: {
        name: personal.name || 'Candidate',
        title: personal.title || '',
        location: {
          title: personal.location?.location || personal.location?.title || '',
          link: personal.location?.link || '',
          icon: personal.location?.icon || '📍'
        },
        contact: [
          ...(personal.contact?.email?.email ? [{ title: personal.contact.email.email, link: `mailto:${personal.contact.email.email}`, icon: personal.contact.email.icon || '✉️' }] : []),
          ...(personal.contact?.phone?.phone ? [{ title: personal.contact.phone.phone, link: personal.contact.phone.link, icon: personal.contact.phone.icon || '📞' }] : []),
          ...networkContacts
        ]
      }
    },
    summary: {
      title: summary.summaryTitle || 'RESUMO',
      summary: summary.summary || ''
    },
    skills: {
      title: skills.skillsTitle || 'HABILIDADES',
      skills: (skills.skills || []).map((cat: any) => ({
        title: cat.name || '',
        items: cat.items || []
      }))
    },
    experiences: {
      title: experiences.experienceTitle || 'EXPERIÊNCIAS',
      experiences: (experiences.experiences || []).map((exp: any) => ({
        company: exp.company || '',
        role: exp.position || '',
        period: exp.period || '',
        bullets: exp.bullets || []
      }))
    },
    education: {
      title: education.educationTitle || 'EDUCAÇÃO',
      education: (education.educations || []).map((edu: any) => ({
        institution: edu.organization || '',
        role: edu.degree || '',
        period: edu.period || '',
        description: edu.description || ''
      }))
    },
    projects: {
      title: projects.projectTitle || 'PROJETOS',
      projects: (projects.projects || []).map((proj: any) => ({
        title: proj.title || '',
        role: proj.description || '',
        link: proj.link || '',
        bullets: proj.bullets || []
      }))
    }
  };

  return payload;
}