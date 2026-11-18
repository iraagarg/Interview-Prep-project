// Small helper so controllers can `throw httpError(404, 'Interview not found')`
const httpError = (statusCode, message) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

module.exports = httpError;
