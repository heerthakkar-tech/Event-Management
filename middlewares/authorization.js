const AppError = require("../utils/AppError");
const STATUS_CODES = require("../constants/statusCodes");
const MESSAGES = require("../constants/messages");

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(
        new AppError(MESSAGES.UNAUTHORIZED, STATUS_CODES.UNAUTHORIZED),
      );
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return next(
        new AppError(
          MESSAGES.NOT_ALLOWED_TO_PERFORM_ACTION,
          STATUS_CODES.FORBIDDEN,
        ),
      );
    }

    return next();
  };
};

module.exports = authorize;
