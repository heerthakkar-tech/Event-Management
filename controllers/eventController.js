const {
  createEvent,
  publishEvent,
  updateEvent,
  deleteEvent,
  uploadEventBanner,
  publishedEvent,
} = require("../services/eventServices");

const sendResponse = require("../utils/response");
const STATUS_CODES = require("../constants/statusCodes");
const MESSAGES = require("../constants/messages");
const EVENT_STATUS = require("../constants/eventStatus");

// Create event controller
const createEventController = async (req, res, next) => {
  try {
    const event = await createEvent(req.body, req.user.id);

    return sendResponse(
      res,
      STATUS_CODES.CREATED,
      MESSAGES.EVENT_CREATED_SUCCESSFULLY,
      { event },
    );
  } catch (error) {
    return next(error);
  }
};

// Publish event controller
const publishEventController = async (req, res, next) => {
  try {
    const event = await publishEvent(
      req.params.eventId,
      req.user.id,
      req.user.role,
    );

    const message =
      event.status === EVENT_STATUS.SCHEDULED
        ? MESSAGES.EVENT_SCHEDULED_FOR_PUBLICATION_SUCCESSFULLY
        : MESSAGES.EVENT_PUBLISHED_SUCCESSFULLY;

    return sendResponse(res, STATUS_CODES.OK, message, { event });
  } catch (error) {
    return next(error);
  }
};

// View all published events
const publishedEventController = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const result = await publishedEvent({ page, limit });

    return sendResponse(
      res,
      STATUS_CODES.OK,
      MESSAGES.EVENTS_FETCHED_SUCCESSFULLY,
      result,
    );
  } catch (error) {
    return next(error);
  }
};

// Update event controller
const updateEventController = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const updates = req.body;

    const result = await updateEvent({
      eventId,
      user: req.user,
      updates,
    });

    return sendResponse(
      res,
      STATUS_CODES.OK,
      MESSAGES.EVENT_UPDATED_SUCCESSFULLY,
      result,
    );
  } catch (error) {
    return next(error);
  }
};

// Delete event controller
const deleteEventController = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const user = req.user;

    const result = await deleteEvent({ eventId, user });

    return sendResponse(res, STATUS_CODES.OK, result.message);
  } catch (error) {
    return next(error);
  }
};

// Upload event banner controller
const uploadBannerController = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const user = req.user;
    const file = req.file;

    const event = await uploadEventBanner({
      eventId,
      user,
      file,
    });

    return sendResponse(
      res,
      STATUS_CODES.OK,
      MESSAGES.EVENT_BANNER_UPLOADED_SUCCESSFULLY,
      {
        bannerUrl: event.bannerUrl,
        bannerPublicId: event.bannerPublicId,
      },
    );
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createEventController,
  publishEventController,
  updateEventController,
  deleteEventController,
  uploadBannerController,
  publishedEventController,
};
