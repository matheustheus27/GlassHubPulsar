const assert = require('assert');
const analyticsWorker = require('../workers/analyticsWorker');

console.log('\n=== RUNNING ATS SCORER & ANALYTICS WORKER TESTS ===\n');

const mockResume = {
  personal: { name: 'Alexandre Oliveira', title: 'Senior Developer' },
  summary: { summary: 'Experiente em microsserviços e TypeScript.' },
  skills: {
    skills: [
      { name: 'Frontend', items: ['React', 'TypeScript', 'TailwindCSS'] },
      { name: 'Backend', items: ['Node.js', 'Express', 'PostgreSQL'] }
    ]
  },
  experiences: {
    experiences: [
      { company: 'Tech Corp', role: 'Senior Developer', bullets: ['Liderou desenvolvimento de backend.'] }
    ]
  },
  projects: {
    projects: [
      { title: 'Glassmorphic CV', bullets: ['Criou plataforma de alta performance.'] }
    ]
  }
};

const result = analyticsWorker.calculateHeuristicScore(mockResume, 'pt-BR');

assert(typeof result.overallScore === 'number' && result.overallScore >= 0 && result.overallScore <= 100, 'Score should be between 0 and 100');
assert(Array.isArray(result.missingKeywords), 'missingKeywords must be an array');
assert(!result.missingKeywords.includes('Microsserviços'), 'Should NOT suggest Microsserviços if candidate already has it in summary/skills');
assert(!result.missingKeywords.includes('Microservices Architecture'), 'Should NOT suggest Microservices in English if candidate has Microsserviços in PT');
assert(result.actionVerbsDensity && typeof result.actionVerbsDensity.score === 'number', 'actionVerbsDensity must have score');
assert(Array.isArray(result.actionableRecommendations), 'actionableRecommendations must be array');

console.log('✅ ATS Score Calculated:', result.overallScore);
console.log('✅ Summary:', result.summary);
console.log('✅ Missing Keywords (Microsserviços recognized as already present):', result.missingKeywords.join(', '));
console.log('✅ Recommendations Count:', result.actionableRecommendations.length);

console.log('\n🎉 ATS SCORER TESTS PASSED SUCCESSFULLY!\n');
