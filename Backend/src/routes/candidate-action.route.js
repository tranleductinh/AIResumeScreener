import express from "express";

import { createCandidateActionController } from "../controllers/candidate-action.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/", createCandidateActionController);

export default router;
