const express = require("express");
const {
  createEventController,
  publishEventController,
  updateEventController,
  deleteEventController,
  uploadBannerController,
  publishedEventController,
} = require("../controllers/eventController");
const validate = require("../middlewares/validate");
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorization");
const {
  upload,
  validateImageContent,
} = require("../middlewares/uploadMiddleware");
const {
  createEventSchema,
  publishEventIdSchema,
  updateEventSchema,
  updateEventParamsSchema,
  publishedEventsSchema,
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

// all published event route
router.get(
  "/",
  validate(publishedEventsSchema, "query"),
  publishedEventController,
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
// delete event route
router.delete(
  "/:eventId",
  authenticate,
  authorize("organizer", "super_admin"),
  validate(updateEventParamsSchema, "params"),
  deleteEventController,
);
// upload event banner route
router.post(
  "/:eventId/banner",
  authenticate,
  authorize("organizer", "super_admin"),
  validate(updateEventParamsSchema, "params"),
  upload.single("banner"),
  validateImageContent,
  uploadBannerController,
);

module.exports = router;
