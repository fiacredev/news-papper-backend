
import express from "express";

import newsController from "../controllers/news.controller.js";

const router = express.Router();

router.get("/", newsController.getNews);
router.get("/categories", newsController.getCategories);
router.get("/:slug", newsController.getNewsBySlug);

export default router;
