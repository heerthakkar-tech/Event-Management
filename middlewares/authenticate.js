const { User, Session } = require("../models");
const { Op } = require("sequelize");
const { verifyAccessToken } = require("../config/jwt");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Access token is required",
      });
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyAccessToken(token);

    if (!payload.id || !payload.sid || !payload.role) {
      return res.status(401).json({
        message: "Invalid access token payload",
      });
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
      return res.status(401).json({
        message: "Session is invalid, expired, or inactive",
      });
    }

    const user = session.user;

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      sid: session.id,
    };

    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError" ||
      error.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        message: "Invalid or expired access token",
      });
    }

    console.error("Authentication error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = authenticate;
