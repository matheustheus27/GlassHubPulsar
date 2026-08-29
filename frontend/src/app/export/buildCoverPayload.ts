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

  const knownKeys = ['portfolio', 'linkedin', 'github', 'x', 'twitter', 'instagram', 'facebook'];
  if (networking.portfolio?.url) networkContacts.push({ title: networking.portfolio.name || 'Portfólio', link: networking.portfolio.url, icon: networking.portfolio.icon || 'portfolio' });
  if (networking.linkedin?.url) networkContacts.push({ title: networking.linkedin.name || 'LinkedIn', link: networking.linkedin.url, icon: networking.linkedin.icon || 'linkedin' });
  if (networking.github?.url) networkContacts.push({ title: networking.github.name || 'GitHub', link: networking.github.url, icon: networking.github.icon || 'github' });
  const xContact = networking.x || networking.twitter;
  if (xContact?.url) networkContacts.push({ title: xContact.name || 'X', link: xContact.url, icon: xContact.icon || 'x' });
  if (networking.instagram?.url) networkContacts.push({ title: networking.instagram.name || 'Instagram', link: networking.instagram.url, icon: networking.instagram.icon || 'instagram' });
  if (networking.facebook?.url) networkContacts.push({ title: networking.facebook.name || 'Facebook', link: networking.facebook.url, icon: networking.facebook.icon || 'facebook' });

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
    coverLetter: {
      greeting: coverLetter.greeting || 'Prezados,',
      text: coverLetter.text || [''],
      valediction: coverLetter.valediction || 'Atenciosamente,',
      signature: coverLetter.signature || personal.name || ''
    }
  };
}