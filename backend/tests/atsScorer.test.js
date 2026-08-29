const assert = require('assert');
const analyticsWorker = require('../workers/analyticsWorker');

console.log('\n=== RUNNING ATS SCORER & ANALYTICS WORKER TESTS ===\n');

// ---------------------------------------------------------
// TEST 1: ResumeDTO Payload Format (as sent by frontend export & ATS modal)
// ---------------------------------------------------------
console.log('--- TEST 1: ATS Evaluation with ResumeDTO Payload Format ---');
const resumeDtoFormat = {
  personal: {
    title: 'ALEXANDRE DA SILVA SANTOS',
    personal: {
      name: 'ALEXANDRE DA SILVA SANTOS',
      title: 'DESENVOLVEDOR DE SOFTWARE',
      location: { title: 'São Paulo, SP' },
      contact: []
    }
  },
  summary: {
    title: 'RESUMO PROFISSIONAL',
    summary: 'Desenvolvedor de Software com 9 anos de experiência em microsserviços, Docker, APIs REST, mensageria e bancos de dados.'
  },
  skills: {
    title: 'COMPETÊNCIAS & TECNOLOGIAS',
    skills: [
      { title: 'Linguagens', items: ['PHP', 'Python', 'JavaScript', 'TypeScript'] },
      { title: 'Frameworks', items: ['Node.js', 'Express', 'Laravel'] },
      { title: 'Bancos de Dados', items: ['PostgreSQL', 'MongoDB', 'Redis'] }
    ]
  },
  experiences: {
    title: 'HISTÓRICO PROFISSIONAL',
    experiences: [
      {
        company: 'Teknisa',
        role: 'Desenvolvedor Full-Stack',
        period: 'Set 2025 - Presente',
        bullets: ['Desenvolvimento de integrações e APIs REST em microsserviços de alto volume, reduzindo latência em 35%.']
      },
      {
        company: 'Azapfy',
        role: 'Desenvolvedor Back-end',
        period: 'Out 2021 - Set 2024',
        bullets: ['Manutenção de pipelines assíncronos e processamento de mais de 500k eventos/dia com MongoDB e Redis.']
      }
    ]
  },
  projects: {
    title: 'PROJETOS DE DESTAQUE',
    projects: [
      {
        title: 'GlassHub Nebula',
        role: 'Motor Gráfico C++20',
        bullets: ['Arquitetura desacoplada com renderização de alta taxa de quadros.']
      }
    ]
  }
};

const norm = analyticsWorker.normalizeCandidateDoc(resumeDtoFormat);
console.log('Normalized candidate extraction:');
console.log('  Name:', norm.name);
console.log('  Professional Title:', norm.title);
console.log('  Summary Length:', norm.summary.length);
console.log('  Experiences Count:', norm.experiences.length);
console.log('  Skills Categories:', norm.skills.length);

assert.strictEqual(norm.name, 'ALEXANDRE DA SILVA SANTOS', 'Candidate name must be extracted correctly');
assert.strictEqual(norm.title, 'DESENVOLVEDOR DE SOFTWARE', 'Candidate title must be DESENVOLVEDOR DE SOFTWARE, NOT the candidate name');
assert(norm.summary.length > 50, 'Summary must be present');

const result1 = analyticsWorker.calculateHeuristicScore(resumeDtoFormat, 'pt-BR');

console.log('\nATS Score Result:');
console.log('  Overall Score:', result1.overallScore);
console.log('  Summary:', result1.summary);
console.log('  Recommendations:', result1.actionableRecommendations);

assert(result1.overallScore >= 80, `Score should be >= 80 for complete senior profile (got ${result1.overallScore})`);
assert(!result1.summary.includes('Adicione resumo profissional'), 'Should NOT report "Adicione resumo profissional" when summary is present');
assert(!JSON.stringify(result1).includes("Garanta que o título 'alexandre da silva"), 'Should NOT confuse candidate name with professional title');
assert(JSON.stringify(result1).includes("DESENVOLVEDOR DE SOFTWARE") || JSON.stringify(result1).includes("desenvolvedor"), 'Must reflect real professional title');

console.log('✅ Test 1 Passed: ResumeDTO format correctly extracts professional title and scores profile accurately.\n');

// ---------------------------------------------------------
// TEST 2: Direct DocumentData Format (raw storage schema)
// ---------------------------------------------------------
console.log('--- TEST 2: Direct DocumentData Format ---');
const docDataFormat = {
  personalDetails: {
    name: 'Carolina Mendes',
    title: 'Product Designer'
  },
  summaryDetails: {
    summary: 'Product Designer especializada em Design Systems e testes de usabilidade.'
  },
  skillsDetails: {
    skills: [
      { name: 'UI/UX', items: ['Figma', 'Design Systems', 'Wireframing'] }
    ]
  },
  experienceDetails: {
    experiences: [
      {
        company: 'Studio Digital',
        role: 'Product Designer Jr',
        bullets: ['Desenvolvimento de componentes com aumento de 20% na consistência.']
      }
    ]
  }
};

const norm2 = analyticsWorker.normalizeCandidateDoc(docDataFormat);
assert.strictEqual(norm2.name, 'Carolina Mendes');
assert.strictEqual(norm2.title, 'Product Designer');
assert(norm2.summary.length > 20);

const result2 = analyticsWorker.calculateHeuristicScore(docDataFormat, 'pt-BR');
assert(result2.overallScore >= 70, 'Score should be >= 70');
assert(!result2.summary.includes('Adicione resumo profissional'), 'Should NOT report missing summary');

console.log('✅ Test 2 Passed: Direct document schema format evaluated accurately.\n');

console.log('🎉 ALL ATS SCORER & NORMALIZATION TESTS PASSED 100% PERFECTLY!\n');
