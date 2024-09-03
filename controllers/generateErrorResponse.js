function generateErrorResponse(res, statusCode, message) {
  return res.status(statusCode).json({ message });
}

module.exports = generateErrorResponse;
