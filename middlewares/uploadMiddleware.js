const multer = require("multer");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error("Only JPEG, JPG, PNG, and WebP images are allowed");

    error.statusCode = 400;
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
      return res.status(400).json({
        success: false,
        message: "Banner image is required",
      });
    }

    const { fileTypeFromBuffer } = await import("file-type");

    const detectedType = await fileTypeFromBuffer(req.file.buffer);

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!detectedType || !allowedTypes.includes(detectedType.mime)) {
      return res.status(400).json({
        success: false,
        message: "Invalid image content",
      });
    }

    if (detectedType.mime !== req.file.mimetype) {
      return res.status(400).json({
        success: false,
        message: "Image content does not match its MIME type",
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  upload,
  validateImageContent,
};
