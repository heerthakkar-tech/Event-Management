const multer = require("multer");
const AppError = require("../utils/AppError");
const STATUS_CODES = require("../constants/statusCodes");
const MESSAGES = require("../constants/messages");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new AppError(
      MESSAGES.ONLY_SUPPORTED_IMAGE_TYPES_ALLOWED,
      STATUS_CODES.BAD_REQUEST,
    );

    cb(error);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
});

// Validate actual image content
const validateImageContent = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError(
        MESSAGES.BANNER_IMAGE_REQUIRED,
        STATUS_CODES.BAD_REQUEST,
      );
    }

    const { fileTypeFromBuffer } = await import("file-type");

    const detectedType = await fileTypeFromBuffer(req.file.buffer);

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!detectedType || !allowedTypes.includes(detectedType.mime)) {
      throw new AppError(
        MESSAGES.INVALID_IMAGE_CONTENT,
        STATUS_CODES.BAD_REQUEST,
      );
    }

    if (detectedType.mime !== req.file.mimetype) {
      throw new AppError(
        MESSAGES.IMAGE_CONTENT_MIME_TYPE_MISMATCH,
        STATUS_CODES.BAD_REQUEST,
      );
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  upload,
  validateImageContent,
};
