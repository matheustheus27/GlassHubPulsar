const assert = require('assert');
const ContactLinkOptimizer = require('../layout/ContactLinkOptimizer');

console.log('\n=== RUNNING CONTACT LINK OPTIMIZER TESTS ===\n');

// Test 1: Single item
const singleItem = [{ title: 'São Paulo, SP', link: '#', icon: '📍' }];
const rows1 = ContactLinkOptimizer.balanceLinks(singleItem, 680);
assert.strictEqual(rows1.length, 1);
assert.strictEqual(rows1[0].length, 1);
console.log('✅ Test 1 Passed: Single item renders in 1 row.');

// Test 2: 4 items (should balance into 2x2 if too wide for 1 line, or 1x4 if narrow)
const fourItems = [
  { title: 'São Paulo, SP', link: '#', icon: '📍' },
  { title: 'alexandre.oliveira@example.com', link: 'mailto:...', icon: '✉️' },
  { title: '+55 (11) 98765-4321', link: 'tel:...', icon: '📞' },
  { title: 'github.com/alexandre-dev', link: 'https:...', icon: '🐙' }
];

// Test with restricted container (e.g. 400px)
const rows4Narrow = ContactLinkOptimizer.balanceLinks(fourItems, 400);
assert.strictEqual(rows4Narrow.length, 2, '4 items in narrow container should split into 2 rows');
assert.strictEqual(rows4Narrow[0].length, 2, 'Row 1 should have 2 items');
assert.strictEqual(rows4Narrow[1].length, 2, 'Row 2 should have 2 items (No orphan)');
console.log('✅ Test 2 Passed: 4 items balance strictly 2x2 without orphan links.');

// Test 3: 5 items (should balance 3x2 or 2x3 instead of 4+1)
const fiveItems = [
  ...fourItems,
  { title: 'linkedin.com/in/alexandre-dev', link: 'https:...', icon: '💼' }
];

const rows5 = ContactLinkOptimizer.balanceLinks(fiveItems, 500);
assert.strictEqual(rows5.length, 2, '5 items should balance into 2 rows');
assert(rows5[0].length >= 2 && rows5[1].length >= 2, 'Neither row should have a solitary orphan item');
console.log(`✅ Test 3 Passed: 5 items balance symmetrically: ${rows5[0].length}x${rows5[1].length}`);

// Test 4: HTML render output
const html = ContactLinkOptimizer.renderHtml(fiveItems, 500);
assert(html.includes('contacts-balanced-grid'), 'HTML should wrap in balanced grid class');
assert(html.includes('contacts-row-1') && html.includes('contacts-row-2'), 'HTML should contain multiple rows');
console.log('✅ Test 4 Passed: HTML renders balanced rows cleanly.');

console.log('\n🎉 ALL CONTACT LINK OPTIMIZER TESTS PASSED SUCCESSFULLY!\n');
