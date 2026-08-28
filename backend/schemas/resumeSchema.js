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
        github: { type: "string" },
        x: { type: "string" },
        instagram: { type: "string" },
        facebook: { type: "string" },
        portfolio: { type: "string" }
      },
      required: ["name", "title", "location", "email", "phone"]
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
          bullets: { type: "array", items: { type: "string" } }
        },
        required: ["company", "position", "period", "bullets"]
      }
    },
    education: {
      type: "array",
      items: {
        type: "object",
        properties: {
          institution: { type: "string" },
          degree: { type: "string" },
          period: { type: "string" },
          description: { type: "string" }
        },
        required: ["institution", "degree", "period", "description"]
      }
    },
    projects: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          bullets: { type: "array", items: { type: "string" } }
        },
        required: ["name", "description", "bullets"]
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
      x: cleanString(candidate.x || candidate.twitter),
      instagram: cleanString(candidate.instagram),
      facebook: cleanString(candidate.facebook),
      portfolio: cleanString(candidate.portfolio)
    },
    professionalSummary: cleanString(data.professionalSummary),
    skills: cleanedSkills,
    experiences: Array.isArray(data.experiences) ? data.experiences.map(exp => {
      const company = cleanString(exp.company);
      const position = cleanString(exp.position);
      const period = cleanString(exp.period);
      let generalDescription = cleanString(exp.generalDescription);
      if (generalDescription && generalDescription.toLowerCase() === position.toLowerCase()) {
        generalDescription = '';
      }
      return {
        company,
        position,
        period,
        generalDescription,
        bullets: cleanArray(exp.bullets || exp.achievements || exp.realizacoes)
      };
    }).filter(exp => exp.company || exp.position) : [],
    education: Array.isArray(data.education) ? data.education.map(edu => ({
      institution: cleanString(edu.institution || edu.instituicao),
      degree: cleanString(edu.degree || edu.grau),
      period: cleanString(edu.period || edu.statusOrPeriod || edu.statusOuPeriodo),
      description: cleanString(edu.description || edu.details || edu.detalhes)
    })).filter(edu => edu.institution || edu.degree) : [],
    projects: Array.isArray(data.projects) ? data.projects.map(proj => {
      const name = cleanString(proj.name || proj.nome);
      let description = cleanString(proj.description || (Array.isArray(proj.technologies) ? proj.technologies.join(', ') : ''));
      let bullets = cleanArray(proj.bullets || proj.achievements || proj.realizacoes);

      // Safeguard: If bullets is empty but description has text, ensure bullets gets populated
      if (bullets.length === 0 && description) {
        bullets = [description];
      }

      return {
        name,
        description,
        bullets
      };
    }).filter(proj => proj.name) : []
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
        generalDescription: exp.generalDescription,
        bullets: exp.bullets.length > 0 ? exp.bullets : (exp.generalDescription ? [exp.generalDescription] : [])
      }))
    },
    educationDetails: {
      educationTitle: titles.education,
      educations: schema.education.map(edu => ({
        organization: edu.institution,
        degree: edu.degree,
        period: edu.period,
        description: edu.description
      }))
    },
    projectDetails: {
      projectTitle: titles.projects,
      projects: schema.projects.map(proj => ({
        title: proj.name,
        link: "",
        description: proj.description,
        bullets: proj.bullets.length > 0 ? proj.bullets : (proj.description ? [proj.description] : [])
      }))
    }
  };
}

module.exports = {
  RESUME_JSON_SCHEMA,
  validateAndCleanResumeData,
  normalizeToApplicationDTO
};
