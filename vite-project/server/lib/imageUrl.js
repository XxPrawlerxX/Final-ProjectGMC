import { config } from "../config.js";

// Uploaded pictures are stored as "/api/images/<id>". If the website lives on a
// different domain than the API, send the full address instead.
export function imageUrl(path) {
  if (typeof path === "string" && path.startsWith("/") && config.publicApiUrl) {
    return config.publicApiUrl + path;
  }
  return path;
}
