import express from "express";

import {
  createScreeningRunController,
  deleteScreeningRunController,
  getScreeningRunByIdController,
  getScreeningRunResultsController,
  getScreeningRunsController,
  updateScreeningRunStatusController,
} from "../controllers/screening-run.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validate-request.middleware.js";
import {
  commonSchemas,
  screeningResultSchemas,
  screeningRunSchemas,
} from "../validations/request-schemas.js";

const router = express.Router();

router.use(protect);

router.post("/", validateRequest(screeningRunSchemas.create), createScreeningRunController);
router.get("/", validateRequest(screeningRunSchemas.list), getScreeningRunsController);
router.get(
  "/:id/results",
  validateRequest({
    params: commonSchemas.objectIdParam.params,
    query: screeningResultSchemas.list.query,
  }),
  getScreeningRunResultsController
);
router.get("/:id", validateRequest(commonSchemas.objectIdParam), getScreeningRunByIdController);
router.patch("/:id/status", validateRequest(screeningRunSchemas.updateStatus), updateScreeningRunStatusController);
router.delete("/:id", validateRequest(commonSchemas.objectIdParam), deleteScreeningRunController);

export default router;
