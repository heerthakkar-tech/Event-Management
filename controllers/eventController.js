const {
  createEvent,
  publishEvent,
  updateEvent,
  deleteEvent,
  uploadEventBanner,
  publishedEvent,
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

//view all published events

const publishedEventController = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const result = await publishedEvent({ page, limit });

    return res.status(200).json({
      success: true,
      message: "Events fetched successfully",
      data: result,
    });
  } catch (error) {
    next(error);
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

const deleteEventController = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const user = req.user;

    const result = await deleteEvent({ eventId, user });
    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

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

    return res.status(200).json({
      success: true,
      message: "Event banner uploaded successfully",
      data: {
        bannerUrl: event.bannerUrl,
        bannerPublicId: event.bannerPublicId,
      },
    });
  } catch (error) {
    next(error);
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
