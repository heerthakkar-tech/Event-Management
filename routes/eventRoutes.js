const express = require("express");
const {
  createEventController,
  publishEventController,
  updateEventController,
} = require("../controllers/eventController");
const validate = require("../middlewares/validate");
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorization");
const {
  createEventSchema,
  publishEventIdSchema,
  updateEventSchema,
  updateEventParamsSchema,
} = require("../validators/eventValidator");

const router = express.Router();

// create event Route
router.post(
  "/",
  authenticate,
  authorize("organizer", "super_admin"),
  validate(createEventSchema),
  createEventController,
);
//publish event route
router.patch(
  "/:eventId/publish",
  authenticate,
  authorize("organizer", "super_admin"),
  validate(publishEventIdSchema, "params"),
  publishEventController,
);
//update event route
router.patch(
  "/:eventId",
  authenticate,
  authorize("organizer", "super_admin"),
  validate(updateEventParamsSchema, "params"),
  validate(updateEventSchema, "body"),
  updateEventController,
);

module.exports = router;
