import express from "express";

import userController from "../controllers/user.controller.js";
import protect from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/role.middleware.js";

const router = express.Router();

router.use(protect, authorizeRoles("admin"));

router.get("/journalists", userController.getJournalists);

router.get("/journalists/:id", userController.getJournalistById);

router.patch("/journalists/:id", userController.updateJournalist);

router.patch(
  "/journalists/:id/status",
  userController.toggleStatus
);

router.delete(
  "/journalists/:id",
  userController.deleteJournalist
);

export default router;