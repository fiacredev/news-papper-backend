
import multer from "multer";
import { fileTypeFromBuffer } from "file-type";

const storage = multer.memoryStorage();

const allowedTypes = [
  "image/jpeg",
  "image/png",
  "image/webp"
];

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10,
    fields: 20
  },

  fileFilter: (req, file, cb) => {
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new Error("Only JPEG, PNG and WEBP images are allowed")
      );
    }

    cb(null, true);
  }
});

// Verify actual file contents after Multer receives files
export const validateUploadedImages = async (req, res, next) => {
  try {
    const files = Object.values(req.files || {}).flat();

    for (const file of files) {
      const detectedType = await fileTypeFromBuffer(file.buffer);

      if (!detectedType || !allowedTypes.includes(detectedType.mime)) {
        const error = new Error("Invalid image file detected");
        error.statusCode = 400;
        throw error;
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default upload;
