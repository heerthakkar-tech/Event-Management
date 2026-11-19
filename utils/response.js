const sendResponse = (res, statusCode, message, data = null, errors) => {
  const success = statusCode >= 200 && statusCode < 300;

  const responseBody = {
    data,
    meta: {
      message,
      code: success ? 1 : 0,
    },
  };

  if (errors !== undefined && errors !== null) {
    responseBody.errors = errors;
  }

  return res.status(statusCode).json(responseBody);
};

module.exports = sendResponse;
