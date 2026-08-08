const assert = require('assert');
const LayoutEngine = require('../layout/LayoutEngine');
const LayoutBlock = require('../layout/LayoutBlock');

const engine = new LayoutEngine(140);

const pages = engine.build([
  LayoutBlock.summary('<div>Resumo</div>', 70),
  LayoutBlock.projects('<div>Projeto</div>', 50)
]);

assert.strictEqual(pages.length, 2, 'should move the first project block to a new page when section overhead would overflow');
assert.strictEqual(pages[0].sections.length, 1, 'first page should keep the summary block');
assert.strictEqual(pages[1].sections.length, 1, 'second page should contain the project block');
console.log('layout-engine regression test passed');
