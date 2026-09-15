function requireRole(role) {
  return function (req, res, next) {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    // owners can access everything
    if (user.role === 'owner') return next();

    // staff are allowed to view product data and record sales,
    // but not manage inventory, workers, purchases or owner-only settings.
    if (role === 'sales' && user.role === 'staff') return next();
    if (role === 'view' && user.role === 'staff') return next();

    if (user.role === role) return next();

    return res.status(403).json({ message: 'Forbidden: insufficient role' });
  }
}

module.exports = { requireRole };
