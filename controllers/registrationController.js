const {
  registerForEvent,
  cancelRegistration,
} = require("../services/registrationService");

//registration user controller
const registerForEventController = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    const registration = await registerForEvent(eventId, userId);
    return res.status(201).json({
      success: true,
      message: "Event registration successful",
      data: {
        registration,
      },
    });
  } catch (error) {
    next(error);
  }
};

const cancelRegistrationController = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    const result = await cancelRegistration(eventId, userId);
    return res.status(200).json({
      success: true,
      message: "Event registration cancelled successfully",
      data: {
        result,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerForEventController,
  cancelRegistrationController,
};
