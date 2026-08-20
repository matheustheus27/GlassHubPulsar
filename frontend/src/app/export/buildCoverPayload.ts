import { LanguageCode } from "../utils/defaultSettings";
import { Settings } from "../types/settingsType";

export function buildCoverPayload(
  lang: LanguageCode,
  isLight: boolean,
  styles: Settings,
  docData?: any
) {
  const data = docData || {};
  const personal = data.personalDetails || { name: 'Alexandre Oliveira', title: 'Engenheiro de Software' };
  const coverLetter = data.coverLetterDetails || {};

  const networking = personal.contact?.networking || {};
  const networkContacts: Array<{ title: string; link: string; icon: string }> = [];

  if (networking.portfolio?.url) networkContacts.push({ title: networking.portfolio.name || 'Portfólio', link: networking.portfolio.url, icon: networking.portfolio.icon || '🌐' });
  if (networking.linkedin?.url) networkContacts.push({ title: networking.linkedin.name || 'LinkedIn', link: networking.linkedin.url, icon: networking.linkedin.icon || '💼' });
  if (networking.github?.url) networkContacts.push({ title: networking.github.name || 'GitHub', link: networking.github.url, icon: networking.github.icon || '🐙' });
  if (networking.twitter?.url) networkContacts.push({ title: networking.twitter.name || 'X', link: networking.twitter.url, icon: networking.twitter.icon || '𝕏' });
  if (networking.instagram?.url) networkContacts.push({ title: networking.instagram.name || 'Instagram', link: networking.instagram.url, icon: networking.instagram.icon || '📷' });
  if (networking.facebook?.url) networkContacts.push({ title: networking.facebook.name || 'Facebook', link: networking.facebook.url, icon: networking.facebook.icon || '📘' });

  return {
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
      cover: styles.cover,
      backgroundColor: styles.backgroundColor
    } as any,
    personal: {
      title: personal.name || 'Candidate',
      personal: {
        name: personal.name || 'Candidate',
        title: personal.title || '',
        location: {
          title: personal.location?.location || '',
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
    coverLetter: {
      greeting: coverLetter.greeting || 'Prezados,',
      text: coverLetter.text || [''],
      valediction: coverLetter.valediction || 'Atenciosamente,',
      signature: coverLetter.signature || personal.name || ''
    }
  };
}