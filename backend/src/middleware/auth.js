const jwt = require('jsonwebtoken');
const { query } = require('../database/connection');
const { ensureLocalUserFromSso, resolveEmailFromToken } = require('../utils/ssoProvisioning');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        message: 'Silakan login terlebih dahulu' 
      });
    }

    // Debug: decode header/payload sebelum verifikasi untuk bantu diagnosis
    try {
      const decodedComplete = jwt.decode(token, { complete: true });
      if (decodedComplete) {
        const hdrAlg = decodedComplete.header && decodedComplete.header.alg;
        const claimKeys = decodedComplete.payload ? Object.keys(decodedComplete.payload) : [];
        console.log(`[Auth] Pre-verify token alg=${hdrAlg}, claimKeys=${claimKeys.join(',')}`);
      } else {
        console.log('[Auth] Pre-verify decode returned null');
      }
    } catch (e) {
      console.log('[Auth] Pre-verify decode error:', e.message);
    }

    // Verify SSO token dan resolve email
    const { email } = await resolveEmailFromToken(token);

    // Ensure local user exists (auto-provision from SSO via dblink)
    const user = await ensureLocalUserFromSso(email);
    if (!user || user.is_active === false) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token tidak valid atau user tidak aktif'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      console.error('[Auth] JWT error:', error.message);
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'Token tidak valid' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      console.error('[Auth] Token expired:', error.message);
      return res.status(401).json({ 
        error: 'Token expired',
        message: 'Token sudah kadaluarsa, silakan login kembali' 
      });
    }
    if (error.name === 'EmployeeNotFound') {
      console.error('[Auth] Employee not found for token identifier');
      return res.status(401).json({
        error: 'Invalid token',
        message: 'User SSO tidak ditemukan di gate_sso.employees'
      });
    }
    if (error.name === 'EmailResolveError') {
      console.error('[Auth] Email could not be resolved from token');
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Email tidak ditemukan di token SSO dan tidak bisa di-resolve'
      });
    }
    
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      error: 'Authentication error',
      message: 'Terjadi kesalahan pada sistem autentikasi' 
    });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Silakan login terlebih dahulu' 
      });
    }

    const userRole = req.user.role;
    if (!roles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: 'Anda tidak memiliki izin untuk mengakses resource ini' 
      });
    }

    next();
  };
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const { email } = await resolveEmailFromToken(token);
      const user = await ensureLocalUserFromSso(email);
      if (user && user.is_active) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  optionalAuth
};
