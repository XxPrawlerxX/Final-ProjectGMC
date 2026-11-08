import { Image } from "../models/Image.js";
import { detectImageType, imageIdFromPath, imagePath } from "./imageTypes.js";

// Saves uploaded files (multer memory buffers) and returns their URLs, in order.
export async function saveImages(files, ownerId) {
  const urls = [];
  for (const file of files) {
    const contentType = detectImageType(file.buffer);
    if (!contentType) {
      const err = new Error("Only JPEG, PNG or WebP pictures are allowed.");
      err.status = 400;
      err.field = "images";
      throw err;
    }
    const saved = await Image.create({
      data: file.buffer,
      contentType,
      size: file.buffer.length,
      owner: ownerId,
    });
    urls.push(imagePath(saved._id));
  }
  return urls;
}

export async function deleteImagesByPath(paths, ownerId) {
  const ids = paths.map(imageIdFromPath).filter(Boolean);
  if (ids.length) await Image.deleteMany({ _id: { $in: ids }, owner: ownerId });
}
