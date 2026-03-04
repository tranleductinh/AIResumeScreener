import express from "express";

import {
  analyzeJobJdController,
  createJobController,
  deleteJobController,
  getJobByIdController,
  getJobCandidateActionsController,
  getJobScreeningResultsController,
  getJobsController,
  updateJobController,
} from "../controllers/job.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validate-request.middleware.js";
import {
  candidateActionSchemas,
  commonSchemas,
  jobSchemas,
  screeningResultSchemas,
} from "../validations/request-schemas.js";

const router = express.Router();

router.use(protect);

router.post("/", validateRequest(jobSchemas.create), createJobController);
router.post("/:id/analyze-jd", validateRequest(commonSchemas.objectIdParam), analyzeJobJdController);
router.get("/", validateRequest(jobSchemas.list), getJobsController);
router.get(
  "/:jobId/actions",
  validateRequest(candidateActionSchemas.list),
  getJobCandidateActionsController
);
router.get(
  "/:jobId/results",
  validateRequest({
    params: { jobId: commonSchemas.objectIdParam.params.id },
    query: screeningResultSchemas.list.query,
  }),
  getJobScreeningResultsController
);
router.get("/:id", validateRequest(commonSchemas.objectIdParam), getJobByIdController);
router.patch("/:id", validateRequest(jobSchemas.update), updateJobController);
router.delete("/:id", validateRequest(commonSchemas.objectIdParam), deleteJobController);

export default router;
