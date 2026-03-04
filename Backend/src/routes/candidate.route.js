import express from "express";

import {
  createCandidateController,
  deleteCandidateController,
  getCandidateByIdController,
  getCandidatesController,
  updateCandidateController,
} from "../controllers/candidate.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validate-request.middleware.js";
import { candidateSchemas, commonSchemas } from "../validations/request-schemas.js";

const router = express.Router();

router.use(protect);

router.post("/", validateRequest(candidateSchemas.create), createCandidateController);
router.get("/", validateRequest(candidateSchemas.list), getCandidatesController);
router.get("/:id", validateRequest(commonSchemas.objectIdParam), getCandidateByIdController);
router.patch("/:id", validateRequest(candidateSchemas.update), updateCandidateController);
router.delete("/:id", validateRequest(commonSchemas.objectIdParam), deleteCandidateController);

export default router;
