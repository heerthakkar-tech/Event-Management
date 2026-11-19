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
const STATUS_CODES = require("../constants/statusCodes");
const MESSAGES = require("../constants/messages");
const AppError = require("../utils/AppError");

const registerUser = async ({ name, email, password, role }) => {
  if (role === ROLES.SUPER_ADMIN) {
    throw new AppError(
      MESSAGES.SUPER_ADMIN_REGISTRATION_NOT_ALLOWED,
      STATUS_CODES.FORBIDDEN,
    );
  }
  const hashedPassword = await bcrypt.hash(password, 10);

  return sequelize.transaction(async (transaction) => {
    const existingUser = await User.findOne({
      where: { email },
      transaction,
    });

    if (existingUser) {
      throw new AppError(
        MESSAGES.EMAIL_ALREADY_REGISTERED,
        STATUS_CODES.CONFLICT,
      );
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
      throw new AppError(
        MESSAGES.INVALID_EMAIL_OR_PASSWORD,
        STATUS_CODES.UNAUTHORIZED,
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new AppError(
        MESSAGES.INVALID_EMAIL_OR_PASSWORD,
        STATUS_CODES.UNAUTHORIZED,
      );
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
    throw new AppError(
      MESSAGES.SESSION_NOT_FOUND_OR_INACTIVE,
      STATUS_CODES.UNAUTHORIZED,
    );
  }

  const user = await User.findByPk(payload.id);

  if (!user) {
    throw new AppError(MESSAGES.USER_NOT_FOUND, STATUS_CODES.NOT_FOUND);
  }

  const accessToken = signAccessToken(user, session.id);
  return {
    accessToken,
  };
};
const forgotPassword = async ({ email }) => {
  const message = MESSAGES.PASSWORD_RESET_REQUEST_SENT;
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
  return sequelize.transaction(async (transaction) => {
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      where: {
        resetToken: resetTokenHash,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!user) {
      throw new AppError(
        MESSAGES.INVALID_OR_EXPIRED_RESET_TOKEN,
        STATUS_CODES.BAD_REQUEST,
      );
    }

    if (
      !user.resetTokenExpiresAt ||
      new Date(user.resetTokenExpiresAt) <= new Date()
    ) {
      throw new AppError(
        MESSAGES.INVALID_OR_EXPIRED_RESET_TOKEN,
        STATUS_CODES.BAD_REQUEST,
      );
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);

    if (isSamePassword) {
      throw new AppError(
        MESSAGES.NEW_PASSWORD_MUST_BE_DIFFERENT,
        STATUS_CODES.BAD_REQUEST,
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await user.update(
      {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiresAt: null,
      },
      { transaction },
    );

    await Session.update(
      {
        status: "inactive",
      },
      {
        where: {
          userId: user.id,
          status: "active",
        },
        transaction,
      },
    );
    return {
      message: MESSAGES.PASSWORD_RESET_SUCCESSFULLY,
    };
  });
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
    throw new AppError(
      MESSAGES.SESSION_NOT_FOUND_OR_INACTIVE,
      STATUS_CODES.UNAUTHORIZED,
    );
  }
  await session.update({
    status: "inactive",
  });

  return {
    message: MESSAGES.LOGGED_OUT_SUCCESSFULLY,
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
