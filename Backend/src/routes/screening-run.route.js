import express from "express";

import {
  createScreeningRunController,
  getScreeningRunByIdController,
  getScreeningRunsController,
  updateScreeningRunStatusController,
} from "../controllers/screening-run.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/", createScreeningRunController);
router.get("/", getScreeningRunsController);
router.get("/:id", getScreeningRunByIdController);
router.patch("/:id/status", updateScreeningRunStatusController);

export default router;
