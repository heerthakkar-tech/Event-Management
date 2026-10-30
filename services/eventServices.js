const { Event, Category } = require("../models");
const ROLES = require("../constants/roles");
const { scheduleEventPublish } = require("./eventScheduler");

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
    const error = new Error("Category not found or inactive");
    error.statusCode = 400;
    throw error;
  }

  const startDate = new Date(startAt);
  const endDate = new Date(endAt);
  const now = new Date();

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    const error = new Error("Invalid event date");
    error.statusCode = 400;
    throw error;
  }

  if (startDate <= now) {
    const error = new Error("Event start time must be in the future");
    error.statusCode = 400;
    throw error;
  }

  if (endDate <= startDate) {
    const error = new Error("Event end time must be after start time");
    error.statusCode = 400;
    throw error;
  }

  let scheduledPublishAt = null;

  if (publishAt) {
    const publishDate = new Date(publishAt);

    if (Number.isNaN(publishDate.getTime()) || publishDate <= now) {
      const error = new Error("Publication time must be a valid future date");
      error.statusCode = 400;
      throw error;
    }

    if (startDate <= publishDate) {
      const error = new Error(
        "Event start time must be after the scheduled publication time",
      );
      error.statusCode = 400;
      throw error;
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
    status: "draft",
    publishAt: scheduledPublishAt,
    publishedAt: null,
  });

  return event;
};

//publish event api
const publishEvent = async (eventId, userId, userRole) => {
  const event = await Event.findByPk(eventId);
  if (!event) {
    const error = new Error("Event not found");
    error.statusCode = 404;
    throw error;
  }
  if (userRole !== ROLES.SUPER_ADMIN && event.organizerId !== userId) {
    const error = new Error("You are not allowed to perform this action");
    error.statusCode = 403;
    throw error;
  }
  if (event.status !== "draft") {
    const error = new Error(
      `event cannot be published with ${event.status} status`,
    );
    error.statusCode = 409;
    throw error;
  }
  const now = new Date();
  if (event.startAt <= now) {
    const error = new Error(
      "An event cannot be published that has already started",
    );
    error.statusCode = 400;
    throw error;
  }

  if (event.publishAt) {
    const publishDate = new Date(event.publishAt);

    if (publishDate <= now) {
      const error = new Error("Publication time must be in the future");
      error.statusCode = 400;
      throw error;
    }

    if (publishDate >= event.startAt) {
      const error = new Error(
        "Publication time must be before the event start time",
      );
      error.statusCode = 400;
      throw error;
    }

    event.status = "scheduled";
    await event.save();
    // scheduler which will run in this case
    scheduleEventPublish(event);
  } else {
    event.status = "published";
    event.publishedAt = now;
    await event.save();
  }

  return event;
};

//update event api
const updateEvent = async ({ eventId, user, updates }) => {
  const invalidFields = Object.keys(updates).filter(
    (field) => !ALLOWED_FIELDS.includes(field),
  );

  if (invalidFields.length > 0) {
    const error = new Error(
      `These fields cannot be updated: ${invalidFields.join(", ")}`,
    );
    error.statusCode = 400;
    throw error;
  }

  const event = await Event.findByPk(eventId);

  if (!event) {
    const error = new Error("Event not found");
    error.statusCode = 404;
    throw error;
  }
  const isSuperAdmin = user.role === "super_admin";
  const isOwner = event.organizerId === user.id;

  if (!isSuperAdmin && !isOwner) {
    const error = new Error("You are not allowed to update this event");
    error.statusCode = 403;
    throw error;
  }

  if (event.status === "cancelled") {
    const error = new Error("Cancelled events cannot be updated");
    error.statusCode = 400;
    throw error;
  }

  if (
    event.status === "published" &&
    Object.prototype.hasOwnProperty.call(updates, "publishAt")
  ) {
    const error = new Error(
      "publishAt cannot be changed after an event is published",
    );
    error.statusCode = 400;
    throw error;
  }

  if (updates.categoryId !== undefined) {
    const category = await Category.findByPk(updates.categoryId);

    if (!category || !category.isActive) {
      const error = new Error("Category not found or inactive");
      error.statusCode = 400;
      throw error;
    }
  }

  const startAt = new Date(updates.startAt ?? event.startAt);
  const endAt = new Date(updates.endAt ?? event.endAt);

  if (
    Number.isNaN(startAt.getTime()) ||
    Number.isNaN(endAt.getTime()) ||
    endAt <= startAt
  ) {
    const error = new Error("endAt must be after startAt");
    error.statusCode = 400;
    throw error;
  }

  const publishAt = Object.prototype.hasOwnProperty.call(updates, "publishAt")
    ? updates.publishAt
    : event.publishAt;

  if (event.status === "scheduled") {
    if (!publishAt || new Date(publishAt) <= new Date()) {
      const error = new Error("A scheduled event must have a future publishAt");
      error.statusCode = 400;
      throw error;
    }

    if (new Date(publishAt) >= startAt) {
      const error = new Error("publishAt must be before the event startAt");
      error.statusCode = 400;
      throw error;
    }
  }

  if (event.status === "published" && startAt <= new Date()) {
    const error = new Error("The event startAt must remain in the future");
    error.statusCode = 400;
    throw error;
  }

  const scheduleChanged =
    event.status === "published" &&
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

  if (
    event.status === "scheduled" &&
    Object.prototype.hasOwnProperty.call(updates, "publishAt")
  ) {
    scheduleEventPublish(event);
  }

  // email send model implementation is still remaining
  return {
    event,
    scheduleChanged,
  };
};

module.exports = {
  createEvent,
  publishEvent,
  updateEvent,
};
