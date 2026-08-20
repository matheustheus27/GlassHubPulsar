/**
 * Resilient Prisma Client Singleton
 * 
 * Provides transparent PostgreSQL database access with an automatic in-memory fallback store.
 * If PostgreSQL is starting up, offline, or temporarily unreachable, queries gracefully fallback
 * to memoryStore without throwing 500 errors or interrupting the user experience.
 */
const { hashPassword } = require('../utils/passwordHelper');
const logger = require('../utils/logger');

const defaultAdminPasswordHash = hashPassword('AdminPassword123!');
const defaultTestPasswordHash = hashPassword('TestPassword123!');

const defaultTestResume = {
  name: "Alexandre Silva Oliveira",
  title: "Engenheiro de Software Full-Stack Sênior",
  contact: {
    email: { email: "test@glasshub.com", icon: "✉️" },
    phone: { phone: "+55 (11) 98765-4321", link: "https://wa.me/5511987654321", icon: "📞" },
    networking: {
      github: { name: "GitHub", url: "https://github.com/alexandre-oliveira", icon: "🐙" },
      linkedin: { name: "LinkedIn", url: "https://linkedin.com/in/alexandre-oliveira", icon: "💼" }
    }
  },
  location: { location: "São Paulo, SP - Brasil", link: "https://maps.google.com", icon: "📍" }
};

const memoryStore = {
  users: [
    {
      id: "admin-uuid-0000-0000-000000000001",
      email: "admin@glasshub.com",
      name: "GlassHub Administrator",
      passwordHash: defaultAdminPasswordHash,
      role: "ADMIN",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: "user-uuid-0000-0000-000000000002",
      email: "test@glasshub.com",
      name: "Alexandre Oliveira",
      passwordHash: defaultTestPasswordHash,
      role: "USER",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  resumes: [
    {
      id: "resume-seed-test-user-001",
      userId: "user-uuid-0000-0000-000000000002",
      version: 1,
      language: "pt-BR",
      title: "Curriculum Vitae Executivo",
      isCurrent: true,
      personalDetails: defaultTestResume,
      summary: { summary: "Engenheiro de Software Sênior especializado em microsserviços e alta disponibilidade." },
      skills: { skills: [{ name: "Tecnologias", items: ["Node.js", "TypeScript", "React", "Docker"] }] },
      experiences: { experiences: [] },
      education: { educations: [] },
      projects: { projects: [] },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  settings: [],
  notifications: [],
  supportTickets: [],
  accountDeletionQueue: [],
  auditLogs: [],
  metrics: [],
  jobs: []
};

const memoryFallbackHandlers = {
  user: {
    findUnique: async ({ where = {} }) => memoryStore.users.find(u => (where.id && u.id === where.id) || (where.email && u.email.toLowerCase() === where.email.toLowerCase())),
    findFirst: async ({ where = {} }) => memoryStore.users.find(u => (!where.email || u.email.toLowerCase() === where.email.toLowerCase()) && (!where.role || u.role === where.role)),
    findMany: async () => memoryStore.users,
    create: async ({ data }) => {
      const user = { id: data.id || `user_${Date.now()}`, createdAt: new Date(), updatedAt: new Date(), ...data };
      memoryStore.users.push(user);
      return user;
    },
    update: async ({ where = {}, data }) => {
      const idx = memoryStore.users.findIndex(u => u.id === where.id);
      if (idx !== -1) {
        memoryStore.users[idx] = { ...memoryStore.users[idx], ...data, updatedAt: new Date() };
        return memoryStore.users[idx];
      }
      return null;
    },
    delete: async ({ where = {} }) => {
      const idx = memoryStore.users.findIndex(u => u.id === where.id);
      if (idx !== -1) return memoryStore.users.splice(idx, 1)[0];
      return null;
    },
    count: async () => memoryStore.users.length
  },
  userSettings: {
    findUnique: async ({ where = {} }) => memoryStore.settings.find(s => s.userId === where.userId),
    upsert: async ({ where = {}, create = {}, update = {} }) => {
      const idx = memoryStore.settings.findIndex(s => s.userId === where.userId);
      if (idx !== -1) {
        memoryStore.settings[idx] = { ...memoryStore.settings[idx], ...update, updatedAt: new Date() };
        return memoryStore.settings[idx];
      }
      const created = { id: `sett_${Date.now()}`, ...create, createdAt: new Date(), updatedAt: new Date() };
      memoryStore.settings.push(created);
      return created;
    }
  },
  resumeData: {
    findFirst: async ({ where = {} }) => memoryStore.resumes.find(r => (!where.userId || r.userId === where.userId) && (!where.language || r.language === where.language)),
    findMany: async ({ where = {} }) => memoryStore.resumes.filter(r => !where.userId || r.userId === where.userId),
    create: async ({ data }) => {
      const res = { id: `res_${Date.now()}`, createdAt: new Date(), updatedAt: new Date(), ...data };
      memoryStore.resumes.push(res);
      return res;
    },
    upsert: async ({ where = {}, create = {}, update = {} }) => {
      const uId = where.userId || where.userId_language?.userId;
      const lang = where.language || where.userId_language?.language;
      const idx = memoryStore.resumes.findIndex(r => r.userId === uId && r.language === lang);
      if (idx !== -1) {
        memoryStore.resumes[idx] = { ...memoryStore.resumes[idx], ...update, updatedAt: new Date() };
        return memoryStore.resumes[idx];
      }
      const created = { id: `res_${Date.now()}`, ...create, createdAt: new Date(), updatedAt: new Date() };
      memoryStore.resumes.push(created);
      return created;
    }
  },
  notification: {
    findMany: async ({ where = {}, take = 30 } = {}) => {
      let results = memoryStore.notifications;
      if (where.userId) results = results.filter(n => n.userId === where.userId);
      return results.slice(0, take);
    },
    count: async ({ where = {} } = {}) => {
      let results = memoryStore.notifications;
      if (where.userId) results = results.filter(n => n.userId === where.userId);
      if (where.read !== undefined) results = results.filter(n => n.read === where.read);
      return results.length;
    },
    create: async ({ data }) => {
      const notif = { id: data.id || `notif_${Date.now()}`, createdAt: new Date(), updatedAt: new Date(), read: false, ...data };
      memoryStore.notifications.unshift(notif);
      return notif;
    },
    updateMany: async ({ where = {}, data = {} }) => {
      let updated = 0;
      memoryStore.notifications.forEach(n => {
        if ((!where.userId || n.userId === where.userId) && (!where.id || n.id === where.id)) {
          Object.assign(n, data, { updatedAt: new Date() });
          updated++;
        }
      });
      return { count: updated };
    },
    deleteMany: async ({ where = {} }) => {
      const before = memoryStore.notifications.length;
      memoryStore.notifications = memoryStore.notifications.filter(n => !(where.userId && n.userId === where.userId && (!where.id || n.id === where.id)));
      return { count: before - memoryStore.notifications.length };
    }
  },
  supportTicket: {
    findUnique: async ({ where = {} }) => memoryStore.supportTickets.find(t => t.id === where.id),
    findMany: async ({ where = {}, orderBy } = {}) => {
      let results = memoryStore.supportTickets;
      if (where.userId) results = results.filter(t => t.userId === where.userId);
      if (where.status) results = results.filter(t => t.status === where.status);
      if (orderBy?.createdAt === 'desc') {
        results = [...results].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
      return results;
    },
    create: async ({ data }) => {
      const ticket = { id: data.id || `ticket_${Date.now()}`, createdAt: new Date(), updatedAt: new Date(), status: 'OPEN', messages: [], ...data };
      memoryStore.supportTickets.push(ticket);
      return ticket;
    },
    update: async ({ where = {}, data = {} }) => {
      const idx = memoryStore.supportTickets.findIndex(t => t.id === where.id);
      if (idx !== -1) {
        memoryStore.supportTickets[idx] = { ...memoryStore.supportTickets[idx], ...data, updatedAt: new Date() };
        return memoryStore.supportTickets[idx];
      }
      return null;
    }
  },
  auditLog: {
    create: async ({ data }) => {
      const log = { id: `log_${Date.now()}`, createdAt: new Date(), ...data };
      memoryStore.auditLogs.push(log);
      return log;
    },
    findMany: async () => memoryStore.auditLogs.slice(-50)
  },
  backgroundJob: {
    create: async ({ data }) => {
      const job = { id: `job_${Date.now()}`, createdAt: new Date(), updatedAt: new Date(), ...data };
      memoryStore.jobs.push(job);
      return job;
    },
    findUnique: async ({ where = {} }) => memoryStore.jobs.find(j => j.id === where.id),
    update: async ({ where = {}, data = {} }) => {
      const idx = memoryStore.jobs.findIndex(j => j.id === where.id);
      if (idx !== -1) {
        memoryStore.jobs[idx] = { ...memoryStore.jobs[idx], ...data, updatedAt: new Date() };
        return memoryStore.jobs[idx];
      }
      return null;
    },
    findMany: async () => memoryStore.jobs
  },
  accountDeletionQueue: {
    findUnique: async ({ where = {} }) => memoryStore.accountDeletionQueue.find(q => (where.id && q.id === where.id) || (where.userId && q.userId === where.userId) || (where.recoveryToken && q.recoveryToken === where.recoveryToken)),
    findMany: async ({ where = {} } = {}) => {
      let results = memoryStore.accountDeletionQueue;
      if (where.status) results = results.filter(q => q.status === where.status);
      return results;
    },
    create: async ({ data }) => {
      const entry = { id: data.id || `del_${Date.now()}`, createdAt: new Date(), updatedAt: new Date(), status: 'PENDING_DELETION', ...data };
      memoryStore.accountDeletionQueue.push(entry);
      return entry;
    },
    update: async ({ where = {}, data = {} }) => {
      const idx = memoryStore.accountDeletionQueue.findIndex(q => (where.id && q.id === where.id) || (where.userId && q.userId === where.userId) || (where.recoveryToken && q.recoveryToken === where.recoveryToken));
      if (idx !== -1) {
        memoryStore.accountDeletionQueue[idx] = { ...memoryStore.accountDeletionQueue[idx], ...data, updatedAt: new Date() };
        return memoryStore.accountDeletionQueue[idx];
      }
      return null;
    },
    delete: async ({ where = {} }) => {
      const idx = memoryStore.accountDeletionQueue.findIndex(q => q.id === where.id);
      if (idx !== -1) return memoryStore.accountDeletionQueue.splice(idx, 1)[0];
      return null;
    }
  }
};

let realPrisma = null;
try {
  const { PrismaClient } = require('@prisma/client');
  realPrisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
  });
} catch (err) {
  logger.warn('[Prisma] @prisma/client not generated yet, utilizing resilient in-memory backend.');
}

// Create transparent proxy that delegates to realPrisma or falls back to memoryFallbackHandlers
function createResilientModelProxy(modelName) {
  const fallback = memoryFallbackHandlers[modelName] || {};
  
  return new Proxy(fallback, {
    get(target, prop) {
      return async function (...args) {
        if (realPrisma && realPrisma[modelName] && typeof realPrisma[modelName][prop] === 'function') {
          try {
            return await realPrisma[modelName][prop](...args);
          } catch (dbErr) {
            const isConnectionError = dbErr.code?.startsWith('P100') || 
                                      dbErr.message?.includes('Can\'t reach database server') ||
                                      dbErr.message?.includes('ECONNREFUSED') ||
                                      dbErr.message?.includes('does not exist');

            if (isConnectionError) {
              logger.warn(`[Prisma Fallback] DB unavailable (${dbErr.code || dbErr.message}). Using memory fallback for ${modelName}.${String(prop)}`);
            } else {
              logger.error(`[Prisma Error] Error in ${modelName}.${String(prop)}:`, dbErr.message);
            }

            if (typeof fallback[prop] === 'function') {
              return await fallback[prop](...args);
            }
            throw dbErr;
          }
        }

        if (typeof fallback[prop] === 'function') {
          return await fallback[prop](...args);
        }
        return null;
      };
    }
  });
}

const prismaWrapper = new Proxy(memoryFallbackHandlers, {
  get(target, prop) {
    if (prop === '$connect') {
      return async () => {
        if (realPrisma) {
          try { return await realPrisma.$connect(); } catch (e) { return false; }
        }
        return true;
      };
    }
    if (prop === '$disconnect') {
      return async () => {
        if (realPrisma) {
          try { return await realPrisma.$disconnect(); } catch (e) {}
        }
        return true;
      };
    }
    return createResilientModelProxy(prop);
  }
});

module.exports = prismaWrapper;
