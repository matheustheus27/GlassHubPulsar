import React from 'react';
import { DynamicResumeHeader } from '../organisms/DynamicResumeHeader';
import { SummarySection } from '../organisms/SummarySection';
import { SkillsSection } from '../organisms/SkillsSection';
import { ExperienceSection } from '../organisms/ExperienceSection';
import { EducationSection } from '../organisms/EducationSection';
import { ProjectsSection } from '../organisms/ProjectsSection';
import { TemplateType } from '../molecules/TemplateSelector';
import { Settings } from '../../types/settingsType';

interface ResumeLayoutProps {
  template: TemplateType;
  personal: any;
  summary: any;
  skills: any;
  experiences: any;
  education: any;
  projects: any;
  styles: Settings;
}

export const ResumeLayout: React.FC<ResumeLayoutProps> = ({
  template = 'GlassModern',
  personal = {},
  summary,
  skills,
  experiences,
  education,
  projects,
  styles
}) => {
  const net = personal.contact?.networking || {};

  // Extract contact links into array
  const contactItems = [
    ...(personal.location ? [{ title: personal.location.location, link: personal.location.link, icon: personal.location.icon || '📍' }] : []),
    ...(personal.contact?.email ? [{ title: personal.contact.email.email, link: `mailto:${personal.contact.email.email}`, icon: personal.contact.email.icon || '✉️' }] : []),
    ...(personal.contact?.phone ? [{ title: personal.contact.phone.phone, link: personal.contact.phone.link, icon: personal.contact.phone.icon || '📞' }] : []),
    ...(net.portfolio?.url ? [{ title: net.portfolio.name || 'Portfólio', link: net.portfolio.url, icon: net.portfolio.icon || '🌐' }] : []),
    ...(net.linkedin?.url ? [{ title: net.linkedin.name || 'LinkedIn', link: net.linkedin.url, icon: net.linkedin.icon || '💼' }] : []),
    ...(net.github?.url ? [{ title: net.github.name || 'GitHub', link: net.github.url, icon: net.github.icon || '🐙' }] : []),
    ...(net.twitter?.url ? [{ title: net.twitter.name || 'X', link: net.twitter.url, icon: net.twitter.icon || '𝕏' }] : []),
    ...(net.instagram?.url ? [{ title: net.instagram.name || 'Instagram', link: net.instagram.url, icon: net.instagram.icon || '📷' }] : []),
    ...(net.facebook?.url ? [{ title: net.facebook.name || 'Facebook', link: net.facebook.url, icon: net.facebook.icon || '📘' }] : [])
  ];

  const isLight = styles?.theme === 'light';

  // Specific theme stylistic variant adjustments
  const cardBorder = styles?.card?.borderColor || (isLight ? 'rgba(15, 23, 42, 0.15)' : 'rgba(255, 255, 255, 0.12)');
  const cardBg = styles?.card?.backgroundColor || (isLight ? 'rgba(255, 255, 255, 0.88)' : 'rgba(15, 23, 42, 0.75)');

  const templateConfig = {
    GlassModern: {
      gapClass: 'space-y-5',
      headerBorder: cardBorder,
      cardBg: cardBg
    },
    GlassMinimalist: {
      gapClass: 'space-y-6',
      headerBorder: isLight ? 'rgba(15, 23, 42, 0.12)' : 'rgba(255, 255, 255, 0.08)',
      cardBg: isLight ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.03)'
    },
    GlassExecutive: {
      gapClass: 'space-y-5',
      headerBorder: 'rgba(245, 158, 11, 0.3)',
      cardBg: isLight ? 'rgba(255, 255, 255, 0.92)' : 'rgba(15, 23, 42, 0.75)'
    },
    GlassCompact: {
      gapClass: 'space-y-3.5',
      headerBorder: 'rgba(56, 189, 248, 0.25)',
      cardBg: isLight ? 'rgba(255, 255, 255, 0.8)' : 'rgba(15, 23, 42, 0.6)'
    }
  }[template] || {
    gapClass: 'space-y-5',
    headerBorder: cardBorder,
    cardBg: cardBg
  };

  const titlePrimary = styles?.title?.primary || { fontColor: '#38bdf8', fontSize: '28px', fontWeight: '800' };
  const titleSecondary = styles?.title?.secondary || { fontColor: '#38bdf8', fontSize: '18px', fontWeight: '700' };
  const subtitlePrimary = styles?.subtitle?.primary || { fontColor: isLight ? '#0f172a' : '#38bdf8', fontSize: '14px', fontWeight: '800' };
  const subtitleSecondary = styles?.subtitle?.secondary || { fontColor: '#38bdf8', fontSize: '13px', fontWeight: '600' };
  const captionPrimary = styles?.caption?.primary || { fontColor: isLight ? '#0f172a' : '#f8fafc', fontSize: '14px', fontWeight: '700' };
  const captionSecondary = styles?.caption?.secondary || { fontColor: isLight ? '#334155' : '#cbd5e1', fontSize: '13px', fontWeight: '400' };
  const metaStyle = styles?.meta || { fontColor: isLight ? '#0f172a' : '#f8fafc', fontSize: '12px', fontWeight: '600' };
  const chipStyle = styles?.chip || { backgroundColor: isLight ? '#f1f5f9' : 'rgba(15, 23, 42, 0.8)', fontColor: isLight ? '#0f172a' : '#e0f2fe', borderColor: 'rgba(56, 189, 248, 0.25)' };

  return (
    <main id="cv-root" className={`w-full ${templateConfig.gapClass} transition-all duration-300`}>
      <DynamicResumeHeader
        name={personal.name || 'Nome do Candidato'}
        title={personal.title || 'Título Profissional'}
        contacts={contactItems}
        borderColor={templateConfig.headerBorder}
        style={{
          name: {
            color: titlePrimary.fontColor,
            fontFamily: titlePrimary.fontType,
            fontSize: titlePrimary.fontSize,
            fontWeight: titlePrimary.fontWeight
          },
          title: {
            color: isLight ? '#0f172a' : (subtitlePrimary.fontColor || '#38bdf8'),
            fontFamily: subtitlePrimary.fontType,
            fontSize: subtitlePrimary.fontSize,
            fontWeight: 800,
            letterSpacing: '1.5px'
          },
          contact: {
            color: isLight ? '#0f172a' : '#f8fafc',
            iconColor: titlePrimary.fontColor || '#06b6d4',
            backgroundColor: isLight ? '#f1f5f9' : 'rgba(15, 23, 42, 0.75)',
            borderColor: isLight ? 'rgba(15, 23, 42, 0.18)' : 'rgba(255, 255, 255, 0.15)',
            fontFamily: metaStyle.fontType,
            fontSize: metaStyle.fontSize,
            fontWeight: 600
          }
        }}
      />

      {summary && (
        <SummarySection
          title={summary.summaryTitle || 'RESUMO PROFISSIONAL'}
          summary={summary.summary || ''}
          cardStyle={{ backgroundColor: templateConfig.cardBg, borderColor: cardBorder }}
          titleStyle={{ color: titleSecondary.fontColor, fontFamily: titleSecondary.fontType }}
          textStyle={{ color: captionSecondary.fontColor, fontFamily: captionSecondary.fontType }}
        />
      )}

      {skills && (
        <SkillsSection
          title={skills.skillsTitle || 'COMPETÊNCIAS & TECNOLOGIAS'}
          skills={skills.skills || []}
          cardStyle={{ backgroundColor: templateConfig.cardBg, borderColor: cardBorder }}
          titleStyle={{ color: titleSecondary.fontColor, fontFamily: titleSecondary.fontType }}
          categoryTitleStyle={{ color: subtitleSecondary.fontColor, fontFamily: subtitleSecondary.fontType }}
          badgeStyle={{ backgroundColor: chipStyle.backgroundColor, color: chipStyle.fontColor, borderColor: chipStyle.borderColor }}
          borderColor={cardBorder}
        />
      )}

      {experiences && (
        <ExperienceSection
          title={experiences.experienceTitle || 'HISTÓRICO PROFISSIONAL'}
          experiences={experiences.experiences || []}
          cardStyle={{ backgroundColor: templateConfig.cardBg, borderColor: cardBorder }}
          titleStyle={{ color: titleSecondary.fontColor, fontFamily: titleSecondary.fontType }}
          itemStyles={{
            company: { color: captionPrimary.fontColor, fontFamily: captionPrimary.fontType },
            role: { color: isLight ? '#0284c7' : subtitlePrimary.fontColor, fontFamily: subtitlePrimary.fontType },
            meta: { color: metaStyle.fontColor, fontFamily: metaStyle.fontType, fontWeight: metaStyle.fontWeight as any },
            body: { color: captionSecondary.fontColor, fontFamily: captionSecondary.fontType }
          }}
        />
      )}

      {education && (
        <EducationSection
          title={education.educationTitle || 'FORMAÇÃO ACADÊMICA'}
          educations={education.educations || []}
          cardStyle={{ backgroundColor: templateConfig.cardBg, borderColor: cardBorder }}
          titleStyle={{ color: titleSecondary.fontColor, fontFamily: titleSecondary.fontType }}
          itemStyles={{
            org: { color: captionPrimary.fontColor, fontFamily: captionPrimary.fontType },
            degree: { color: isLight ? '#0284c7' : subtitlePrimary.fontColor, fontFamily: subtitlePrimary.fontType },
            meta: { color: metaStyle.fontColor, fontFamily: metaStyle.fontType, fontWeight: metaStyle.fontWeight as any },
            body: { color: captionSecondary.fontColor, fontFamily: captionSecondary.fontType }
          }}
        />
      )}

      {projects && (
        <ProjectsSection
          title={projects.projectTitle || 'PROJETOS DE DESTAQUE'}
          projects={projects.projects || []}
          cardStyle={{ backgroundColor: templateConfig.cardBg, borderColor: cardBorder }}
          titleStyle={{ color: titleSecondary.fontColor, fontFamily: titleSecondary.fontType }}
          itemStyles={{
            title: { color: captionPrimary.fontColor, fontFamily: captionPrimary.fontType },
            description: { color: isLight ? '#0284c7' : subtitlePrimary.fontColor, fontFamily: subtitlePrimary.fontType },
            body: { color: captionSecondary.fontColor, fontFamily: captionSecondary.fontType }
          }}
        />
      )}
    </main>
  );
};
