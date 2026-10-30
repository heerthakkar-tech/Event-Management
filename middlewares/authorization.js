const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // i will put this middleware after authentication middleware in protected routes.
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: "Forbidden: You do not have permission to perform this action",
      });
    }

    next();
  };
};

module.exports = authorize;
