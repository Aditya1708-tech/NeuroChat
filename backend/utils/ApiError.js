export class ApiError extends Error {
  constructor(status, code, message, fields = null, retryable = false) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
    this.retryable = retryable;
    Error.captureStackTrace(this, this.constructor);
  }
}
