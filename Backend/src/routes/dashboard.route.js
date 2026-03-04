import express from "express";

import {
  getDashboardRecentActivityController,
  getDashboardSummaryController,
} from "../controllers/dashboard.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validate-request.middleware.js";
import { dashboardSchemas } from "../validations/request-schemas.js";

const router = express.Router();

router.use(protect);

router.get("/summary", getDashboardSummaryController);
router.get(
  "/recent-activity",
  validateRequest(dashboardSchemas.recentActivity),
  getDashboardRecentActivityController
);

export default router;
