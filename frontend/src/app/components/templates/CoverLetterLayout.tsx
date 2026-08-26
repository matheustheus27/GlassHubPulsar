import React from 'react';
import { DynamicResumeHeader } from '../organisms/DynamicResumeHeader';
import { CoverLetterSection } from '../organisms/CoverLetterSection';
import { Settings } from '../../types/settingsType';

interface CoverLetterLayoutProps {
  personal: any;
  coverLetter: any;
  styles: Settings;
}

export const CoverLetterLayout: React.FC<CoverLetterLayoutProps> = ({
  personal = {},
  coverLetter = {},
  styles
}) => {
  const contactItems = [
    ...(personal.location ? [{ title: personal.location.location, link: personal.location.link, icon: personal.location.icon || '📍' }] : []),
    ...(personal.contact?.email ? [{ title: personal.contact.email.email, link: `mailto:${personal.contact.email.email}`, icon: personal.contact.email.icon || '✉️' }] : []),
    ...(personal.contact?.phone ? [{ title: personal.contact.phone.phone, link: personal.contact.phone.link, icon: personal.contact.phone.icon || '📞' }] : []),
    ...(personal.contact?.networking?.github ? [{ title: personal.contact.networking.github.name, link: personal.contact.networking.github.url, icon: personal.contact.networking.github.icon || '🐙' }] : []),
    ...(personal.contact?.networking?.linkedin ? [{ title: personal.contact.networking.linkedin.name, link: personal.contact.networking.linkedin.url, icon: personal.contact.networking.linkedin.icon || '💼' }] : [])
  ];

  const cardBorder = styles?.card?.borderColor || 'rgba(255, 255, 255, 0.12)';
  const cardBg = styles?.card?.backgroundColor || 'rgba(15, 23, 42, 0.75)';
  const titlePrimary = styles?.title?.primary || { fontColor: '#38bdf8', fontSize: '28px', fontWeight: '800' };
  const subtitlePrimary = styles?.subtitle?.primary || { fontColor: '#cbd5e1', fontSize: '14px', fontWeight: '600' };
  const metaStyle = styles?.meta || { fontColor: '#94a3b8', fontSize: '12px', fontWeight: '500' };
  const coverCommon = styles?.cover?.common || { fontColor: '#f8fafc', fontSize: '14px' };
  const coverSignature = styles?.cover?.signature || { fontColor: '#38bdf8', fontSize: '14px', fontWeight: '700' };

  return (
    <main id="cv-root" className="w-full space-y-6">
      <DynamicResumeHeader
        name={personal.name || 'Nome do Candidato'}
        title={personal.title || 'Título Profissional'}
        contacts={contactItems}
        borderColor={cardBorder}
        style={{
          name: { color: titlePrimary.fontColor, fontFamily: titlePrimary.fontType },
          title: { color: subtitlePrimary.fontColor, fontFamily: subtitlePrimary.fontType },
          contact: { color: metaStyle.fontColor, iconColor: titlePrimary.fontColor || '#06b6d4', fontFamily: metaStyle.fontType }
        }}
      />

      {coverLetter && (
        <CoverLetterSection
          greeting={coverLetter.greeting || 'Prezado(a),'}
          text={coverLetter.text || ['']}
          valediction={coverLetter.valediction || 'Atenciosamente,'}
          signature={coverLetter.signature || personal.name || ''}
          cardStyle={{ backgroundColor: cardBg, borderColor: cardBorder }}
          bodyStyle={{ color: coverCommon.fontColor, fontFamily: coverCommon.fontType }}
          signatureStyle={{ color: coverSignature.fontColor }}
        />
      )}
    </main>
  );
};
