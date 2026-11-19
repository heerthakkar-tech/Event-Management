const Joi = require("joi");
// create event schema
const createEventSchema = Joi.object({
  categoryId: Joi.string()
    .guid({ version: ["uuidv4", "uuidv5"] })
    .required(),

  title: Joi.string().trim().min(2).max(255).required(),

  description: Joi.string().trim().min(1).required(),

  startAt: Joi.date().iso().greater("now").required(),

  endAt: Joi.date().iso().greater(Joi.ref("startAt")).required(),

  location: Joi.string().trim().min(1).required(),

  capacity: Joi.number().integer().positive().required(),

  ticketPrice: Joi.number().precision(2).min(0).required(),

  publishAt: Joi.date().iso().greater("now").optional(),
});
// publish event schema
const publishEventIdSchema = Joi.object({
  eventId: Joi.string()
    .guid({ version: ["uuidv4", "uuidv5"] })
    .required(),
});

//view events schema

const publishedEventsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).max(100).default(10),
});

// update event schema
const updateEventSchema = Joi.object({
  title: Joi.string().trim().min(3).max(255),

  description: Joi.string().trim().min(1),

  startAt: Joi.date().iso(),

  endAt: Joi.date().iso(),

  location: Joi.string().trim().min(1),

  capacity: Joi.number().integer().positive(),

  categoryId: Joi.string().uuid(),

  publishAt: Joi.date().iso().allow(null),
})
  .min(1)
  .unknown(false);

const updateEventParamsSchema = Joi.object({
  eventId: Joi.string().uuid().required(),
});

module.exports = {
  createEventSchema,
  publishEventIdSchema,
  updateEventSchema,
  updateEventParamsSchema,
  publishedEventsSchema,
};
