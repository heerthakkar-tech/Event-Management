const express = require("express");

const {
  registerForEventController,
  cancelRegistrationController,
} = require("../controllers/registrationController");

const {
  registerForEventSchema,
  cancelRegistrationSchema,
} = require("../validators/registerValidator");

const validate = require("../middlewares/validate");
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorization");

const router = express.Router();

// Register user for an event
router.post(
  "/:eventId/registrations",
  authenticate,
  authorize("user"),
  validate(registerForEventSchema, "params"),
  registerForEventController,
);

// cancel the event registration
router.patch(
  "/:eventId/registrations",
  authenticate,
  authorize("user"),
  validate(cancelRegistrationSchema, "params"),
  cancelRegistrationController,
);

module.exports = router;
