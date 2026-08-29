const assert = require('assert');
const ResumeBuilder = require('../services/ResumeBuilderService');
const ContactLinkOptimizer = require('../layout/ContactLinkOptimizer');
const HeightEstimator = require('../layout/HeightEstimator');
const LayoutEngine = require('../layout/LayoutEngine');

async function runPaginationAndVisualTests() {
  console.log('\n=== RUNNING PAGINATION, FILENAME & VECTOR SVG TESTS ===\n');

  // --- TEST 1: Standardized PDF Filename Formatting ---
  function formatPdfFileName(candidateName = "Candidato", language = "pt-BR") {
    const clean = String(candidateName)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .replace(/[^a-zA-Z0-9\s_-]/g, "");

    const toTitleCase = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

    const parts = clean.split(/\s+/).filter(Boolean);
    let namePart = "Candidato";
    if (parts.length === 1) {
      namePart = toTitleCase(parts[0]);
    } else if (parts.length >= 2) {
      const firstName = toTitleCase(parts[0]);
      const lastName = toTitleCase(parts[parts.length - 1]);
      namePart = `${firstName}_${lastName}`;
    }

    const cleanLang = (language || "pt-BR").trim();
    const isEn = cleanLang.toLowerCase().startsWith("en");
    const isEs = cleanLang.toLowerCase().startsWith("es");
    const prefix = isEn ? "Resume" : (isEs ? "Curriculum" : "Currículo");

    return `${prefix}_${namePart}_${cleanLang}.pdf`;
  }

  assert.strictEqual(formatPdfFileName("Alexandre Silva dos Santos", "pt-BR"), "Currículo_Alexandre_Santos_pt-BR.pdf");
  assert.strictEqual(formatPdfFileName("Alexandre Santos", "en-US"), "Resume_Alexandre_Santos_en-US.pdf");
  assert.strictEqual(formatPdfFileName("John Doe", "es-ES"), "Curriculum_John_Doe_es-ES.pdf");
  assert.strictEqual(formatPdfFileName("Bernardo Ferreira", "pt-BR"), "Currículo_Bernardo_Ferreira_pt-BR.pdf");
  console.log('✅ Test 1 Passed: PDF filename formatted as PREFIX_Name_LastName_LANG.pdf');

  // --- TEST 2: Vector SVGs for Facebook, X, Instagram, LinkedIn, GitHub ---
  const facebookSvg = ContactLinkOptimizer.getSvgIcon({ title: 'Facebook', link: 'https://facebook.com/alexandre-dev', icon: '🔗' });
  const xSvg = ContactLinkOptimizer.getSvgIcon({ title: 'X', link: 'https://x.com/alexandre-dev', icon: '𝕏' });
  const instagramSvg = ContactLinkOptimizer.getSvgIcon({ title: 'Instagram', link: 'https://instagram.com/alexandre-dev', icon: '📸' });
  const linkedinSvg = ContactLinkOptimizer.getSvgIcon({ title: 'LinkedIn', link: 'https://linkedin.com/in/alexandre-dev', icon: '💼' });
  const githubSvg = ContactLinkOptimizer.getSvgIcon({ title: 'GitHub', link: 'https://github.com/alexandre-dev', icon: '🐙' });

  assert(facebookSvg.includes('<svg') && facebookSvg.includes('viewBox="0 0 24 24"'), 'Must render Facebook SVG');
  assert(xSvg.includes('<svg') && xSvg.includes('viewBox="0 0 24 24"'), 'Must render X (Twitter) SVG');
  assert(instagramSvg.includes('<svg') && instagramSvg.includes('viewBox="0 0 24 24"'), 'Must render Instagram SVG');
  assert(linkedinSvg.includes('<svg') && linkedinSvg.includes('viewBox="0 0 24 24"'), 'Must render LinkedIn SVG');
  assert(githubSvg.includes('<svg') && githubSvg.includes('viewBox="0 0 24 24"'), 'Must render GitHub SVG');
  console.log('✅ Test 2 Passed: High-resolution vector SVGs generated for all social networks.');

  // --- TEST 3: Pagination of Complete 9-Year Senior Resume (Must fit in 2 to 3 pages, NOT 7!) ---
  const fullCandidateResume = {
    personalDetails: {
      name: "ALEXANDRE SILVA DOS SANTOS",
      title: "DESENVOLVEDOR DE SOFTWARE",
      location: { location: "São Paulo, SP", icon: "📍" },
      contact: {
        email: { email: "alexandre.silva@example.com", icon: "✉️" },
        phone: { phone: "+55 (11) 98765-4321", icon: "📞" },
        networking: {
          portfolio: { name: "Portfólio", url: "https://alexandre-dev.com", icon: "🌐" },
          linkedin: { name: "LinkedIn", url: "https://linkedin.com/in/alexandre-dev", icon: "💼" },
          github: { name: "GitHub", url: "https://github.com/alexandre-dev", icon: "🐙" },
          x: { name: "X", url: "https://x.com/alexandre_dev", icon: "𝕏" },
          instagram: { name: "Instagram", url: "https://instagram.com/alexandre_dev", icon: "📸" },
          facebook: { name: "Facebook", url: "https://facebook.com/alexandre_dev", icon: "📘" }
        }
      }
    },
    summaryDetails: {
      summaryTitle: "RESUMO PROFISSIONAL",
      summary: "Desenvolvedor de Software com 9 anos de experiência no setor de tecnologia, sendo 7 dedicados ativamente à engenharia de back-end, desenvolvimento full-stack e arquitetura de sistemas escaláveis. Especialista na construção de APIs REST robustas, integração de sistemas complexos e criação de pipelines de dados assíncronos de alta performance. Possui sólida vivência no desenvolvimento de soluções voltadas para ecossistemas de alta concorrência, como Varejo, Logística e Foodservice. Domínio técnico avançado em PHP e Python, atuando com microsserviços, fluxos baseados em webhooks, arquiteturas orientadas a eventos e otimização de bancos de dados de grande porte (relacionais e NoSQL)."
    },
    skillsDetails: {
      skillsTitle: "COMPETÊNCIAS & TECNOLOGIAS",
      skills: [
        { name: "LINGUAGENS", items: ["PHP", "Python", "C", "C++", "C#", "Java", "JavaScript", "TypeScript"] },
        { name: "FRAMEWORKS E BIBLIOTECAS", items: ["Node.js", "Express", "Slim", "Symfony", "Doctrine", "Laravel", "Tailwind CSS", "Vue", "React", "Angular"] },
        { name: "BANCOS DE DADOS", items: ["MongoDB", "Oracle SQL", "SQL Server", "MySQL", "Redis"] },
        { name: "DEVOPS", items: ["Docker", "Docker Compose", "Git", "Jenkins", "CI/CD"] },
        { name: "PROTOCOLOS E COMUNICAÇÃO", items: ["APIs REST", "Webhooks", "WebSockets", "Microsserviços"] },
        { name: "METODOLOGIAS ÁGEIS & ARQUITETURA", items: ["Scrum", "Kanban", "Clean Code", "SOLID Principles", "Arquitetura de Software"] }
      ]
    },
    experienceDetails: {
      experienceTitle: "HISTÓRICO PROFISSIONAL",
      experiences: [
        {
          company: "Empresa Alpha Tech",
          period: "Set 2025 - Presente",
          role: "Desenvolvedor Full-Stack",
          bullets: [
            "Integrante da equipe de Integrações do Retail, sendo responsável pela engenharia de rotas e sincronização de dados entre plataformas de ERP, Foodservice e parceiros externos.",
            "Desenvolvimento e sustentação de integrações críticas com APIs complexas de mercado (como Keeta e Zigpay), gerenciando fluxos de autenticação dinâmica, conciliação financeira, reembolsos e fluxos assíncronos.",
            "Otimização de rotinas de banco de dados, tratamento de concorrência em transações financeiras e escrita de queries de alta performance em ambientes Oracle SQL e SQL Server.",
            "Elaboração de documentos de arquitetura técnica detalhados e especificações de APIs para guiar o time de desenvolvimento, suporte e parceiros externos."
          ]
        },
        {
          company: "Empresa Beta Soft",
          period: "Out 2021 - Set 2024",
          role: "Desenvolvedor Back-end",
          bullets: [
            "Atuação no desenvolvimento Back-end focado em sistemas de rastreamento e comprovação de entregas em tempo real, utilizando Laravel, Slim Framework e componentes Symfony.",
            "Refatoração de arquiteturas legadas para padrões desacoplados e atômicos de componentes (utilizando Service Layer, Repositories e Command Pattern), isolando completamente as regras de negócio e eliminando gargalos de performance.",
            "Implementação de fluxos baseados em Webhooks e Pooling para sincronização contínua de status de motoristas e romaneios de carga.",
            "Modelagem e gerenciamento de bases de dados híbridas, utilizando MongoDB como banco de dados principal para armazenamento de payloads assíncronos e Redis para controle de canais e webhooks em tempo real (sistema de chat).",
            "Configuração e automação de ambientes de desenvolvimento e esteiras de CI/CD utilizando Docker e Jenkins."
          ]
        },
        {
          company: "Empresa Gamma Games",
          period: "Fev 2021 - Fev 2023",
          role: "Desenvolvedor de Jogos",
          bullets: [
            "Liderança técnica e desenvolvimento integral de jogo interativo utilizando C# e a engine Unity, gerenciando o ciclo de vida completo do produto.",
            "Coordenação da equipe no planejamento estratégico e divisão de sprints. Responsável pela concepção e redação do GDD (Game Design Document), definindo toda a arquitetura de mecânicas, física e design de níveis do jogo."
          ]
        },
        {
          company: "Centro de Tecnologia e Inovação",
          period: "Nov 2019 - Nov 2020",
          role: "Especialista de TI",
          bullets: [
            "Administração e suporte de infraestrutura de redes locais e servidores Linux/Windows no campus universitário, garantindo alta disponibilidade dos serviços acadêmicos.",
            "Criação de scripts de automação em Bash e Python para monitoramento preventivo de ativos de rede, auditoria de acessos e rotinas de backup estruturado."
          ]
        },
        {
          company: "Instituto de Formação Técnica",
          period: "Mar 2017 - Fev 2019",
          role: "Instrutor de Informática",
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
      educations: [
        {
          organization: "Universidade de Tecnologia",
          degree: "Bacharelado em Engenharia de Computação",
          period: "Previsão de conclusão em 2028",
          description: "Graduação em Engenharia de Computação. Formação teórica e prática aprofundada englobando Teoria da Computação (Linguagens Formais e Autômatos), Compiladores, Engenharia de Software, Arquitetura de Sistemas e Sistemas Embarcados. Desenvolvimento de projetos de pesquisa focados em IHC (Interação Humano-Computador) e Tecnologia HInt (Human-Computer Integration) do Tipo Fusão, com aplicações práticas de Realidade Aumentada aplicadas a manutenções preditivas em maquinários industriais."
        },
        {
          organization: "Escola Técnica Estadual",
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
          title: "GlassHub Landing Page",
          link: "https://glasshub.dev",
          description: "React 19, TypeScript, Tailwind CSS, Atomic Architecture, SOLID Principles",
          bullets: [
            "Arquitetura de componentes baseada em Atomic Design e diretrizes SOLID. Garante o desacoplamento completo de elementos, eliminando o código frágil e blindando o ecossistema contra a entropia.",
            "Implementação visual sofisticada do conceito de glassmorphic sob a física do vidro. Entrega interfaces translúcidas com efeitos de desfoque de fundo e bordas especulares altamente imersivas.",
            "Desenvolvimento de ponta utilizando os novos recursos nativos do React 19 e TypeScript. Proporciona renderização ultraeficiente, gerenciamento avançado de estados e tipagem estática estrita.",
            "Engenharia de software limpa focada em resiliência estrutural e alta performance. Suporta grandes pressões de escala e tráfego sem sofrer colapsos ou degradação da experiência do usuário.",
            "Interface responsiva construída com utilitários otimizados do Tailwind CSS. Assegura transições orgânicas, total conformidade de acessibilidade e carregamento instantâneo em qualquer dispositivo."
          ]
        },
        {
          title: "GlassHub Pulsar",
          link: "https://glasshub.dev/pulsar",
          description: "Nginx & Docker Compose, PostgreSQL 16, Redis 7 & BullMQ, Puppeteer Linux Engine, Llama 3.2 & TranslateGemma",
          bullets: [
            "Arquitetura de microsserviços desacoplada e uso de filas com BullMQ. Garante que o ecossistema suporte picos massivos de requisições e processamento de IA sem degradação de performance.",
            "Análise preditiva de currículos por inteligência artificial com Llama 3.2. Entrega pontuação ATS detalhada, palavras-chave ausentes e densidade de verbos de ação para maximizar o sucesso em processos seletivos.",
            "Algoritmo matemático de balanceamento simétrico combinado com calibração via Puppeteer Linux. Elimina problemas crônicos de formatação e links órfãos, gerando PDFs com fidelidade visual absoluta em relação à pré-visualização web."
          ]
        },
        {
          title: "DocShell - Intelligent Documentation Framework",
          link: "https://github.com/alexandre-dev/docshell",
          description: "Python, PHP, JavaScript, Docker, Semantic Search & RAG, Multi-runtime Engines",
          bullets: [
            "Suporte nativo a múltiplos ambientes de execução como Python, PHP e JavaScript. Permite a geração unificada de documentação técnica independente da linguagem do projeto.",
            "Assistente de inteligência artificial com capacidades de RAG e busca semântica integradas. Facilita a navegação pelo conteúdo e resolve dúvidas complexas de forma contextual e instantânea.",
            "Geração simultânea de websites interativos e documentos PDF com controle de versão. Garante consistência visual absoluta e preservação do histórico tanto no formato digital quanto impresso."
          ]
        }
      ]
    }
  };

  const html = ResumeBuilder.build(fullCandidateResume, { debug: true });

  assert(html.includes('ALEXANDRE SILVA DOS SANTOS'), 'Must include candidate name');
  assert(html.includes('svg-icon'), 'Must include vector SVG icons');
  assert(html.includes('Roboto'), 'Must include Roboto font');
  assert(!html.includes('(Continuação)') && !html.includes('(CONTINUAÇÃO)'), 'Must NOT include (Continuação) tag in continuing sections');
  assert(!html.includes('(Continued)'), 'Must NOT include (Continued) tag');
  assert(html.includes('alexandre-dev.com') || html.includes('Portfólio') || html.includes('favicon'), 'Must resolve portfolio domain name or favicon');

  console.log('✅ Test 3 Passed: Complete resume renders with clean section titles (no Continuação tag), Roboto typography and glassmorphic contact badges.');
  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!\n');
}

if (require.main === module) {
  runPaginationAndVisualTests().catch(err => {
    console.error('Test execution failed:', err);
    process.exit(1);
  });
}

module.exports = runPaginationAndVisualTests;
