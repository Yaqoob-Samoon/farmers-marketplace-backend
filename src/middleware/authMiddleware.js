const jwt = require('jsonwebtoken');
require('dotenv').config();

// 1. Verify Token (Authentication)
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Access Denied: No Token Provided' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; // Attaches { id, role } to the request
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid Token' });
  }
};

// 2. Authorize Roles (Security)
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // Note: Roles in database are lowercase ('farmer', 'buyer')
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access Denied: Requires ${allowedRoles.join(' or ')} role` 
      });
    }
    next();
  };
};

module.exports = { verifyToken, authorizeRoles };