const assert = require('assert');
const { validateAndCleanResumeData, normalizeToApplicationDTO } = require('../schemas/resumeSchema');

async function runSchemaTests() {
  console.log('[Test] Running Resume JSON Schema & DTO Normalizer tests...\n');

  const mockRawSchemaData = {
    candidate: {
      name: 'Alexandre Silva dos Santos',
      title: 'Desenvolvedor de Software Senior',
      location: 'São Paulo, SP',
      email: 'alexandre.silva@example.com',
      phone: '+55 (11) 98765-4321',
      linkedin: 'https://linkedin.com/in/alexandre-silva-dev',
      github: 'https://github.com/alexandre-silva-dev',
      x: 'https://x.com/alexandre_dev',
      instagram: 'https://instagram.com/alexandre_dev',
      facebook: 'https://facebook.com/alexandre_dev',
      portfolio: 'https://alexandre-silva.dev'
    },
    professionalSummary: '<BOLD>Desenvolvedor de Software</BOLD> com 9 anos de experiência.',
    skills: [
      { category: 'Languages', items: ['PHP', 'Python', 'TypeScript'] },
      { category: 'Frameworks & Libraries', items: ['Node.js', 'Express', 'React', 'Vue'] },
      { category: 'Databases', items: ['MongoDB', 'Oracle SQL', 'Redis'] },
      { category: 'DevOps & Cloud', items: ['Docker', 'Jenkins', 'Git'] }
    ],
    experiences: [
      {
        company: 'Empresa Alpha Tech',
        position: 'Desenvolvedor Full-Stack',
        period: '2022 - Presente',
        generalDescription: 'Atuação na equipe de integrações.',
        bullets: [
          'Desenvolvimento de <BOLD>APIs REST</BOLD> robustas.',
          'Criação de pipelines de dados assíncronos.'
        ]
      },
      {
        company: 'Empresa Beta Soft',
        position: 'Desenvolvedor Backend',
        period: '2019 - 2022',
        generalDescription: 'Manutenção de sistemas legados.',
        bullets: [
          'Otimização de rotinas SQL em bancos de grande porte.'
        ]
      }
    ],
    education: [
      {
        institution: 'Universidade de Tecnologia',
        degree: 'Bacharelado em Engenharia de Computação',
        period: 'Previsão de conclusão em 2028',
        description: 'Foco em redes e inteligência artificial'
      }
    ],
    projects: [
      {
        name: 'Nexus Cloud Engine',
        description: 'Node.js, React, Docker, TypeScript',
        bullets: [
          'Arquitetura orientada a microsserviços em containers Docker.'
        ]
      }
    ]
  };

  // Test 1: Clean and Validate Raw Schema Data
  const cleaned = validateAndCleanResumeData(mockRawSchemaData);
  assert.strictEqual(cleaned.candidate.name, 'Alexandre Silva dos Santos');
  assert.strictEqual(cleaned.candidate.x, 'https://x.com/alexandre_dev');
  assert.strictEqual(cleaned.candidate.portfolio, 'https://alexandre-silva.dev');
  assert.strictEqual(cleaned.experiences.length, 2);
  assert.strictEqual(cleaned.experiences[0].company, 'Empresa Alpha Tech');
  assert.strictEqual(cleaned.experiences[0].position, 'Desenvolvedor Full-Stack');
  assert.strictEqual(cleaned.experiences[0].period, '2022 - Presente');
  assert.strictEqual(cleaned.experiences[0].bullets.length, 2);
  assert.strictEqual(cleaned.education[0].period, 'Previsão de conclusão em 2028');
  assert.strictEqual(cleaned.education[0].description, 'Foco em redes e inteligência artificial');
  assert.strictEqual(cleaned.projects[0].description, 'Node.js, React, Docker, TypeScript');
  assert.strictEqual(cleaned.projects[0].bullets.length, 1);
  assert.strictEqual(cleaned.skills.length, 4);
  assert.strictEqual(cleaned.skills[0].category, 'Languages');
  assert.deepStrictEqual(cleaned.skills[0].items, ['PHP', 'Python', 'TypeScript']);
  console.log('✓ Test 1 Passed: Raw schema JSON cleaned and validated successfully.');

  // Test 2: Normalize to Application DTO (pt-BR default) & verify socials/networking
  const dtoPt = normalizeToApplicationDTO(mockRawSchemaData, 'pt-BR');
  assert.strictEqual(dtoPt.personalDetails.name, 'Alexandre Silva dos Santos');
  assert.strictEqual(dtoPt.personalDetails.contact.email.email, 'alexandre.silva@example.com');
  assert.strictEqual(dtoPt.personalDetails.contact.networking.linkedin.url, 'https://linkedin.com/in/alexandre-silva-dev');
  assert.strictEqual(dtoPt.personalDetails.contact.networking.github.url, 'https://github.com/alexandre-silva-dev');
  assert.strictEqual(dtoPt.personalDetails.contact.networking.x.url, 'https://x.com/alexandre_dev');
  assert.strictEqual(dtoPt.personalDetails.contact.networking.instagram.url, 'https://instagram.com/alexandre_dev');
  assert.strictEqual(dtoPt.personalDetails.contact.networking.facebook.url, 'https://facebook.com/alexandre_dev');
  assert.strictEqual(dtoPt.personalDetails.contact.networking.portfolio.url, 'https://alexandre-silva.dev');
  assert.strictEqual(dtoPt.summaryDetails.summaryTitle, 'RESUMO PROFISSIONAL');
  assert.strictEqual(dtoPt.summaryDetails.summary, '<BOLD>Desenvolvedor de Software</BOLD> com 9 anos de experiência.');
  assert.strictEqual(dtoPt.skillsDetails.skillsTitle, 'COMPETÊNCIAS & TECNOLOGIAS');
  assert.strictEqual(dtoPt.experienceDetails.experienceTitle, 'HISTÓRICO PROFISSIONAL');
  assert.strictEqual(dtoPt.educationDetails.educationTitle, 'FORMAÇÃO ACADÊMICA');
  assert.strictEqual(dtoPt.educationDetails.educations[0].period, 'Previsão de conclusão em 2028');
  assert.strictEqual(dtoPt.educationDetails.educations[0].description, 'Foco em redes e inteligência artificial');
  assert.strictEqual(dtoPt.projectDetails.projectTitle, 'PROJETOS DE DESTAQUE');
  assert.strictEqual(dtoPt.projectDetails.projects[0].description, 'Node.js, React, Docker, TypeScript');
  assert.strictEqual(dtoPt.projectDetails.projects[0].bullets[0], 'Arquitetura orientada a microsserviços em containers Docker.');
  assert.strictEqual(dtoPt.experienceDetails.experiences.length, 2);
  assert.strictEqual(dtoPt.skillsDetails.skills.length, 4);

  // Test 3: Normalize to Application DTO (en-US)
  const dtoEn = normalizeToApplicationDTO(mockRawSchemaData, 'en-US');
  assert.strictEqual(dtoEn.summaryDetails.summaryTitle, 'PROFESSIONAL SUMMARY');
  assert.strictEqual(dtoEn.skillsDetails.skillsTitle, 'SKILLS & TECHNOLOGIES');
  assert.strictEqual(dtoEn.experienceDetails.experienceTitle, 'PROFESSIONAL EXPERIENCE');
  assert.strictEqual(dtoEn.educationDetails.educationTitle, 'EDUCATION');
  assert.strictEqual(dtoEn.projectDetails.projectTitle, 'FEATURED PROJECTS');

  console.log('✓ Test 2 & 3 Passed: Schema successfully normalized to Application DTO with localized section titles.');

  // Test 4: Backward compatibility with legacy field names (achievements, statusOrPeriod, details, etc.)
  const legacyData = {
    experiences: [{ company: 'Old Corp', position: 'Dev', achievements: ['Built things'] }],
    education: [{ instituicao: 'Old Uni', grau: 'Engenharia', statusOrPeriod: '2020', detalhes: 'Curriculum' }],
    projects: [{ nome: 'Legacy App', technologies: ['Java', 'Spring'], achievements: ['Launched app'] }]
  };
  const legacyCleaned = validateAndCleanResumeData(legacyData);
  assert.strictEqual(legacyCleaned.experiences[0].bullets[0], 'Built things');
  assert.strictEqual(legacyCleaned.education[0].institution, 'Old Uni');
  assert.strictEqual(legacyCleaned.education[0].period, '2020');
  assert.strictEqual(legacyCleaned.education[0].description, 'Curriculum');
  assert.strictEqual(legacyCleaned.projects[0].description, 'Java, Spring');
  assert.strictEqual(legacyCleaned.projects[0].bullets[0], 'Launched app');
  console.log('✓ Test 4 Passed: Backward compatibility with legacy schema fields preserved.');

  console.log('\n🎉 ALL SCHEMA TESTS PASSED SUCCESSFULLY!');
}

if (require.main === module) {
  runSchemaTests().catch(err => {
    console.error('Schema test failed:', err);
    process.exit(1);
  });
}

module.exports = runSchemaTests;
