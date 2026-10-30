const jwt = require("jsonwebtoken");

const signAccessToken = (user, sessionId) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      sid: sessionId,
      type: "access",
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    },
  );
};

const signRefreshToken = (user, sessionId) => {
  return jwt.sign(
    {
      id: user.id,
      sid: sessionId,
      type: "refresh",
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    },
  );
};

const verifyAccessToken = (token) => {
  const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

  if (payload.type !== "access") {
    throw new Error("Invalid access token type");
  }

  return payload;
};

const verifyRefreshToken = (token) => {
  const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  console.log(payload);

  if (payload.type !== "refresh") {
    throw new Error("Invalid refresh token type");
  }

  return payload;
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
