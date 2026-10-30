const { Result } = require("pg");
const {
  createEvent,
  publishEvent,
  updateEvent,
} = require("../services/eventServices");

//create event controller
const createEventController = async (req, res) => {
  try {
    const event = await createEvent(req.body, req.user.id);

    return res.status(201).json({
      message: "Event created successfully",
      data: {
        event,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : "Internal server error",
    });
  }
};
// publish event controller
const publishEventController = async (req, res) => {
  try {
    const event = await publishEvent(
      req.params.eventId,
      req.user.id,
      req.user.role,
    );

    return res.status(200).json({
      message:
        event.status === "scheduled"
          ? "Event scheduled for publication successfully"
          : "Event published successfully",
      data: {
        event,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : "Internal server error",
    });
  }
};

//update event controller
const updateEventController = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const updates = req.body;

    const event = await updateEvent({
      eventId,
      user: req.user,
      updates,
    });

    return res.status(200).json({
      message: "Event updated successfully",
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEventController,
  publishEventController,
  updateEventController,
};
