const express = require("express");
const router = express.Router();

const validate = require("../middlewares/validate");
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require("../validators/authValidator");
const authController = require("../controllers/authController");

// Register api
router.post("/register", validate(registerSchema), authController.register);
//login api
router.post("/login", validate(loginSchema), authController.login);
//refresh api
router.post("/refresh-token", authController.refreshToken);
//forgot-password
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  authController.forgotPassword,
);
//reset Passwor
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  authController.resetPassword,
);
//logout api
router.post("/logout", authController.logout);

module.exports = router;
