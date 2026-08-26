/**
 * RAG (Retrieval-Augmented Generation) & Semantic Vector Service
 * Generates vector embeddings via Ollama (nomic-embed-text), chunks document text,
 * and performs semantic similarity retrieval to augment AI Chat & ATS scoring context.
 */
const logger = require('../utils/logger');
const metrics = require('../utils/metrics');

class RAGService {
  constructor() {
    // In-memory vector store indexed by userId -> Array of { id, userId, text, embedding, tfidfVector, createdAt }
    this.vectorStore = new Map();
    this.embeddingModel = process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text';
  }

  /**
   * Generate high-dimensional vector embedding for text using Ollama Embeddings API
   */
  async generateEmbedding(text) {
    if (!text || typeof text !== 'string' || !text.trim()) return null;

    const ollamaHost = process.env.OLLAMA_HOST || 'http://ollama:11434';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      // Primary API: /api/embed (Ollama v0.1.44+)
      const response = await fetch(`${ollamaHost}/api/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.embeddingModel,
          input: text.trim()
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        const embedding = data?.embeddings?.[0];
        if (Array.isArray(embedding) && embedding.length > 0) {
          return embedding;
        }
      }
    } catch (err) {
      clearTimeout(timeout);
      logger.warn(`[RAGService] Primary embedding API (/api/embed with ${this.embeddingModel}) error:`, err.message);

      // Legacy fallback API: /api/embeddings
      try {
        const legacyRes = await fetch(`${ollamaHost}/api/embeddings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama3.2',
            prompt: text.trim()
          })
        });

        if (legacyRes.ok) {
          const legacyData = await legacyRes.json();
          if (Array.isArray(legacyData?.embedding) && legacyData.embedding.length > 0) {
            return legacyData.embedding;
          }
        }
      } catch (e2) {
        logger.warn('[RAGService] Fallback embedding API error:', e2.message);
      }
    }

    return null;
  }

  /**
   * Cosine Similarity between two dense float embedding arrays
   */
  cosineSimilarityDense(vecA, vecB) {
    if (!Array.isArray(vecA) || !Array.isArray(vecB) || vecA.length !== vecB.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      const a = vecA[i];
      const b = vecB[i];
      dotProduct += a * b;
      normA += a * a;
      normB += b * b;
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Lexical TF-IDF fallback vectorizer
   */
  tokenizeAndVectorize(text) {
    if (!text || typeof text !== 'string') return new Map();
    const words = text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);

    const freqMap = new Map();
    for (const w of words) {
      freqMap.set(w, (freqMap.get(w) || 0) + 1);
    }
    return freqMap;
  }

  /**
   * Cosine Similarity for lexical TF-IDF fallback
   */
  cosineSimilarityLexical(vecA, vecB) {
    if (!vecA || !vecB || vecA.size === 0 || vecB.size === 0) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (const [term, freq] of vecA.entries()) {
      normA += freq * freq;
      if (vecB.has(term)) {
        dotProduct += freq * vecB.get(term);
      }
    }

    for (const freq of vecB.values()) {
      normB += freq * freq;
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Intelligent semantic chunking with sliding-window overlap
   */
  chunkText(text, targetChunkSize = 450, overlap = 80) {
    if (!text || typeof text !== 'string') return [];

    const rawParagraphs = text
      .split(/\n{2,}/)
      .map(p => p.trim())
      .filter(Boolean);

    const chunks = [];
    let currentChunk = '';

    for (const para of rawParagraphs) {
      if ((currentChunk + '\n\n' + para).length <= targetChunkSize) {
        currentChunk = currentChunk ? `${currentChunk}\n\n${para}` : para;
      } else {
        if (currentChunk) chunks.push(currentChunk);
        currentChunk = para;
      }
    }

    if (currentChunk) chunks.push(currentChunk);

    return chunks.length > 0 ? chunks : [text.trim()];
  }

  /**
   * Generate vector embeddings in a single batch request to Ollama /api/embed
   */
  async generateEmbeddingsBatch(chunks) {
    if (!Array.isArray(chunks) || chunks.length === 0) return [];

    const ollamaHost = process.env.OLLAMA_HOST || 'http://ollama:11434';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch(`${ollamaHost}/api/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.embeddingModel,
          input: chunks.map(c => typeof c === 'string' ? c.trim() : '')
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data?.embeddings) && data.embeddings.length > 0) {
          return data.embeddings;
        }
      }
    } catch (err) {
      clearTimeout(timeout);
      logger.warn(`[RAGService] Batch embedding API error, falling back to parallel requests:`, err.message);
    }

    return Promise.all(chunks.map(c => this.generateEmbedding(c)));
  }

  /**
   * Index raw text into semantic vector chunks for user
   */
  async indexText(userId, rawText) {
    if (!userId || !rawText || typeof rawText !== 'string' || !rawText.trim()) return;

    const chunks = this.chunkText(rawText);
    logger.info(`[RAGService] Generating Ollama vector embeddings for ${chunks.length} chunks in batch (user: ${userId})...`);

    const embeddings = await this.generateEmbeddingsBatch(chunks);

    const indexedChunks = chunks.map((chunkText, idx) => {
      const embedding = Array.isArray(embeddings[idx]) ? embeddings[idx] : null;
      const tfidfVector = this.tokenizeAndVectorize(chunkText);
      return {
        id: `${userId}_chunk_${idx}_${Date.now()}`,
        userId,
        text: chunkText,
        embedding,
        tfidfVector,
        createdAt: new Date()
      };
    });

    this.vectorStore.set(String(userId), indexedChunks);
    logger.info(`[RAGService] Indexed ${indexedChunks.length} vector chunks into Ollama RAG store for user [${userId}]`);
    metrics.increment('rag.documents_indexed');
  }

  /**
   * Query most relevant context chunks for RAG augmentation
   */
  async queryRelevantContext(userId, queryText, topK = 4) {
    const key = String(userId);
    const userChunks = this.vectorStore.get(key) || [];
    if (userChunks.length === 0 || !queryText || typeof queryText !== 'string') return [];

    const queryEmbedding = await this.generateEmbedding(queryText);
    const queryTfidf = this.tokenizeAndVectorize(queryText);

    const scored = userChunks.map(chunk => {
      let score = 0;
      if (queryEmbedding && Array.isArray(chunk.embedding)) {
        score = this.cosineSimilarityDense(queryEmbedding, chunk.embedding);
      } else {
        score = this.cosineSimilarityLexical(queryTfidf, chunk.tfidfVector);
      }
      return { ...chunk, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const topResults = scored.slice(0, topK).filter(r => r.score > 0.05);

    logger.info(`[RAGService] Retrieved ${topResults.length} RAG vector context chunks for query "${queryText.slice(0, 30)}..." (user: ${userId})`);
    return topResults.map(r => r.text);
  }

  /**
   * Returns vector store statistics for SRE Telemetry Cockpit
   */
  getStats() {
    let totalChunks = 0;
    let embeddedChunks = 0;
    for (const chunks of this.vectorStore.values()) {
      totalChunks += chunks.length;
      embeddedChunks += chunks.filter(c => Array.isArray(c.embedding)).length;
    }
    return {
      indexedUsersCount: this.vectorStore.size,
      totalChunks,
      embeddedChunks,
      embeddingModel: this.embeddingModel
    };
  }
}

module.exports = new RAGService();
