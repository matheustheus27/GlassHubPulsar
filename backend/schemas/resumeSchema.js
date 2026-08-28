/**
 * Resume JSON Schema & DTO Normalization Module
 * Defines exact schema for Ollama format enforcement and normalizes to application state DTO.
 */

const RESUME_JSON_SCHEMA = {
  type: "object",
  properties: {
    candidate: {
      type: "object",
      properties: {
        name: { type: "string" },
        title: { type: "string" },
        location: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        linkedin: { type: "string" },
        github: { type: "string" }
      },
      required: ["name", "title", "location", "email", "phone", "linkedin", "github"]
    },
    professionalSummary: { type: "string" },
    skills: {
      type: "array",
      items: {
        type: "object",
        properties: {
          category: { type: "string" },
          items: { type: "array", items: { type: "string" } }
        },
        required: ["category", "items"]
      }
    },
    experiences: {
      type: "array",
      items: {
        type: "object",
        properties: {
          company: { type: "string" },
          position: { type: "string" },
          period: { type: "string" },
          generalDescription: { type: "string" },
          achievements: { type: "array", items: { type: "string" } }
        },
        required: ["company", "position", "period", "generalDescription", "achievements"]
      }
    },
    education: {
      type: "array",
      items: {
        type: "object",
        properties: {
          institution: { type: "string" },
          degree: { type: "string" },
          fieldOfStudy: { type: "string" },
          statusOrPeriod: { type: "string" },
          details: { type: "string" }
        },
        required: ["institution", "degree", "fieldOfStudy", "statusOrPeriod", "details"]
      }
    },
    projects: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          technologies: { type: "array", items: { type: "string" } },
          description: { type: "string" },
          achievements: { type: "array", items: { type: "string" } }
        },
        required: ["name", "technologies", "description", "achievements"]
      }
    }
  },
  required: [
    "candidate",
    "professionalSummary",
    "skills",
    "experiences",
    "education",
    "projects"
  ]
};

function validateAndCleanResumeData(rawJson) {
  const data = typeof rawJson === 'object' && rawJson !== null ? rawJson : {};
  const candidate = data.candidate || {};

  const cleanString = (str) => typeof str === 'string' ? str.trim() : '';
  const cleanArray = (arr) => Array.isArray(arr) ? arr.map(cleanString).filter(Boolean) : [];

  const rawSkills = Array.isArray(data.skills) ? data.skills : [];
  const cleanedSkills = rawSkills.map(cat => ({
    category: cleanString(cat.category) || 'Competências',
    items: cleanArray(cat.items)
  })).filter(cat => cat.items.length > 0);

  return {
    candidate: {
      name: cleanString(candidate.name),
      title: cleanString(candidate.title),
      location: cleanString(candidate.location),
      email: cleanString(candidate.email),
      phone: cleanString(candidate.phone),
      linkedin: cleanString(candidate.linkedin),
      github: cleanString(candidate.github),
      x: cleanString(candidate.x),
      instagram: cleanString(candidate.instagram),
      facebook: cleanString(candidate.facebook),
      portfolio: cleanString(candidate.portfolio)
    },
    professionalSummary: cleanString(data.professionalSummary),
    skills: cleanedSkills,
    experiences: Array.isArray(data.experiences) ? data.experiences.map(exp => ({
      company: cleanString(exp.company),
      position: cleanString(exp.position),
      period: cleanString(exp.period),
      generalDescription: cleanString(exp.generalDescription),
      achievements: cleanArray(exp.achievements)
    })).filter(exp => exp.company || exp.position) : [],
    education: Array.isArray(data.education) ? data.education.map(edu => ({
      institution: cleanString(edu.institution),
      degree: cleanString(edu.degree),
      fieldOfStudy: cleanString(edu.fieldOfStudy),
      statusOrPeriod: cleanString(edu.statusOrPeriod),
      details: cleanString(edu.details)
    })).filter(edu => edu.institution || edu.degree || edu.fieldOfStudy) : [],
    projects: Array.isArray(data.projects) ? data.projects.map(proj => ({
      name: cleanString(proj.name),
      technologies: cleanArray(proj.technologies),
      description: cleanString(proj.description),
      achievements: cleanArray(proj.achievements)
    })).filter(proj => proj.name) : []
  };
}

function normalizeToApplicationDTO(structuredSchema, targetLanguage = 'pt-BR') {
  const schema = validateAndCleanResumeData(structuredSchema);
  const cand = schema.candidate;
  const isPt = targetLanguage.toLowerCase().startsWith('pt');

  const titles = isPt ? {
    summary: "RESUMO PROFISSIONAL",
    skills: "COMPETÊNCIAS & TECNOLOGIAS",
    experience: "HISTÓRICO PROFISSIONAL",
    education: "FORMAÇÃO ACADÊMICA",
    projects: "PROJETOS DE DESTAQUE"
  } : {
    summary: "PROFESSIONAL SUMMARY",
    skills: "SKILLS & TECHNOLOGIES",
    experience: "PROFESSIONAL EXPERIENCE",
    education: "EDUCATION",
    projects: "FEATURED PROJECTS"
  };

  return {
    rawSchema: schema,
    personalDetails: {
      name: cand.name,
      title: cand.title,
      location: { location: cand.location, link: "" },
      contact: {
        email: { email: cand.email },
        phone: { phone: cand.phone, link: cand.phone ? `https://wa.me/${cand.phone.replace(/\D/g, '')}` : '' },
        networking: {
          linkedin: { name: "LinkedIn", url: cand.linkedin || "" },
          github: { name: "GitHub", url: cand.github || "" },
          x: { name: "X", url: cand.x || "" },
          instagram: { name: "Instagram", url: cand.instagram || "" },
          facebook: { name: "Facebook", url: cand.facebook || "" },
          portfolio: { name: "Portfolio", url: cand.portfolio || "" }
        }
      }
    },
    summaryDetails: {
      summaryTitle: titles.summary,
      summary: schema.professionalSummary
    },
    skillsDetails: {
      skillsTitle: titles.skills,
      skills: schema.skills.map(s => ({ name: s.category, items: s.items }))
    },
    experienceDetails: {
      experienceTitle: titles.experience,
      experiences: schema.experiences.map(exp => ({
        company: exp.company,
        position: exp.position,
        period: exp.period,
        bullets: exp.achievements.length > 0 ? exp.achievements : (exp.generalDescription ? [exp.generalDescription] : [])
      }))
    },
    educationDetails: {
      educationTitle: titles.education,
      educations: schema.education.map(edu => ({
        organization: edu.institution,
        degree: [edu.degree, edu.fieldOfStudy].filter(Boolean).join(" - "),
        period: edu.statusOrPeriod,
        description: edu.details
      }))
    },
    projectDetails: {
      projectTitle: titles.projects,
      projects: schema.projects.map(proj => ({
        title: proj.name,
        link: "",
        description: proj.description || (proj.technologies.length > 0 ? `${isPt ? 'Tecnologias' : 'Technologies'}: ${proj.technologies.join(', ')}` : ''),
        bullets: proj.achievements.length > 0 ? proj.achievements : (proj.description ? [proj.description] : [])
      }))
    }
  };
}

module.exports = {
  RESUME_JSON_SCHEMA,
  validateAndCleanResumeData,
  normalizeToApplicationDTO
};
