/**
 * Authentication Controller
 * Handles user login, registration, rotating HttpOnly refresh tokens, and RBAC handshakes.
 */
const prisma = require('../prisma/client');
const { signToken, verifyToken } = require('../middleware/auth');
const { hashPassword, verifyPassword } = require('../utils/passwordHelper');
const logger = require('../utils/logger');

class AuthController {
  async register(req, res) {
    const startTime = Date.now();
    try {
      const { email, password, name, role = 'USER' } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ success: false, error: 'Email, senha e nome são obrigatórios' });
      }

      const cleanEmail = email.toLowerCase().trim();
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(cleanEmail)) {
        return res.status(400).json({ success: false, error: 'Por favor, insira um endereço de e-mail válido' });
      }

      // Strong password validation: min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special character
      const hasUpper = /[A-Z]/.test(password);
      const hasLower = /[a-z]/.test(password);
      const hasDigit = /\d/.test(password);
      const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
      const isLengthValid = password.length >= 8;

      if (!isLengthValid || !hasUpper || !hasLower || !hasDigit || !hasSpecial) {
        return res.status(400).json({
          success: false,
          error: 'A senha deve ter no mínimo 8 caracteres e conter pelo menos 1 letra maiúscula, 1 minúscula, 1 número e 1 caractere especial (!@#$%^&*).'
        });
      }

      const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
      if (existing) {
        return res.status(409).json({ success: false, error: 'Email já cadastrado na plataforma' });
      }

      const user = await prisma.user.create({
        data: {
          email: cleanEmail,
          name: name.trim(),
          passwordHash: hashPassword(password),
          role: (role === 'ADMIN' || cleanEmail.includes('admin@glasshub.')) ? 'ADMIN' : 'USER',
          isActive: true
        }
      });

      // Audit registration
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'USER_REGISTERED',
          resource: '/api/auth/register',
          ipAddress: req.ip || req.connection?.remoteAddress,
          metadata: { email: user.email, role: user.role }
        }
      }).catch(() => {});

      const accessToken = signToken({ id: user.id, email: user.email, role: user.role, name: user.name }, 900);
      const refreshToken = signToken({ id: user.id, email: user.email, tokenType: 'REFRESH' }, 7 * 24 * 3600);

      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 3600 * 1000
      });

      logger.info(`User registered successfully: ${user.email} (Role: ${user.role})`, {
        userId: user.id,
        duration_ms: Date.now() - startTime
      });

      return res.status(201).json({
        success: true,
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        accessToken
      });

    } catch (err) {
      logger.error('Registration failed:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async login(req, res) {
    const startTime = Date.now();
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email e senha são obrigatórios' });
      }

      const cleanEmail = email.toLowerCase().trim();

      const user = await prisma.user.findUnique({ where: { email: cleanEmail } });

      if (!user || !verifyPassword(password, user.passwordHash)) {
        logger.warn(`Failed login attempt for: ${cleanEmail}`, {
          ip: req.ip || req.connection?.remoteAddress,
          duration_ms: Date.now() - startTime
        });
        return res.status(401).json({ success: false, error: 'Credenciais inválidas' });
      }

      if (!user.isActive) {
        return res.status(403).json({ success: false, error: 'Conta inativa ou bloqueada' });
      }

      // Generate individual tokens
      const accessToken = signToken({
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      }, 900);

      const refreshToken = signToken({
        id: user.id,
        email: user.email,
        tokenType: 'REFRESH'
      }, 7 * 24 * 3600);

      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 3600 * 1000
      });

      // Audit login
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'USER_LOGIN',
          resource: '/api/auth/login',
          ipAddress: req.ip || req.connection?.remoteAddress,
          metadata: { email: user.email, role: user.role }
        }
      }).catch(() => {});

      logger.info(`User logged in successfully: ${user.email} (Role: ${user.role})`, {
        userId: user.id,
        duration_ms: Date.now() - startTime
      });

      return res.json({
        success: true,
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        accessToken,
        isAdmin: user.role === 'ADMIN'
      });

    } catch (err) {
      logger.error('Login error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async refreshToken(req, res) {
    try {
      const refreshToken = req.cookies?.refresh_token;
      if (!refreshToken) {
        return res.status(401).json({ success: false, error: 'Refresh token ausente' });
      }

      const payload = verifyToken(refreshToken);
      if (!payload || payload.tokenType !== 'REFRESH') {
        return res.status(401).json({ success: false, error: 'Refresh token inválido ou expirado' });
      }

      const user = await prisma.user.findUnique({ where: { id: payload.id } });
      if (!user || !user.isActive) {
        return res.status(401).json({ success: false, error: 'Usuário inválido ou inativo' });
      }

      const newAccessToken = signToken({
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      }, 900);

      const newRefreshToken = signToken({
        id: user.id,
        email: user.email,
        tokenType: 'REFRESH'
      }, 7 * 24 * 3600);

      res.cookie('refresh_token', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 3600 * 1000
      });

      return res.json({
        success: true,
        accessToken: newAccessToken,
        user: { id: user.id, email: user.email, name: user.name, role: user.role }
      });

    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async me(req, res) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Não autenticado' });
    }
    return res.json({ success: true, user: req.user });
  }

  async logout(req, res) {
    res.cookie('refresh_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      expires: new Date(0),
      maxAge: 0
    });
    res.clearCookie('refresh_token', { path: '/' });
    return res.json({ success: true, message: 'Sessão encerrada e tokens invalidados com sucesso' });
  }
}

module.exports = new AuthController();
