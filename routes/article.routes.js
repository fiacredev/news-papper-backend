import express from "express";

import articleController from "../controllers/article.controller.js";
import protect from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/role.middleware.js";

const router = express.Router();

// Every management route requires authentication.
router.use(protect);

// Admin and journalists can list their permitted articles.
router.get("/", articleController.getArticles);

router.get("/:id", articleController.getArticleById);

// Admin and journalists can create articles.
router.post("/", articleController.createArticle);

// Ownership and draft restrictions are enforced in the service.
router.patch("/:id", articleController.updateArticle);

router.delete("/:id", articleController.deleteArticle);

// Admin-only editorial operations.
router.patch(
  "/:id/publish",
  authorizeRoles("admin"),
  articleController.publishArticle
);

router.patch(
  "/:id/archive",
  authorizeRoles("admin"),
  articleController.archiveArticle
);

router.patch(
  "/:id/feature",
  authorizeRoles("admin"),
  articleController.toggleFeatured
);

export default router;