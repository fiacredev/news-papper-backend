
import express from "express";

import authController from "../controllers/auth.controller.js";
import protect from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/role.middleware.js";

const router = express.Router();

// Public login
router.post("/login", authController.login);

// Admin creates journalist accounts
router.post(
  "/journalists",
  protect,
  authorizeRoles("admin"),
  authController.createJournalist
);

// Current authenticated user
router.get("/me", protect, authController.getProfile);

export default router;
