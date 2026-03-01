import express from "express";

import {
  deleteResumeFileController,
  getResumeFileByIdController,
  getResumeFilesController,
  uploadResumeFilesController,
} from "../controllers/resume-file.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { parseResumeUpload } from "../middlewares/resume-upload.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/upload", parseResumeUpload, uploadResumeFilesController);
router.get("/", getResumeFilesController);
router.get("/:id", getResumeFileByIdController);
router.delete("/:id", deleteResumeFileController);

export default router;
