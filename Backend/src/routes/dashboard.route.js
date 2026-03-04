import express from "express";

import {
  getDashboardRecentActivityController,
  getDashboardSummaryController,
} from "../controllers/dashboard.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/summary", getDashboardSummaryController);
router.get("/recent-activity", getDashboardRecentActivityController);

export default router;
