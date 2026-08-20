/**
 * Structured JSON Logger for Production Observability, Datadog APM & PostgreSQL Log Engine
 */
const crypto = require('crypto');

class Logger {
  constructor(serviceName = 'backend-api') {
    this.serviceName = serviceName;
    this.prisma = null;
  }

  getPrisma() {
    if (!this.prisma) {
      try {
        this.prisma = require('../prisma/client');
      } catch (e) {
        // Prisma not initialized yet
      }
    }
    return this.prisma;
  }

  /**
   * Generates or extracts a trace_id
   */
  getTraceId(req) {
    if (req && req.headers && req.headers['x-trace-id']) {
      return req.headers['x-trace-id'];
    }
    return crypto.randomUUID();
  }

  async persistToDatabase(level, message, context = {}) {
    const prisma = this.getPrisma();
    if (!prisma || !prisma.systemExecutionLog) return;

    try {
      await prisma.systemExecutionLog.create({
        data: {
          service: this.serviceName,
          level: level.toUpperCase(),
          traceId: context.trace_id || null,
          durationMs: typeof context.duration_ms === 'number' ? context.duration_ms : null,
          route: context.path || null,
          statusCode: typeof context.status_code === 'number' ? context.status_code : null,
          message: String(message),
          metadata: context
        }
      });
    } catch (err) {
      // Avoid recursive logger crashes
    }
  }

  formatLog(level, message, context = {}) {
    const memory = process.memoryUsage();
    const logObject = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      service: this.serviceName,
      message,
      trace_id: context.trace_id || crypto.randomUUID(),
      span_id: context.span_id || crypto.randomBytes(8).toString('hex'),
      duration_ms: context.duration_ms || undefined,
      memory_mb: Math.round(memory.heapUsed / 1024 / 1024 * 100) / 100,
      ...context
    };

    return JSON.stringify(logObject);
  }

  info(message, context = {}) {
    console.log(this.formatLog('info', message, context));
    this.persistToDatabase('INFO', message, context);
  }

  warn(message, context = {}) {
    console.warn(this.formatLog('warn', message, context));
    this.persistToDatabase('WARN', message, context);
  }

  error(message, errorOrContext = {}) {
    let context = {};
    if (errorOrContext instanceof Error) {
      context = {
        error_name: errorOrContext.name,
        error_message: errorOrContext.message,
        stack: errorOrContext.stack
      };
    } else {
      context = errorOrContext;
    }
    console.error(this.formatLog('error', message, context));
    this.persistToDatabase('ERROR', message, context);
  }

  debug(message, context = {}) {
    if (process.env.DEBUG || process.env.NODE_ENV === 'development') {
      console.debug(this.formatLog('debug', message, context));
    }
  }

  /**
   * Express Middleware for structured request telemetry
   */
  requestMiddleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      const trace_id = this.getTraceId(req);
      req.trace_id = trace_id;

      res.setHeader('X-Trace-Id', trace_id);

      res.on('finish', () => {
        const duration_ms = Date.now() - startTime;
        const logData = {
          trace_id,
          method: req.method,
          path: req.originalUrl,
          status_code: res.statusCode,
          ip: req.ip || req.connection?.remoteAddress,
          duration_ms,
          user_agent: req.headers['user-agent']
        };

        if (res.statusCode >= 400) {
          this.warn(`${req.method} ${req.originalUrl} - ${res.statusCode}`, logData);
        } else {
          this.info(`${req.method} ${req.originalUrl} - ${res.statusCode}`, logData);
        }
      });

      next();
    };
  }
}

module.exports = new Logger();
