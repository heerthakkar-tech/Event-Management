const schedule = require("node-schedule");
const { Event } = require("../models");
const { Op } = require("sequelize");
const EVENT_STATUS = require("../constants/eventStatus");

const scheduleEventPublish = (event) => {
  const jobName = `publish-${event.id}`;
  const publishTime = new Date(event.publishAt);

  if (Number.isNaN(publishTime.getTime()) || publishTime <= new Date()) {
    console.log("Publish time must be in the future");
    return;
  }

  if (event.status !== EVENT_STATUS.SCHEDULED) {
    return;
  }

  const existingJob = schedule.scheduledJobs[jobName];

  if (existingJob) {
    existingJob.cancel();
  }

  const job = schedule.scheduleJob(jobName, publishTime, async () => {
    try {
      // find event again because it is possible that event is scheduled yesterday , today someone cancelled it and te scheduled time arrives so we should not publish the cancelled event
      const currentEvent = await Event.findByPk(event.id);

      if (
        !currentEvent ||
        currentEvent.status !== EVENT_STATUS.SCHEDULED ||
        !currentEvent.publishAt ||
        new Date(currentEvent.publishAt) > new Date()
      ) {
        return;
      }

      currentEvent.status = EVENT_STATUS.PUBLISHED;
      currentEvent.publishedAt = new Date();

      await currentEvent.save();

      console.log(`Event ${event.id} published successfully`);
    } catch (error) {
      console.error(`Failed to publish event ${event.id}:`, error);
    }
  });

  if (!job) {
    throw new Error(`Failed to schedule event ${event.id}`);
  }

  console.log(`Event ${event.id} scheduled for ${publishTime}`);
};

const restoreScheduledEvents = async () => {
  const events = await Event.findAll({
    where: {
      status: EVENT_STATUS.SCHEDULED,
      publishAt: {
        [Op.gt]: new Date(),
      },
    },
  });

  for (const event of events) {
    scheduleEventPublish(event);
  }

  console.log(`Restored ${events.length} scheduled event jobs`);
};

module.exports = { scheduleEventPublish, restoreScheduledEvents };
