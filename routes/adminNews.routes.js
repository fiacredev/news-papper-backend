
import express from "express";

import adminNewsController from "../controllers/adminNews.controller.js";
import protect from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/role.middleware.js";
import upload, {
  validateUploadedImages
} from "../middleware/upload.middleware.js";

const router = express.Router();

const articleUploads = upload.fields([
  { name: "featuredImage", maxCount: 1 },
  { name: "images", maxCount: 10 }
]);

// All routes require authentication
router.use(protect);

// Create article
router.post(
  "/",
  authorizeRoles("admin", "journalist"),
  articleUploads,
  validateUploadedImages,
  adminNewsController.createArticle
);

// Get articles
router.get(
  "/",
  authorizeRoles("admin", "journalist"),
  adminNewsController.getAllArticles
);

// Get single article
router.get(
  "/:id",
  authorizeRoles("admin", "journalist"),
  adminNewsController.getArticleById
);

// Update article
router.put(
  "/:id",
  authorizeRoles("admin", "journalist"),
  articleUploads,
  validateUploadedImages,
  adminNewsController.updateArticle
);

// Delete article
router.delete(
  "/:id",
  authorizeRoles("admin", "journalist"),
  adminNewsController.deleteArticle
);

// Publish article - admin only
router.patch(
  "/:id/publish",
  authorizeRoles("admin"),
  adminNewsController.publishArticle
);

// Save draft
router.patch(
  "/:id/draft",
  authorizeRoles("admin", "journalist"),
  adminNewsController.saveDraft
);

export default router;
