import express from "express";

import { createScreeningResultsBulkController } from "../controllers/screening-result.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validate-request.middleware.js";
import { screeningResultSchemas } from "../validations/request-schemas.js";

const router = express.Router();

router.use(protect);

router.post("/bulk", validateRequest(screeningResultSchemas.bulkCreate), createScreeningResultsBulkController);

export default router;
