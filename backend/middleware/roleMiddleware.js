const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, no user session found' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Forbidden: Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`,
      });
    }

    next();
  };
};

module.exports = { authorizeRoles };
