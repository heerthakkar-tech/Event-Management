const Joi = require("joi");
const ROLES = require("../constants/roles");

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    "string.empty": "Name is required",
    "string.min": "Name must be at least 2 characters long",
    "string.max": "Name cannot exceed 100 characters",
    "any.required": "Name is required",
  }),

  email: Joi.string()
    .trim()
    .pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    .max(255)
    .required()
    .messages({
      "string.pattern.base": "Please enter a valid email address",
      "string.empty": "Email is required",
      "any.required": "Email is required",
    }),

  password: Joi.string().min(8).max(72).required().messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 8 characters long",
    "string.max": "Password cannot exceed 72 characters",
    "any.required": "Password is required",
  }),

  role: Joi.string().valid(ROLES.USER, ROLES.ORGANIZER).required().messages({
    "any.only": "Role must be user or organizer",
    "any.required": "Role is required",
    "string.empty": "Role is required",
  }),
});

const loginSchema = Joi.object({
  email: Joi.string()
    .trim()
    .pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    .max(255)
    .required()
    .messages({
      "string.pattern.base": "Please enter a valid email address",
      "string.empty": "Email is required",
      "any.required": "Email is required",
    }),

  password: Joi.string().required().messages({
    "any.required": "Password is required",
    "string.empty": "Password is required",
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
};
