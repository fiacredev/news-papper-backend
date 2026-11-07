
import express from "express";

import authRoutes from "./auth.routes.js";
import adminNewsRoutes from "./adminNews.routes.js";
import newsRoutes from "./news.routes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/journalist/news", adminNewsRoutes);
router.use("/news", newsRoutes);

export default router;
