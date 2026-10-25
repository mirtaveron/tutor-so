const { verifyToken } = require('../utils/jwt');

const requireAuth = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: 'No autorizado. Token faltante.' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // { userId, role }
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido o expirado.' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Acceso denegado. Se requieren permisos de administrador.' });
  }
  next();
};

module.exports = { requireAuth, requireAdmin };
