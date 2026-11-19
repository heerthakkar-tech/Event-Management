const AppError = require("../utils/AppError");
const STATUS_CODES = require("../constants/statusCodes");
const MESSAGES = require("../constants/messages");

const validate = (schema, source = "body") => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
    });

    if (error) {
      const validationError = new AppError(
        MESSAGES.VALIDATION_FAILED,
        STATUS_CODES.BAD_REQUEST,
      );

      validationError.errors = error.details.map((detail) => detail.message);

      return next(validationError);
    }

    req[source] = value;
    return next();
  };
};

module.exports = validate;
