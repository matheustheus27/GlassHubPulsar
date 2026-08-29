/**
 * End-to-End Test for PDF Worker, Textual/Vector PDF Generation & ATS Compatibility
 */
const assert = require('assert');
const pdfParse = require('pdf-parse');
const pdfWorker = require('../workers/pdfWorker');

async function runPdfWorkerE2ETests() {
  console.log('[Test] Running PDF Worker E2E & Textual ATS Compliance Test...\n');

  const mockResumeData = {
    personalDetails: {
      name: 'MATHEUS THIAGO DE SOUZA FERREIRA',
      title: 'DESENVOLVEDOR DE SOFTWARE',
      location: 'Belo Horizonte, MG',
      contact: {
        email: { email: 'matheus.ferreira@example.com' },
        phone: { phone: '+55 (31) 99999-8888' },
        networking: {
          linkedin: { name: 'LinkedIn', url: 'https://linkedin.com/in/matheustheus27' },
          github: { name: 'GitHub', url: 'https://github.com/matheustheus27' }
        }
      }
    },
    summaryDetails: {
      summaryTitle: 'RESUMO PROFISSIONAL',
      summary: '<BOLD>Desenvolvedor de Software</BOLD> com sólida experiência em arquitetura back-end e sistemas distribuídos.'
    },
    skillsDetails: {
      skillsTitle: 'COMPETÊNCIAS & TECNOLOGIAS',
      skills: [
        { name: 'Linguagens & Frameworks', items: ['PHP', 'TypeScript', 'Node.js', 'Python'] },
        { name: 'Bancos de Dados & Filas', items: ['MongoDB', 'PostgreSQL', 'Redis', 'RabbitMQ'] }
      ]
    },
    experienceDetails: {
      experienceTitle: 'HISTÓRICO PROFISSIONAL',
      experiences: [
        {
          company: 'Teknisa',
          position: 'Desenvolvedor Full-Stack',
          period: 'Set 2025 - Presente',
          bullets: [
            'Integrante da equipe de Integrações do Retail.',
            'Desenvolvimento de microserviços em PHP e integração de APIs REST.'
          ]
        },
        {
          company: 'Azapfy',
          position: 'Desenvolvedor Back-end',
          period: '2023 - 2025',
          bullets: [
            'Otimização de rotinas de mensageria com MongoDB e PostgreSQL.',
            'Criação de pipelines assíncronos de alta performance.'
          ]
        }
      ]
    },
    educationDetails: {
      educationTitle: 'FORMAÇÃO ACADÊMICA',
      educations: [
        {
          organization: 'CEFET-MG',
          degree: 'Engenharia de Computação',
          period: '2019 - 2024',
          description: 'Projeto de graduação focado em sistemas inteligentes.'
        }
      ]
    },
    projectDetails: {
      projectTitle: 'PROJETOS',
      projects: [
        {
          title: 'GlassHub Nebula',
          role: 'Arquiteto de Software',
          link: 'https://github.com/matheustheus27/GlassHubNebula',
          bullets: [
            'Plataforma completa de gestão com arquitetura orientada a microsserviços.'
          ]
        }
      ]
    }
  };

  const jobId = `test_e2e_${Date.now()}`;

  // Test 1: Process job with direct payload format (MessageBroker style)
  console.log('--- Test 1: PDFWorker.processJob with MessageBroker payload ---');
  const result = await pdfWorker.processJob({
    jobId,
    type: 'resume',
    document: mockResumeData,
    candidateName: 'MATHEUS THIAGO DE SOUZA FERREIRA',
    fileName: 'MATHEUS_FERREIRA-pt-BR.pdf',
    language: 'pt-BR'
  });

  assert(result, 'Job must return a result object');
  assert.strictEqual(result.success, true, 'Job must succeed');
  assert(result.pdfSize > 1000, `PDF size must be substantial (got ${result.pdfSize} bytes)`);
  assert(result.downloadUrl, 'Download URL must be provided');
  console.log(`✓ Test 1 Passed: PDF generated successfully (${result.pdfSize} bytes in ${result.durationMs}ms)`);

  // Test 2: In-memory cache retrieval
  console.log('\n--- Test 2: In-Memory Cache (pdfStore) Retrieval ---');
  const storedEntry = pdfWorker.getPdf(jobId);
  assert(storedEntry, 'Stored PDF entry must exist in cache');
  assert(Buffer.isBuffer(storedEntry.buffer), 'Stored item must be a Buffer');
  assert.strictEqual(storedEntry.fileName, result.fileName);
  console.log(`✓ Test 2 Passed: PDF retrieved from cache successfully (${storedEntry.fileName}).`);

  // Test 3: Extract and validate text from PDF (ATS validation)
  console.log('\n--- Test 3: PDF Text Extraction & ATS Searchability Verification ---');
  const parsedPdf = await pdfParse(storedEntry.buffer);
  const pdfText = parsedPdf.text;

  console.log(`Extracted text length: ${pdfText.length} characters.`);
  console.log(`Number of pages: ${parsedPdf.numpages}`);
  console.log('Preview of extracted text (first 300 chars):');
  console.log(pdfText.slice(0, 300));
  console.log('--------------------------------------------------');

  const requiredKeywords = [
    'MATHEUS',
    'TEKNISA',
    'AZAPFY',
    'PHP',
    'MONGODB',
    'CEFET-MG',
    'GLASSHUB'
  ];

  const upperText = pdfText.toUpperCase();
  for (const kw of requiredKeywords) {
    assert(
      upperText.includes(kw),
      `ATS Requirement Failed: PDF text must contain "${kw}". Text snippet: ${upperText.slice(0, 500)}`
    );
    console.log(`✓ Found keyword "${kw}" in PDF text.`);
  }

  // Test 4: BullMQ Job Format Compatibility ({ id, data: { ... } })
  console.log('\n--- Test 4: BullMQ Job Envelope Compatibility ---');
  const bullJobId = `test_bull_${Date.now()}`;
  const bullResult = await pdfWorker.processJob({
    id: bullJobId,
    data: {
      jobId: bullJobId,
      type: 'resume',
      document: mockResumeData,
      candidateName: 'MATHEUS THIAGO DE SOUZA FERREIRA',
      fileName: 'MATHEUS_FERREIRA-pt-BR.pdf',
      language: 'pt-BR'
    }
  });

  assert.strictEqual(bullResult.success, true, 'BullMQ format job must succeed');
  const bullStored = pdfWorker.getPdf(bullJobId);
  assert(bullStored && bullStored.buffer.length > 1000, 'BullMQ job PDF must be cached');
  console.log(`✓ Test 4 Passed: BullMQ envelope format processed and cached successfully (${bullResult.pdfSize} bytes).`);

  console.log('\n🎉 ALL PDF WORKER E2E & ATS TESTS PASSED 100% PERFECTLY!');
}

if (require.main === module) {
  runPdfWorkerE2ETests().then(() => {
    process.exit(0);
  }).catch(err => {
    console.error('PDF Worker E2E Test Failed:', err);
    process.exit(1);
  });
}

module.exports = runPdfWorkerE2ETests;
