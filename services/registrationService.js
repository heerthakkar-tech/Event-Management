const { Event, EventRegistration, User, sequelize } = require("../models");
const { Op } = require("sequelize");
const sendRegistrationEmail = require("../utils/registrationEmail");
const sendWaitlistPromotionEmail = require("../utils/sendWaitlistPromotionEmail");
const STATUS_CODES = require("../constants/statusCodes");
const MESSAGES = require("../constants/messages");
const AppError = require("../utils/AppError");
const EVENT_STATUS = require("../constants/eventStatus");
const REGISTRATION_STATUS = require("../constants/registrationStatus");

// Register for event
const registerForEvent = async (eventId, userId) => {
  let transaction;

  try {
    transaction = await sequelize.transaction();

    // Find event and lock its row
    const event = await Event.findByPk(eventId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    // Check event exists
    if (!event) {
      throw new AppError(MESSAGES.EVENT_NOT_FOUND, STATUS_CODES.NOT_FOUND);
    }

    // Check event status
    if (event.status !== EVENT_STATUS.PUBLISHED) {
      throw new AppError(
        MESSAGES.ONLY_REGISTER_FOR_PUBLISHED_EVENTS,
        STATUS_CODES.BAD_REQUEST,
      );
    }

    // Check registration deadline
    const now = new Date();

    if (new Date(event.startAt) <= now) {
      throw new AppError(
        MESSAGES.REGISTRATION_DEADLINE_PASSED,
        STATUS_CODES.BAD_REQUEST,
      );
    }

    // Check duplicate active registration
    const existingRegistration = await EventRegistration.findOne({
      where: {
        eventId,
        userId,
        status: {
          [Op.in]: [
            REGISTRATION_STATUS.CONFIRMED,
            REGISTRATION_STATUS.WAITLISTED,
          ],
        },
      },
      transaction,
    });

    if (existingRegistration) {
      throw new AppError(
        MESSAGES.ALREADY_REGISTERED_FOR_EVENT,
        STATUS_CODES.CONFLICT,
      );
    }

    // Check event capacity
    const confirmedRegistrations = await EventRegistration.count({
      where: {
        eventId,
        status: REGISTRATION_STATUS.CONFIRMED,
      },
      transaction,
    });

    const isEventFull = confirmedRegistrations >= event.capacity;

    // Decide registration status
    let registrationStatus;
    let waitlistPosition = null;

    if (isEventFull) {
      registrationStatus = REGISTRATION_STATUS.WAITLISTED;

      const lastWaitlistedUser = await EventRegistration.findOne({
        where: {
          eventId,
          status: REGISTRATION_STATUS.WAITLISTED,
        },
        order: [["waitlistPosition", "DESC"]],
        transaction,
      });

      waitlistPosition = lastWaitlistedUser
        ? lastWaitlistedUser.waitlistPosition + 1
        : 1;
    } else {
      registrationStatus = REGISTRATION_STATUS.CONFIRMED;
    }

    // Create event registration
    const registration = await EventRegistration.create(
      {
        userId,
        eventId,
        status: registrationStatus,
        waitlistPosition,
        registeredAt: new Date(),
      },
      { transaction },
    );

    // Commit transaction
    await transaction.commit();

    // Send registration email
    try {
      const user = await User.findByPk(userId);

      if (user) {
        await sendRegistrationEmail({
          name: user.name,
          email: user.email,
          eventTitle: event.title,
          eventStartAt: event.startAt,
          eventLocation: event.location,
          status: registration.status,
          waitlistPosition: registration.waitlistPosition,
        });
      }
    } catch (emailError) {
      console.error("Registration email failed:", emailError);
    }

    return registration;
  } catch (error) {
    // Rollback transaction if something fails
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }

    throw error;
  }
};

// cancel registration
const cancelRegistration = async (eventId, userId) => {
  let transaction;
  let promotedRegistration = null;

  try {
    transaction = await sequelize.transaction();

    // find event and lock its row
    const event = await Event.findByPk(eventId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    // check event exists
    if (!event) {
      throw new AppError(MESSAGES.EVENT_NOT_FOUND, STATUS_CODES.NOT_FOUND);
    }

    // find user active registration
    const registration = await EventRegistration.findOne({
      where: {
        eventId,
        userId,
        status: {
          [Op.in]: [
            REGISTRATION_STATUS.CONFIRMED,
            REGISTRATION_STATUS.WAITLISTED,
          ],
        },
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    // check if registration exists
    if (!registration) {
      throw new AppError(
        MESSAGES.ACTIVE_REGISTRATION_NOT_FOUND,
        STATUS_CODES.NOT_FOUND,
      );
    }

    const wasConfirmed = registration.status === REGISTRATION_STATUS.CONFIRMED;

    // store original waitlist position
    const cancelledWaitlistPosition = registration.waitlistPosition;

    // cancel user registration
    registration.status = REGISTRATION_STATUS.CANCELLED;
    registration.cancelledAt = new Date();
    registration.waitlistPosition = null;

    await registration.save({ transaction });

    if (wasConfirmed) {
      // find the first waitlisted user
      const firstWaitlistedUser = await EventRegistration.findOne({
        where: {
          eventId,
          status: REGISTRATION_STATUS.WAITLISTED,
        },
        order: [["waitlistPosition", "ASC"]],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      // promote first waitlisted user
      if (firstWaitlistedUser) {
        const promotedPosition = firstWaitlistedUser.waitlistPosition;
        firstWaitlistedUser.status = REGISTRATION_STATUS.CONFIRMED;
        firstWaitlistedUser.waitlistPosition = null;

        await firstWaitlistedUser.save({ transaction });

        // store promoted registration for email
        promotedRegistration = firstWaitlistedUser;
        const remainingWaitlistedUsers = await EventRegistration.findAll({
          where: {
            eventId,
            status: REGISTRATION_STATUS.WAITLISTED,
            waitlistPosition: {
              [Op.gt]: promotedPosition,
            },
          },
          order: [["waitlistPosition", "ASC"]],
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        for (const waitlistedUser of remainingWaitlistedUsers) {
          waitlistedUser.waitlistPosition -= 1;

          await waitlistedUser.save({
            transaction,
          });
        }
      }
    } else if (cancelledWaitlistPosition !== null) {
      // find users behind the cancelled user
      const remainingWaitlistedUsers = await EventRegistration.findAll({
        where: {
          eventId,
          status: REGISTRATION_STATUS.WAITLISTED,
          waitlistPosition: {
            [Op.gt]: cancelledWaitlistPosition,
          },
        },
        order: [["waitlistPosition", "ASC"]],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      // shift remaining waitlist positions up by one
      for (const waitlistedUser of remainingWaitlistedUsers) {
        waitlistedUser.waitlistPosition -= 1;

        await waitlistedUser.save({ transaction });
      }
    }

    // commit transaction
    await transaction.commit();

    // send promotion email after successful transaction
    if (promotedRegistration) {
      try {
        const promotedUser = await User.findByPk(promotedRegistration.userId);

        if (promotedUser) {
          await sendWaitlistPromotionEmail({
            name: promotedUser.name,
            email: promotedUser.email,
            eventTitle: event.title,
            eventStartAt: event.startAt,
            eventLocation: event.location,
          });
        }
      } catch (emailError) {
        console.error("Waitlist promotion email failed:", emailError);
      }
    }

    return registration;
  } catch (error) {
    // rollback transaction if it has not already finished
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }

    throw error;
  }
};

// Get user registration history
const getRegistrationHistory = async (userId, page, limit) => {
  // Get registration summary
  const [totalRegistrations, confirmed, waitlisted, cancelled] =
    await Promise.all([
      EventRegistration.count({
        where: { userId },
      }),
      EventRegistration.count({
        where: { userId, status: REGISTRATION_STATUS.CONFIRMED },
      }),
      EventRegistration.count({
        where: { userId, status: REGISTRATION_STATUS.WAITLISTED },
      }),
      EventRegistration.count({
        where: { userId, status: REGISTRATION_STATUS.CANCELLED },
      }),
    ]);

  // Calculate pagination offset
  const offset = (page - 1) * limit;

  // Get users registration records with event details
  const { count, rows } = await EventRegistration.findAndCountAll({
    where: { userId },
    include: [
      {
        model: Event,
        as: "event",
        attributes: [
          "id",
          "title",
          "bannerUrl",
          "startAt",
          "endAt",
          "location",
        ],
      },
    ],
    order: [["registeredAt", "DESC"]],
    limit,
    offset,
  });

  // return the history
  return {
    summary: {
      totalRegistrations,
      confirmed,
      waitlisted,
      cancelled,
    },
    registrations: rows,
    pagination: {
      currentPage: page,
      limit,
      totalRecords: count,
      totalPages: Math.ceil(count / limit),
    },
  };
};

module.exports = {
  registerForEvent,
  cancelRegistration,
  getRegistrationHistory,
};
