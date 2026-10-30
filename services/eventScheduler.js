const schedule = require("node-schedule");
const { Event } = require("../models");
const { Op } = require("sequelize");

const scheduleEventPublish = (event) => {
  const jobName = `publish-${event.id}`;
  const publishTime = new Date(event.publishAt);

  if (Number.isNaN(publishTime.getTime()) || publishTime <= new Date()) {
    console.log("Publish time must be in the future");
    return;
  }

  if (event.status !== "scheduled") {
    return;
  }

  const existingJob = schedule.scheduledJobs[jobName];

  if (existingJob) {
    existingJob.cancel();
  }

  const job = schedule.scheduleJob(jobName, publishTime, async () => {
    try {
      const currentEvent = await Event.findByPk(event.id);

      if (
        !currentEvent ||
        currentEvent.status !== "scheduled" ||
        !currentEvent.publishAt ||
        new Date(currentEvent.publishAt) > new Date()
      ) {
        return;
      }

      currentEvent.status = "published";
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
      status: "scheduled",
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
