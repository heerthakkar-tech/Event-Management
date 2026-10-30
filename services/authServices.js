const bcrypt = require("bcrypt");

const sequelize = require("../config/db");
const { User, Session } = require("../models");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../config/jwt");
const ROLES = require("../constants/roles");
const { Op } = require("sequelize");
const crypto = require("crypto");
const transporter = require("../config/mailer");

const registerUser = async ({ name, email, password, role }) => {
  if (role === ROLES.SUPER_ADMIN) {
    const error = new Error("Super admin registration is not allowed");

    error.statusCode = 403;

    throw error;
  }
  const hashedPassword = await bcrypt.hash(password, 10);

  return sequelize.transaction(async (transaction) => {
    const existingUser = await User.findOne({
      where: { email },
      transaction,
    });

    if (existingUser) {
      const error = new Error("Email is already registered");
      error.statusCode = 409;
      throw error;
    }

    const newUser = await User.create(
      {
        name,
        email,
        password: hashedPassword,
        role,
      },
      { transaction },
    );

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const session = await Session.create(
      {
        userId: newUser.id,
        status: "active",
        expiresAt,
      },
      { transaction },
    );

    const accessToken = signAccessToken(newUser, session.id);
    const refreshToken = signRefreshToken(newUser, session.id);

    return {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
      accessToken,
      refreshToken,
    };
  });
};

const loginUser = async ({ email, password }) => {
  return sequelize.transaction(async (transaction) => {
    const user = await User.findOne({
      where: { email },
      transaction,
    });

    if (!user) {
      const error = new Error("Invalid email or password");
      error.statusCode = 401;
      throw error;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      const error = new Error("Invalid email or password");
      error.statusCode = 401;
      throw error;
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const session = await Session.create(
      {
        userId: user.id,
        status: "active",
        expiresAt,
      },
      { transaction },
    );

    const accessToken = signAccessToken(user, session.id);
    const refreshToken = signRefreshToken(user, session.id);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  });
};

const refreshToken = async ({ refreshToken }) => {
  const payload = verifyRefreshToken(refreshToken);

  const session = await Session.findOne({
    where: {
      id: payload.sid,
      userId: payload.id,
      status: "active",
      expiresAt: {
        [Op.gt]: new Date(),
      },
    },
  });
  if (!session) {
    const error = new Error("Session not found or inactive");
    error.statusCode = 401;
    throw error;
  }

  const user = await User.findByPk(payload.id);

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 401;
    throw error;
  }

  const accessToken = signAccessToken(user, session.id);
  return {
    accessToken,
  };
};
const forgotPassword = async ({ email }) => {
  const message =
    "If the email is registered, a password reset link will be sent.";
  const user = await User.findOne({
    where: { email },
  });
  if (!user) {
    return { message };
  }
  const resetToken = crypto.randomBytes(16).toString("hex");

  const resetTokenHash = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const resetTokenExpiresAt = new Date(
    Date.now() + Number(process.env.RESET_TOKEN_EXPIRES_IN_MINUTES) * 60 * 1000,
  );

  await user.update({
    resetToken: resetTokenHash,
    resetTokenExpiresAt,
  });

  const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: "Password Reset Request",
    text: `You requested a password reset. Open this link to reset your password: ${resetLink}\n\nThis link expires in 30 minutes. If you did not request this, ignore this email.`,
  });

  return { message };
};

const resetPassword = async ({ token, newPassword }) => {
  const resetTokenHash = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    where: {
      resetToken: resetTokenHash,
    },
  });

  if (!user) {
    const error = new Error("Invalid or expired reset token.");
    error.statusCode = 400;
    throw error;
  }

  if (
    !user.resetTokenExpiresAt ||
    new Date(user.resetTokenExpiresAt) <= new Date()
  ) {
    const error = new Error("Invalid or expired reset token.");
    error.statusCode = 400;
    throw error;
  }
  const isSamePassword = await bcrypt.compare(newPassword, user.password);

  if (isSamePassword) {
    const error = new Error(
      "New password must be different from your current password.",
    );
    error.statusCode = 400;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await user.update({
    password: hashedPassword,
    resetToken: null,
    resetTokenExpiresAt: null,
  });

  return {
    message: "Password reset successfully.",
  };
};

const logoutUser = async ({ refreshToken }) => {
  const payload = verifyRefreshToken(refreshToken);

  const session = await Session.findOne({
    where: {
      id: payload.sid,
      userId: payload.id,
      status: "active",
      expiresAt: {
        [Op.gt]: new Date(),
      },
    },
  });
  if (!session) {
    const error = new Error("Session not found or inactive");
    error.statusCode = 401;
    throw error;
  }
  await session.update({
    status: "inactive",
  });

  return {
    message: "Logged out successfully",
  };
};

module.exports = {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
  forgotPassword,
  resetPassword,
};
