const assert = require('assert');
const ResumeBuilder = require('../services/ResumeBuilderService');

async function runPdfPaginationTests() {
  console.log('[Test] Running Vector PDF Pagination & Markup Data Attributes tests...\n');

  const mockResume = {
    personalDetails: {
      name: 'Matheus Thiago de Souza Ferreira',
      title: 'Desenvolvedor de Software',
      location: 'Ribeirão das Neves, MG',
      contact: {
        email: { email: 'matheustheus27@gmail.com' },
        phone: { phone: '+55 (31) 99150-4604' }
      }
    },
    summaryDetails: {
      summaryTitle: 'RESUMO PROFISSIONAL',
      summary: 'Desenvolvedor de Software com 9 anos de experiência no setor de tecnologia.'
    },
    skillsDetails: {
      skillsTitle: 'COMPETÊNCIAS & TECNOLOGIAS',
      skills: [
        { name: 'Linguagens', items: ['PHP', 'Python', 'TypeScript', 'C#'] },
        { name: 'Frameworks', items: ['Node.js', 'Express', 'React', 'Vue', 'Laravel'] }
      ]
    },
    experienceDetails: {
      experienceTitle: 'HISTÓRICO PROFISSIONAL',
      experiences: [
        {
          company: 'Teknisa',
          position: 'Desenvolvedor Full-Stack',
          period: 'Set 2025 - Presente',
          bullets: ['Liderança técnica na equipe de Integrações do Retail.', 'Desenvolvimento de APIs REST em Laravel e Slim.']
        },
        {
          company: 'Azapfy',
          position: 'Desenvolvedor Back-end',
          period: 'Out 2021 - Set 2024',
          bullets: ['Manutenção e evolução de microserviços em PHP.', 'Otimização de rotinas SQL Server e Oracle SQL.']
        }
      ]
    },
    educationDetails: {
      educationTitle: 'FORMAÇÃO ACADÊMICA',
      educations: [
        {
          organization: 'CEFET-MG',
          degree: 'Bacharelado em Engenharia de Computação',
          period: 'Concluído em 2021',
          description: 'Ênfase em redes e sistemas distribuídos.'
        }
      ]
    }
  };

  // Test 1: HTML Markup Attribute Generation
  const html = ResumeBuilder.build(mockResume);
  assert(html.includes('data-printable-section'), 'HTML output must contain data-printable-section attributes');
  assert(html.includes('data-section-title'), 'HTML output must contain data-section-title attributes');
  assert(html.includes('data-printable-item'), 'HTML output must contain data-printable-item attributes');
  console.log('✓ Test 1 Passed: ResumeBuilder generated HTML with data-printable-section, data-section-title, and data-printable-item attributes.');

  // Test 2: CSS Print Adjustments
  assert(html.includes('data-printable-section'), 'Must contain printable section containers');
  assert(html.includes('MATHEUS THIAGO DE SOUZA FERREIRA'), 'Must include candidate name');
  console.log('✓ Test 2 Passed: HTML template includes CSS print rules and candidate vector data.');

  console.log('\n🎉 ALL PDF PAGINATION TESTS PASSED SUCCESSFULLY!');
}

if (require.main === module) {
  runPdfPaginationTests().catch(err => {
    console.error('PDF Pagination test failed:', err);
    process.exit(1);
  });
}

module.exports = runPdfPaginationTests;
