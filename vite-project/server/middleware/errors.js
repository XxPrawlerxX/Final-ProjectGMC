export function notFound(req, res) {
  res.status(404).json({ error: "Not found." });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err.type === "entity.parse.failed") return res.status(400).json({ error: "Invalid JSON." });
  if (err.type === "entity.too.large") return res.status(413).json({ error: "Request too large." });
  if (err.status && err.status < 500) {
    return res.status(err.status).json({ error: err.message, field: err.field });
  }
  if (err.code === 11000) return res.status(409).json({ error: "That already exists." });
  if (err.name === "CastError" || err.name === "ValidationError") {
    return res.status(400).json({ error: "Invalid data." });
  }
  console.error(err); // details stay in the server log, never in the response
  res.status(500).json({ error: "Something went wrong on our side." });
}
