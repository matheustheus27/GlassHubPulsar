const assert = require('assert');
const translationWorker = require('../workers/translationWorker');

console.log('\n=== RUNNING TRANSLATION WORKER & MULTILINGUAL AI TESTS ===\n');

async function runTranslationTests() {
  const mockDocData = {
    personalDetails: {
      name: 'Alexandre Silveira',
      title: 'Desenvolvedor de Software',
      location: { location: 'São Paulo, SP' }
    },
    summaryDetails: {
      summaryTitle: 'Resumo Profissional',
      summary: 'Desenvolvedor de Software com 9 anos de experiência em microsserviços, mensageria e bancos de dados.'
    },
    skillsDetails: {
      skillsTitle: 'Competências & Tecnologias',
      skills: [
        { category: 'Linguagens', items: ['PHP', 'Python', 'TypeScript'] },
        { category: 'Bancos de Dados', items: ['PostgreSQL', 'MongoDB', 'Redis'] }
      ]
    },
    experienceDetails: {
      experienceTitle: 'Histórico Profissional',
      experiences: [
        {
          company: 'Empresa Alpha',
          role: 'Desenvolvedor Full-Stack',
          period: 'Set 2023 - Presente',
          bullets: ['Desenvolvimento de integrações em microsserviços com alta concorrência.']
        }
      ]
    },
    educationDetails: {
      educations: [
        {
          institution: 'Universidade de Tecnologia',
          degree: 'Engenharia de Computação',
          period: '2018 - 2022',
          description: 'Foco em arquitetura de software e sistemas distribuídos.'
        }
      ]
    },
    projectDetails: {
      projects: [
        {
          title: 'GlassHub Pulsar',
          role: 'Arquiteto de Software',
          bullets: ['Plataforma de alta performance com processamento assíncrono.']
        }
      ]
    },
    coverLetterDetails: {
      greeting: 'Prezada Equipe de Recrutamento,',
      text: [
        'Apresento minha candidatura à vaga de Engenheiro de Software Sênior.',
        'Tenho ampla experiência com sistemas distribuídos e microsserviços.'
      ],
      valediction: 'Atenciosamente,',
      signature: 'Alexandre Silveira'
    }
  };

  // Mock progress emission
  const progressEvents = [];
  translationWorker.setSSEEmitter((event) => {
    progressEvents.push(event);
  });

  const job = {
    id: 'test_job_trans_101',
    data: {
      document: mockDocData,
      targetLang: 'en-US',
      userId: 'test_user_777'
    },
    updateProgress: async (p) => {}
  };

  const result = await translationWorker.processJob(job);

  assert(result && result.success, 'Translation job must return success');
  assert.strictEqual(result.targetLang, 'en-US', 'Target language must be en-US');

  const translated = result.document;
  console.log('Translated Output:');
  console.log('  Title:', translated.personalDetails.title);
  console.log('  Summary:', translated.summaryDetails.summary);
  console.log('  Experience Role:', translated.experienceDetails.experiences[0].role);
  console.log('  Experience Period:', translated.experienceDetails.experiences[0].period);
  console.log('  Skills Category:', translated.skillsDetails.skills[0].category);

  assert(translated.personalDetails.title.toLowerCase().includes('software'), 'Title must be translated');
  assert(translated.summaryDetails.summary.toLowerCase().includes('developer') || translated.summaryDetails.summary.toLowerCase().includes('microservices'), 'Summary must be translated');
  assert(translated.skillsDetails.skills[0].category.toLowerCase().includes('languages'), 'Skills category must be translated');
  assert(translated.experienceDetails.experiences[0].period.toLowerCase().includes('sep') || translated.experienceDetails.experiences[0].period.toLowerCase().includes('present'), 'Period must be translated');

  console.log('  Cover Letter Greeting:', translated.coverLetterDetails?.greeting);
  console.log('  Cover Letter Text (Paragraph 1):', translated.coverLetterDetails?.text?.[0]);
  console.log('  Cover Letter Valediction:', translated.coverLetterDetails?.valediction);

  assert(translated.coverLetterDetails, 'Cover letter details must be present in translated document');
  assert(translated.coverLetterDetails.greeting.toLowerCase().includes('dear') || translated.coverLetterDetails.greeting.toLowerCase().includes('team') || translated.coverLetterDetails.greeting.toLowerCase().includes('committee'), 'Cover letter greeting must be translated');
  assert(translated.coverLetterDetails.valediction.toLowerCase().includes('sincerely') || translated.coverLetterDetails.valediction.toLowerCase().includes('regards'), 'Cover letter valediction must be translated');

  console.log(`\nProgress Events Emitted: ${progressEvents.length}`);
  assert(progressEvents.some(e => e.progress === 10), 'Must emit 10% progress');
  assert(progressEvents.some(e => e.progress === 100), 'Must emit 100% progress');

  console.log('✅ Translation Worker executed and emitted all SSE stages successfully!\n');
  console.log('🎉 ALL TRANSLATION TESTS PASSED 100% PERFECTLY!\n');
}

if (require.main === module) {
  runTranslationTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });
}

module.exports = runTranslationTests;
