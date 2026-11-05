const { Event, EventRegistration, sequelize } = require("../models");
const { Op } = require("sequelize");

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
      const error = new Error("Event Not Found");
      error.statusCode = 404;
      throw error;
    }

    // Check event status
    if (event.status !== "published") {
      const error = new Error("You can only register for published events");
      error.statusCode = 400;
      throw error;
    }

    // Check registration deadline
    const now = new Date();

    if (new Date(event.startAt) <= now) {
      const error = new Error("Registration deadline has passed");
      error.statusCode = 400;
      throw error;
    }

    // Check duplicate active registration
    const existingRegistration = await EventRegistration.findOne({
      where: {
        eventId,
        userId,
        status: {
          [Op.in]: ["confirmed", "waitlisted"],
        },
      },
      transaction,
    });

    if (existingRegistration) {
      const error = new Error("You have already registered for this event");
      error.statusCode = 409;
      throw error;
    }

    // Check event capacity
    const confirmedRegistrations = await EventRegistration.count({
      where: {
        eventId,
        status: "confirmed",
      },
      transaction,
    });

    const isEventFull = confirmedRegistrations >= event.capacity;

    // Decide registration status
    let registrationStatus;
    let waitlistPosition = null;

    if (isEventFull) {
      registrationStatus = "waitlisted";

      const lastWaitlistedUser = await EventRegistration.findOne({
        where: {
          eventId,
          status: "waitlisted",
        },
        order: [["waitlistPosition", "DESC"]],
        transaction,
      });

      waitlistPosition = lastWaitlistedUser
        ? lastWaitlistedUser.waitlistPosition + 1
        : 1;
    } else {
      registrationStatus = "confirmed";
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

  try {
    transaction = await sequelize.transaction();

    // find event and lock its row
    const event = await Event.findByPk(eventId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    // check event exists
    if (!event) {
      const error = new Error("Event Not Found");
      error.statusCode = 404;
      throw error;
    }

    // find user active registration
    const registration = await EventRegistration.findOne({
      where: {
        eventId,
        userId,
        status: {
          [Op.in]: ["confirmed", "waitlisted"],
        },
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    // check if registration exists
    if (!registration) {
      const error = new Error("Active registration not found");
      error.statusCode = 404;
      throw error;
    }

    const wasConfirmed = registration.status === "confirmed";

    // store original waitlist position
    const cancelledWaitlistPosition = registration.waitlistPosition;

    // cancel user registration
    registration.status = "cancelled";
    registration.cancelledAt = new Date();
    registration.waitlistPosition = null;

    await registration.save({ transaction });

    if (wasConfirmed) {
      // find the first waitlisted user
      const firstWaitlistedUser = await EventRegistration.findOne({
        where: {
          eventId,
          status: "waitlisted",
        },
        order: [["waitlistPosition", "ASC"]],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      // promote first waitlisted user
      if (firstWaitlistedUser) {
        firstWaitlistedUser.status = "confirmed";
        firstWaitlistedUser.waitlistPosition = null;

        await firstWaitlistedUser.save({ transaction });
      }
    } else if (cancelledWaitlistPosition !== null) {
      // find users behind the cancelled user
      const remainingWaitlistedUsers = await EventRegistration.findAll({
        where: {
          eventId,
          status: "waitlisted",
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

    return registration;
  } catch (error) {
    //  if a transaction exists and it has not already finished roll it back.
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }

    throw error;
  }
};

module.exports = {
  registerForEvent,
  cancelRegistration,
};
