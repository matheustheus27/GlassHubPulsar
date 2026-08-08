import { Translations } from "../data/TranslationsData";
import { LanguageCode } from "../data/LanguagesData";
import { CoverDTO } from "../dto/CoverDTO";
import { Settings } from "../types/settingsType";

export function buildCoverPayload(
  lang: LanguageCode,
  isLight: boolean,
  styles: Settings
) {
  const t = Translations[lang];

  const payload: CoverDTO = {
        greeting: t.coverLetterDetails.greeting,
        bullets: t.coverLetterDetails.text,
        signature: t.coverLetterDetails.signature,
        valediction: t.coverLetterDetails.valediction,
        settings: {
          language: lang,
          theme: isLight ? "light" : "dark",
          card: styles.card,
          title: styles.title,
          subtitle: styles.subtitle,
          meta: styles.meta,
          cover: styles.cover,
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
        }
      };

  return payload;
}