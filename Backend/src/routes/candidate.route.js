import express from "express";

import {
  createCandidateController,
  deleteCandidateController,
  getCandidateByIdController,
  getCandidatesController,
  updateCandidateController,
} from "../controllers/candidate.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/", createCandidateController);
router.get("/", getCandidatesController);
router.get("/:id", getCandidateByIdController);
router.patch("/:id", updateCandidateController);
router.delete("/:id", deleteCandidateController);

export default router;
