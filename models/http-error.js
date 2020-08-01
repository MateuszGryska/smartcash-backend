class HttpError extends Error {
  constructor(message, errorCode) {
    super(message); // add a "messeage" property
    this.code = errorCode;
  }
}

module.exports = HttpError;
