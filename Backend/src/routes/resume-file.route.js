import express from "express";

import {
  deleteResumeFileController,
  getResumeFileByIdController,
  getResumeFilesController,
  parseResumeFileController,
  uploadResumeFilesController,
} from "../controllers/resume-file.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { parseResumeUpload } from "../middlewares/resume-upload.middleware.js";
import { validateRequest } from "../middlewares/validate-request.middleware.js";
import { commonSchemas, resumeFileSchemas } from "../validations/request-schemas.js";

const router = express.Router();

router.use(protect);

router.post("/upload", parseResumeUpload, uploadResumeFilesController);
router.post("/:id/parse", validateRequest(resumeFileSchemas.parse), parseResumeFileController);
router.get("/", validateRequest(resumeFileSchemas.list), getResumeFilesController);
router.get("/:id", validateRequest(commonSchemas.objectIdParam), getResumeFileByIdController);
router.delete("/:id", validateRequest(commonSchemas.objectIdParam), deleteResumeFileController);

export default router;
