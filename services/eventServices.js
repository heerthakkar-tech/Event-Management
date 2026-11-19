const { Event, Category, EventRegistration, User } = require("../models");
const ROLES = require("../constants/roles");
const { scheduleEventPublish } = require("./eventScheduler");
const { Readable } = require("stream");
const cloudinary = require("../config/cloudinary");
const sendScheduleUpdateEmail = require("../utils/scheduleUpdateEmail");
const { Op } = require("sequelize");
const STATUS_CODES = require("../constants/statusCodes");
const MESSAGES = require("../constants/messages");
const AppError = require("../utils/AppError");
const EVENT_STATUS = require("../constants/eventStatus");
const REGISTRATION_STATUS = require("../constants/registrationStatus");

const ALLOWED_FIELDS = [
  "title",
  "description",
  "startAt",
  "endAt",
  "location",
  "capacity",
  "categoryId",
  "publishAt",
];
// create event api

const createEvent = async (eventData, organizerId) => {
  const {
    categoryId,
    title,
    description,
    startAt,
    endAt,
    location,
    capacity,
    ticketPrice,
    publishAt,
  } = eventData;

  const category = await Category.findOne({
    where: {
      id: categoryId,
      isActive: true,
    },
  });

  if (!category) {
    throw new AppError(
      MESSAGES.CATEGORY_NOT_FOUND_OR_INACTIVE,
      STATUS_CODES.BAD_REQUEST,
    );
  }

  const startDate = new Date(startAt);
  const endDate = new Date(endAt);
  const now = new Date();

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new AppError(MESSAGES.INVALID_EVENT_DATE, STATUS_CODES.BAD_REQUEST);
  }

  if (startDate <= now) {
    throw new AppError(
      MESSAGES.EVENT_START_TIME_MUST_BE_IN_FUTURE,
      STATUS_CODES.BAD_REQUEST,
    );
  }

  if (endDate <= startDate) {
    throw new AppError(
      MESSAGES.EVENT_END_TIME_MUST_BE_AFTER_START_TIME,
      STATUS_CODES.BAD_REQUEST,
    );
  }

  let scheduledPublishAt = null;

  if (publishAt) {
    const publishDate = new Date(publishAt);

    if (Number.isNaN(publishDate.getTime()) || publishDate <= now) {
      throw new AppError(
        MESSAGES.PUBLICATION_TIME_MUST_BE_VALID_FUTURE_DATE,
        STATUS_CODES.BAD_REQUEST,
      );
    }

    if (startDate <= publishDate) {
      throw new AppError(
        MESSAGES.EVENT_START_TIME_MUST_BE_AFTER_SCHEDULED_PUBLICATION,
        STATUS_CODES.BAD_REQUEST,
      );
    }

    scheduledPublishAt = publishDate;
  }

  const event = await Event.create({
    organizerId,
    categoryId,
    title,
    description,
    startAt: startDate,
    endAt: endDate,
    location,
    capacity,
    ticketPrice,
    status: EVENT_STATUS.DRAFT,
    publishAt: scheduledPublishAt,
    publishedAt: null,
  });

  return event;
};

//publish event api
const publishEvent = async (eventId, userId, userRole) => {
  const event = await Event.findByPk(eventId);

  if (!event) {
    throw new AppError(MESSAGES.EVENT_NOT_FOUND, STATUS_CODES.NOT_FOUND);
  }

  if (userRole !== ROLES.SUPER_ADMIN && event.organizerId !== userId) {
    throw new AppError(
      MESSAGES.NOT_ALLOWED_TO_PERFORM_ACTION,
      STATUS_CODES.FORBIDDEN,
    );
  }

  if (event.status !== EVENT_STATUS.DRAFT) {
    throw new AppError(
      `Event cannot be published with ${event.status} status`,
      STATUS_CODES.CONFLICT,
    );
  }

  const now = new Date();

  if (event.startAt <= now) {
    throw new AppError(
      MESSAGES.EVENT_CANNOT_BE_PUBLISHED_AFTER_START,
      STATUS_CODES.BAD_REQUEST,
    );
  }

  if (event.publishAt) {
    const publishDate = new Date(event.publishAt);

    if (publishDate <= now) {
      throw new AppError(
        MESSAGES.PUBLICATION_TIME_MUST_BE_IN_FUTURE,
        STATUS_CODES.BAD_REQUEST,
      );
    }

    if (publishDate >= event.startAt) {
      throw new AppError(
        MESSAGES.PUBLICATION_TIME_MUST_BE_BEFORE_EVENT_START,
        STATUS_CODES.BAD_REQUEST,
      );
    }

    event.status = EVENT_STATUS.SCHEDULED;
    await event.save();

    // Scheduler which will run in this case
    scheduleEventPublish(event);
  } else {
    event.status = EVENT_STATUS.PUBLISHED;

    event.publishedAt = now;
    await event.save();
  }

  return event;
};

// Get all published events
const publishedEvent = async ({ page, limit }) => {
  const offset = (page - 1) * limit;

  const { count, rows } = await Event.findAndCountAll({
    where: {
      status: EVENT_STATUS.PUBLISHED,
    },
    order: [["startAt", "ASC"]],
    offset,
    limit,
  });

  return {
    events: rows,
    totalEvents: count,
    currentPage: page,
    totalPages: Math.ceil(count / limit),
  };
};

//update event api

const updateEvent = async ({ eventId, user, updates }) => {
  // Check so that user cannot update the not allowed fields
  const invalidFields = Object.keys(updates).filter(
    (field) => !ALLOWED_FIELDS.includes(field),
  );

  if (invalidFields.length > 0) {
    throw new AppError(
      `These fields cannot be updated: ${invalidFields.join(", ")}`,
      STATUS_CODES.BAD_REQUEST,
    );
  }

  // Check if the event is available or not
  const event = await Event.findByPk(eventId);

  if (!event) {
    throw new AppError(MESSAGES.EVENT_NOT_FOUND, STATUS_CODES.NOT_FOUND);
  }

  // Check if authorized user is performing the action or not
  const isSuperAdmin = user.role === ROLES.SUPER_ADMIN;
  const isOwner = String(event.organizerId) === String(user.id);

  if (!isSuperAdmin && !isOwner) {
    throw new AppError(
      MESSAGES.NOT_ALLOWED_TO_UPDATE_EVENT,
      STATUS_CODES.FORBIDDEN,
    );
  }

  // Cancelled events cannot be updated
  if (event.status === EVENT_STATUS.CANCELLED) {
    throw new AppError(
      MESSAGES.CANCELLED_EVENTS_CANNOT_BE_UPDATED,
      STATUS_CODES.BAD_REQUEST,
    );
  }

  if (
    event.status === EVENT_STATUS.PUBLISHED &&
    Object.prototype.hasOwnProperty.call(updates, "publishAt")
  ) {
    throw new AppError(
      MESSAGES.PUBLISH_AT_CANNOT_CHANGE_AFTER_PUBLICATION,
      STATUS_CODES.BAD_REQUEST,
    );
  }

  if (updates.categoryId !== undefined) {
    const category = await Category.findByPk(updates.categoryId);

    if (!category || !category.isActive) {
      throw new AppError(
        MESSAGES.CATEGORY_NOT_FOUND_OR_INACTIVE,
        STATUS_CODES.BAD_REQUEST,
      );
    }
  }

  // Use the new start time if supplied, otherwise use the existing start time
  const startAt = new Date(updates.startAt ?? event.startAt);
  const endAt = new Date(updates.endAt ?? event.endAt);

  // Check that the updated end date must be after start date
  if (
    Number.isNaN(startAt.getTime()) ||
    Number.isNaN(endAt.getTime()) ||
    endAt <= startAt
  ) {
    throw new AppError(
      MESSAGES.END_AT_MUST_BE_AFTER_START_AT,
      STATUS_CODES.BAD_REQUEST,
    );
  }

  // Use the new publishAt time provided or use the existing one
  const publishAt = Object.prototype.hasOwnProperty.call(updates, "publishAt")
    ? updates.publishAt
    : event.publishAt;

  if (event.status === EVENT_STATUS.SCHEDULED) {
    if (!publishAt || new Date(publishAt) <= new Date()) {
      throw new AppError(
        MESSAGES.SCHEDULED_EVENT_REQUIRES_FUTURE_PUBLISH_AT,
        STATUS_CODES.BAD_REQUEST,
      );
    }

    if (new Date(publishAt) >= startAt) {
      throw new AppError(
        MESSAGES.PUBLISH_AT_MUST_BE_BEFORE_EVENT_START_AT,
        STATUS_CODES.BAD_REQUEST,
      );
    }
  }

  // Already published events cannot be updated with a past start time
  if (event.status === EVENT_STATUS.PUBLISHED && startAt <= new Date()) {
    throw new AppError(
      MESSAGES.EVENT_START_AT_MUST_REMAIN_IN_FUTURE,
      STATUS_CODES.BAD_REQUEST,
    );
  }

  // Detect whether the schedule of a published event has really changed
  const scheduleChanged =
    event.status === EVENT_STATUS.PUBLISHED &&
    ((updates.startAt !== undefined &&
      startAt.getTime() !== new Date(event.startAt).getTime()) ||
      (updates.endAt !== undefined &&
        endAt.getTime() !== new Date(event.endAt).getTime()));

  for (const field of ALLOWED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(updates, field)) {
      event[field] = updates[field];
    }
  }

  await event.save();

  // Send email if the schedule changes
  if (scheduleChanged) {
    try {
      const registrations = await EventRegistration.findAll({
        where: {
          eventId: event.id,
          status: {
            [Op.in]: [
              REGISTRATION_STATUS.CONFIRMED,
              REGISTRATION_STATUS.WAITLISTED,
            ],
          },
        },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["name", "email"],
          },
        ],
      });

      // Send email to every confirmed and waitlisted user
      const emailResults = await Promise.allSettled(
        registrations
          .filter((registration) => registration.user)
          .map((registration) =>
            sendScheduleUpdateEmail({
              name: registration.user.name,
              email: registration.user.email,
              eventTitle: event.title,
              eventStartAt: event.startAt,
              eventEndAt: event.endAt,
            }),
          ),
      );

      const failedEmails = emailResults.filter(
        (result) => result.status === "rejected",
      );

      if (failedEmails.length > 0) {
        console.error(
          `${failedEmails.length} schedule update email failed `,
          failedEmails,
        );
      }
    } catch (emailError) {
      console.error("Schedule update email failed", emailError);
    }
  }

  // Reschedule publication if publishAt is updated
  if (
    event.status === EVENT_STATUS.SCHEDULED &&
    Object.prototype.hasOwnProperty.call(updates, "publishAt")
  ) {
    scheduleEventPublish(event);
  }

  return {
    event,
    scheduleChanged,
  };
};

//delete event api
const deleteEvent = async ({ eventId, user }) => {
  // find the particular event by its eventId
  const event = await Event.findByPk(eventId);

  // Check whether the event exists
  if (!event) {
    throw new AppError(MESSAGES.EVENT_NOT_FOUND, STATUS_CODES.NOT_FOUND);
  }

  // Check authorization
  const isSuperAdmin = user.role === ROLES.SUPER_ADMIN;
  const isOwner = String(event.organizerId) === String(user.id);

  if (!isSuperAdmin && !isOwner) {
    throw new AppError(
      MESSAGES.NOT_ALLOWED_TO_DELETE_EVENT,
      STATUS_CODES.FORBIDDEN,
    );
  }

  // Cancelled event cannot be deleted
  if (event.status === EVENT_STATUS.CANCELLED) {
    throw new AppError(
      MESSAGES.CANCELLED_EVENTS_CANNOT_BE_DELETED,
      STATUS_CODES.BAD_REQUEST,
    );
  }

  // Check whether the event has any registrations
  const registrationCount = await EventRegistration.count({
    where: { eventId },
  });

  if (registrationCount > 0) {
    throw new AppError(
      MESSAGES.CANNOT_DELETE_EVENT_WITH_REGISTRATIONS,
      STATUS_CODES.BAD_REQUEST,
    );
  }

  // Delete event
  await event.destroy();

  return {
    message: MESSAGES.EVENT_DELETED_SUCCESSFULLY,
  };
};

// the helper function to save banners in cloudinary
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "event-banners",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result);
      },
    );

    Readable.from(fileBuffer).pipe(uploadStream);
  });
};

//banner upload api

const uploadEventBanner = async ({ eventId, user, file }) => {
  const event = await Event.findByPk(eventId);
  if (!event) {
    throw new AppError(MESSAGES.EVENT_NOT_FOUND, STATUS_CODES.NOT_FOUND);
  }

  const isSuperAdmin = user.role === ROLES.SUPER_ADMIN;
  const isOwner = String(event.organizerId) === String(user.id);

  if (!isSuperAdmin && !isOwner) {
    throw new AppError(
      MESSAGES.NOT_ALLOWED_TO_UPLOAD_BANNER,
      STATUS_CODES.FORBIDDEN,
    );
  }

  if (event.status === EVENT_STATUS.CANCELLED) {
    throw new AppError(
      MESSAGES.CANNOT_UPLOAD_BANNER_FOR_CANCELLED_EVENTS,
      STATUS_CODES.BAD_REQUEST,
    );
  }

  // Store the old banner public id
  const oldBannerPublicId = event.bannerPublicId;

  // Upload the new banner to Cloudinary
  const uploadedImage = await uploadToCloudinary(file.buffer);

  try {
    // Save new banner details in the database
    await event.update({
      bannerUrl: uploadedImage.secure_url,
      bannerPublicId: uploadedImage.public_id,
    });
  } catch (error) {
    try {
      await cloudinary.uploader.destroy(uploadedImage.public_id);
    } catch (cleanupError) {
      console.error(
        "Failed to delete newly uploaded banner:",
        cleanupError.message,
      );
    }

    throw error;
  }

  // Delete the old banner after successful database update
  if (oldBannerPublicId) {
    try {
      await cloudinary.uploader.destroy(oldBannerPublicId);
    } catch (error) {
      console.error("Failed to delete old event banner:", error.message);
    }
  }

  return event;
};

module.exports = {
  createEvent,
  publishEvent,
  updateEvent,
  deleteEvent,
  uploadEventBanner,
  publishedEvent,
};
