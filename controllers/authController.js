const authService = require("../services/authServices");

const register = async (req, res) => {
  try {
    const result = await authService.registerUser(req.body);

    return res.status(201).json({
      data: result.user,
      meta: {
        message: "User registered successfully",
        code: 1,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    const statusCode = error.statusCode || 500;

    return res.status(statusCode).json({
      data: null,
      meta: {
        message: error.statusCode ? error.message : "Internal server error",
        code: 0,
      },
    });
  }
};

const login = async (req, res) => {
  try {
    const result = await authService.loginUser(req.body);

    return res.status(200).json({
      data: result.user,
      meta: {
        message: "Login successful",
        code: 1,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(error.statusCode || 500).json({
      data: null,
      meta: {
        message: error.statusCode ? error.message : "Internal server error",
        code: 0,
      },
    });
  }
};
const refreshToken = async (req, res) => {
  try {
    const result = await authService.refreshToken(req.body);

    return res.status(200).json({
      data: {
        accessToken: result.accessToken,
      },
      meta: {
        message: "Access token refreshed successfully",
        code: 1,
      },
    });
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError" ||
      error.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        message: "Invalid or expired refresh token",
      });
    }

    return res.status(error.statusCode || 500).json({
      message:
        error.statusCode || error.statusCode === 401
          ? error.message
          : "Internal server error",
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const result = await authService.forgotPassword(req.body);

    return res.status(200).json({
      data: null,
      meta: {
        message: result.message,
        code: 1,
      },
    });
  } catch (error) {
    console.error("Forgot password error:", error.message);

    return res.status(error.statusCode || 500).json({
      data: null,
      meta: {
        message: error.statusCode ? error.message : "Internal server error",
        code: 0,
      },
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const result = await authService.resetPassword(req.body);

    return res.status(200).json({
      data: null,
      meta: {
        message: result.message,
        code: 1,
      },
    });
  } catch (error) {
    console.error("Reset password error:", error.message);

    return res.status(error.statusCode || 500).json({
      data: null,
      meta: {
        message: error.statusCode ? error.message : "Internal server error",
        code: 0,
      },
    });
  }
};

const logout = async (req, res) => {
  try {
    const result = await authService.logoutUser(req.body);

    return res.status(200).json({
      data: null,
      meta: {
        message: result.message,
        code: 1,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      data: null,
      meta: {
        message: error.message || "Internal server error",
        code: 0,
      },
    });
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
