const STATUS_CODES = require("../constants/statusCodes");
const MESSAGES = require("../constants/messages");
const sendResponse = require("../utils/response");
const multer = require("multer");

const errorHandler = (err, req, res, next) => {
  // console.error("ERROR DETAILS:", err);
  if (err instanceof multer.MulterError) {
    err.statusCode = STATUS_CODES.BAD_REQUEST;

    if (err.code === "LIMIT_FILE_SIZE") {
      err.message = MESSAGES.FILE_SIZE_LIMIT_EXCEEDED;
    } else {
      err.message = MESSAGES.INVALID_FILE_UPLOAD;
    }
  }

  const statusCode = err.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;

  const message =
    statusCode === STATUS_CODES.INTERNAL_SERVER_ERROR
      ? MESSAGES.INTERNAL_SERVER_ERROR
      : err.message || MESSAGES.INTERNAL_SERVER_ERROR;

  return sendResponse(res, statusCode, message, null, err.errors);
};

module.exports = errorHandler;
