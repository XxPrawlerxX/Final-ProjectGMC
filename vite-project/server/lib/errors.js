export class HttpError extends Error {
  constructor(status, message, field) {
    super(message);
    this.status = status;
    this.field = field;
  }
}

// Express 4 doesn't catch rejected promises from async handlers; this does.
export const wrap = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);
