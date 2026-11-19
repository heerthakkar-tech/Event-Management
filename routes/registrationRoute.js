const express = require("express");

const {
  registerForEventController,
  cancelRegistrationController,
  getRegistrationHistoryController,
} = require("../controllers/registrationController");

const {
  registerForEventSchema,
  cancelRegistrationSchema,
  registrationHistorySchema,
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

// view registration history
router.get(
  "/registrations/history",
  authenticate,
  authorize("user"),
  validate(registrationHistorySchema, "query"),
  getRegistrationHistoryController,
);

module.exports = router;
