const MESSAGES = {
  INTERNAL_SERVER_ERROR: "Internal server error",
  VALIDATION_FAILED: "Validation failed",

  USER_REGISTERED_SUCCESSFULLY: "User registered successfully",
  LOGIN_SUCCESSFUL: "Login successful",
  ACCESS_TOKEN_REFRESHED_SUCCESSFULLY: "Access token refreshed successfully",
  PASSWORD_RESET_REQUEST_SENT:
    "If the email is registered, a password reset link will be sent.",
  PASSWORD_RESET_SUCCESSFULLY: "Password reset successfully.",
  LOGGED_OUT_SUCCESSFULLY: "Logged out successfully",

  EVENT_CREATED_SUCCESSFULLY: "Event created successfully",
  EVENT_SCHEDULED_FOR_PUBLICATION_SUCCESSFULLY:
    "Event scheduled for publication successfully",
  EVENT_PUBLISHED_SUCCESSFULLY: "Event published successfully",
  EVENTS_FETCHED_SUCCESSFULLY: "Events fetched successfully",
  EVENT_UPDATED_SUCCESSFULLY: "Event updated successfully",
  EVENT_DELETED_SUCCESSFULLY: "Event deleted successfully",
  EVENT_BANNER_UPLOADED_SUCCESSFULLY: "Event banner uploaded successfully",
  EVENT_REGISTRATION_SUCCESSFUL: "Event registration successful",
  EVENT_REGISTRATION_CANCELLED_SUCCESSFULLY:
    "Event registration cancelled successfully",
  REGISTRATION_HISTORY_FETCHED_SUCCESSFULLY:
    "Registration history fetched successfully",
  AUTHENTICATION_SUCCESSFUL: "Authentication successful",
  AUTHORIZATION_SUCCESSFUL: "Authorization successful",

  ACCESS_TOKEN_REQUIRED: "Access token is required",
  INVALID_ACCESS_TOKEN_PAYLOAD: "Invalid access token payload",
  INVALID_OR_EXPIRED_ACCESS_TOKEN: "Invalid or expired access token",
  INVALID_OR_EXPIRED_REFRESH_TOKEN: "Invalid or expired refresh token",
  SESSION_INVALID_EXPIRED_OR_INACTIVE:
    "Session is invalid, expired, or inactive",
  SESSION_NOT_FOUND_OR_INACTIVE: "Session not found or inactive",
  UNAUTHORIZED: "Unauthorized",
  FORBIDDEN: "Forbidden: You do not have permission to perform this action",

  SUPER_ADMIN_REGISTRATION_NOT_ALLOWED:
    "Super admin registration is not allowed",
  EMAIL_ALREADY_REGISTERED: "Email is already registered",
  INVALID_EMAIL_OR_PASSWORD: "Invalid email or password",
  USER_NOT_FOUND: "User not found",
  INVALID_OR_EXPIRED_RESET_TOKEN: "Invalid or expired reset token.",
  NEW_PASSWORD_MUST_BE_DIFFERENT:
    "New password must be different from your current password.",

  EVENT_NOT_FOUND: "Event not found",
  CATEGORY_NOT_FOUND_OR_INACTIVE: "Category not found or inactive",
  INVALID_EVENT_DATE: "Invalid event date",
  EVENT_START_TIME_MUST_BE_IN_FUTURE: "Event start time must be in the future",
  EVENT_END_TIME_MUST_BE_AFTER_START_TIME:
    "Event end time must be after start time",
  PUBLICATION_TIME_MUST_BE_VALID_FUTURE_DATE:
    "Publication time must be a valid future date",
  EVENT_START_TIME_MUST_BE_AFTER_SCHEDULED_PUBLICATION:
    "Event start time must be after the scheduled publication time",
  NOT_ALLOWED_TO_PERFORM_ACTION: "You are not allowed to perform this action",
  EVENT_CANNOT_BE_PUBLISHED_AFTER_START:
    "An event cannot be published that has already started",
  PUBLICATION_TIME_MUST_BE_IN_FUTURE: "Publication time must be in the future",
  PUBLICATION_TIME_MUST_BE_BEFORE_EVENT_START:
    "Publication time must be before the event start time",
  NOT_ALLOWED_TO_UPDATE_EVENT: "You are not allowed to update this event",
  CANCELLED_EVENTS_CANNOT_BE_UPDATED: "Cancelled events cannot be updated",
  PUBLISH_AT_CANNOT_CHANGE_AFTER_PUBLICATION:
    "publishAt cannot be changed after an event is published",
  END_AT_MUST_BE_AFTER_START_AT: "endAt must be after startAt",
  SCHEDULED_EVENT_REQUIRES_FUTURE_PUBLISH_AT:
    "A scheduled event must have a future publishAt",
  PUBLISH_AT_MUST_BE_BEFORE_EVENT_START_AT:
    "publishAt must be before the event startAt",
  EVENT_START_AT_MUST_REMAIN_IN_FUTURE:
    "The event startAt must remain in the future",
  NOT_ALLOWED_TO_DELETE_EVENT: "You are not allowed to delete this event",
  CANCELLED_EVENTS_CANNOT_BE_DELETED: "Cancelled events cannot be deleted",
  CANNOT_DELETE_EVENT_WITH_REGISTRATIONS:
    "Cannot delete this event because registrations exist",
  NOT_ALLOWED_TO_UPLOAD_BANNER: "You are not allowed to upload the banner",
  CANNOT_UPLOAD_BANNER_FOR_CANCELLED_EVENTS:
    "Cannot upload banner for the cancelled events",

  ONLY_SUPPORTED_IMAGE_TYPES_ALLOWED:
    "Only JPEG, JPG, PNG, and WebP images are allowed",
  BANNER_IMAGE_REQUIRED: "Banner image is required",
  INVALID_IMAGE_CONTENT: "Invalid image content",
  IMAGE_CONTENT_MIME_TYPE_MISMATCH:
    "Image content does not match its MIME type",

  ONLY_REGISTER_FOR_PUBLISHED_EVENTS:
    "You can only register for published events",
  REGISTRATION_DEADLINE_PASSED: "Registration deadline has passed",
  ALREADY_REGISTERED_FOR_EVENT: "You have already registered for this event",
  ACTIVE_REGISTRATION_NOT_FOUND: "Active registration not found",

  NAME_REQUIRED: "Name is required",
  NAME_MUST_BE_AT_LEAST_2_CHARACTERS: "Name must be at least 2 characters long",
  NAME_CANNOT_EXCEED_100_CHARACTERS: "Name cannot exceed 100 characters",
  EMAIL_REQUIRED: "Email is required",
  INVALID_EMAIL_ADDRESS: "Please enter a valid email address",
  PASSWORD_REQUIRED: "Password is required",
  PASSWORD_MUST_BE_AT_LEAST_8_CHARACTERS:
    "Password must be at least 8 characters long",
  PASSWORD_CANNOT_EXCEED_72_CHARACTERS: "Password cannot exceed 72 characters",
  ROLE_REQUIRED: "Role is required",
  ROLE_MUST_BE_USER_OR_ORGANIZER: "Role must be user or organizer",
  FILE_SIZE_LIMIT_EXCEEDED: "File size must not exceed 5 MB.",
  INVALID_FILE_UPLOAD: "Invalid file upload.",
};

module.exports = MESSAGES;
