const assert = require('assert');
const LayoutEngine = require('../layout/LayoutEngine');
const LayoutBlock = require('../layout/LayoutBlock');
const HeightEstimator = require('../layout/HeightEstimator');

console.log('\n=== TESTE DE PAGINAÇÃO DE PROJETOS ===\n');

// Simulate real projects as in the resume
const projectGenericOne = {
  title: 'ProjectTitleSample',
  role: 'Tecnologia A, Tecnologia B, Arquitetura de Software',
  bullets: [
    'Desenvolvimento de uma plataforma de alta performance focada na integração, otimização e processamento eficiente de dados.',
    'Projetado com arquitetura de zero dependências externas para garantir execução rápida, baixo consumo de memória e fácil portabilidade.',
    'Implementação de lógica eficiente para manipulação de fluxos e interações de baixo nível com o ecossistema, otimizando o processamento geral.'
  ]
};

const projectGenericTwo = {
  title: 'System Framework',
  role: 'Linguagem X, Framework Y, Gestão de Sistemas',
  bullets: [
    'Liderança de todo o ciclo de vida do desenvolvimento do produto "System" em Linguagem e Framework, atuando da concepção até deploy final.',
    'Direção do time no planejamento estratégico, divisão de sprints, mapeamento de tarefas e implementação de regras, fluxos e design do sistema.'
  ]
};
// Estima alturas
const heightProject1 = HeightEstimator.estimateProjects(projectGenericOne);
const heightProject2 = HeightEstimator.estimateProjects(projectGenericTwo);

console.log(`📊 Estimativas de altura:`);
console.log(`  NativeZipTools: ${heightProject1}px`);
console.log(`  Bubble Game: ${heightProject2}px`);
console.log();

// Test with actual A4 page height (210mm × 297mm with 22mm padding)
// Useful height: (297mm - 44mm) * 3.7795 ≈ 956px
const pageHeight = 950;

const engine = new LayoutEngine(pageHeight, true);

const blocks = [
  LayoutBlock.summary('<div>Lorem ipsum dolor sit amet consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</div>', 200),
  LayoutBlock.skills(
    '<div class="skill-group">Skills</div>',
    180
  ),
  LayoutBlock.experience(
    `<div>Experiência 1</div>`,
    150
  ),
  LayoutBlock.education(
    `<div>Educação 1</div>`,
    120
  ),
  LayoutBlock.projects(
    `<div class="item-block">
      <h3>${projectGenericOne.title}</h3>
      <div>${projectGenericOne.role}</div>
      <ul>${projectGenericOne.bullets.map(b => `<li>${b}</li>`).join('')}</ul>
    </div>`,
    heightProject1
  ),
  LayoutBlock.projects(
    `<div class="item-block">
      <h3>${projectGenericTwo.title}</h3>
      <div>${projectGenericTwo.role}</div>
      <ul>${projectGenericTwo.bullets.map(b => `<li>${b}</li>`).join('')}</ul>
    </div>`,
    heightProject2
  )
];

console.log(`\n📄 Rodando paginação com altura de página: ${pageHeight}px\n`);
const pages = engine.build(blocks);

console.log(`\n✅ Resultado: ${pages.length} página(s) gerada(s)`);

// Validation
assert(pages.length >= 2, 'Deveria ter pelo menos 2 páginas');
console.log('✅ Teste passou: Paginação funcionando corretamente!');
