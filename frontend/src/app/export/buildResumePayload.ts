import { Translations } from "../data/TranslationsData";
import { LanguageCode } from "../data/LanguagesData";
import { ResumeDTO } from "../dto/ResumeDTO";
import { Settings } from "../types/settingsType";

export function buildResumePayload(
  lang: LanguageCode,
  isLight: boolean,
  styles: Settings
) {
  const t = Translations[lang];

  const payload: ResumeDTO = {
        settings: {
          language: lang,
          theme: isLight ? "light" : "dark",
          card: styles.card,
          title: styles.title,
          subtitle: styles.subtitle,
          caption: styles.caption,
          meta: styles.meta,
          chip: styles.chip,
          backgroundColor: styles.backgroundColor
        },
        personal: {
          title: t.personalDetails.name,
          personal: {
            name: t.personalDetails.name,
            title: t.personalDetails.title,
            location: {
              title: t.personalDetails.location.location,
              link: t.personalDetails.location.link,
              icon: t.personalDetails.location.icon
            },
            contact: [
              { title: t.personalDetails.contact.email.email, link: `mailto:${t.personalDetails.contact.email.email}`, icon: t.personalDetails.contact.email.icon },
              { title: t.personalDetails.contact.phone.phone, link: t.personalDetails.contact.phone.link, icon: t.personalDetails.contact.phone.icon },
              ...(t.personalDetails.contact.networking ? Object.values(t.personalDetails.contact.networking).map((net: any) => ({ title: net.name, link: net.url, icon: net.icon })) : [])
            ]
          }
        },
        summary: {
          title: t.summaryDetails.summaryTitle,
          summary: t.summaryDetails.summary
        },
        skills: {
          title: t.skillsDetails.skillsTitle,
          skills: t.skillsDetails.skills.map(cat => ({
            title: cat.name,
            items: cat.items
          }))
        },
        experiences: {
          title: t.experienceDetails.experienceTitle,
          experiences: t.experienceDetails.experiences.map(exp => ({
            company: exp.company,
            role: exp.position,
            period: exp.period,
            bullets: exp.bullets
          }))
        },
        education: {
          title: t.educationDetails.educationTitle,
          education: t.educationDetails.educations.map(edu => ({
            institution: edu.organization,
            role: edu.degree,
            period: edu.period,
            description: edu.description
          }))
        },
        projects: {
          title: t.projectDetails.projectTitle,
          projects: t.projectDetails.projects.map(proj => ({
            title: proj.title,
            role: proj.description,
            link: proj.link,
            bullets: proj.bullets
          }))
        }
      };

  return payload;
}