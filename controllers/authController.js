const authService = require("../services/authServices");
const sendResponse = require("../utils/response");
const STATUS_CODES = require("../constants/statusCodes");
const MESSAGES = require("../constants/messages");

// Handle authentication errors
const handleAuthError = (error, next) => {
  if (
    error.name === "JsonWebTokenError" ||
    error.name === "TokenExpiredError" ||
    error.name === "NotBeforeError"
  ) {
    error.statusCode = STATUS_CODES.UNAUTHORIZED;
    error.message = MESSAGES.INVALID_OR_EXPIRED_REFRESH_TOKEN;
  }

  return next(error);
};

// Register
const register = async (req, res, next) => {
  try {
    const result = await authService.registerUser(req.body);

    return sendResponse(
      res,
      STATUS_CODES.CREATED,
      MESSAGES.USER_REGISTERED_SUCCESSFULLY,
      result,
    );
  } catch (error) {
    return next(error);
  }
};

// Login
const login = async (req, res, next) => {
  try {
    const result = await authService.loginUser(req.body);

    return sendResponse(
      res,
      STATUS_CODES.OK,
      MESSAGES.LOGIN_SUCCESSFUL,
      result,
    );
  } catch (error) {
    return next(error);
  }
};

// Refresh access token
const refreshToken = async (req, res, next) => {
  try {
    const result = await authService.refreshToken(req.body);

    return sendResponse(
      res,
      STATUS_CODES.OK,
      MESSAGES.ACCESS_TOKEN_REFRESHED_SUCCESSFULLY,
      result,
    );
  } catch (error) {
    return handleAuthError(error, next);
  }
};

// Forgot password
const forgotPassword = async (req, res, next) => {
  try {
    const result = await authService.forgotPassword(req.body);

    return sendResponse(res, STATUS_CODES.OK, result.message, null);
  } catch (error) {
    return next(error);
  }
};

// Reset password
const resetPassword = async (req, res, next) => {
  try {
    const result = await authService.resetPassword(req.body);

    return sendResponse(res, STATUS_CODES.OK, result.message, null);
  } catch (error) {
    return next(error);
  }
};

// Logout
const logout = async (req, res, next) => {
  try {
    const result = await authService.logoutUser(req.body);

    return sendResponse(res, STATUS_CODES.OK, result.message, null);
  } catch (error) {
    return handleAuthError(error, next);
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
  logout,
};
