import React, { useEffect, useState } from 'react';

import { GlassCard } from './components/GlassCard';
import { SkillBadge } from './components/SkillBadge';
import { SectionTitle } from './components/SectionTitle';
import { ExperienceMeta } from './components/ExperienceMeta';
import { ProjectMeta } from './components/ProjectMeta';
import { CoverLetterMeta } from './components/CoverLetterMeta';
import { LanguageSelector, GetResumeLabel, GetCoverLabel } from './components/LanguageSelector';
import { Toast } from './components/Toast';

import { Translations } from './data/TranslationsData';
import { LanguageCode } from './data/LanguagesData';
import { settingsData } from './data/SettingsData';
import { Settings } from './types/settingsType';

import { buildResumePayload } from './export/buildResumePayload';
import { buildCoverPayload } from './export/buildCoverPayload';

import { processInHtml } from './services/tagProcessorService';

export default function App() {
  const [lang, setLang] = useState<LanguageCode>(() => {
    return (localStorage.getItem('glass_lang') as LanguageCode) || 'pt-BR';
  });

  const [isLight, setIsLight] = useState<boolean>(() => {
    return localStorage.getItem('glass_theme') === 'light';
  });

  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem('glass_tab') || 'resume';
  });

  const [openMenu, setOpenMenu] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Load complete style settings based on active theme
  const currentTheme = isLight ? 'light' : 'dark';
  const styles: Settings = settingsData[currentTheme];

  // Select complete language dictionary directly from TranslationsData
  const t = Translations[lang];
  const personal = t.personalDetails;

  useEffect(() => {
    localStorage.setItem('glass_lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('glass_theme', isLight ? 'light' : 'dark');
  }, [isLight]);

  useEffect(() => {
    localStorage.setItem('glass_tab', activeTab);
  }, [activeTab]);


  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const payload = activeTab === 'resume' ? buildResumePayload(lang, isLight, styles) : buildCoverPayload(lang, isLight, styles);

      const response = await fetch(`http://localhost:3001/pdf/export?type=${activeTab}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const candidateName = personal.name
      .trim()
      .toLowerCase()
      .replace(/^(\w+)\s+(?:.*\s+)?(\w+)$/, (_, p1, p2) => {
          const first = p1.charAt(0).toUpperCase() + p1.slice(1);
          const last = p2.charAt(0).toUpperCase() + p2.slice(1);
          return `${first}_${last}`;
      });

      const docType = (activeTab === 'cover' ? GetCoverLabel(lang) : GetResumeLabel(lang)).replace(/\s+/g, "_");

      link.href = url;
      link.download = `${docType}_${candidateName}_${lang}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      setToast({
        message: lang === 'pt-BR' ? 'PDF exportado com sucesso!' : 'PDF exported successfully!',
        type: 'success'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setToast({
        message: lang === 'pt-BR' 
          ? `Erro ao exportar: ${errorMessage}` 
          : `Export error: ${errorMessage}`,
        type: 'error'
      });
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const themeBg = isLight ? 'text-slate-900' : 'text-slate-50';
  const borderCol = isLight ? 'border-blue-200/60' : 'border-slate-800';

  return (
    <div 
      className="min-h-screen flex justify-center p-6 md:p-12 font-sans transition-colors duration-300"
      style={{ backgroundColor: styles.backgroundColor }}
    >
      <div className="w-full max-w-3xl">
        {/* TOP BAR */}
        <div className="flex justify-between items-center mb-6 print:hidden">
          <button
            onClick={() => setOpenMenu(!openMenu)}
            className="px-3 py-2 rounded-lg border text-xs font-medium hover:bg-slate-800 hover:text-white transition cursor-pointer text-slate-400 border-slate-800"
          >
            ⚙️ {lang === 'pt-BR' ? 'Configurações' : 'Settings'}
          </button>

          <button
            onClick={exportToPDF}
            disabled={isExporting}
            className={`px-4 py-2 text-black text-xs font-bold rounded-lg transition cursor-pointer shadow-sm ${
              isExporting 
                ? 'bg-cyan-600 opacity-60 cursor-not-allowed' 
                : 'bg-cyan-500 hover:bg-cyan-400'
            }`}
          >
            {isExporting 
              ? (lang === 'pt-BR' ? 'Exportando...' : 'Exporting...') 
              : (lang === 'pt-BR' ? 'Exportar PDF' : 'Export PDF')}
          </button>
        </div>

          {/* TABS DE NAVEGAÇÃO */}
          <div className="flex gap-2 mb-6 border-b border-slate-800 pb-2 print:hidden">
            <button
              onClick={() => setActiveTab('resume')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'resume'
                  ? 'bg-cyan-500 text-black'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {lang === 'pt-BR' ? 'Currículo' : 'Resume'}
            </button>
            <button
              onClick={() => setActiveTab('cover')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'cover'
                  ? 'bg-cyan-500 text-black'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {lang === 'pt-BR' ? 'Carta de Apresentação' : 'Cover Letter'}
            </button>
          </div>

        {/* SETTINGS PANEL */}
        {openMenu && (
          <div className="mb-6 p-4 border border-slate-800 rounded-xl bg-slate-900/90 space-y-4 print:hidden">
            <div>
              <p className="text-xs mb-2 text-slate-400 font-semibold">Language</p>
              <LanguageSelector value={lang} onChange={setLang} />
            </div>
            <div>
              <p className="text-xs mb-2 text-slate-400 font-semibold">Theme</p>
              <button
                onClick={() => setIsLight(!isLight)}
                className={`w-14 h-7 flex items-center rounded-full p-1 transition cursor-pointer ${isLight ? 'bg-cyan-500' : 'bg-slate-700'}`}
              >
                <div
                  className="bg-white w-5 h-5 rounded-full shadow-md transform transition"
                  style={{ transform: isLight ? 'translateX(28px)' : 'translateX(0px)' }}
                />
              </button>
            </div>
          </div>
        )}

        <main id="cv-root" className="space-y-5">
  
            {/* HEADER VISUAL (Comum a ambos ou ajustado por aba) */}
            <header 
              className={`flex flex-col gap-2 border-b pb-6 ${borderCol}`}
              style={{ borderBottomColor: styles.card.borderColor }}
            >
              <h1 
                className="tracking-tight"
                style={{ 
                  color: styles.title.primary.fontColor, 
                  fontFamily: styles.title.primary.fontType,
                  fontSize: styles.title.primary.fontSize,
                  fontWeight: styles.title.primary.fontWeight 
                }}
              >
                {personal.name}
              </h1>
              <h2 
                className="tracking-widest uppercase"
                style={{ 
                  color: styles.subtitle.primary.fontColor, 
                  fontFamily: styles.subtitle.primary.fontType,
                  fontSize: styles.subtitle.primary.fontSize,
                  fontWeight: styles.subtitle.primary.fontWeight
                }}
              >
                {personal.title}
              </h2>

              <div 
                className="flex flex-wrap gap-x-4 gap-y-2 mt-2"
                style={{ 
                  color: styles.meta.fontColor, 
                  fontFamily: styles.meta.fontType,
                  fontSize: styles.meta.fontSize,
                  fontWeight: styles.meta.fontWeight
                }}
              >
                <a href={personal.location.link} target="_blank" rel="noreferrer" className="hover:text-cyan-500 transition-colors cursor-pointer group">
                  {personal.location.icon} <span className="underline decoration-dotted group-hover:decoration-solid">{personal.location.location}</span>
                </a>
                <a href={`mailto:${personal.contact.email.email}`} className="hover:text-cyan-500 transition-colors">
                  {personal.contact.email.icon} {personal.contact.email.email}
                </a>
                <a href={personal.contact.phone.link} target="_blank" rel="noreferrer" className="hover:text-cyan-500 transition-colors">
                  {personal.contact.phone.icon} {personal.contact.phone.phone}
                </a>
                {personal.contact.networking.github && (
                  <a href={personal.contact.networking.github.url} target="_blank" rel="noreferrer" className="hover:text-cyan-500 transition-colors">
                    {personal.contact.networking.github.icon} {personal.contact.networking.github.name}
                  </a>
                )}
                {personal.contact.networking.linkedin && (
                  <a href={personal.contact.networking.linkedin.url} target="_blank" rel="noreferrer" className="hover:text-cyan-500 transition-colors">
                    {personal.contact.networking.linkedin.icon} {personal.contact.networking.linkedin.name}
                  </a>
                )}
              </div>
            </header>

            {/* CONTEÚDO: RESUME / CURRÍCULO */}
            {activeTab === 'resume' && (
              <>
                {/* PROFESSIONAL RESUME */}
                <GlassCard 
                  style={{ backgroundColor: styles.card.backgroundColor, borderColor: styles.card.borderColor }}
                  className={themeBg}
                >
                  <SectionTitle style={{ color: styles.title.secondary.fontColor, fontFamily: styles.title.secondary.fontType, fontSize: styles.title.secondary.fontSize }}>
                    {t.summaryDetails.summaryTitle}
                  </SectionTitle>
                  <p 
                    className="text-sm text-justify leading-relaxed mt-3"
                    style={{ color: styles.caption.secondary.fontColor, fontFamily: styles.caption.secondary.fontType, fontSize: styles.caption.secondary.fontSize }}
                    dangerouslySetInnerHTML={{ __html: processInHtml(t.summaryDetails.summary) }}
                  />
                </GlassCard>

                {/* SKILLS */}
                <GlassCard 
                  style={{ backgroundColor: styles.card.backgroundColor, borderColor: styles.card.borderColor }}
                  className={themeBg}
                >
                  <SectionTitle style={{ color: styles.title.secondary.fontColor, fontFamily: styles.title.secondary.fontType, fontSize: styles.title.secondary.fontSize }}>
                    {t.skillsDetails.skillsTitle}
                  </SectionTitle>
                  <div className="flex flex-col gap-4 mt-3">
                    {t.skillsDetails.skills.map((cat, idx) => (
                      <div 
                        key={cat.name} 
                        className="pb-2"
                        style={{ borderBottom: idx !== t.skillsDetails.skills.length - 1 ? `1px solid ${styles.card.borderColor}` : 'none' }}
                      >
                        <h4 
                          className="text-xs font-bold uppercase tracking-wider mb-2"
                          style={{ 
                            color: styles.subtitle.secondary.fontColor, 
                            fontFamily: styles.subtitle.secondary.fontType,
                            fontSize: styles.subtitle.secondary.fontSize,
                            fontWeight: styles.subtitle.secondary.fontWeight
                          }}
                        >
                          {cat.name}
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {cat.items.map(skill => (
                            <SkillBadge 
                              key={skill}
                              style={{ 
                                backgroundColor: styles.chip.backgroundColor, 
                                color: styles.chip.fontColor, 
                                borderColor: styles.chip.borderColor,
                                fontFamily: styles.chip.fontType, 
                                fontSize: styles.chip.fontSize,
                                fontWeight: styles.chip.fontWeight 
                              }}
                            >
                              {skill}
                            </SkillBadge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>

                {/* PROFESSIONAL EXPERIENCE */}
                <GlassCard 
                  style={{ backgroundColor: styles.card.backgroundColor, borderColor: styles.card.borderColor }}
                  className={themeBg}
                >
                  <SectionTitle style={{ color: styles.title.secondary.fontColor, fontFamily: styles.title.secondary.fontType, fontSize: styles.title.secondary.fontSize }}>
                    {t.experienceDetails.experienceTitle}
                  </SectionTitle>
                  <div className="flex flex-col gap-6 mt-4">
                    {t.experienceDetails.experiences.map((exp, index) => (
                      <div key={index}>
                        <div style={{ color: styles.caption.primary.fontColor }}>
                          <ExperienceMeta 
                            company={exp.company} 
                            date={exp.period} 
                            role={exp.position}
                            style={{
                              color: styles.meta.fontColor,
                              fontFamily: styles.meta.fontType,
                              fontSize: styles.meta.fontSize,
                              fontWeight: styles.meta.fontWeight as any
                            }}
                          >
                            <ul 
                              className="list-disc pl-4 flex flex-col gap-1.5 text-sm text-justify mt-2"
                              style={{ color: styles.caption.secondary.fontColor, fontFamily: styles.caption.secondary.fontType, fontSize: styles.caption.secondary.fontSize }}
                              dangerouslySetInnerHTML={{ __html: exp.bullets.map((bullet) => `<li>${processInHtml(bullet)}</li>`).join('') }}
                            />
                          </ExperienceMeta>
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>

                {/* EDUCATION */}
                <GlassCard 
                  style={{ backgroundColor: styles.card.backgroundColor, borderColor: styles.card.borderColor }}
                  className={themeBg}
                >
                  <SectionTitle style={{ color: styles.title.secondary.fontColor, fontFamily: styles.title.secondary.fontType, fontSize: styles.title.secondary.fontSize }}>
                    {t.educationDetails.educationTitle}
                  </SectionTitle>
                  <div className="flex flex-col gap-6 mt-4">
                    {t.educationDetails.educations.map((edu, index) => (
                      <div key={index}>
                        <div style={{ color: styles.caption.primary.fontColor }}>
                          <ExperienceMeta 
                            company={edu.organization} 
                            date={edu.period} 
                            role={edu.degree}
                            style={{
                              color: styles.meta.fontColor,
                              fontFamily: styles.meta.fontType,
                              fontSize: styles.meta.fontSize,
                              fontWeight: styles.meta.fontWeight as any
                            }}
                          >
                            <p 
                              className="text-sm text-justify mt-2"
                              style={{ color: styles.caption.secondary.fontColor, fontFamily: styles.caption.secondary.fontType, fontSize: styles.caption.secondary.fontSize }}
                              dangerouslySetInnerHTML= {{ __html: processInHtml(edu.description) }}
                            />
                          </ExperienceMeta>
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>

                {/* PERSONAL PROJECTS */}
                <GlassCard 
                  style={{ backgroundColor: styles.card.backgroundColor, borderColor: styles.card.borderColor }}
                  className={themeBg}
                >
                  <SectionTitle style={{ color: styles.title.secondary.fontColor, fontFamily: styles.title.secondary.fontType, fontSize: styles.title.secondary.fontSize }}>
                    {t.projectDetails.projectTitle}
                  </SectionTitle>
                  <div className="flex flex-col gap-6 mt-4">
                    {t.projectDetails.projects.map((proj, index) => (
                      <div key={index}>
                        <div style={{ color: styles.caption.primary.fontColor }}>
                          <ProjectMeta 
                            title={proj.title} 
                            role={proj.description}
                            link={proj.link}
                          >
                            <ul 
                              className="list-disc pl-4 flex flex-col gap-1.5 text-sm text-justify mt-2"
                              style={{ color: styles.caption.secondary.fontColor, fontFamily: styles.caption.secondary.fontType, fontSize: styles.caption.secondary.fontSize }}
                              dangerouslySetInnerHTML={{ __html: proj.bullets.map((bullet) => `<li>${processInHtml(bullet)}</li>`).join('') }}
                            />
                          </ProjectMeta>
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </>
            )}

            {/* CONTEÚDO: CARTA DE APRESENTAÇÃO */}
            {activeTab === 'cover' && (
              <GlassCard 
                style={{ backgroundColor: styles.card.backgroundColor, borderColor: styles.card.borderColor }}
                className={themeBg}
              >                
                <CoverLetterMeta
                  greeting={ t.coverLetterDetails.greeting }
                  text={ t.coverLetterDetails.text }
                  signature={ t.coverLetterDetails.signature }
                  valediction={ t.coverLetterDetails.valediction }
                  style={{
                    common: {
                      color: styles.cover.common.fontColor,
                      fontFamily: styles.cover.common.fontType,
                      fontSize: styles.cover.common.fontSize,
                      fontWeight: styles.cover.common.fontWeight
                    },
                    signature: {
                      color: styles.cover.signature.fontColor,
                      fontWeight: styles.cover.signature.fontWeight
                    }
                  }}>   
                </CoverLetterMeta>
              </GlassCard>
            )}

            {toast && (
              <Toast
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(null)}
              />
            )}

          </main>
      </div>
    </div>
  );
}
