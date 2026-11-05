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

module.exports = {
  registerForEventSchema,
  cancelRegistrationSchema,
};
