const jwt = require('jsonwebtoken');

// Utilisez toujours process.env.JWT_SECRET en production.
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader) {
    if (authHeader.startsWith('Bearer ')) {
      const parts = authHeader.split(' ');
      if (parts.length !== 2) {
        return res.status(401).json({ error: 'Acces refuse : format du token invalide' });
      }
      token = parts[1];
    } else {
      token = authHeader;
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Acces refuse : token manquant' });
  }

  jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(403).json({ error: 'Token expire' });
      }
      return res.status(403).json({ error: 'Token invalide' });
    }
    req.user = decoded;
    next();
  });
};

// Accepte les roles en arguments ou sous forme de tableau.
const authorizeRole = (...allowedRoles) => {
  const normalizedAllowedRoles = allowedRoles
    .flatMap((role) => (Array.isArray(role) ? role : [role]))
    .filter(Boolean);

  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ error: 'Acces refuse : role manquant' });
    }

    if (!normalizedAllowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Acces non autorise : role '${req.user.role}' insuffisant`,
      });
    }

    next();
  };
};

const getTokenFromRequest = (req) => {
  return req.headers.authorization?.split(' ')[1] || req.query.token || req.cookies?.jwt;
};

module.exports = { authenticateToken, authorizeRole, getTokenFromRequest };
