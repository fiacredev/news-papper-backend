
import cloudinary from "../config/cloudinary.js";

const uploadImage = (fileBuffer, folder = "news/articles") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp"]
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        if (!result?.secure_url || !result?.public_id) {
          return reject(
            new Error("Cloudinary returned an invalid upload result")
          );
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id
        });
      }
    );

    stream.on("error", reject);
    stream.end(fileBuffer);
  });
};

const deleteImage = async (publicId) => {
  if (!publicId) return null;

  const result = await cloudinary.uploader.destroy(publicId);

  if (result.result !== "ok" && result.result !== "not found") {
    throw new Error("Failed to delete image from Cloudinary");
  }

  return result;
};

const uploadService = {
  uploadImage,
  deleteImage
};

export default uploadService;
