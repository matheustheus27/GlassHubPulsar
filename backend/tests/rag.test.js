const assert = require('assert');
const RAGService = require('../services/RAGService');

async function runRAGTests() {
  console.log('[Test] Running Ollama RAG & Semantic Vector Search tests...\n');

  const userId = 'user_test_rag_123';
  const rawText = `
MATHEUS THIAGO DE SOUZA FERREIRA
DESENVOLVEDOR DE SOFTWARE

RESUMO PROFISSIONAL
Desenvolvedor de Software com 9 anos de experiência no setor de tecnologia, sendo 7 dedicados à engenharia de back-end, desenvolvimento full-stack e arquitetura de sistemas escaláveis. Especialista na construção de APIs REST robustas, integração de sistemas complexos e criação de pipelines de dados assíncronos.

COMPETÊNCIAS TÉCNICAS
PHP, Python, C#, Java, JavaScript, TypeScript, Node.js, Express, Slim, Symfony, Vue, React, Docker, Jenkins, MongoDB, Oracle SQL, SQL Server, Redis.

HISTÓRICO PROFISSIONAL
Desenvolvedor Full-Stack (Time de Integrações) - Empresa Retail
Liderança técnica na equipe de Integrações do Retail. Atuação direta na integração com ERPs e parceiros como Keeta e Zigpay. Desenvolvimento de rotinas em Oracle SQL e SQL Server. Uso de Laravel, Slim Framework, componentes Symfony, Docker e Jenkins.

Desenvolvedor de Software - Empresa Games & Tech
Desenvolvimento de aplicações interativas em C# e Unity, integração de redes locais e servidores Linux/Windows. Automação de tarefas com scripts Bash e Python.

FORMAÇÃO ACADÊMICA
Engenharia de Computação - CEFET-MG (Concluído em 2021)
Foco em redes de computadores, inteligência artificial e otimização de algoritmos.
  `;

  // Test 1: Indexing text into Ollama RAG Vector Store
  await RAGService.indexText(userId, rawText);
  const stats = RAGService.getStats();
  assert(stats.totalChunks >= 3, 'Must chunk document into at least 3 semantic fragments');
  assert.strictEqual(stats.indexedUsersCount, 1, 'Must track 1 active user');
  console.log(`✓ Test 1 Passed: Document indexed into ${stats.totalChunks} semantic chunks.`);

  // Test 2: Semantic Vector Query Retrieval
  const queryText = 'Quais bancos de dados o Matheus utilizou na empresa Retail?';
  const retrievedChunks = await RAGService.queryRelevantContext(userId, queryText, 2);

  assert(retrievedChunks.length > 0, 'Must retrieve relevant context chunks');
  const combinedContext = retrievedChunks.join('\n');
  assert(
    combinedContext.includes('Oracle SQL') || combinedContext.includes('Retail') || combinedContext.includes('COMPETÊNCIAS'),
    'Retrieved context must contain relevant section fragments'
  );
  console.log('✓ Test 2 Passed: Semantic vector similarity search retrieved relevant candidate context.');

  // Test 3: SRE Telemetry Cockpit Stats
  assert(stats.embeddingModel === 'nomic-embed-text', 'Embedding model must be nomic-embed-text');
  console.log('✓ Test 3 Passed: SRE Telemetry Stats returned embedding model metrics.');

  console.log('\n🎉 ALL OLLAMA RAG TESTS PASSED SUCCESSFULLY!');
}

if (require.main === module) {
  runRAGTests().catch(err => {
    console.error('RAG test failed:', err);
    process.exit(1);
  });
}

module.exports = runRAGTests;
