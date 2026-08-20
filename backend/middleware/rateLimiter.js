/**
 * Rate Limiter Middleware for Brute Force and AI Abuse Protection
 */
class RateLimiter {
  constructor(windowMs = 60000, maxRequests = 60, message = 'Muitas requisições. Tente novamente mais tarde.') {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.message = message;
    this.hits = new Map();
  }

  middleware() {
    return (req, res, next) => {
      const key = req.ip || req.connection?.remoteAddress || 'global_client';
      const now = Date.now();

      const record = this.hits.get(key) || { count: 0, resetTime: now + this.windowMs };

      if (now > record.resetTime) {
        record.count = 1;
        record.resetTime = now + this.windowMs;
      } else {
        record.count++;
      }

      this.hits.set(key, record);

      res.setHeader('X-RateLimit-Limit', this.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, this.maxRequests - record.count));
      res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

      if (record.count > this.maxRequests) {
        return res.status(429).json({
          success: false,
          error: this.message,
          retryAfterSeconds: Math.ceil((record.resetTime - now) / 1000)
        });
      }

      next();
    };
  }
}

// 1. Auth Rate Limiter: 10 attempts per 15 minutes
const authLimiter = new RateLimiter(15 * 60 * 1000, 15, 'Muitas tentativas de login/registro. Tente novamente em 15 minutos.');

// 2. AI Rate Limiter: 30 requests per minute
const aiLimiter = new RateLimiter(60 * 1000, 30, 'Limite de processamento de IA atingido. Aguarde um instante.');

// 3. General API Limiter: 120 requests per minute
const generalLimiter = new RateLimiter(60 * 1000, 120, 'Taxa de requisições excedida.');

module.exports = {
  authLimiter: authLimiter.middleware(),
  aiLimiter: aiLimiter.middleware(),
  generalLimiter: generalLimiter.middleware()
};
