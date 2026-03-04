import express from "express";

import { createCandidateActionController } from "../controllers/candidate-action.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validate-request.middleware.js";
import { candidateActionSchemas } from "../validations/request-schemas.js";

const router = express.Router();

router.use(protect);

router.post("/", validateRequest(candidateActionSchemas.create), createCandidateActionController);

export default router;
