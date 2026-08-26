/**
 * Resume JSON Schema & DTO Normalization Module
 * Defines exact schema for Ollama format enforcement and normalizes to application state DTO.
 */

const RESUME_JSON_SCHEMA = {
  type: "object",
  properties: {
    candidato: {
      type: "object",
      properties: {
        nome: { type: "string" },
        titulo: { type: "string" },
        localizacao: { type: "string" },
        email: { type: "string" },
        telefone: { type: "string" },
        linkedin: { type: "string" },
        github: { type: "string" }
      },
      required: ["nome", "titulo"]
    },
    resumoProfissional: { type: "string" },
    competencias: {
      type: "object",
      properties: {
        linguagens: { type: "array", items: { type: "string" } },
        frameworksBibliotecas: { type: "array", items: { type: "string" } },
        bancosDeDados: { type: "array", items: { type: "string" } },
        devops: { type: "array", items: { type: "string" } },
        protocolosComunicacao: { type: "array", items: { type: "string" } },
        metodologiasConceitos: { type: "array", items: { type: "string" } }
      }
    },
    experiencias: {
      type: "array",
      items: {
        type: "object",
        properties: {
          empresa: { type: "string" },
          cargo: { type: "string" },
          periodo: { type: "string" },
          descricaoGeral: { type: "string" },
          realizacoes: { type: "array", items: { type: "string" } }
        },
        required: ["empresa", "cargo", "periodo", "realizacoes"]
      }
    },
    formacaoAcademica: {
      type: "array",
      items: {
        type: "object",
        properties: {
          instituicao: { type: "string" },
          grau: { type: "string" },
          curso: { type: "string" },
          statusOuPeriodo: { type: "string" },
          detalhes: { type: "string" }
        },
        required: ["instituicao", "grau", "statusOuPeriodo"]
      }
    },
    projetos: {
      type: "array",
      items: {
        type: "object",
        properties: {
          nome: { type: "string" },
          tecnologias: { type: "array", items: { type: "string" } },
          descricao: { type: "string" },
          realizacoes: { type: "array", items: { type: "string" } }
        },
        required: ["nome", "descricao"]
      }
    }
  },
  required: ["candidato", "resumoProfissional", "competencias", "experiencias", "formacaoAcademica", "projetos"]
};

/**
 * Validates, cleans and ensures safe defaults for extracted resume data
 */
function validateAndCleanResumeData(rawJson) {
  const data = typeof rawJson === 'object' && rawJson !== null ? rawJson : {};

  const candidato = data.candidato || {};
  const competencias = data.competencias || {};

  const cleanString = (str) => typeof str === 'string' ? str.trim() : '';
  const cleanArray = (arr) => Array.isArray(arr) ? arr.map(cleanString).filter(Boolean) : [];

  const cleaned = {
    candidato: {
      nome: cleanString(candidato.nome),
      titulo: cleanString(candidato.titulo),
      localizacao: cleanString(candidato.localizacao),
      email: cleanString(candidato.email),
      telefone: cleanString(candidato.telefone),
      linkedin: cleanString(candidato.linkedin),
      github: cleanString(candidato.github)
    },
    resumoProfissional: cleanString(data.resumoProfissional),
    competencias: {
      linguagens: cleanArray(competencias.linguagens),
      frameworksBibliotecas: cleanArray(competencias.frameworksBibliotecas),
      bancosDeDados: cleanArray(competencias.bancosDeDados),
      devops: cleanArray(competencias.devops),
      protocolosComunicacao: cleanArray(competencias.protocolosComunicacao),
      metodologiasConceitos: cleanArray(competencias.metodologiasConceitos)
    },
    experiencias: Array.isArray(data.experiencias) ? data.experiencias.map(exp => ({
      empresa: cleanString(exp.empresa),
      cargo: cleanString(exp.cargo),
      periodo: cleanString(exp.periodo),
      descricaoGeral: cleanString(exp.descricaoGeral),
      realizacoes: cleanArray(exp.realizacoes)
    })).filter(exp => exp.empresa || exp.cargo) : [],
    formacaoAcademica: Array.isArray(data.formacaoAcademica) ? data.formacaoAcademica.map(edu => ({
      instituicao: cleanString(edu.instituicao),
      grau: cleanString(edu.grau),
      curso: cleanString(edu.curso),
      statusOuPeriodo: cleanString(edu.statusOuPeriodo),
      detalhes: cleanString(edu.detalhes)
    })).filter(edu => edu.instituicao || edu.grau || edu.curso) : [],
    projetos: Array.isArray(data.projetos) ? data.projetos.map(proj => ({
      nome: cleanString(proj.nome),
      tecnologias: cleanArray(proj.tecnologias),
      descricao: cleanString(proj.descricao),
      realizacoes: cleanArray(proj.realizacoes)
    })).filter(proj => proj.nome) : []
  };

  return cleaned;
}

/**
 * Normalizes cleaned schema data into application frontend DTO state
 */
function normalizeToApplicationDTO(structuredSchema) {
  const schema = validateAndCleanResumeData(structuredSchema);
  const cand = schema.candidato;

  // Build skills category list
  const skillsList = [];

  if (schema.competencias.linguagens.length > 0) {
    skillsList.push({ name: "Linguagens", items: schema.competencias.linguagens });
  }
  if (schema.competencias.frameworksBibliotecas.length > 0) {
    skillsList.push({ name: "Frameworks & Bibliotecas", items: schema.competencias.frameworksBibliotecas });
  }
  if (schema.competencias.bancosDeDados.length > 0) {
    skillsList.push({ name: "Bancos de Dados", items: schema.competencias.bancosDeDados });
  }
  if (schema.competencias.devops.length > 0) {
    skillsList.push({ name: "DevOps & Cloud", items: schema.competencias.devops });
  }
  if (schema.competencias.protocolosComunicacao.length > 0) {
    skillsList.push({ name: "Protocolos & Comunicação", items: schema.competencias.protocolosComunicacao });
  }
  if (schema.competencias.metodologiasConceitos.length > 0) {
    skillsList.push({ name: "Metodologias & Conceitos", items: schema.competencias.metodologiasConceitos });
  }

  return {
    rawSchema: schema,
    personalDetails: {
      name: cand.nome,
      title: cand.titulo,
      location: {
        location: cand.localizacao,
        link: "",
        icon: "📍"
      },
      contact: {
        email: { email: cand.email, icon: "✉️" },
        phone: { phone: cand.telefone, link: "", icon: "📞" },
        networking: {
          linkedin: { name: "LinkedIn", url: cand.linkedin, icon: "💼" },
          github: { name: "GitHub", url: cand.github, icon: "🐙" }
        }
      }
    },
    summaryDetails: {
      summaryTitle: "RESUMO PROFISSIONAL",
      summary: schema.resumoProfissional
    },
    skillsDetails: {
      skillsTitle: "COMPETÊNCIAS & TECNOLOGIAS",
      skills: skillsList
    },
    experienceDetails: {
      experienceTitle: "HISTÓRICO PROFISSIONAL",
      experiences: schema.experiencias.map(exp => ({
        company: exp.empresa,
        position: exp.cargo,
        period: exp.periodo,
        bullets: exp.realizacoes.length > 0 ? exp.realizacoes : (exp.descricaoGeral ? [exp.descricaoGeral] : [])
      }))
    },
    educationDetails: {
      educationTitle: "FORMAÇÃO ACADÊMICA",
      educations: schema.formacaoAcademica.map(edu => ({
        organization: edu.instituicao,
        degree: [edu.grau, edu.curso].filter(Boolean).join(" - "),
        period: edu.statusOuPeriodo,
        description: edu.detalhes
      }))
    },
    projectDetails: {
      projectTitle: "PROJETOS DE DESTAQUE",
      projects: schema.projetos.map(proj => ({
        title: proj.nome,
        link: "",
        description: proj.descricao || (proj.tecnologias.length > 0 ? `Tecnologias: ${proj.tecnologias.join(', ')}` : ''),
        bullets: proj.realizacoes
      }))
    }
  };
}

module.exports = {
  RESUME_JSON_SCHEMA,
  validateAndCleanResumeData,
  normalizeToApplicationDTO
};
