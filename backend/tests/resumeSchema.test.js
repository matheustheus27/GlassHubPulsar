const assert = require('assert');
const { validateAndCleanResumeData, normalizeToApplicationDTO } = require('../schemas/resumeSchema');

async function runSchemaTests() {
  console.log('[Test] Running Resume JSON Schema & DTO Normalizer tests...\n');

  const mockRawSchemaData = {
    candidato: {
      nome: 'Matheus Thiago de Souza Ferreira',
      titulo: 'Desenvolvedor de Software',
      localizacao: 'Ribeirão das Neves, MG',
      email: 'matheustheus27@gmail.com',
      telefone: '+55 (31) 99150-4604',
      linkedin: 'https://linkedin.com/in/matheustheus27',
      github: 'https://github.com/matheustheus27'
    },
    resumoProfissional: 'Desenvolvedor de Software com 9 anos de experiência.',
    competencias: {
      linguagens: ['PHP', 'Python', 'TypeScript'],
      frameworksBibliotecas: ['Node.js', 'Express', 'React', 'Vue'],
      bancosDeDados: ['MongoDB', 'Oracle SQL', 'Redis'],
      devops: ['Docker', 'Jenkins', 'Git'],
      protocolosComunicacao: ['APIs REST', 'Webhooks'],
      metodologiasConceitos: ['Microsserviços', 'Arquitetura de Eventos']
    },
    experiencias: [
      {
        empresa: 'Empresa A',
        cargo: 'Desenvolvedor Full-Stack',
        periodo: '2022 - Presente',
        descricaoGeral: 'Atuação na equipe de integrações.',
        realizacoes: [
          'Desenvolvimento de APIs REST robustas.',
          'Criação de pipelines de dados assíncronos.'
        ]
      },
      {
        empresa: 'Empresa B',
        cargo: 'Desenvolvedor Backend',
        periodo: '2019 - 2022',
        descricaoGeral: 'Manutenção de sistemas legados.',
        realizacoes: [
          'Otimização de rotinas SQL em bancos de grande porte.'
        ]
      }
    ],
    formacaoAcademica: [
      {
        instituicao: 'CEFET-MG',
        grau: 'Bacharelado',
        curso: 'Engenharia de Computação',
        statusOuPeriodo: 'Concluído em 2021',
        detalhes: 'Foco em redes e inteligência artificial'
      }
    ],
    projetos: [
      {
        nome: 'GlassHub Pulsar',
        tecnologias: ['Node.js', 'React', 'Docker'],
        descricao: 'Gerador e renderizador de currículos dinâmicos com IA.',
        realizacoes: [
          'Arquitetura orientada a microsserviços em containers Docker.'
        ]
      }
    ]
  };

  // Test 1: Clean and Validate Raw Schema Data
  const cleaned = validateAndCleanResumeData(mockRawSchemaData);
  assert.strictEqual(cleaned.candidato.nome, 'Matheus Thiago de Souza Ferreira');
  assert.strictEqual(cleaned.experiencias.length, 2);
  assert.strictEqual(cleaned.experiencias[0].empresa, 'Empresa A');
  assert.strictEqual(cleaned.experiencias[0].cargo, 'Desenvolvedor Full-Stack');
  assert.strictEqual(cleaned.experiencias[0].periodo, '2022 - Presente');
  assert.strictEqual(cleaned.competencias.linguagens.length, 3);
  console.log('✓ Test 1 Passed: Raw schema JSON cleaned and validated successfully.');

  // Test 2: Normalize to Application DTO
  const dto = normalizeToApplicationDTO(mockRawSchemaData);
  assert.strictEqual(dto.personalDetails.name, 'Matheus Thiago de Souza Ferreira');
  assert.strictEqual(dto.personalDetails.contact.email.email, 'matheustheus27@gmail.com');
  assert.strictEqual(dto.summaryDetails.summary, 'Desenvolvedor de Software com 9 anos de experiência.');
  
  // Verify experience fields are strictly decoupled
  assert.strictEqual(dto.experienceDetails.experiences.length, 2);
  assert.strictEqual(dto.experienceDetails.experiences[0].company, 'Empresa A');
  assert.strictEqual(dto.experienceDetails.experiences[0].position, 'Desenvolvedor Full-Stack');
  assert.strictEqual(dto.experienceDetails.experiences[0].period, '2022 - Presente');
  assert.strictEqual(dto.experienceDetails.experiences[0].bullets.length, 2);

  // Verify skills categories
  assert(dto.skillsDetails.skills.length >= 4, 'Skills must be split into categories');
  assert.strictEqual(dto.skillsDetails.skills[0].name, 'Linguagens');
  assert.deepStrictEqual(dto.skillsDetails.skills[0].items, ['PHP', 'Python', 'TypeScript']);

  console.log('✓ Test 2 Passed: Schema successfully normalized to Application DTO with decoupled fields.');

  console.log('\n🎉 ALL SCHEMA TESTS PASSED SUCCESSFULLY!');
}

if (require.main === module) {
  runSchemaTests().catch(err => {
    console.error('Schema test failed:', err);
    process.exit(1);
  });
}

module.exports = runSchemaTests;
