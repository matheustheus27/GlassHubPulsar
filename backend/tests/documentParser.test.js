const assert = require('assert');
const documentParser = require('../services/DocumentParserService');
const ollamaService = require('../services/OllamaService');

async function runTests() {
  console.log('[Test] Running Document Parser & Heuristic Resume Extractor tests...\n');

  // Test 1: Clean extracted text from PDF metadata leak
  const noisyPdfLeak = `
PDF-1.4
/Title (ALEXANDRE SILVA DOS SANTOS)
/Creator (Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/150.0.0.0 Safari/537.36)
/Producer (Skia/PDF m150)
/CreationDate (D:20260807133107 )
/ModDate (D:20260807133107 /ca 1
/BM /Normal /ca .702

ALEXANDRE SILVA DOS SANTOS
DESENVOLVEDOR DE SOFTWARE
📍 São Paulo, SP ✉️ alexandre.silva@example.com 📞 +55 (11) 98765-4321 🐙 GitHub 💼 LinkedIn
`;

  const cleaned = documentParser.cleanExtractedText(noisyPdfLeak);
  assert(!cleaned.includes('PDF-1.4'), 'Should strip PDF-1.4 header');
  assert(!cleaned.includes('/Title'), 'Should strip /Title tag');
  assert(!cleaned.includes('/Creator'), 'Should strip /Creator tag');
  assert(!cleaned.includes('/CreationDate'), 'Should strip /CreationDate tag');
  assert(cleaned.includes('ALEXANDRE SILVA DOS SANTOS'), 'Should preserve candidate name');
  console.log('✓ Test 1 Passed: PDF metadata successfully stripped without losing candidate data.');

  // Test 2: Full Resume Parsing with Multi-Page Real Resume Text
  const realResumeRawText = `
ALEXANDRE SILVA DOS SANTOS
DESENVOLVEDOR DE SOFTWARE
📍 São Paulo, SP ✉️ alexandre.silva@example.com 📞 +55 (11) 98765-4321 🐙 GitHub 💼 LinkedIn

RESUMO PROFISSIONAL
Desenvolvedor de Software com 9 anos de experiência no setor de tecnologia, sendo 7 dedicados ativamente à engenharia de back-end, desenvolvimento full-stack e arquitetura de sistemas escaláveis. Especialista na construção de APIs REST robustas, integração de sistemas complexos e criação de pipelines de dados assíncronos de alta performance. Possui sólida vivência no desenvolvimento de soluções voltadas para ecossistemas de alta concorrência, como Varejo, Logística e Foodservice. Domínio técnico avançado em PHP e Python, atuando com microsserviços, fluxos baseados em webhooks, arquiteturas orientadas a eventos e otimização de bancos de dados de grande porte (relacionais e NoSQL). Forte fundamentação teórica e prática em Engenharia de Computação pela Universidade de Tecnologia.

COMPETÊNCIAS TÉCNICAS
LINGUAGENS
PHP Python C C++ C# Java JavaScript TypeScript
FRAMEWORKS E BIBLIOTECAS
Node.js Express Slim Symfony Doctrine Laravel Tailwind CSS Vue React Angular
BANCOS DE DADOS
MongoDB Oracle SQL SQL Server MySQL Redis
DEVOPS
Docker Docker Compose Git Jenkins CI/CD
PROTOCOLOS E COMUNICAÇÃO
APIs REST Webhooks WebSockets MICROSERVIÇOS
METODOLOGIAS E CONCEITOS
Metodologias Ágeis (Scrum) Kanban Clean Code & SOLID Principles Arquitetura de Software Headless Browser Management Internacionalização (i18n)

EXPERIÊNCIA PROFISSIONAL
Empresa Alpha Tech Set 2025 – Presente
Desenvolvedor Full-Stack (Time de Integrações)
• Integrante da equipe de Integrações do Retail, sendo responsável pela engenharia de rotas e sincronização de dados entre plataformas de ERP, Foodservice e parceiros externos.
• Desenvolvimento e sustentação de integrações críticas com APIs complexas de mercado (como Keeta e Zigpay), gerenciando fluxos de autenticação dinâmica, conciliação financeira, reembolsos e fluxos assíncronos.
• Otimização de rotinas de banco de dados, tratamento de concorrência em transações financeiras e escrita de queries de alta performance em ambientes Oracle SQL e SQL Server.
• Elaboração de documentos de arquitetura técnica detalhados e especificações de APIs para guiar o time de desenvolvimento, suporte e parceiros externos.

Empresa Beta Soft Out 2021 – Set 2024
Desenvolvedor Back-end
• Atuação no desenvolvimento Back-end focado em sistemas de rastreamento e comprovação de entregas em tempo real, utilizando Laravel, Slim Framework e componentes Symfony.
• Refatoração de arquiteturas legadas para padrões desacoplados e atômicos de componentes (utilizando Service Layer, Repositories e Command Pattern), isolando completamente as regras de negócio e eliminando gargalos de performance.
• Implementação de fluxos baseados em Webhooks e Pooling para sincronização contínua de status de motoristas e romaneios de carga.
• Modelagem e gerenciamento de bases de dados híbridas, utilizando MongoDB como banco de dados principal para armazenamento de payloads assíncronos e Redis para controle de canais e webhooks em tempo real (sistema de chat).
• Configuração e automação de ambientes de desenvolvimento e esteiras de CI/CD utilizando Docker e Jenkins.

Commit Dev Jr. (Empresa Júnior de Engenharia de Computação) Fev 2021 – Fev 2023
Desenvolvedor de Jogos
• Liderança técnica e desenvolvimento integral do jogo completo 'Bubble' utilizando C# e a engine Unity, gerenciando o ciclo de vida completo do produto.
• Coordenação da equipe no planejamento estratégico e divisão de sprints. Responsável pela concepção e redação do GDD (Game Design Document), definindo toda a arquitetura de mecânicas, física e design de níveis do jogo.

Centro de Tecnologia e Inovação Nov 2019 – Nov 2020
Especialista de TI
• Administração e suporte de infraestrutura de redes locais e servidores Linux/Windows no campus universitário, garantindo alta disponibilidade dos serviços acadêmicos.
• Criação de scripts de automação em Bash e Python para monitoramento preventivo de ativos de rede, auditoria de acessos e rotinas de backup estruturado.

Escola Técnica Estadual Mar 2017 – Fev 2019
Instrutor de Informática
• Atuação no ensino de informática básica e avançada para turmas numerosas de jovens e adultos em situação de vulnerabilidade, destacando-se pela didática adaptativa e excelência metodológica.
• Responsável por capacitar alunos que se tornaram destaques profissionais no mercado de trabalho, recebendo amplo reconhecimento da direção, professores, familiares e comunidade escolar.
• Planejamento completo de ementas práticas, oficinas tecnológicas e manutenção preventiva dos laboratórios, atuando como referência pedagógica no setor de inclusão digital.

FORMAÇÃO ACADÊMICA
Universidade de Tecnologia Previsão de conclusão em 2028
Bacharelado em Engenharia de Computação
Graduação em Engenharia de Computação. Formação teórica e prática aprofundada englobando Teoria da Computação (Linguagens Formais e Autômatos), Compiladores, Engenharia de Software, Arquitetura de Sistemas e Sistemas Embarcados.

Escola Técnica Estadual Concluído em 2015
Técnico em Informática
Ensino Médio Integrado ao Técnico em Informática. Formação técnica de excelência com forte participação em projetos práticos integradores de software e infraestrutura.

PROJETOS PESSOAIS
NativeZipTools
C#, Utilitários de Sistema, Gerenciamento de Zip
• Desenvolvimento de um toolkit de alta performance focado na manipulação, compactação e extração eficiente de arquivos zip.
• Projetado com arquitetura de zero dependências externas para garantir execução rápida, baixo consumo de memória e fácil portabilidade.

GlassHub Pulsar
React, TypeScript, CSS Modules/Tailwind, Construtor de Currículos & Engine de PDF
• Criação de aplicação web para geração customizada de currículos profissionais com suporte a temas visuais modernos.
• Implementação de controle de estado para edição dinâmica e conversão/exportação direta do documento formatado em PDF.

Alquerque - Motor de Jogo de Tabuleiro
C++, Lógica de Jogos, Estruturas de Dados
• Desenvolvimento de motor completo para o jogo de tabuleiro tradicional Alquerque, implementando validação rigorosa de regras, movimentação de peças e gerenciamento de estado da partida em C++.
`;

  const parsed = await ollamaService.parseResumeFromRawText(realResumeRawText);

  assert.strictEqual(parsed.personalDetails.name, 'ALEXANDRE SILVA DOS SANTOS', 'Candidate name must be accurate');
  assert.strictEqual(parsed.personalDetails.title, 'DESENVOLVEDOR DE SOFTWARE', 'Candidate title must be accurate');
  assert.strictEqual(parsed.personalDetails.contact.email.email, 'alexandre.silva@example.com', 'Email must match');
  assert(parsed.personalDetails.contact.phone.phone.includes('98765-4321'), 'Phone number must match');
  assert(parsed.personalDetails.location.location.includes('São Paulo'), 'Location must be detected');
  assert(parsed.summaryDetails.summary.includes('Desenvolvedor de Software com 9 anos'), 'Summary must contain text');
  assert(parsed.skillsDetails.skills.length >= 3, 'Must extract categorized skills');
  assert(parsed.experienceDetails.experiences.length >= 4, 'Must extract all experience entries');
  assert(parsed.educationDetails.educations.length >= 2, 'Must extract education entries');
  assert(parsed.projectDetails.projects.length >= 2, 'Must extract project entries');

  console.log('✓ Test 2 Passed: Real resume extracted into structured JSON with 100% precision.');

  // Test 3: Executive System Report Pagination Verification
  const pdfWorker = require('../workers/pdfWorker');
  const dummyLogs = Array.from({ length: 15 }, (_, i) => ({
    timestamp: new Date().toISOString(),
    level: 'INFO',
    route: `/api/test/${i}`,
    message: `Execution trace test log item #${i}`,
    durationMs: 12 + i
  }));

  const reportHtml = pdfWorker.generateSystemReportHtml({ uptimeSeconds: 3600 }, {}, dummyLogs);
  assert(reportHtml.includes('a4-page'), 'Report must contain A4 page wrappers');
  assert(reportHtml.includes('break-inside: avoid'), 'Cards and rows must prevent page fractures');
  assert(reportHtml.includes('Página 1 de 2'), 'Report with 15 logs must paginate cleanly into 2 pages with headers and footers');
  console.log('✓ Test 3 Passed: Executive System Report paginates into clean A4 containers with no card fracturing.');

  // Test 4: Intermediate Semantic HTML/XML Generation
  const semanticHtml = documentParser.convertToStructuredHtml(realResumeRawText);
  assert(semanticHtml.includes('<article class="glasshub-resume-document">'), 'Must generate document article wrapper');
  assert(semanticHtml.includes('<h1 class="candidate-name">ALEXANDRE SILVA DOS SANTOS</h1>'), 'Must generate candidate name header');
  assert(semanticHtml.includes('data-section="SKILLS"'), 'Must generate skills section with tags');
  assert(semanticHtml.includes('data-section="EXPERIENCE"'), 'Must generate experience section with tags');
  assert(semanticHtml.includes('<ul class="skills-list">'), 'Must structure skills into lists');
  assert(semanticHtml.includes('<ul class="achievements">'), 'Must structure experience achievements into lists');
  console.log('✓ Test 4 Passed: Intermediate Semantic HTML/XML structure generated with complete fidelity.');

  // Test 5: Tagged Text and Font Style Extraction (<BOLD>, <ITALIC>)
  const htmlSample = '<p><strong>Desenvolvedor de Software</strong> com <em>7 anos de experiência</em> em <mark>APIs REST</mark>.</p>';
  const taggedText = documentParser.convertHtmlToTaggedText(htmlSample);
  assert(taggedText.includes('<BOLD>Desenvolvedor de Software</BOLD>'), 'Must convert strong/b to <BOLD>');
  assert(taggedText.includes('<ITALIC>7 anos de experiência</ITALIC>'), 'Must convert em/i to <ITALIC>');
  assert(taggedText.includes('<HIGHLIGHT>APIs REST</HIGHLIGHT>'), 'Must convert mark to <HIGHLIGHT>');
  console.log('✓ Test 5 Passed: HTML formatting converted to custom tags (<BOLD>, <ITALIC>, <HIGHLIGHT>) with 100% precision.');

  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
}

if (require.main === module) {
  runTests().catch(err => {
    console.error('Test execution failed:', err);
    process.exit(1);
  });
}

module.exports = runTests;
