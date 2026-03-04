import express from "express";

import { createScreeningResultsBulkController } from "../controllers/screening-result.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/bulk", createScreeningResultsBulkController);

export default router;
