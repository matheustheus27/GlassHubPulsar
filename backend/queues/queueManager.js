/**
 * Asynchronous Message Queue & Worker Manager (BullMQ / Redis / Resilient Fallback)
 * Handles job dispatching, concurrent worker processing, and rich execution logs.
 */
const logger = require('../utils/logger');

let Queue, Worker;
try {
  ({ Queue, Worker } = require('bullmq'));
} catch (e) {
  Queue = null;
  Worker = null;
}

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);

const connection = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: null,
  lazyConnect: true
};

class InMemoryQueue {
  constructor(name) {
    this.name = name;
    this.jobs = [];
    this.isPaused = false;
    this.handlers = [];
  }

  async add(jobName, data, opts = {}) {
    const job = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: jobName,
      data,
      opts,
      progress: 0,
      status: 'waiting',
      timestamp: Date.now(),
      updateProgress: async (p) => {
        job.progress = p;
        const queueTag = this.name.toUpperCase();
        console.log(`[WORKER: ${queueTag}] 📊 [Job #${job.id}] Progresso: ${p}%`);
        if (job.onProgress) job.onProgress(p);
      }
    };
    this.jobs.push(job);

    const queueTag = this.name.toUpperCase();
    console.log(`[QUEUE: ${queueTag}] 📥 [Job #${job.id}] Tarefa '${jobName}' enfileirada.`);

    // If not paused and handler exists, process asynchronously
    if (!this.isPaused && this.handlers.length > 0) {
      setTimeout(async () => {
        job.status = 'active';
        console.log(`[WORKER: ${queueTag}] 🚀 [Job #${job.id}] Iniciando processamento...`);
        const startTime = Date.now();
        for (const handler of this.handlers) {
          try {
            job.returnvalue = await handler(job);
            job.status = 'completed';
            const duration = Date.now() - startTime;
            console.log(`[WORKER: ${queueTag}] ✅ [Job #${job.id}] Concluído com sucesso em ${duration}ms.`);
          } catch (err) {
            job.status = 'failed';
            job.failedReason = err.message;
            console.error(`[WORKER: ${queueTag}] ❌ [Job #${job.id}] Falha na execução: ${err.message}`, err.stack);
          }
        }
      }, 50);
    }

    return job;
  }

  async getJobCounts() {
    return {
      waiting: this.jobs.filter(j => j.status === 'waiting').length,
      active: this.jobs.filter(j => j.status === 'active').length,
      completed: this.jobs.filter(j => j.status === 'completed').length,
      failed: this.jobs.filter(j => j.status === 'failed').length,
      paused: this.isPaused ? 1 : 0
    };
  }

  async pause() {
    this.isPaused = true;
    console.log(`[QUEUE: ${this.name.toUpperCase()}] ⏸️ Fila pausada.`);
    return true;
  }

  async resume() {
    this.isPaused = false;
    console.log(`[QUEUE: ${this.name.toUpperCase()}] ▶️ Fila retomada.`);
    // Process any waiting jobs
    const waiting = this.jobs.filter(j => j.status === 'waiting');
    for (const job of waiting) {
      job.status = 'active';
      for (const handler of this.handlers) {
        try {
          job.returnvalue = await handler(job);
          job.status = 'completed';
        } catch (err) {
          job.status = 'failed';
          job.failedReason = err.message;
        }
      }
    }
    return true;
  }

  async clean() {
    this.jobs = [];
    console.log(`[QUEUE: ${this.name.toUpperCase()}] 🧹 Fila limpa.`);
    return true;
  }

  registerWorker(handler) {
    this.handlers.push(handler);
    console.log(`[QUEUE: ${this.name.toUpperCase()}] 🛠️ Worker handler registrado em memória.`);
  }
}

class QueueManager {
  constructor() {
    this.queues = {};
    this.workers = {};
    this.isRedisAvailable = false;
    this.initQueues();
  }

  initQueues() {
    const queueNames = ['translation', 'notification', 'pdf', 'analytics', 'ocr', 'cdc'];

    for (const name of queueNames) {
      if (Queue && process.env.USE_REDIS === 'true') {
        try {
          const q = new Queue(name, { connection });
          q.on('error', (err) => {
            logger.warn(`[QueueManager] Queue ${name} Redis note:`, err.message);
          });
          this.queues[name] = q;
          this.isRedisAvailable = true;
          logger.info(`[QueueManager] BullMQ Queue initialized: ${name} (Redis: ${REDIS_HOST}:${REDIS_PORT})`);
        } catch (e) {
          this.queues[name] = new InMemoryQueue(name);
        }
      } else {
        this.queues[name] = new InMemoryQueue(name);
      }
    }
  }

  getQueue(name) {
    if (!this.queues[name]) {
      this.queues[name] = new InMemoryQueue(name);
    }
    return this.queues[name];
  }

  /**
   * Registers a worker processor for a queue (BullMQ or In-Memory)
   * @param {string} name 
   * @param {Function} processor 
   */
  registerWorker(name, processor) {
    const queueTag = name.toUpperCase();

    if (Worker && process.env.USE_REDIS === 'true') {
      try {
        const worker = new Worker(name, async (job) => {
          const startTime = Date.now();
          console.log(`[WORKER: ${queueTag}] 🚀 [Job #${job.id}] Iniciando processamento...`);
          try {
            const result = await processor(job);
            const duration = Date.now() - startTime;
            console.log(`[WORKER: ${queueTag}] ✅ [Job #${job.id}] Concluído com sucesso em ${duration}ms.`);
            return result;
          } catch (err) {
            console.error(`[WORKER: ${queueTag}] ❌ [Job #${job.id}] Falhou: ${err.message}`, err.stack);
            throw err;
          }
        }, { connection, concurrency: 2 });

        worker.on('progress', (job, progress) => {
          console.log(`[WORKER: ${queueTag}] 📊 [Job #${job.id}] Progresso: ${progress}%`);
        });

        worker.on('failed', (job, err) => {
          logger.error(`[WORKER: ${queueTag}] Job ${job?.id} failed:`, err);
        });

        worker.on('error', (err) => {
          logger.error(`[WORKER: ${queueTag}] Worker error:`, err);
        });

        this.workers[name] = worker;
        console.log(`[WORKER: ${queueTag}] 🛠️ BullMQ Worker inicializado e escutando Redis (${REDIS_HOST}:${REDIS_PORT})`);
        return worker;
      } catch (err) {
        logger.warn(`[QueueManager] Could not start BullMQ Worker for ${name}, falling back to memory queue:`, err.message);
      }
    }

    // In-memory fallback
    const q = this.getQueue(name);
    if (q.registerWorker) {
      q.registerWorker(processor);
    }
  }

  async getAllQueueStats() {
    const stats = {};
    for (const [name, queue] of Object.entries(this.queues)) {
      try {
        stats[name] = await queue.getJobCounts();
      } catch (err) {
        stats[name] = { waiting: 0, active: 0, completed: 0, failed: 0, paused: 0 };
      }
    }
    return stats;
  }

  async pauseQueue(name) {
    const q = this.getQueue(name);
    await q.pause();
    logger.info(`Queue [${name}] paused`);
    return { success: true, message: `Queue ${name} paused` };
  }

  async resumeQueue(name) {
    const q = this.getQueue(name);
    await q.resume();
    logger.info(`Queue [${name}] resumed`);
    return { success: true, message: `Queue ${name} resumed` };
  }

  async cleanQueue(name) {
    const q = this.getQueue(name);
    await q.clean();
    logger.info(`Queue [${name}] cleaned`);
    return { success: true, message: `Queue ${name} cleaned` };
  }
}

module.exports = new QueueManager();
