/**
 * Authentication & RBAC Middleware
 */
const crypto = require('crypto');
const prisma = require('../prisma/client');
const logger = require('../utils/logger');

// Lightweight JWT encoder/decoder with signature verification (works without heavy external deps if needed)
const JWT_SECRET = process.env.JWT_SECRET || 'glasshub_super_secret_jwt_key_2026';

function signToken(payload, expiresInSeconds = 900) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, body, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');

  if (signature !== expectedSig) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return payload;
  } catch (e) {
    return null;
  }
}

/**
 * Authenticate middleware
 */
async function authenticate(req, res, next) {
  let token = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.access_token) {
    token = req.cookies.access_token;
  }

  if (!token) {
    // Allows anonymous read in public routes if needed, but attaches null
    req.user = null;
    return next();
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ success: false, error: 'Token inválido ou expirado' });
  }

  req.user = payload;
  next();
}

/**
 * Require valid authentication
 */
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Autenticação necessária para este recurso' });
  }
  next();
}

/**
 * Role-Based Access Control Middleware
 * @param {'USER' | 'ADMIN'} requiredRole 
 */
function requireRole(requiredRole) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Autenticação necessária' });
    }

    if (req.user.role !== requiredRole && req.user.role !== 'ADMIN') {
      logger.warn(`[RBAC] Access denied for user ${req.user.email} (Role: ${req.user.role}, Required: ${requiredRole})`);
      
      // Audit log the forbidden attempt
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'ACCESS_DENIED_UNAUTHORIZED_ROLE',
          resource: req.originalUrl,
          ipAddress: req.ip || req.connection?.remoteAddress,
          metadata: { requiredRole, userRole: req.user.role }
        }
      }).catch(() => {});

      return res.status(403).json({ success: false, error: 'Acesso restrito: Privilégios insuficientes' });
    }

    next();
  };
}

module.exports = {
  signToken,
  verifyToken,
  authenticate,
  requireAuth,
  requireRole
};
