const express = require("express");
const router = express.Router();

const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorization");
const ROLES = require("../constants/roles");

// Test 1: Check whether the user is logged in
router.get("/protected", authenticate, (req, res) => {
  return res.status(200).json({
    message: "Authentication successful",
    user: req.user,
  });
});

// Test 2: Only organizers and super admins can access
router.get(
  "/organizer",
  authenticate,
  authorize(ROLES.ORGANIZER, ROLES.SUPER_ADMIN),
  (req, res) => {
    return res.status(200).json({
      message: "Authorization successful",
      user: req.user,
    });
  },
);

module.exports = router;
