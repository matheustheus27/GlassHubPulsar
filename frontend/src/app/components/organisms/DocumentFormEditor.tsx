import React, { useState } from 'react';
import { GlassSurface } from '../atoms/GlassSurface';
import { Button } from '../atoms/Button';
import { useI18n } from '../../hooks/useI18n';

interface DocumentFormEditorProps {
  documentData: any;
  onChange: (newData: any) => void;
  activeTab: 'resume' | 'cover';
  onSaveManual?: () => void;
  isSaving?: boolean;
}

export const DocumentFormEditor: React.FC<DocumentFormEditorProps> = ({
  documentData,
  onChange,
  activeTab,
  onSaveManual,
  isSaving = false
}) => {
  const { t } = useI18n();
  const [section, setSection] = useState<'personal' | 'summary' | 'experience' | 'skills' | 'education' | 'projects' | 'cover'>('personal');

  const personal = documentData.personalDetails || {};
  const summary = documentData.summaryDetails || {};
  const skills = documentData.skillsDetails?.skills || [];
  const experiences = documentData.experienceDetails?.experiences || [];
  const educations = documentData.educationDetails?.educations || [];
  const projects = documentData.projectDetails?.projects || [];
  const coverLetter = documentData.coverLetterDetails || {};

  // Insert formatting tag
  const insertTag = (tag: 'BOLD' | 'HIGHLIGHT' | 'ITALIC' | 'UNDERLINE', currentText: string, setter: (newText: string) => void) => {
    setter(`${currentText} <${tag}>texto</${tag}>`);
  };

  // Updaters
  const updatePersonal = (field: string, value: any) => {
    onChange({
      ...documentData,
      personalDetails: { ...personal, [field]: value }
    });
  };

  const updateLocation = (locationText: string) => {
    const mapsLink = locationText.trim()
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationText.trim())}`
      : 'https://maps.google.com';

    onChange({
      ...documentData,
      personalDetails: {
        ...personal,
        location: { location: locationText, link: mapsLink, icon: '📍' }
      }
    });
  };

  const updateContact = (field: string, value: any) => {
    onChange({
      ...documentData,
      personalDetails: {
        ...personal,
        contact: { ...personal.contact, [field]: value }
      }
    });
  };

  const updateNetworking = (networkKey: string, name: string, url: string, icon: string) => {
    const currentNetworking = personal.contact?.networking || {};
    onChange({
      ...documentData,
      personalDetails: {
        ...personal,
        contact: {
          ...personal.contact,
          networking: {
            ...currentNetworking,
            [networkKey]: { name, url, icon }
          }
        }
      }
    });
  };

  const updateSummary = (value: string) => {
    onChange({
      ...documentData,
      summaryDetails: { ...summary, summary: value }
    });
  };

  // --- EXPERIENCES ACTIONS & ORDERING ---
  const addExperience = () => {
    const newExp = { company: '', position: '', period: '', bullets: [''] };
    onChange({
      ...documentData,
      experienceDetails: {
        ...documentData.experienceDetails,
        experiences: [...experiences, newExp]
      }
    });
  };

  const addExperienceAfter = (index: number) => {
    const newExp = { company: '', position: '', period: '', bullets: [''] };
    const updated = [...experiences];
    updated.splice(index + 1, 0, newExp);
    onChange({
      ...documentData,
      experienceDetails: { ...documentData.experienceDetails, experiences: updated }
    });
  };

  const moveExperience = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= experiences.length) return;
    const updated = [...experiences];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);
    onChange({
      ...documentData,
      experienceDetails: { ...documentData.experienceDetails, experiences: updated }
    });
  };

  const sortExperiencesByDate = () => {
    const parseYear = (str: string) => {
      if (!str) return 0;
      if (str.toLowerCase().includes('presente') || str.toLowerCase().includes('present')) return 9999;
      const matches = str.match(/\b(19\d\d|20\d\d)\b/g);
      if (matches && matches.length > 0) {
        return parseInt(matches[matches.length - 1], 10);
      }
      return 0;
    };

    const sorted = [...experiences].sort((a: any, b: any) => parseYear(b.period) - parseYear(a.period));
    onChange({
      ...documentData,
      experienceDetails: { ...documentData.experienceDetails, experiences: sorted }
    });
  };

  const removeExperience = (index: number) => {
    const updated = experiences.filter((_: any, idx: number) => idx !== index);
    onChange({
      ...documentData,
      experienceDetails: { ...documentData.experienceDetails, experiences: updated }
    });
  };

  const updateExperience = (index: number, field: string, value: any) => {
    const updated = [...experiences];
    updated[index] = { ...updated[index], [field]: value };
    onChange({
      ...documentData,
      experienceDetails: { ...documentData.experienceDetails, experiences: updated }
    });
  };

  const removeExpBullet = (expIndex: number, bulletIndex: number) => {
    const updated = [...experiences];
    if (updated[expIndex]?.bullets) {
      updated[expIndex].bullets.splice(bulletIndex, 1);
      onChange({
        ...documentData,
        experienceDetails: { ...documentData.experienceDetails, experiences: updated }
      });
    }
  };

  const updateExpBullet = (expIndex: number, bulletIndex: number, text: string) => {
    const updated = [...experiences];
    updated[expIndex].bullets[bulletIndex] = text;
    onChange({
      ...documentData,
      experienceDetails: { ...documentData.experienceDetails, experiences: updated }
    });
  };

  const addExpBullet = (expIndex: number) => {
    const updated = [...experiences];
    if (!updated[expIndex].bullets) updated[expIndex].bullets = [];
    updated[expIndex].bullets.push('');
    onChange({
      ...documentData,
      experienceDetails: { ...documentData.experienceDetails, experiences: updated }
    });
  };

  // --- SKILLS BULK INSERTION ---
  const addSkillCategory = () => {
    const newCat = { name: '', items: [] };
    onChange({
      ...documentData,
      skillsDetails: {
        ...documentData.skillsDetails,
        skills: [...skills, newCat]
      }
    });
  };

  const updateSkillCategoryName = (index: number, name: string) => {
    const updated = [...skills];
    updated[index] = { ...updated[index], name };
    onChange({
      ...documentData,
      skillsDetails: { ...documentData.skillsDetails, skills: updated }
    });
  };

  const addSkillTagsBulk = (catIndex: number, rawInput: string) => {
    if (!rawInput.trim()) return;
    const tokens = rawInput
      .split(/[;,]+/)
      .map(s => s.trim())
      .filter(Boolean);

    const updated = [...skills];
    if (!updated[catIndex].items) updated[catIndex].items = [];

    // Collect existing lower-case skill items across all categories
    const existingLower = new Set<string>();
    skills.forEach((c: any) => {
      (c.items || []).forEach((it: string) => existingLower.add(it.trim().toLowerCase()));
    });

    tokens.forEach(t => {
      const lower = t.trim().toLowerCase();
      if (!existingLower.has(lower)) {
        updated[catIndex].items.push(t);
        existingLower.add(lower);
      }
    });

    onChange({
      ...documentData,
      skillsDetails: { ...documentData.skillsDetails, skills: updated }
    });
  };

  const removeSkillTag = (catIndex: number, tagIndex: number) => {
    const updated = [...skills];
    updated[catIndex].items.splice(tagIndex, 1);
    onChange({
      ...documentData,
      skillsDetails: { ...documentData.skillsDetails, skills: updated }
    });
  };

  const removeSkillCategory = (catIndex: number) => {
    const updated = skills.filter((_: any, idx: number) => idx !== catIndex);
    onChange({
      ...documentData,
      skillsDetails: { ...documentData.skillsDetails, skills: updated }
    });
  };

  // --- EDUCATION ACTIONS & ORDERING ---
  const addEducation = () => {
    const newEdu = { organization: '', degree: '', period: '', description: '' };
    onChange({
      ...documentData,
      educationDetails: {
        ...documentData.educationDetails,
        educations: [...educations, newEdu]
      }
    });
  };

  const addEducationAfter = (index: number) => {
    const newEdu = { organization: '', degree: '', period: '', description: '' };
    const updated = [...educations];
    updated.splice(index + 1, 0, newEdu);
    onChange({
      ...documentData,
      educationDetails: { ...documentData.educationDetails, educations: updated }
    });
  };

  const moveEducation = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= educations.length) return;
    const updated = [...educations];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);
    onChange({
      ...documentData,
      educationDetails: { ...documentData.educationDetails, educations: updated }
    });
  };

  const sortEducationByDate = () => {
    const parseYear = (str: string) => {
      if (!str) return 0;
      const matches = str.match(/\b(19\d\d|20\d\d)\b/g);
      if (matches && matches.length > 0) {
        return parseInt(matches[matches.length - 1], 10);
      }
      return 0;
    };

    const sorted = [...educations].sort((a: any, b: any) => parseYear(b.period) - parseYear(a.period));
    onChange({
      ...documentData,
      educationDetails: { ...documentData.educationDetails, educations: sorted }
    });
  };

  const removeEducation = (index: number) => {
    const updated = educations.filter((_: any, idx: number) => idx !== index);
    onChange({
      ...documentData,
      educationDetails: { ...documentData.educationDetails, educations: updated }
    });
  };

  const updateEducation = (index: number, field: string, value: any) => {
    const updated = [...educations];
    updated[index] = { ...updated[index], [field]: value };
    onChange({
      ...documentData,
      educationDetails: { ...documentData.educationDetails, educations: updated }
    });
  };

  // --- PROJECTS ACTIONS & ORDERING ---
  const addProject = () => {
    const newProj = { title: '', description: '', link: '', bullets: [''] };
    onChange({
      ...documentData,
      projectDetails: {
        ...documentData.projectDetails,
        projects: [...projects, newProj]
      }
    });
  };

  const addProjectAfter = (index: number) => {
    const newProj = { title: '', description: '', link: '', bullets: [''] };
    const updated = [...projects];
    updated.splice(index + 1, 0, newProj);
    onChange({
      ...documentData,
      projectDetails: { ...documentData.projectDetails, projects: updated }
    });
  };

  const moveProject = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= projects.length) return;
    const updated = [...projects];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);
    onChange({
      ...documentData,
      projectDetails: { ...documentData.projectDetails, projects: updated }
    });
  };

  const removeProject = (index: number) => {
    const updated = projects.filter((_: any, idx: number) => idx !== index);
    onChange({
      ...documentData,
      projectDetails: { ...documentData.projectDetails, projects: updated }
    });
  };

  const updateProject = (index: number, field: string, value: any) => {
    const updated = [...projects];
    updated[index] = { ...updated[index], [field]: value };
    onChange({
      ...documentData,
      projectDetails: { ...documentData.projectDetails, projects: updated }
    });
  };

  const removeProjectBullet = (projIndex: number, bulletIndex: number) => {
    const updated = [...projects];
    if (updated[projIndex]?.bullets) {
      updated[projIndex].bullets.splice(bulletIndex, 1);
      onChange({
        ...documentData,
        projectDetails: { ...documentData.projectDetails, projects: updated }
      });
    }
  };

  const updateProjectBullet = (projIndex: number, bulletIndex: number, text: string) => {
    const updated = [...projects];
    updated[projIndex].bullets[bulletIndex] = text;
    onChange({
      ...documentData,
      projectDetails: { ...documentData.projectDetails, projects: updated }
    });
  };

  const addProjectBullet = (projIndex: number) => {
    const updated = [...projects];
    if (!updated[projIndex].bullets) updated[projIndex].bullets = [];
    updated[projIndex].bullets.push('');
    onChange({
      ...documentData,
      projectDetails: { ...documentData.projectDetails, projects: updated }
    });
  };

  const net = personal.contact?.networking || {};

  return (
    <GlassSurface glow="cyan" className="bg-slate-950/85 border-white/10 p-5 space-y-5 h-full overflow-y-auto shadow-2xl backdrop-blur-2xl">
      {/* SECTION SELECTOR BUTTONS & MANUAL SAVE BUTTON */}
      <div className="sticky -top-5 z-30 bg-slate-950/95 backdrop-blur-md flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pt-2 pb-3 -mx-5 px-5 shadow-md">
        <div className="flex flex-wrap gap-1.5">
          {activeTab === 'resume' ? (
            <>
              {[
                { id: 'personal', label: t('sectionPersonal') },
                { id: 'summary', label: t('sectionSummary') },
                { id: 'experience', label: t('sectionExperience') },
                { id: 'skills', label: t('sectionSkills') },
                { id: 'education', label: t('sectionEducation') },
                { id: 'projects', label: t('sectionProjects') }
              ].map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSection(s.id as any)}
                  className={`min-h-[36px] px-3 py-1 rounded-xl text-xs md:text-sm font-bold transition cursor-pointer ${section === s.id
                      ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                      : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                >
                  {s.label}
                </button>
              ))}
            </>
          ) : (
            <button
              type="button"
              className="min-h-[36px] px-3 py-1 rounded-xl text-xs md:text-sm font-bold bg-cyan-500 text-slate-950"
            >
              {t('sectionCoverLetter')}
            </button>
          )}
        </div>

        {/* EXPLICIT SAVE BUTTON */}
        {onSaveManual && (
          <Button
            variant="neon"
            size="sm"
            onClick={onSaveManual}
            isLoading={isSaving}
            leftIcon="💾"
            className="text-xs font-black shadow-[0_0_15px_rgba(6,182,212,0.3)]"
          >
            Salvar
          </Button>
        )}
      </div>

      {/* 1. DADOS PESSOAIS */}
      {section === 'personal' && activeTab === 'resume' && (
        <div className="space-y-4 animate-in fade-in">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
            {t('personalHeading')}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">{t('labelFullName')}</label>
              <input
                type="text"
                value={personal.name || ''}
                onChange={e => updatePersonal('name', e.target.value)}
                placeholder={t('phFullName')}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">{t('labelJobTitle')}</label>
              <input
                type="text"
                value={personal.title || ''}
                onChange={e => updatePersonal('title', e.target.value)}
                placeholder={t('phJobTitle')}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">{t('labelEmail')}</label>
              <input
                type="email"
                value={personal.contact?.email?.email || ''}
                onChange={e => updateContact('email', { email: e.target.value, icon: '✉️' })}
                placeholder="seuemail@exemplo.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans"
              />
              {personal.contact?.email?.email?.includes('@') && !personal.contact.email.email.includes('.com') && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com'].map(domain => {
                    const prefix = personal.contact.email.email.split('@')[0];
                    const suggested = `${prefix}@${domain}`;
                    return (
                      <button
                        key={domain}
                        type="button"
                        onClick={() => updateContact('email', { email: suggested, icon: '✉️' })}
                        className="px-2 py-0.5 rounded-md bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-[10px] font-semibold hover:bg-cyan-900/60 transition cursor-pointer"
                      >
                        @{domain}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">{t('labelPhone')}</label>
              <input
                type="text"
                value={personal.contact?.phone?.phone || ''}
                onChange={e => {
                  const raw = e.target.value;
                  const digits = raw.replace(/\D/g, '');
                  let formatted = raw;
                  if (!raw.startsWith('+')) {
                    if (digits.length <= 2) formatted = digits.length ? `(${digits}` : '';
                    else if (digits.length <= 6) formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
                    else if (digits.length <= 10) formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
                    else formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
                  }
                  const waNumber = digits.startsWith('55') ? digits : (digits.length >= 10 ? `55${digits}` : digits);
                  updateContact('phone', {
                    phone: formatted,
                    link: digits ? `https://wa.me/${waNumber}` : '',
                    icon: '📞'
                  });
                }}
                placeholder="(11) 99999-8888"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-300 block mb-1">
                {t('labelLocation')} <span className="text-[10px] text-cyan-400 font-normal">(Link dinâmico gerado para o Google Maps)</span>
              </label>
              <input
                type="text"
                value={personal.location?.location || ''}
                onChange={e => updateLocation(e.target.value)}
                placeholder={t('phLocation')}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">{t('labelPortfolio')}</label>
              <input
                type="text"
                value={net.portfolio?.url || ''}
                onChange={e => updateNetworking('portfolio', 'Portfólio', e.target.value, 'portfolio')}
                placeholder="https://seusite.dev"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">{t('labelLinkedin')}</label>
              <div className="flex rounded-xl bg-slate-900 border border-slate-800 focus-within:border-cyan-400 overflow-hidden">
                <span className="px-2.5 py-2.5 bg-slate-950 text-slate-400 text-xs font-mono border-r border-slate-800 shrink-0">
                  linkedin.com/in/
                </span>
                <input
                  type="text"
                  value={(net.linkedin?.url || '').replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, '')}
                  onChange={e => {
                    const uname = e.target.value.trim().replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, '');
                    updateNetworking('linkedin', 'LinkedIn', uname ? `https://linkedin.com/in/${uname}` : '', '💼');
                  }}
                  placeholder="seu-usuario"
                  className="w-full px-3 py-2.5 bg-transparent text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-sans"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">{t('labelGithub')}</label>
              <div className="flex rounded-xl bg-slate-900 border border-slate-800 focus-within:border-cyan-400 overflow-hidden">
                <span className="px-2.5 py-2.5 bg-slate-950 text-slate-400 text-xs font-mono border-r border-slate-800 shrink-0">
                  github.com/
                </span>
                <input
                  type="text"
                  value={(net.github?.url || '').replace(/^https?:\/\/(www\.)?github\.com\//i, '')}
                  onChange={e => {
                    const uname = e.target.value.trim().replace(/^https?:\/\/(www\.)?github\.com\//i, '');
                    updateNetworking('github', 'GitHub', uname ? `https://github.com/${uname}` : '', '🐙');
                  }}
                  placeholder="seu-usuario"
                  className="w-full px-3 py-2.5 bg-transparent text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-sans"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">{t('labelTwitter')}</label>
              <div className="flex rounded-xl bg-slate-900 border border-slate-800 focus-within:border-cyan-400 overflow-hidden">
                <span className="px-2.5 py-2.5 bg-slate-950 text-slate-400 text-xs font-mono border-r border-slate-800 shrink-0">
                  x.com/
                </span>
                <input
                  type="text"
                  value={(net.x?.url || net.twitter?.url || '').replace(/^https?:\/\/(www\.)?(x|twitter)\.com\//i, '')}
                  onChange={e => {
                    const uname = e.target.value.trim().replace(/^https?:\/\/(www\.)?(x|twitter)\.com\//i, '');
                    updateNetworking('x', 'X', uname ? `https://x.com/${uname}` : '', '𝕏');
                  }}
                  placeholder="seu-usuario"
                  className="w-full px-3 py-2.5 bg-transparent text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-sans"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">{t('labelInstagram')}</label>
              <div className="flex rounded-xl bg-slate-900 border border-slate-800 focus-within:border-cyan-400 overflow-hidden">
                <span className="px-2.5 py-2.5 bg-slate-950 text-slate-400 text-xs font-mono border-r border-slate-800 shrink-0">
                  instagram.com/
                </span>
                <input
                  type="text"
                  value={(net.instagram?.url || '').replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')}
                  onChange={e => {
                    const uname = e.target.value.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '');
                    updateNetworking('instagram', 'Instagram', uname ? `https://instagram.com/${uname}` : '', '📷');
                  }}
                  placeholder="seu-usuario"
                  className="w-full px-3 py-2.5 bg-transparent text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-sans"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">{t('labelFacebook')}</label>
              <div className="flex rounded-xl bg-slate-900 border border-slate-800 focus-within:border-cyan-400 overflow-hidden">
                <span className="px-2.5 py-2.5 bg-slate-950 text-slate-400 text-xs font-mono border-r border-slate-800 shrink-0">
                  facebook.com/
                </span>
                <input
                  type="text"
                  value={(net.facebook?.url || '').replace(/^https?:\/\/(www\.)?facebook\.com\//i, '')}
                  onChange={e => {
                    const uname = e.target.value.trim().replace(/^https?:\/\/(www\.)?facebook\.com\//i, '');
                    updateNetworking('facebook', 'Facebook', uname ? `https://facebook.com/${uname}` : '', '📘');
                  }}
                  placeholder="seu-usuario"
                  className="w-full px-3 py-2.5 bg-transparent text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-sans"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. SUMÁRIO PROFISSIONAL */}
      {section === 'summary' && activeTab === 'resume' && (
        <div className="space-y-3.5 animate-in fade-in">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              {t('summaryHeading')}
            </h3>

            {/* TAG ASSISTANT TOOLBAR */}
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => insertTag('BOLD', summary.summary || '', updateSummary)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-cyan-300 border border-cyan-500/30 transition cursor-pointer"
                title="Inserir negrito"
              >
                &lt;BOLD&gt;
              </button>
              <button
                type="button"
                onClick={() => insertTag('HIGHLIGHT', summary.summary || '', updateSummary)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-300 border border-amber-500/30 transition cursor-pointer"
                title="Inserir destaque"
              >
                &lt;HIGHLIGHT&gt;
              </button>
              <button
                type="button"
                onClick={() => insertTag('ITALIC', summary.summary || '', updateSummary)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-violet-300 border border-violet-500/30 transition cursor-pointer"
                title="Inserir itálico"
              >
                &lt;ITALIC&gt;
              </button>
            </div>
          </div>

          <textarea
            rows={7}
            value={summary.summary || ''}
            onChange={e => updateSummary(e.target.value)}
            placeholder={t('phSummary')}
            className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs md:text-sm text-slate-100 placeholder-slate-500 leading-relaxed focus:outline-none focus:border-cyan-400 font-sans"
          />
        </div>
      )}

      {/* 3. EXPERIÊNCIAS */}
      {section === 'experience' && activeTab === 'resume' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              {t('experienceHeading')} ({experiences.length})
            </h3>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={sortExperiencesByDate} leftIcon="🔄">
                Ordenar por Data
              </Button>
              <Button variant="neon" size="sm" onClick={addExperience} leftIcon="+">
                {t('addExperienceBtn')}
              </Button>
            </div>
          </div>

          <div className="space-y-3.5">
            {experiences.map((exp: any, idx: number) => {
              const isCurrentJob = exp.period?.toLowerCase().includes('presente') || exp.period?.toLowerCase().includes('present');

              return (
                <div key={idx} className="p-4 rounded-xl bg-slate-900/80 border border-white/10 space-y-3 shadow-lg relative group">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-xs font-bold text-slate-200">Cargo #{idx + 1}</span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => moveExperience(idx, 'up')}
                        disabled={idx === 0}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs text-slate-300 cursor-pointer"
                        title="Mover para cima"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => moveExperience(idx, 'down')}
                        disabled={idx === experiences.length - 1}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs text-slate-300 cursor-pointer"
                        title="Mover para baixo"
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        onClick={() => addExperienceAfter(idx)}
                        className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-xs font-bold hover:bg-cyan-900 cursor-pointer"
                        title="Inserir cargo após este"
                      >
                        + Inserir Abaixo
                      </button>
                      <button
                        type="button"
                        onClick={() => removeExperience(idx)}
                        className="text-red-400 hover:text-red-300 text-xs font-semibold px-2 cursor-pointer"
                      >
                        {t('removeExperienceBtn')}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    <input
                      type="text"
                      value={exp.company}
                      onChange={e => updateExperience(idx, 'company', e.target.value)}
                      placeholder={t('phCompany')}
                      className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs md:text-sm text-slate-100 placeholder-slate-500"
                    />
                    <input
                      type="text"
                      value={exp.position}
                      onChange={e => updateExperience(idx, 'position', e.target.value)}
                      placeholder={t('phPosition')}
                      className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs md:text-sm text-slate-100 placeholder-slate-500"
                    />
                    <input
                      type="text"
                      value={exp.period}
                      onChange={e => updateExperience(idx, 'period', e.target.value)}
                      placeholder="Ex: 02/2017 - 02/2019 ou 2017 - Presente"
                      className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs md:text-sm text-slate-100 placeholder-slate-500"
                    />
                  </div>

                  {/* Current Job Checkbox */}
                  <div className="flex items-center gap-2 pt-1">
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer font-semibold">
                      <input
                        type="checkbox"
                        checked={isCurrentJob}
                        onChange={e => {
                          const currentPeriod = exp.period || '';
                          if (e.target.checked) {
                            const startYear = currentPeriod.split('-')[0]?.trim() || '2022';
                            updateExperience(idx, 'period', `${startYear} - Presente`);
                          } else {
                            updateExperience(idx, 'period', currentPeriod.replace(/\s*-\s*Presente/i, ' - 2024'));
                          }
                        }}
                        className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-400 cursor-pointer"
                      />
                      Emprego Atual (Trabalho aqui atualmente)
                    </label>
                  </div>

                  {/* Bullets */}
                  <div className="space-y-2 pl-2 border-t border-white/5 pt-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">{t('bulletsLabel')}</label>
                    {exp.bullets?.map((bullet: string, bIdx: number) => (
                      <div key={bIdx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={bullet}
                          onChange={e => updateExpBullet(idx, bIdx, e.target.value)}
                          placeholder="Conquista mensurável com impacto ou métricas..."
                          className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs md:text-sm text-slate-200 placeholder-slate-500 font-sans"
                        />
                        <button
                          type="button"
                          onClick={() => removeExpBullet(idx, bIdx)}
                          className="px-2.5 py-2 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-400 hover:text-red-200 text-xs font-bold transition cursor-pointer"
                          title="Apagar este bullet"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addExpBullet(idx)}
                      className="text-xs text-cyan-400 hover:underline pt-1 block cursor-pointer font-semibold"
                    >
                      {t('addBulletBtn')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. HABILIDADES COM INSERÇÃO EM LOTE */}
      {section === 'skills' && activeTab === 'resume' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                {t('skillsHeading')}
              </h3>
              <p className="text-[11px] text-slate-400">Insira várias competências separadas por ponto-e-vírgula (;) ou vírgula (,)</p>
            </div>
            <Button variant="neon" size="sm" onClick={addSkillCategory} leftIcon="+">
              {t('addSkillCatBtn')}
            </Button>
          </div>

          <div className="space-y-3.5">
            {skills.map((cat: any, cIdx: number) => (
              <div key={cIdx} className="p-4 rounded-xl bg-slate-900/80 border border-white/10 space-y-2.5 shadow-lg">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={cat.name}
                    onChange={e => updateSkillCategoryName(cIdx, e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs md:text-sm font-bold text-cyan-300 placeholder-slate-500"
                    placeholder={t('phSkillCat')}
                  />
                  <button
                    type="button"
                    onClick={() => removeSkillCategory(cIdx)}
                    className="px-3 py-2 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-400 hover:text-red-200 text-xs font-bold transition cursor-pointer shrink-0"
                    title="Remover esta categoria de habilidades"
                  >
                    ✕ Remover Categoria
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {cat.items?.map((item: string, iIdx: number) => (
                    <span
                      key={iIdx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 text-xs text-slate-200 border border-slate-700 shadow"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => removeSkillTag(cIdx, iIdx)}
                        className="text-slate-400 hover:text-red-400 text-xs font-bold ml-1 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    id={`skill-input-${cIdx}`}
                    placeholder="Ex: TypeScript; React; Node.js; Docker; PostgreSQL"
                    className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs md:text-sm text-slate-200 placeholder-slate-500 flex-1"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.target as HTMLInputElement;
                        addSkillTagsBulk(cIdx, input.value);
                        input.value = '';
                      }
                    }}
                  />
                  <Button
                    variant="glass"
                    size="sm"
                    onClick={() => {
                      const input = document.getElementById(`skill-input-${cIdx}`) as HTMLInputElement;
                      if (input && input.value) {
                        addSkillTagsBulk(cIdx, input.value);
                        input.value = '';
                      }
                    }}
                  >
                    Adicionar Várias
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. EDUCAÇÃO */}
      {section === 'education' && activeTab === 'resume' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              {t('educationHeading')} ({educations.length})
            </h3>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={sortEducationByDate} leftIcon="🔄">
                Ordenar por Data
              </Button>
              <Button variant="neon" size="sm" onClick={addEducation} leftIcon="+">
                {t('addEducationBtn')}
              </Button>
            </div>
          </div>

          <div className="space-y-3.5">
            {educations.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-500 bg-slate-900/40 rounded-xl border border-white/5">
                Nenhuma formação acadêmica adicionada. Clique em "Adicionar Formação" acima.
              </div>
            )}

            {educations.map((edu: any, idx: number) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-900/80 border border-white/10 space-y-3 shadow-lg">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-xs font-bold text-slate-200">Formação #{idx + 1}</span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => moveEducation(idx, 'up')}
                      disabled={idx === 0}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs text-slate-300 cursor-pointer"
                      title="Mover para cima"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => moveEducation(idx, 'down')}
                      disabled={idx === educations.length - 1}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs text-slate-300 cursor-pointer"
                      title="Mover para baixo"
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      onClick={() => addEducationAfter(idx)}
                      className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-xs font-bold hover:bg-cyan-900 cursor-pointer"
                      title="Inserir formação após esta"
                    >
                      + Inserir Abaixo
                    </button>
                    <button
                      type="button"
                      onClick={() => removeEducation(idx)}
                      className="text-red-400 hover:text-red-300 text-xs font-semibold px-2 cursor-pointer"
                    >
                      {t('removeExperienceBtn')}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    value={edu.organization || ''}
                    onChange={e => updateEducation(idx, 'organization', e.target.value)}
                    placeholder={t('phInstitution')}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs md:text-sm text-slate-100 placeholder-slate-500"
                  />
                  <input
                    type="text"
                    value={edu.degree || ''}
                    onChange={e => updateEducation(idx, 'degree', e.target.value)}
                    placeholder={t('phDegree')}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs md:text-sm text-slate-100 placeholder-slate-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  <input
                    type="text"
                    value={edu.period || ''}
                    onChange={e => updateEducation(idx, 'period', e.target.value)}
                    placeholder="Ex: Concluído em 2020 ou 2016 - 2020"
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs md:text-sm text-slate-100 placeholder-slate-500 md:col-span-1"
                  />
                  <input
                    type="text"
                    value={edu.description || ''}
                    onChange={e => updateEducation(idx, 'description', e.target.value)}
                    placeholder={t('phEduDesc')}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs md:text-sm text-slate-100 placeholder-slate-500 md:col-span-2"
                  />
                </div>

                {/* Status Helpers */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="text-[11px] text-slate-400 font-bold self-center">Formatação Rápida:</span>
                  <button
                    type="button"
                    onClick={() => updateEducation(idx, 'period', 'Concluído em 2024')}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-emerald-300 font-semibold"
                  >
                    ✓ Concluído em YYYY
                  </button>
                  <button
                    type="button"
                    onClick={() => updateEducation(idx, 'period', 'Previsão de conclusão em 2026')}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-cyan-300 font-semibold"
                  >
                    ⏳ Previsão de conclusão em YYYY
                  </button>
                  <button
                    type="button"
                    onClick={() => updateEducation(idx, 'period', 'Incompleto')}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-amber-300 font-semibold"
                  >
                    ⚠️ Incompleto
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. PROJETOS */}
      {section === 'projects' && activeTab === 'resume' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              {t('projectsHeading')} ({projects.length})
            </h3>
            <Button variant="neon" size="sm" onClick={addProject} leftIcon="+">
              {t('addProjectBtn')}
            </Button>
          </div>

          <div className="space-y-3.5">
            {projects.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-500 bg-slate-900/40 rounded-xl border border-white/5">
                Nenhum projeto adicionado. Clique em "Adicionar Projeto" acima.
              </div>
            )}

            {projects.map((proj: any, idx: number) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-900/80 border border-white/10 space-y-3 shadow-lg">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-xs font-bold text-slate-200">Projeto #{idx + 1}</span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => moveProject(idx, 'up')}
                      disabled={idx === 0}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs text-slate-300 cursor-pointer"
                      title="Mover para cima"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => moveProject(idx, 'down')}
                      disabled={idx === projects.length - 1}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs text-slate-300 cursor-pointer"
                      title="Mover para baixo"
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      onClick={() => addProjectAfter(idx)}
                      className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-xs font-bold hover:bg-cyan-900 cursor-pointer"
                      title="Inserir projeto após este"
                    >
                      + Inserir Abaixo
                    </button>
                    <button
                      type="button"
                      onClick={() => removeProject(idx)}
                      className="text-red-400 hover:text-red-300 text-xs font-semibold px-2 cursor-pointer"
                    >
                      {t('removeExperienceBtn')}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    value={proj.title || ''}
                    onChange={e => updateProject(idx, 'title', e.target.value)}
                    placeholder={t('phProjectTitle')}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs md:text-sm text-slate-100 placeholder-slate-500"
                  />
                  <input
                    type="text"
                    value={proj.link || ''}
                    onChange={e => updateProject(idx, 'link', e.target.value)}
                    placeholder={t('phProjectLink')}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs md:text-sm text-slate-100 placeholder-slate-500"
                  />
                </div>

                <textarea
                  rows={2}
                  value={proj.description || ''}
                  onChange={e => updateProject(idx, 'description', e.target.value)}
                  placeholder={t('phProjectDesc')}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs md:text-sm text-slate-100 placeholder-slate-500"
                />

                {/* Bullets */}
                <div className="space-y-2 pl-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">Destaques do Projeto:</label>
                  {(proj.bullets || []).map((bullet: string, bIdx: number) => (
                    <div key={bIdx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={bullet}
                        onChange={e => updateProjectBullet(idx, bIdx, e.target.value)}
                        placeholder="Impacto ou resultado técnico alcançado no projeto..."
                        className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs md:text-sm text-slate-200 placeholder-slate-500 font-sans"
                      />
                      <button
                        type="button"
                        onClick={() => removeProjectBullet(idx, bIdx)}
                        className="px-2.5 py-2 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-400 hover:text-red-200 text-xs font-bold transition cursor-pointer"
                        title="Apagar este bullet"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addProjectBullet(idx)}
                    className="text-xs text-cyan-400 hover:underline pt-1 block cursor-pointer font-semibold"
                  >
                    {t('addProjectBulletBtn')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. CARTA DE APRESENTAÇÃO */}
      {activeTab === 'cover' && (
        <div className="space-y-4 animate-in fade-in">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
            {t('coverHeading')}
          </h3>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">{t('labelGreeting')}</label>
            <input
              type="text"
              value={coverLetter.greeting || ''}
              onChange={e => onChange({ ...documentData, coverLetterDetails: { ...coverLetter, greeting: e.target.value } })}
              placeholder={t('phGreeting')}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs md:text-sm text-slate-100 placeholder-slate-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">{t('labelParagraphs')}</label>
            {coverLetter.text?.map((p: string, pIdx: number) => (
              <textarea
                key={pIdx}
                rows={3}
                value={p}
                onChange={e => {
                  const updated = [...coverLetter.text];
                  updated[pIdx] = e.target.value;
                  onChange({ ...documentData, coverLetterDetails: { ...coverLetter, text: updated } });
                }}
                className="w-full p-3 mb-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs md:text-sm text-slate-100 leading-relaxed"
              />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">{t('labelValediction')}</label>
              <input
                type="text"
                value={coverLetter.valediction || ''}
                onChange={e => onChange({ ...documentData, coverLetterDetails: { ...coverLetter, valediction: e.target.value } })}
                placeholder={t('phValediction')}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs md:text-sm text-slate-100 placeholder-slate-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">{t('labelSignature')}</label>
              <input
                type="text"
                value={coverLetter.signature || ''}
                onChange={e => onChange({ ...documentData, coverLetterDetails: { ...coverLetter, signature: e.target.value } })}
                placeholder={t('phSignature')}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs md:text-sm text-slate-100 placeholder-slate-500"
              />
            </div>
          </div>
        </div>
      )}
    </GlassSurface>
  );
};
