const assert = require('assert');
const { validateAndCleanResumeData, normalizeToApplicationDTO } = require('../schemas/resumeSchema');

async function runSchemaTests() {
  console.log('[Test] Running Resume JSON Schema & DTO Normalizer tests...\n');

  const mockRawSchemaData = {
    candidate: {
      name: 'Matheus Thiago de Souza Ferreira',
      title: 'Desenvolvedor de Software',
      location: 'Ribeirão das Neves, MG',
      email: 'matheustheus27@gmail.com',
      phone: '+55 (31) 99150-4604',
      linkedin: 'https://linkedin.com/in/matheustheus27',
      github: 'https://github.com/matheustheus27'
    },
    professionalSummary: 'Desenvolvedor de Software com 9 anos de experiência.',
    skills: [
      { category: 'Languages', items: ['PHP', 'Python', 'TypeScript'] },
      { category: 'Frameworks & Libraries', items: ['Node.js', 'Express', 'React', 'Vue'] },
      { category: 'Databases', items: ['MongoDB', 'Oracle SQL', 'Redis'] },
      { category: 'DevOps & Cloud', items: ['Docker', 'Jenkins', 'Git'] }
    ],
    experiences: [
      {
        company: 'Empresa A',
        position: 'Desenvolvedor Full-Stack',
        period: '2022 - Presente',
        generalDescription: 'Atuação na equipe de integrações.',
        achievements: [
          'Desenvolvimento de APIs REST robustas.',
          'Criação de pipelines de dados assíncronos.'
        ]
      },
      {
        company: 'Empresa B',
        position: 'Desenvolvedor Backend',
        period: '2019 - 2022',
        generalDescription: 'Manutenção de sistemas legados.',
        achievements: [
          'Otimização de rotinas SQL em bancos de grande porte.'
        ]
      }
    ],
    education: [
      {
        institution: 'CEFET-MG',
        degree: 'Bacharelado',
        fieldOfStudy: 'Engenharia de Computação',
        statusOrPeriod: 'Concluído em 2021',
        details: 'Foco em redes e inteligência artificial'
      }
    ],
    projects: [
      {
        name: 'GlassHub Pulsar',
        technologies: ['Node.js', 'React', 'Docker'],
        description: 'Gerador e renderizador de currículos dinâmicos com IA.',
        achievements: [
          'Arquitetura orientada a microsserviços em containers Docker.'
        ]
      }
    ]
  };

  // Test 1: Clean and Validate Raw Schema Data
  const cleaned = validateAndCleanResumeData(mockRawSchemaData);
  assert.strictEqual(cleaned.candidate.name, 'Matheus Thiago de Souza Ferreira');
  assert.strictEqual(cleaned.experiences.length, 2);
  assert.strictEqual(cleaned.experiences[0].company, 'Empresa A');
  assert.strictEqual(cleaned.experiences[0].position, 'Desenvolvedor Full-Stack');
  assert.strictEqual(cleaned.experiences[0].period, '2022 - Presente');
  assert.strictEqual(cleaned.skills.length, 4);
  assert.strictEqual(cleaned.skills[0].category, 'Languages');
  assert.deepStrictEqual(cleaned.skills[0].items, ['PHP', 'Python', 'TypeScript']);
  console.log('✓ Test 1 Passed: Raw schema JSON cleaned and validated successfully.');

  // Test 2: Normalize to Application DTO (pt-BR default)
  const dtoPt = normalizeToApplicationDTO(mockRawSchemaData, 'pt-BR');
  assert.strictEqual(dtoPt.personalDetails.name, 'Matheus Thiago de Souza Ferreira');
  assert.strictEqual(dtoPt.personalDetails.contact.email.email, 'matheustheus27@gmail.com');
  assert.strictEqual(dtoPt.summaryDetails.summaryTitle, 'RESUMO PROFISSIONAL');
  assert.strictEqual(dtoPt.skillsDetails.skillsTitle, 'COMPETÊNCIAS & TECNOLOGIAS');
  assert.strictEqual(dtoPt.experienceDetails.experienceTitle, 'HISTÓRICO PROFISSIONAL');
  assert.strictEqual(dtoPt.educationDetails.educationTitle, 'FORMAÇÃO ACADÊMICA');
  assert.strictEqual(dtoPt.projectDetails.projectTitle, 'PROJETOS DE DESTAQUE');
  assert.strictEqual(dtoPt.experienceDetails.experiences.length, 2);
  assert.strictEqual(dtoPt.skillsDetails.skills.length, 4);

  // Test 3: Normalize to Application DTO (en-US)
  const dtoEn = normalizeToApplicationDTO(mockRawSchemaData, 'en-US');
  assert.strictEqual(dtoEn.summaryDetails.summaryTitle, 'PROFESSIONAL SUMMARY');
  assert.strictEqual(dtoEn.skillsDetails.skillsTitle, 'SKILLS & TECHNOLOGIES');
  assert.strictEqual(dtoEn.experienceDetails.experienceTitle, 'PROFESSIONAL EXPERIENCE');
  assert.strictEqual(dtoEn.educationDetails.educationTitle, 'EDUCATION');
  assert.strictEqual(dtoEn.projectDetails.projectTitle, 'FEATURED PROJECTS');

  console.log('✓ Test 2 Passed: Schema successfully normalized to Application DTO with localized section titles.');

  console.log('\n🎉 ALL SCHEMA TESTS PASSED SUCCESSFULLY!');
}

if (require.main === module) {
  runSchemaTests().catch(err => {
    console.error('Schema test failed:', err);
    process.exit(1);
  });
}

module.exports = runSchemaTests;
