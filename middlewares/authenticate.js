const { User, Session } = require("../models");
const { Op } = require("sequelize");
const { verifyAccessToken } = require("../config/jwt");

const STATUS_CODES = require("../constants/statusCodes");
const MESSAGES = require("../constants/messages");
const AppError = require("../utils/AppError");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError(
        MESSAGES.ACCESS_TOKEN_REQUIRED,
        STATUS_CODES.UNAUTHORIZED,
      );
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyAccessToken(token);

    if (!payload.id || !payload.sid || !payload.role) {
      throw new AppError(
        MESSAGES.INVALID_ACCESS_TOKEN_PAYLOAD,
        STATUS_CODES.UNAUTHORIZED,
      );
    }
    const session = await Session.findOne({
      where: {
        id: payload.sid,
        userId: payload.id,
        status: "active",
        expiresAt: {
          [Op.gt]: new Date(),
        },
      },
      include: [
        {
          model: User,
          as: "user",
          required: true,
          attributes: ["id", "email", "role"],
        },
      ],
    });
    if (!session) {
      throw new AppError(
        MESSAGES.SESSION_INVALID_EXPIRED_OR_INACTIVE,
        STATUS_CODES.UNAUTHORIZED,
      );
    }

    const user = session.user;

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      sid: session.id,
    };

    return next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError" ||
      error.name === "NotBeforeError"
    ) {
      error.statusCode = STATUS_CODES.UNAUTHORIZED;
      error.message = MESSAGES.INVALID_OR_EXPIRED_ACCESS_TOKEN;
    }

    return next(error);
  }
};

module.exports = authenticate;
