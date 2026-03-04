import express from "express";

import {
  createJobController,
  deleteJobController,
  getJobByIdController,
  getJobScreeningResultsController,
  getJobsController,
  updateJobController,
} from "../controllers/job.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/", createJobController);
router.get("/", getJobsController);
router.get("/:jobId/results", getJobScreeningResultsController);
router.get("/:id", getJobByIdController);
router.patch("/:id", updateJobController);
router.delete("/:id", deleteJobController);

export default router;
