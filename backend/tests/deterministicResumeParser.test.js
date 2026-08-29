const assert = require('assert');
const ollamaService = require('../services/OllamaService');
const ResumeSectionParser = require('../parsers/ResumeSectionParser');
const CandidateParser = require('../parsers/CandidateParser');
const SummaryParser = require('../parsers/SummaryParser');
const SkillsParser = require('../parsers/SkillsParser');
const ExperienceParser = require('../parsers/ExperienceParser');
const EducationParser = require('../parsers/EducationParser');
const ProjectParser = require('../parsers/ProjectParser');
const ResumeMergeService = require('../parsers/ResumeMergeService');
const { validateAndCleanResumeData, normalizeToApplicationDTO } = require('../schemas/resumeSchema');

const mockResumeRawText = `
ALEXANDRE SILVA DOS SANTOS
DESENVOLVEDOR DE SOFTWARE
Belo Horizonte, MG
alexandre.silva@example.com
+55 (31) 98765-4321
https://github.com/alexandre-silva-dev
https://linkedin.com/in/alexandre-silva-dev
https://x.com/alexandre_dev
https://www.instagram.com/alexandre_dev/
https://www.facebook.com/alexandre_dev
https://alexandre-silva.dev

RESUMO PROFISSIONAL
<BOLD>Desenvolvedor de Software</BOLD> com 9 anos de experiência no setor de tecnologia, sendo 7 dedicados ativamente à engenharia de back-end, desenvolvimento full-stack e arquitetura de sistemas escaláveis. Especialista na construção de APIs REST robustas, integração de sistemas complexos e criação de pipelines de dados assíncronos de alta performance.

COMPETÊNCIAS & TECNOLOGIAS
LINGUAGENS
- PHP
- Python
- JavaScript
- TypeScript
- C++
- C#

FRAMEWORKS E BIBLIOTECAS
- Node.js
- Express
- Laravel
- React
- Vue

HISTÓRICO PROFISSIONAL
Alpha Tech Soluções
Desenvolvedor Full-Stack
Set 2025 - Presente
- Integrante da equipe de Integrações do Retail, sendo responsável pela engenharia de rotas e sincronização de dados entre plataformas de ERP, Foodservice e parceiros externos.
- Desenvolvimento e sustentação de integrações críticas com APIs complexas de mercado (Keeta, Keeta Pay, Zigpay), gerenciando fluxos de autenticação dinâmica, conciliação financeira, reembolsos e fluxos assíncronos.
- Otimização de rotinas de banco de dados, tratamento de concorrência em transações financeiras e escrita de queries de alta performance em ambientes Oracle SQL e SQL Server.
- Elaboração de documentos de arquitetura técnica detalhados e especificações de APIs para guiar o time de desenvolvimento, suporte e parceiros externos.

Beta Systems Softwares
Desenvolvedor Back-end
Out 2021 – Set 2024
- Atuação no desenvolvimento Back-end focado em sistemas de rastreamento e comprovação de entregas em tempo real, utilizando Laravel, Slim Framework e componentes Symfony.
- Refatoração de arquiteturas legadas para padrões <BOLD>desacoplados e atômicos de componentes</BOLD> (utilizando Service Layer, Repositories e Command Pattern), isolando completamente as regras de negócio e eliminando gargalos de performance.
- Implementação de fluxos baseados em Webhooks e Pooling para sincronização contínua de status de motoristas e romaneios de carga.
- Modelagem e gerenciamento de bases de dados híbridas, utilizando MongoDB como banco de dados principal para armazenamento de payloads assíncronos e Redis para controle de canais e webhooks em tempo real (sistema de chat).

Gamma Game Studio
Desenvolvedor de Jogos
Fev 2021 – Fev 2023
- Liderança técnica e desenvolvimento integral do jogo completo 'Bubble' utilizando C# e a engine Unity, gerenciando o ciclo de vida completo do produto.
- Coordenação da equipe no planejamento estratégico e divisão de sprints. Responsável pela concepção e redação do GDD (Game Design Document), definindo toda a arquitetura de mecânicas, física e design de níveis do jogo.

Instituto de Tecnologia e Pesquisa (ITP)
Especialista de TI
Nov 2019 – Nov 2020
- Administração e suporte de infraestrutura de redes locais e servidores Linux/Windows no campus universitário, garantindo alta disponibilidade dos serviços acadêmicos.
- Criação de scripts de automação em Bash e Python para monitoramento preventivo de ativos de rede, auditoria de acessos e rotinas de backup estruturado.

Fundação Futuro Digital
Instrutor de Informática
Mar 2017 – Fev 2019
- Atuação no ensino de informática básica e avançada para turmas numerosas de jovens e adultos em situação de vulnerabilidade, destacando-se pela didática adaptativa e excelência metodológica.
- Responsável por capacitar alunos que se tornaram destaques profissionais no mercado de trabalho, recebendo amplo reconhecimento da direção, professores, familiares e comunidade escolar.
- Planejamento completo de ementas práticas, oficinas tecnológicas e manutenção preventiva dos laboratórios, atuando como referência pedagógica no setor de inclusão digital.

FORMAÇÃO ACADÊMICA
Universidade Federal de Tecnologia
Bacharelado em Engenharia de Computação
Previsão de conclusão em 2028

Graduação em Engenharia de Computação. Formação teórica e prática aprofundada englobando Teoria da Computação (Linguagens Formais e Autômatos), Compiladores, Engenharia de Software, Arquitetura de Sistemas e Sistemas Embarcados.

Instituto Técnico de Formação Profissional
Técnico em Informática
Concluído em 2015

Ensino Médio Integrado ao Técnico em Informática. Formação técnica de excelência com forte participação em projetos práticos integradores de software e infraestrutura.

PROJETOS DE DESTAQUE
Vortex Render Engine
C++20, Vulkan 1.3, Win32 API, Engenharia de Software de Baixo Nível, Graphics Engine
- Desenvolvimento de um motor gráfico 2D/3D customizado em C++20 utilizando a API Vulkan 1.3 do zero, com gerenciamento manual de memória GPU (VMA), pipeline de shaders SPIR-V e renderização multithread.
- Implementação de algoritmos avançados de processamento de imagem, pipelines de pós-processamento (Bloom, HDR, Tone Mapping) e arquitetura de render graph orientada a dados (Data-Oriented Design).
- Arquitetura baseada em subsistemas desacoplados (Windowing Win32 nativo, Input, Asset Manager, Renderer), priorizando zero dependências externas pesadas e controle total do ciclo de vida da GPU.

Aegis Mesh Network
Android Nativo, Kotlin, WebAssembly (Wasm), Criptografia, P2P / Mesh Networks (DTN)
- Desenvolvimento de arquitetura de rede ad-hoc resiliente e tolerante a atrasos (DTN - Delay-Tolerant Networking) para comunicação descentralizada sem internet, utilizando Wi-Fi Direct e Bluetooth Low Energy (BLE).
- Criação de módulos criptográficos de alta performance compilados em WebAssembly (Wasm) e integrados via JNI no Android, garantindo sigilo ponta a ponta (E2EE) com chaves assimétricas e hashing seguro.
- Implementação de protocolo de sincronização de mensagens off-grid baseado em árvores de Merkle e vetores de versão para reconciliação consistente de dados distribuídos.

Horizon Telemetry Suite
C#, .NET 8, WPF, MVVM, Multi-threading, CLI Tools, Telemetria de Sistemas
- Construção de ferramenta executiva para monitoramento de processos, telemetria de hardware e diagnóstico de performance em tempo real no Windows, com interface reativa construída em WPF/XAML sob padrão MVVM.
- Implementação de coletores assíncronos de alta frequência para métricas de CPU, GPU, I/O de disco e memória utilizando Event Tracing for Windows (ETW) e Windows Management Instrumentation (WMI).
- Desenvolvimento de suíte CLI integrada para automação de benchmarks, perfilamento de threads e exportação de relatórios analíticos em JSON e CSV estruturados.
`;

async function runDeterministicTests() {
    console.log('[Test] Running Hybrid Resume Extraction & Validation Suite (Mock Data)...\n');

    // Test 1: Full Pipeline Extraction with Mock Resume
    const result = await ollamaService.parseResumeFromRawText(mockResumeRawText);

    // 1.1 Candidate & Contacts Verification
    assert.strictEqual(result.personalDetails.name, 'ALEXANDRE SILVA DOS SANTOS', 'Candidate name must match');
    assert.strictEqual(result.personalDetails.title, 'DESENVOLVEDOR DE SOFTWARE', 'Candidate title must match');
    assert.strictEqual(result.personalDetails.location.location, 'Belo Horizonte, MG', 'Location must match');
    assert.strictEqual(result.personalDetails.contact.email.email, 'alexandre.silva@example.com', 'Email must match');
    assert.strictEqual(result.personalDetails.contact.phone.phone, '+55 (31) 98765-4321', 'Phone must match');

    // 1.2 Pure Social URLs (No markdown wrappers [url](url), no HTML)
    const net = result.personalDetails.contact.networking;
    assert.strictEqual(net.github.url, 'https://github.com/alexandre-silva-dev', 'GitHub URL must be literal and pure');
    assert.strictEqual(net.linkedin.url, 'https://linkedin.com/in/alexandre-silva-dev', 'LinkedIn URL must be literal and pure');
    assert.strictEqual(net.x.url, 'https://x.com/alexandre_dev', 'X URL must be literal and pure');
    assert.strictEqual(net.instagram.url, 'https://www.instagram.com/alexandre_dev/', 'Instagram URL must be literal and pure');
    assert.strictEqual(net.facebook.url, 'https://www.facebook.com/alexandre_dev', 'Facebook URL must be literal and pure');
    assert.strictEqual(net.portfolio.url, 'https://alexandre-silva.dev', 'Portfolio URL must be literal and pure');

    console.log('✓ Test 1.1 & 1.2 Passed: Candidate details & pure URLs verified.');

    // 1.3 Professional Summary & Formatting Tag Preservation
    assert(result.summaryDetails.summary.includes('<BOLD>Desenvolvedor de Software</BOLD>'), 'Must preserve <BOLD> tags in summary');
    assert(result.summaryDetails.summary.includes('com 9 anos de experiência'), 'Summary content must match');

    console.log('✓ Test 1.3 Passed: Professional summary with formatting tags preserved.');

    // 1.4 Skills Extraction
    assert(result.skillsDetails.skills.length >= 2, 'Must extract at least 2 skill categories');
    const langCategory = result.skillsDetails.skills.find(s => s.name.toUpperCase().includes('LINGUAGENS'));
    assert(langCategory, 'Must find LINGUAGENS category');
    assert(langCategory.items.includes('PHP'), 'Must include PHP');
    assert(langCategory.items.includes('Python'), 'Must include Python');
    assert(langCategory.items.includes('C++'), 'Must include C++');

    console.log('✓ Test 1.4 Passed: Skills categories and items extracted.');

    // 1.5 Professional Experience Extraction (Exactly 5 experiences and exactly 15 total bullets)
    const exps = result.experienceDetails.experiences;
    assert.strictEqual(exps.length, 5, 'Must extract exactly 5 experience entries');

    // Experience 1: Alpha Tech (4 bullets)
    assert.strictEqual(exps[0].company, 'Alpha Tech Soluções');
    assert.strictEqual(exps[0].position, 'Desenvolvedor Full-Stack');
    assert.strictEqual(exps[0].period, 'Set 2025 - Presente');
    assert.strictEqual(exps[0].generalDescription, '', 'generalDescription must NOT be populated with position title');
    assert.strictEqual(exps[0].bullets.length, 4, 'Alpha Tech must have exactly 4 bullets');

    // Experience 2: Beta Systems (4 bullets, tag preservation)
    assert.strictEqual(exps[1].company, 'Beta Systems Softwares');
    assert.strictEqual(exps[1].position, 'Desenvolvedor Back-end');
    assert.strictEqual(exps[1].period, 'Out 2021 – Set 2024');
    assert.strictEqual(exps[1].bullets.length, 4, 'Beta Systems must have exactly 4 bullets');
    assert(exps[1].bullets[1].includes('<BOLD>desacoplados e atômicos de componentes</BOLD>'), 'Must preserve <BOLD> inside experience bullets');

    // Experience 3: Gamma Game Studio (2 bullets)
    assert.strictEqual(exps[2].company, 'Gamma Game Studio');
    assert.strictEqual(exps[2].position, 'Desenvolvedor de Jogos');
    assert.strictEqual(exps[2].period, 'Fev 2021 – Fev 2023');
    assert.strictEqual(exps[2].bullets.length, 2, 'Gamma Game Studio must have exactly 2 bullets');

    // Experience 4: ITP (2 bullets)
    assert.strictEqual(exps[3].company, 'Instituto de Tecnologia e Pesquisa (ITP)');
    assert.strictEqual(exps[3].position, 'Especialista de TI');
    assert.strictEqual(exps[3].period, 'Nov 2019 – Nov 2020');
    assert.strictEqual(exps[3].bullets.length, 2, 'ITP must have exactly 2 bullets');

    // Experience 5: Fundação Futuro Digital (3 bullets)
    assert.strictEqual(exps[4].company, 'Fundação Futuro Digital');
    assert.strictEqual(exps[4].position, 'Instrutor de Informática');
    assert.strictEqual(exps[4].period, 'Mar 2017 – Fev 2019');
    assert.strictEqual(exps[4].bullets.length, 3, 'Fundação Futuro Digital must have exactly 3 bullets');

    const totalBullets = exps.reduce((acc, exp) => acc + exp.bullets.length, 0);
    assert.strictEqual(totalBullets, 15, 'Total experience bullets must equal exactly 15');

    console.log('✓ Test 1.5 Passed: Exactly 5 experiences extracted with 15 bullets (4, 4, 2, 2, 3), empty generalDescription and tag preservation.');

    // 1.6 Education Extraction (Exactly 2 entries)
    const edus = result.educationDetails.educations;
    assert.strictEqual(edus.length, 2, 'Must extract exactly 2 education entries');

    assert.strictEqual(edus[0].organization, 'Universidade Federal de Tecnologia');
    assert.strictEqual(edus[0].degree, 'Bacharelado em Engenharia de Computação');
    assert.strictEqual(edus[0].period, 'Previsão de conclusão em 2028');
    assert(edus[0].description.includes('Graduação em Engenharia de Computação'), 'Education description must match');

    assert.strictEqual(edus[1].organization, 'Instituto Técnico de Formação Profissional');
    assert.strictEqual(edus[1].degree, 'Técnico em Informática');
    assert.strictEqual(edus[1].period, 'Concluído em 2015');

    console.log('✓ Test 1.6 Passed: Exactly 2 education entries extracted without data loss.');

    // 1.7 Featured Projects Extraction (Exactly 3 projects with descriptions & 3 bullets each)
    const projs = result.projectDetails.projects;
    assert.strictEqual(projs.length, 3, 'Must extract exactly 3 projects');

    // Project 1: Vortex Render Engine
    assert.strictEqual(projs[0].title, 'Vortex Render Engine');
    assert.strictEqual(projs[0].description, 'C++20, Vulkan 1.3, Win32 API, Engenharia de Software de Baixo Nível, Graphics Engine');
    assert.strictEqual(projs[0].bullets.length, 3, 'Project 1 must have exactly 3 bullets');

    // Project 2: Aegis Mesh Network
    assert.strictEqual(projs[1].title, 'Aegis Mesh Network');
    assert.strictEqual(projs[1].description, 'Android Nativo, Kotlin, WebAssembly (Wasm), Criptografia, P2P / Mesh Networks (DTN)');
    assert.strictEqual(projs[1].bullets.length, 3, 'Project 2 must have exactly 3 bullets');

    // Project 3: Horizon Telemetry Suite
    assert.strictEqual(projs[2].title, 'Horizon Telemetry Suite');
    assert.strictEqual(projs[2].description, 'C#, .NET 8, WPF, MVVM, Multi-threading, CLI Tools, Telemetria de Sistemas');
    assert.strictEqual(projs[2].bullets.length, 3, 'Project 3 must have exactly 3 bullets');

    console.log('✓ Test 1.7 Passed: Exactly 3 featured projects with complete stacks and bullets extracted.');

    // Test 2: Bullet Extractor Unit Tests (Simples, •, –, multiline, sem bullets, duas experiências)
    // 2.1 Bullet Simples (-)
    const simpleBulletText = '- Desenvolvimento de APIs';
    assert.deepStrictEqual(ExperienceParser.extractBulletsFromText(simpleBulletText), ['Desenvolvimento de APIs']);

    // 2.2 Bullet com •
    const dotBulletText = '• Desenvolvimento de APIs';
    assert.deepStrictEqual(ExperienceParser.extractBulletsFromText(dotBulletText), ['Desenvolvimento de APIs']);

    // 2.3 Bullet com – (en-dash) e — (em-dash)
    const dashBulletText = '– Desenvolvimento de APIs\n— Arquitetura de microsserviços';
    assert.deepStrictEqual(ExperienceParser.extractBulletsFromText(dashBulletText), ['Desenvolvimento de APIs', 'Arquitetura de microsserviços']);

    // 2.4 Bullet Multilinha
    const multiLineBulletText = `- Desenvolvimento de uma API responsável por
  integrar múltiplos sistemas.`;
    assert.deepStrictEqual(ExperienceParser.extractBulletsFromText(multiLineBulletText), ['Desenvolvimento de uma API responsável por integrar múltiplos sistemas.']);

    // 2.5 Sem Bullets (não transformar parágrafos em bullets)
    const noBulletText = `Responsável pelo desenvolvimento do sistema.
Atuação com APIs REST.`;
    assert.deepStrictEqual(ExperienceParser.extractBulletsFromText(noBulletText), []);

    // 2.6 Duas experiências sem misturar bullets
    const twoExpText = `
Empresa A
Dev
2023 - 2024
- Bullet A1
- Bullet A2

Empresa B
Dev
2021 - 2022
- Bullet B1
- Bullet B2
`;
    const parsedTwoExp = ExperienceParser.parseExperiences(twoExpText);
    assert.strictEqual(parsedTwoExp.length, 2);
    assert.deepStrictEqual(parsedTwoExp[0].bullets, ['Bullet A1', 'Bullet A2']);
    assert.deepStrictEqual(parsedTwoExp[1].bullets, ['Bullet B1', 'Bullet B2']);

    console.log('✓ Test 2 Passed: Dedicated Bullet Extractor unit tests (- , • , – , multiline, no bullets, 2 distinct exps) verified.');

    // Test 3: Dynamic Skill Categories (No hardcoded keyword list)
    const dynamicSkillsSampleA = `
TECNOLOGIAS DE BACK-END
- PHP
- Laravel

FERRAMENTAS
- Docker
- Git
`;
    const parsedSkillsA = SkillsParser.parseSkills(dynamicSkillsSampleA);
    assert.strictEqual(parsedSkillsA.length, 2);
    assert.strictEqual(parsedSkillsA[0].category, 'TECNOLOGIAS DE BACK-END');
    assert.deepStrictEqual(parsedSkillsA[0].items, ['PHP', 'Laravel']);
    assert.strictEqual(parsedSkillsA[1].category, 'FERRAMENTAS');
    assert.deepStrictEqual(parsedSkillsA[1].items, ['Docker', 'Git']);

    const dynamicSkillsSampleB = `
MINHA STACK
- PHP
- Python

OUTRAS COMPETÊNCIAS
- Docker
`;
    const parsedSkillsB = SkillsParser.parseSkills(dynamicSkillsSampleB);
    assert.strictEqual(parsedSkillsB.length, 2);
    assert.strictEqual(parsedSkillsB[0].category, 'MINHA STACK');
    assert.deepStrictEqual(parsedSkillsB[0].items, ['PHP', 'Python']);
    assert.strictEqual(parsedSkillsB[1].category, 'OUTRAS COMPETÊNCIAS');
    assert.deepStrictEqual(parsedSkillsB[1].items, ['Docker']);

    console.log('✓ Test 3 Passed: Dynamic skill categories extracted without any hardcoded category keywords.');

    // Test 4: URL Masking and Unmasking Utility
    const textWithUrls = 'GitHub: https://github.com/mockuser and LinkedIn: https://linkedin.com/in/mockuser';
    const { maskedText, urlMap } = CandidateParser.maskUrls(textWithUrls);
    assert(maskedText.includes('__URL_0__'), 'Must mask first URL');
    assert(maskedText.includes('__URL_1__'), 'Must mask second URL');
    assert(!maskedText.includes('https://github.com/mockuser'), 'Must replace literal URL in text');

    const simulatedLlmResponse = {
        links: ['[__URL_0__](__URL_0__)', '__URL_1__']
    };
    const unmasked = CandidateParser.unmaskUrls(simulatedLlmResponse, urlMap);
    assert.strictEqual(unmasked.links[0], 'https://github.com/mockuser', 'Must restore pure literal URL without markdown');
    assert.strictEqual(unmasked.links[1], 'https://linkedin.com/in/mockuser', 'Must restore second pure URL');

    console.log('✓ Test 4 Passed: URL masking and unmasking prevents LLM formatting corruptions.');

    // Test 5: Fallback Resilience (LLM returns empty arrays -> Structural data is safely preserved)
    const mockStructuralData = {
        candidate: { name: 'Alexandre Silva', email: 'alexandre@example.com' },
        professionalSummary: 'Summary text',
        skills: [{ category: 'Minha Stack', items: ['JS', 'TS'] }],
        experiences: [{ company: 'Test Corp', position: 'Engineer', period: '2020-2022', generalDescription: '', bullets: ['Did things'] }],
        education: [
            { institution: 'Universidade Federal', degree: 'Engenharia', period: '2028', description: 'Desc 1' },
            { institution: 'Instituto Técnico', degree: 'Técnico', period: '2015', description: 'Desc 2' }
        ],
        projects: [
            { name: 'Proj 1', description: 'Stack 1', bullets: ['b1', 'b2', 'b3'] },
            { name: 'Proj 2', description: 'Stack 2', bullets: ['b1', 'b2', 'b3'] },
            { name: 'Proj 3', description: 'Stack 3', bullets: ['b1', 'b2', 'b3'] }
        ]
    };

    const mockEmptyLlmData = {
        skills: [],
        experiences: [],
        education: [],
        projects: []
    };

    const mergedWithEmptyLlm = ResumeMergeService.mergeAll(mockStructuralData, mockEmptyLlmData);
    assert.strictEqual(mergedWithEmptyLlm.education.length, 2, 'Empty LLM must not wipe 2 structural education entries');
    assert.strictEqual(mergedWithEmptyLlm.projects.length, 3, 'Empty LLM must not wipe 3 structural project entries');
    assert.strictEqual(mergedWithEmptyLlm.experiences.length, 1, 'Empty LLM must not wipe structural experience entries');

    console.log('✓ Test 5 Passed: Empty LLM fallback response safely prevented from wiping structural data.');

    // Test 6: Partial LLM Fallback (LLM returns 1 project -> Result preserves all 3 projects)
    const mockPartialLlmData = {
        projects: [
            {
                name: 'Proj 1',
                description: 'Stack 1',
                bullets: []
            }
        ]
    };

    const mergedWithPartialLlm = ResumeMergeService.mergeAll(mockStructuralData, mockPartialLlmData);
    assert.strictEqual(mergedWithPartialLlm.projects.length, 3, 'Partial LLM return must preserve all 3 projects');
    assert.strictEqual(mergedWithPartialLlm.projects[0].bullets.length, 3, 'Original bullets must not be wiped by empty LLM bullets');

    console.log('✓ Test 6 Passed: Partial LLM response successfully merged without dropping non-overlapping entries.');

    // Test 7: General Description strictness test
    const rawExpBlock = `
Alpha Tech Soluções
Desenvolvedor Full-Stack
Set 2025 - Presente

- Desenvolvimento...
`;
    const parsedExp = ExperienceParser.parseExperiences(rawExpBlock);
    assert.strictEqual(parsedExp[0].generalDescription, '', 'generalDescription must be empty string if no distinct text exists');

    console.log('✓ Test 7 Passed: generalDescription is strictly preserved as empty when no independent text exists.');

    console.log('\n🎉 ALL HYBRID PARSER, EXPERIENCE BULLETS & MERGE TESTS PASSED SUCCESSFULLY (100% FICTITIOUS DATA)!');
}

if (require.main === module) {
    runDeterministicTests().then(() => {
        process.exit(0);
    }).catch(err => {
        console.error('Test execution failed:', err);
        process.exit(1);
    });
}

module.exports = runDeterministicTests;
