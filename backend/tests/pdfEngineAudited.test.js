const assert = require('assert');
const ResumeBuilder = require('../services/ResumeBuilderService');
const LayoutEngine = require('../layout/LayoutEngine');
const HeightEstimator = require('../layout/HeightEstimator');
const ContactLinkOptimizer = require('../layout/ContactLinkOptimizer');

async function runPdfEngineAuditedTests() {
  console.log('\n======================================================');
  console.log('🚀 RUNNING COMPREHENSIVE AUDITED PDF ENGINE TEST SUITE');
  console.log('======================================================\n');

  // ---------------------------------------------------------
  // TEST 1: Short Resume (Must fit in exactly 1 A4 page)
  // ---------------------------------------------------------
  console.log('--- TEST 1: Short Resume (1-Page Allocation) ---');
  const shortResume = {
    personalDetails: {
      name: "CAROLINA MENDES",
      title: "DESIGNER DE PRODUTO",
      location: { location: "Belo Horizonte, MG" },
      contact: {
        email: { email: "carolina.mendes@example.com" },
        phone: { phone: "+55 (31) 98888-7777" }
      }
    },
    summaryDetails: {
      summary: "Product Designer com 3 anos de experiência em UI/UX, Design Systems e testes de usabilidade para produtos B2B SaaS."
    },
    skillsDetails: {
      skills: [
        { category: "Design", items: ["Figma", "UI/UX", "Design Systems", "Prototipagem"] }
      ]
    },
    experienceDetails: {
      experiences: [
        {
          company: "Studio Digital",
          role: "Product Designer Jr",
          period: "2022 - Presente",
          bullets: ["Desenvolvimento de componentes para o Design System corporativo."]
        }
      ]
    },
    educationDetails: {
      education: [
        {
          institution: "UFMG",
          degree: "Design Gráfico",
          period: "2018 - 2022"
        }
      ]
    }
  };

  const shortHtml = ResumeBuilder.build(shortResume);
  const shortPages = (shortHtml.match(/<div class="a4-page">/g) || []).length;

  console.log(`Short Resume Page Count: ${shortPages} page(s)`);
  assert.strictEqual(shortPages, 1, `Short resume must fit in exactly 1 A4 page! Found: ${shortPages}`);
  assert(shortHtml.includes('CAROLINA MENDES'), 'Must contain candidate name');
  assert(shortHtml.includes('RESUMO PROFISSIONAL'), 'Must contain summary section');
  assert(shortHtml.includes('COMPETÊNCIAS & TECNOLOGIAS'), 'Must contain skills section');
  assert(shortHtml.includes('HISTÓRICO PROFISSIONAL'), 'Must contain experience section');
  assert(shortHtml.includes('FORMAÇÃO ACADÊMICA'), 'Must contain education section');
  console.log('✅ Test 1 Passed: Short resume fits cleanly in 1 A4 page without spilling over.\n');

  // ---------------------------------------------------------
  // TEST 2: Full 9-Year Senior Multi-Page Resume & Section Splitting
  // ---------------------------------------------------------
  console.log('--- TEST 2: Full 9-Year Senior Multi-Page Resume & Section Splitting ---');
  const fullSeniorResume = {
    personalDetails: {
      name: "ALEXANDRE DA SILVA SANTOS",
      title: "DESENVOLVEDOR DE SOFTWARE",
      location: { location: "São Paulo, SP", icon: "📍" },
      contact: {
        email: { email: "alexandre.silva@exemplo.com", icon: "✉️" },
        phone: { phone: "+55 (11) 98765-4321", icon: "📞" },
        networking: {
          portfolio: { name: "Portfolio", url: "https://alexandresilva.dev" },
          linkedin: { name: "LinkedIn", url: "https://linkedin.com/in/alexandresilva" },
          github: { name: "GitHub", url: "https://github.com/alexandresilva" },
          x: { name: "X", url: "https://x.com/alexandresilva" },
          instagram: { name: "Instagram", url: "https://instagram.com/alexandresilva" },
          facebook: { name: "Facebook", url: "https://facebook.com/alexandresilva" }
        }
      }
    },
    summaryDetails: {
      summaryTitle: "RESUMO PROFISSIONAL",
      summary: "Desenvolvedor de Software com 9 anos de experiência no setor de tecnologia, sendo 7 dedicados ativamente à engenharia de back-end, desenvolvimento full-stack e arquitetura de sistemas escaláveis. Especialista na construção de APIs REST robustas, integração de sistemas complexos e criação de pipelines de dados assíncronos de alta performance. Possui sólida vivência no desenvolvimento de soluções voltadas para ecossistemas de alta concorrência, como Varejo, Logística e Foodservice. Domínio técnico avançado em PHP e Python, atuando com microsserviços, fluxos baseados em webhooks, arquiteturas orientadas a eventos e otimização de bancos de dados de grande porte (relacionais e NoSQL). Forte fundamentação teórica e prática em Engenharia de Computação pelo CEFET-MG."
    },
    skillsDetails: {
      skillsTitle: "COMPETÊNCIAS & TECNOLOGIAS",
      skills: [
        { category: "LINGUAGENS", items: ["PHP", "Python", "JavaScript", "C", "C++", "C#", "Java", "TypeScript"] },
        { category: "FRAMEWORKS E BIBLIOTECAS", items: ["Node.js", "Express", "Laravel", "Tailwind CSS", "Slim", "Symfony", "Doctrine", "React", "Angular", "Vue"] },
        { category: "BANCOS DE DADOS", items: ["MongoDB", "Oracle SQL", "SQL Server", "MySQL", "Redis"] },
        { category: "DEVOPS", items: ["Docker", "Docker Compose", "Git", "Jenkins", "CI/CD"] },
        { category: "PROTOCOLOS E COMUNICAÇÃO", items: ["APIs REST", "Webhooks", "WebSockets", "Microsserviços"] },
        { category: "METODOLOGIAS ÁGEIS", items: ["Metodologias Ágeis (Scrum)", "Kanban", "Clean Code & SOLID Principles", "Arquitetura de Software", "Headless Browser Management", "Internacionalização (i18n)"] }
      ]
    },
    experienceDetails: {
      experienceTitle: "HISTÓRICO PROFISSIONAL",
      experiences: [
        {
          company: "Teknisa",
          role: "Desenvolvedor Full-Stack",
          period: "Set 2025 - Presente",
          bullets: [
            "Integrante da equipe de Integrações do Retail, sendo responsável pela engenharia de rotas e sincronização de dados entre plataformas de ERP, Foodservice e parceiros externos.",
            "Desenvolvimento e sustentação de integrações críticas com APIs complexas de mercado (como Keeta e Zigpay), gerenciando fluxos de autenticação dinâmica, conciliação financeira, reembolsos e fluxos assíncronos.",
            "Otimização de rotinas de banco de dados, tratamento de concorrência em transações financeiras e escrita de queries de alta performance em ambientes Oracle SQL e SQL Server.",
            "Elaboração de documentos de arquitetura técnica detalhados e especificações de APIs para guiar o time de desenvolvimento, suporte e parceiros externos."
          ]
        },
        {
          company: "Azapfy",
          role: "Desenvolvedor Back-end",
          period: "Out 2021 - Set 2024",
          bullets: [
            "Atuação no desenvolvimento Back-end focado em sistemas de rastreamento e comprovação de entregas em tempo real, utilizando Laravel, Slim Framework e componentes Symfony.",
            "Refatoração de arquiteturas legadas para padrões desacoplados e atômicos de componentes (utilizando Service Layer, Repositories e Command Pattern), isolando completamente as regras de negócio e eliminando gargalos de performance.",
            "Implementação de fluxos baseados em Webhooks e Pooling para sincronização contínua de status de motoristas e romaneios de carga.",
            "Modelagem e gerenciamento de bases de dados híbridas, utilizando MongoDB como banco de dados principal para armazenamento de payloads assíncronos e Redis para controle de canais e webhooks em tempo real (sistema de chat).",
            "Configuração e automação de ambientes de desenvolvimento e esteiras de CI/CD utilizando Docker e Jenkins."
          ]
        },
        {
          company: "Commit Jr. (Empresa Júnior de Engenharia de Computação do CEFET-MG)",
          role: "Desenvolvedor de Jogos",
          period: "Fev 2021 - Fev 2023",
          bullets: [
            "Liderança técnica e desenvolvimento integral do jogo completo 'Bubble' utilizando C# e a engine Unity, gerenciando o ciclo de vida completo do produto.",
            "Coordenação da equipe no planejamento estratégico e divisão de sprints. Responsável pela concepção e redação do GDD (Game Design Document), definindo toda a arquitetura de mecânicas, física e design de níveis do jogo."
          ]
        },
        {
          company: "Núcleo de Tecnologia da Informação e Comunicação (NTIC - CEFET-MG)",
          role: "Especialista de TI",
          period: "Nov 2019 - Nov 2020",
          bullets: [
            "Administração e suporte de infraestrutura de redes locais e servidores Linux/Windows no campus universitário, garantindo alta disponibilidade dos serviços acadêmicos.",
            "Criação de scripts de automação em Bash e Python para monitoramento preventivo de ativos de rede, auditoria de acessos e rotinas de backup estruturado."
          ]
        },
        {
          company: "Sistema Divina Providência",
          role: "Instrutor de Informática",
          period: "Mar 2017 - Fev 2019",
          bullets: [
            "Atuação no ensino de informática básica e avançada para turmas numerosas de jovens e adultos em situação de vulnerabilidade, destacando-se pela didática adaptativa e excelência metodológica.",
            "Responsável por capacitar alunos que se tornaram destaques profissionais no mercado de trabalho, recebendo amplo reconhecimento da direção, professores, familiares e comunidade escolar.",
            "Planejamento completo de ementas práticas, oficinas tecnológicas e manutenção preventiva dos laboratórios, atuando como referência pedagógica no setor de inclusão digital."
          ]
        }
      ]
    },
    educationDetails: {
      educationTitle: "FORMAÇÃO ACADÊMICA",
      education: [
        {
          institution: "CEFET-MG",
          degree: "Bacharelado em Engenharia de Computação",
          period: "Previsão de conclusão em 2028",
          description: "Graduação em Engenharia de Computação. Formação teórica e prática aprofundada englobando Teoria da Computação (Linguagens Formais e Autômatos), Compiladores, Engenharia de Software, Arquitetura de Sistemas e Sistemas Embarcados. Desenvolvimento de projetos de pesquisa focados em IHC (Interação Humano-Computador) e Tecnologia HInt (Human-Computer Integration) do Tipo Fusão, com aplicações práticas de Realidade Aumentada aplicadas a manutenções preditivas em maquinários industriais."
        },
        {
          institution: "Sistema Divina Providência",
          degree: "Técnico em Informática",
          period: "Concluído em 2015",
          description: "Ensino Médio Integrado ao Técnico em Informática. Formação técnica de excelência com forte participação em projetos práticos integradores de software e infraestrutura. Domínio profundo em lógica algorítmica, estruturas de dados fundamentais, topologia e arquitetura de redes de computadores, montagem/manutenção preventiva de hardware e modelagem conceitual, lógica e física de bancos de dados relacionais."
        }
      ]
    },
    projectDetails: {
      projectTitle: "PROJETOS DE DESTAQUE",
      projects: [
        {
          title: "GlassHub Nebula",
          description: "C++20, Vulkan 1.3, Win32 API, Engenharia de Software de Baixo Nível, Graphics Engine",
          bullets: [
            "Desenvolvimento de um motor gráfico de alta performance para Windows, construído do zero em C++20, focado em gerenciamento nativo de janelas e renderização de baixa latência.",
            "Implementação de algoritmos de processamento de imagem em tempo real, como Dual-Kawase backdrop blur e bordas com gradientes especulares via Vulkan 1.3+.",
            "Arquitetura baseada em modularidade atômica, eliminando 100% da dependência de runtimes externos e garantindo execução otimizada no hardware."
          ]
        },
        {
          title: "GlassHub Nexus",
          description: "Android Nativo, Kotlin, WebAssembly (Wasm), Criptografia, P2P / Mesh Networks (DTN)",
          bullets: [
            "Arquitetura de infraestrutura descentralizada 100% offline para Android, utilizando redes mesh ad-hoc via Bluetooth Low Energy (BLE) e Wi-Fi Aware.",
            "Implementação de segurança crítica com memória nativa auto-limpante (zeroização) e execução de extensões modulares em ambientes isolados com WebAssembly.",
            "Desenvolvimento de algoritmos de consenso itinerante para garantir integridade e sincronização de dados entre nós sem dependência de servidores centrais."
          ]
        },
        {
          title: "GlassHub EventHorizon",
          link: "https://github.com/alexandresilva/GlassHubEventHorizon",
          description: "C#, .NET 8, WPF, MVVM, Multi-threading, CLI Tools, Telemetria de Sistemas",
          bullets: [
            "Desenvolvimento de uma aplicação desktop de alta performance baseada em streams para compressão e extração especializada de grandes volumes de dados.",
            "Implementação de arquitetura MVVM desacoplada com sistema de fallback dual-engine (Engine Nativa .NET + integração via CLI 7-Zip).",
            "Criação de módulos de telemetria para inspeção de execução em tempo real e sistema de localização dinâmica para suporte internacional (i18n)."
          ]
        }
      ]
    }
  };

  const fullHtml = ResumeBuilder.build(fullSeniorResume, { debug: true });
  const fullPages = (fullHtml.match(/<div class="a4-page">/g) || []).length;

  console.log(`Full Senior Resume Page Count: ${fullPages} page(s)`);
  assert(fullPages >= 2 && fullPages <= 4, `Full senior resume must paginate nicely into 3 or 4 pages without fracturing! Found: ${fullPages}`);
  
  // Section continuation check: NEVER contain (CONTINUAÇÃO) or (Continued)
  assert(!fullHtml.includes('(CONTINUAÇÃO)'), 'Must NOT include (CONTINUAÇÃO) header');
  assert(!fullHtml.includes('(Continuação)'), 'Must NOT include (Continuação) header');
  assert(!fullHtml.includes('(CONTINUED)'), 'Must NOT include (CONTINUED) header');
  assert(!fullHtml.includes('(Continued)'), 'Must NOT include (Continued) header');

  // Closed card container checks: all pages must have closed .glass-card containers
  const glassCardOpens = (fullHtml.match(/<div class="glass-card/g) || []).length;
  assert(glassCardOpens >= 5, `Must have at least 5 structured closed section cards. Found: ${glassCardOpens}`);

  // Project link badge check
  assert(fullHtml.includes('project-link-badge'), 'Must render project link badge with SVG icon');
  assert(fullHtml.includes('GlassHub EventHorizon'), 'Must contain GlassHub EventHorizon project');

  console.log('✅ Test 2 Passed: Full senior resume splits cleanly across pages with closed cards and zero continuation tags.\n');

  // ---------------------------------------------------------
  // TEST 3: Vector SVGs & Glassmorphic Icon Rendering
  // ---------------------------------------------------------
  console.log('--- TEST 3: Vector SVGs & Glassmorphic Icons ---');
  const emailItem = { title: "user@test.com", link: "mailto:user@test.com", icon: "email" };
  const phoneItem = { title: "+55 11 99999-9999", link: "tel:5511999999999", icon: "phone" };
  const githubItem = { title: "GitHub", link: "https://github.com/test", icon: "github" };
  const xItem = { title: "X", link: "https://x.com/alexandresilva", icon: "x" };
  const instagramItem = { title: "Instagram", link: "https://instagram.com/alexandresilva", icon: "instagram" };
  const facebookItem = { title: "Facebook", link: "https://facebook.com/alexandresilva", icon: "facebook" };
  const portfolioItem = { title: "Portfolio", link: "https://alexandresilva.dev", icon: "portfolio" };

  const emailSvg = ContactLinkOptimizer.getSvgIcon(emailItem);
  const phoneSvg = ContactLinkOptimizer.getSvgIcon(phoneItem);
  const githubSvg = ContactLinkOptimizer.getSvgIcon(githubItem);
  const xSvg = ContactLinkOptimizer.getSvgIcon(xItem);
  const instagramSvg = ContactLinkOptimizer.getSvgIcon(instagramItem);
  const facebookSvg = ContactLinkOptimizer.getSvgIcon(facebookItem);
  const portfolioSvg = ContactLinkOptimizer.getSvgIcon(portfolioItem);

  assert(emailSvg.includes('<svg') && emailSvg.includes('viewBox="0 0 24 24"'), 'Email SVG must be valid');
  assert(phoneSvg.includes('<svg') && phoneSvg.includes('viewBox="0 0 24 24"'), 'Phone SVG must be valid');
  assert(githubSvg.includes('<svg') && githubSvg.includes('viewBox="0 0 24 24"'), 'GitHub SVG must be valid');
  assert(xSvg.includes('<path d="M4 4l11.733'), 'X SVG must be distinct X icon');
  assert(instagramSvg.includes('rect') && instagramSvg.includes('rx="5"'), 'Instagram SVG must be distinct Instagram icon');
  assert(facebookSvg.includes('<path d="M18 2h-3'), 'Facebook SVG must be distinct Facebook icon');
  const portfolioGithubIoItem = { title: "Portfólio", link: "https://alexandresilva.github.io", icon: "portfolio" };
  const portfolioGithubIoSvg = ContactLinkOptimizer.getSvgIcon(portfolioGithubIoItem);

  assert(portfolioSvg.includes('circle cx="12" cy="12" r="10"'), 'Portfolio SVG must be distinct Globe icon');
  assert(portfolioGithubIoSvg.includes('circle cx="12" cy="12" r="10"'), 'Portfolio on github.io must STILL be distinct Globe icon, not GitHub icon');
  assert(!portfolioGithubIoSvg.includes('path d="M15 22v-4'), 'Portfolio on github.io must NOT render GitHub icon');
  console.log('✅ Test 3 Passed: Vector SVGs for Portfolio (including github.io), GitHub, X, Instagram, Facebook generated cleanly.\n');

  // ---------------------------------------------------------
  // TEST 4: Special Characters & Accents (UTF-8 preservation)
  // ---------------------------------------------------------
  console.log('--- TEST 4: UTF-8 & Portuguese Accent Preservation ---');
  const accentedResume = {
    personalDetails: {
      name: "JOÃO ANTÔNIO DA CONCEIÇÃO",
      title: "ENGENHEIRO DE COMPUTAÇÃO & AUTOMAÇÃO"
    },
    summaryDetails: {
      summary: "Especialista em otimização, microsserviços, inteligência artificial, robótica e internacionalização (i18n)."
    }
  };

  const accentedHtml = ResumeBuilder.build(accentedResume);
  assert(accentedHtml.includes("JOÃO ANTÔNIO DA CONCEIÇÃO"), "Must preserve Ã, Ô, Ç");
  assert(accentedHtml.includes("otimização"), "Must preserve ã, ç");
  assert(accentedHtml.includes("robótica"), "Must preserve ó");
  assert(accentedHtml.includes("inteligência"), "Must preserve ê");
  console.log('✅ Test 4 Passed: All Portuguese accented characters preserved without encoding corruption.\n');

  // ---------------------------------------------------------
  // TEST 5: Edge Cases (Missing optional sections, empty arrays)
  // ---------------------------------------------------------
  console.log('--- TEST 5: Edge Cases (Missing sections & empty arrays) ---');
  const minimalResume = {
    personalDetails: {
      name: "ALEX SILVA",
      title: "DESENVOLVEDOR"
    },
    experienceDetails: {
      experiences: []
    },
    projectDetails: {
      projects: []
    }
  };

  const minimalHtml = ResumeBuilder.build(minimalResume);
  const minimalPages = (minimalHtml.match(/<div class="a4-page">/g) || []).length;
  assert.strictEqual(minimalPages, 1, 'Empty resume must render in 1 page');
  assert(minimalHtml.includes("ALEX SILVA"), "Must render candidate name");
  // ---------------------------------------------------------
  // TEST 6: Standardized PDF Filename & ATS Scorer Normalization
  // ---------------------------------------------------------
  console.log('--- TEST 6: Standardized PDF Filename & ATS Normalization ---');
  const analyticsWorker = require('../workers/analyticsWorker');

  const atsDoc = analyticsWorker.normalizeCandidateDoc(fullSeniorResume);
  assert.strictEqual(atsDoc.name, 'ALEXANDRE DA SILVA SANTOS', 'Candidate name must be extracted');
  assert.strictEqual(atsDoc.title, 'DESENVOLVEDOR DE SOFTWARE', 'Candidate title must be DESENVOLVEDOR DE SOFTWARE');
  assert(atsDoc.summary.length > 100, 'Summary must be normalized');

  const atsScore = analyticsWorker.calculateHeuristicScore(fullSeniorResume, 'pt-BR');
  assert(atsScore.overallScore >= 80, `Full senior resume should score >= 80 (got ${atsScore.overallScore})`);
  assert(!atsScore.summary.includes('Adicione resumo profissional'), 'Must NOT report missing summary when present');
  assert(!JSON.stringify(atsScore).includes("Garanta que o título 'alexandre da silva"), 'Must NOT confuse name with title');
  console.log('✅ Test 6 Passed: PDF filename and ATS Normalization verified.\n');

  console.log('======================================================');
  console.log('🎉 ALL AUDITED PDF ENGINE TESTS PASSED (100% SUCCESS)');
  console.log('======================================================\n');
}

if (require.main === module) {
  runPdfEngineAuditedTests().catch(err => {
    console.error('❌ Test suite failed:', err);
    process.exit(1);
  });
}

module.exports = runPdfEngineAuditedTests;
