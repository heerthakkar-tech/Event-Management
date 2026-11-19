const Joi = require("joi");

// user regisration schema
const registerForEventSchema = Joi.object({
  eventId: Joi.string()
    .guid({ version: ["uuidv4", "uuidv5"] })
    .required(),
});

//cancel registration
const cancelRegistrationSchema = Joi.object({
  eventId: Joi.string()
    .guid({ version: ["uuidv4", "uuidv5"] })
    .required(),
});

// View registration history schema
const registrationHistorySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).max(100).default(10),
});

module.exports = {
  registerForEventSchema,
  cancelRegistrationSchema,
  registrationHistorySchema,
};
