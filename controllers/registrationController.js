const {
  registerForEvent,
  cancelRegistration,
  getRegistrationHistory,
} = require("../services/registrationService");

const sendResponse = require("../utils/response");
const STATUS_CODES = require("../constants/statusCodes");
const MESSAGES = require("../constants/messages");

// Register user for event
const registerForEventController = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    const registration = await registerForEvent(eventId, userId);

    return sendResponse(
      res,
      STATUS_CODES.CREATED,
      MESSAGES.EVENT_REGISTRATION_SUCCESSFUL,
      { registration },
    );
  } catch (error) {
    return next(error);
  }
};

// Cancel user registration
const cancelRegistrationController = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    const result = await cancelRegistration(eventId, userId);

    return sendResponse(
      res,
      STATUS_CODES.OK,
      MESSAGES.EVENT_REGISTRATION_CANCELLED_SUCCESSFULLY,
      { result },
    );
  } catch (error) {
    return next(error);
  }
};

// Get user's registration history
const getRegistrationHistoryController = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const history = await getRegistrationHistory(userId, page, limit);

    return sendResponse(
      res,
      STATUS_CODES.OK,
      MESSAGES.REGISTRATION_HISTORY_FETCHED_SUCCESSFULLY,
      history,
    );
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  registerForEventController,
  cancelRegistrationController,
  getRegistrationHistoryController,
};
