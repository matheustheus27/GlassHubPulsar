/**
 * GlassHub Backend API & Gateway Server
 */
const express = require('express');
const cors = require('cors');
const logger = require('./utils/logger');
const { sanitizeInput } = require('./middleware/validator');
const { generalLimiter } = require('./middleware/rateLimiter');

const setupBuilderRoutes = require('./routes/builderRoutes');
const setupDebugRoutes = require('./routes/debugRoutes');
const setupOllamaRoutes = require('./routes/ollamaRoutes');
const setupAuthRoutes = require('./routes/authRoutes');
const setupResumeRoutes = require('./routes/resumeRoutes');
const setupAdminRoutes = require('./routes/adminRoutes');
const setupSSERoutes = require('./routes/sseRoutes');
const setupAIRoutes = require('./routes/aiRoutes');
const setupSupportRoutes = require('./routes/supportRoutes');
const setupUserRoutes = require('./routes/userRoutes');

process.on('uncaughtException', (err) => {
  logger.error('[Server] Uncaught Exception trapped:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('[Server] Unhandled Rejection trapped:', reason);
});

const app = express();

// 1. CORS Configuration (Allows frontend and gateway connections)
app.use(cors({
  origin: true,
  credentials: true
}));

// 2. Body Parser & Cookie Parser (Custom minimal cookie parser)
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

app.use((req, res, next) => {
  req.cookies = {};
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      const name = parts[0]?.trim();
      const val = parts.slice(1).join('=').trim();
      if (name) req.cookies[name] = decodeURIComponent(val);
    });
  }
  next();
});

// 3. Structured Logging & Telemetry Middleware (Datadog compatible)
app.use(logger.requestMiddleware());

// 4. Input Sanitization (Prevents XSS while maintaining custom tags)
app.use(sanitizeInput);

// 5. Rate Limiting Middleware
app.use(generalLimiter);

// 6. Routes Initialization
setupAuthRoutes(app);
setupResumeRoutes(app);
setupAdminRoutes(app);
setupSSERoutes(app);
setupAIRoutes(app);
setupSupportRoutes(app);
setupUserRoutes(app);
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/user/notifications', require('./routes/notificationRoutes'));
setupBuilderRoutes(app);
setupDebugRoutes(app);
setupOllamaRoutes(app);

// 7. Background Workers Initialization (PDF, Translation, Analytics ATS, Notifications)
try {
  require('./workers/pdfWorker');
  require('./workers/translationWorker');
  require('./workers/analyticsWorker');
  require('./workers/notificationWorker');
  logger.info('All GlassHub background workers initialized successfully.');
} catch (wErr) {
  logger.error('Failed to initialize background workers:', wErr);
}

// 8. Health check endpoint for Docker / K8s / Gateway
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'glasshub-backend-api'
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  logger.info(`GlassHub Document Engine & API Server listening on port ${PORT}`);
  // Asynchronously bootstrap PostgreSQL schema & seed in background
  try {
    const initDb = require('./prisma/init-db');
    initDb().catch(err => logger.warn('[InitDB] Background sync note:', err.message || err));
  } catch (dbErr) {
    logger.warn('[InitDB] Background sync note:', dbErr.message || dbErr);
  }
});