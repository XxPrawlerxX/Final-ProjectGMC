const MAX_SIDE = 1600; // pixels
const QUALITY = 0.85;

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Resizes a picture in the browser before upload, so phone photos (often 5 MB+)
// become a few hundred KB. Always returns a JPEG.
export async function shrinkImage(file) {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new Error(`“${file.name}” isn't a JPEG, PNG or WebP picture.`);
  }
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(`“${file.name}” couldn't be read as a picture.`);
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff"; // JPEG has no transparency
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", QUALITY));
  if (!blob) throw new Error(`“${file.name}” couldn't be processed.`);
  const base = file.name.replace(/\.[^.]+$/, "") || "photo";
  return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
}
